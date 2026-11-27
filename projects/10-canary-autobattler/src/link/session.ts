import { F_ACK, F_DATA, F_HELLO, F_PING, FrameDecoder, MAX_FRAGMENT, encodeFrame, type Frame } from './wire';

/**
 * CABLE LINK · capa de enlace.
 *
 * Sobre cualquier transporte de bytes (puerto serie o USB) monta un enlace fiable
 * entre DOS extremos, sin servidor y sin red:
 *
 *  - SALUDO: cada extremo elige un número al azar y lo repite por el cable hasta que
 *    el otro se lo devuelve. Si recibo mi propio número, el cable está puenteado
 *    sobre sí mismo (TX con RX): sirve de prueba de cable con un solo adaptador.
 *    El número mayor hace de anfitrión; no hay que configurar nada.
 *  - ENTREGA FIABLE: parada y espera. Cada trama de datos lleva número de secuencia,
 *    el otro extremo la confirma y, si la confirmación no llega, se reenvía.
 *  - LATIDO: si el cable se queda mudo, el enlace se da por caído.
 *
 * No usa relojes propios: quien la usa llama a tick(ahora). Así se puede probar
 * con un cable virtual y un reloj falso, byte a byte.
 */

export const LINK_PROTO = 1;
const MAX_MESSAGE = 32 * 1024;

export interface LinkTransport {
  readonly label: string;
  write(data: Uint8Array): Promise<void> | void;
  close(): Promise<void> | void;
  onData: ((data: Uint8Array) => void) | null;
  onClose: ((reason: string) => void) | null;
}

export type LinkStatus = 'searching' | 'loopback' | 'linked' | 'closed';

export interface LinkTimings {
  helloMs: number;
  ackMs: number;
  pingMs: number;
  lostMs: number;
  maxRetries: number;
}

export const DEFAULT_TIMINGS: LinkTimings = { helloMs: 300, ackMs: 250, pingMs: 1000, lostMs: 5000, maxRetries: 14 };

interface Pending {
  payload: Uint8Array;
  done?: () => void;
  fail: (e: Error) => void;
}

interface Flight extends Pending {
  seq: number;
  frame: Uint8Array;
  sentAt: number;
  tries: number;
}

const put32 = (p: Uint8Array, at: number, v: number) => {
  p[at] = (v >>> 24) & 0xff;
  p[at + 1] = (v >>> 16) & 0xff;
  p[at + 2] = (v >>> 8) & 0xff;
  p[at + 3] = v & 0xff;
};
const get32 = (p: Uint8Array, at: number) => ((p[at] << 24) | (p[at + 1] << 16) | (p[at + 2] << 8) | p[at + 3]) >>> 0;

export class LinkSession {
  status: LinkStatus = 'searching';
  role: 'host' | 'guest' | null = null;
  /** El otro extremo habla otra versión del protocolo de cable. */
  incompatible = false;
  closeReason: string | null = null;
  readonly stats = { tx: 0, rx: 0, bad: 0, retx: 0 };

  onStatus: ((s: LinkStatus) => void) | null = null;
  /** Un enlace que estaba establecido se ha caído (y se vuelve a buscar solo). */
  onLost: ((why: string) => void) | null = null;
  onMessage: ((msg: unknown) => void) | null = null;

  private mine: number;
  private theirs = 0;
  private sess = 0;
  private readonly dec = new FrameDecoder();
  private txSeq = 0;
  private rxSeq = 0;
  private queue: Pending[] = [];
  private flight: Flight | null = null;
  private parts: Uint8Array[] = [];
  private partsLen = 0;
  private now = 0;
  private lastRx = 0;
  private lastTx = 0;
  private lastHello = -1e12;
  private readonly transport: LinkTransport;
  private readonly t: LinkTimings;
  private readonly rnd: () => number;

  constructor(transport: LinkTransport, timings: LinkTimings = DEFAULT_TIMINGS, rnd: () => number = Math.random) {
    this.transport = transport;
    this.t = timings;
    this.rnd = rnd;
    this.mine = this.newNonce();
    transport.onData = (d) => this.receive(d);
    transport.onClose = (why) => this.shutdown(why);
  }

  /** Mensajes aún sin confirmar por el otro extremo. */
  get backlog(): number {
    return this.queue.length + (this.flight ? 1 : 0);
  }

  /** Único punto de entrada temporal: reenvíos, saludos, latido y caída del enlace. */
  tick(now: number): void {
    this.now = now;
    if (this.status === 'closed') return;
    if (this.status !== 'linked') {
      if (now - this.lastHello >= this.t.helloMs) this.sendHello(false);
      return;
    }
    if (now - this.lastRx >= this.t.lostMs) return this.drop('timeout', 0);
    if (this.flight && now - this.flight.sentAt >= this.t.ackMs) {
      if (this.flight.tries >= this.t.maxRetries) return this.drop('retries', 0);
      this.flight.tries++;
      this.flight.sentAt = now;
      this.stats.retx++;
      this.raw(this.flight.frame);
    }
    this.pump();
    if (now - this.lastTx >= this.t.pingMs) this.raw(encodeFrame(F_PING, 0, 0, this.sess));
  }

  /** Envía un mensaje. La promesa se cumple cuando el otro extremo lo ha confirmado. */
  send(msg: unknown): Promise<void> {
    if (this.status !== 'linked') return Promise.reject(new Error('sin enlace'));
    const bytes = new TextEncoder().encode(JSON.stringify(msg));
    return new Promise<void>((done, fail) => {
      const n = Math.max(1, Math.ceil(bytes.length / MAX_FRAGMENT));
      for (let i = 0; i < n; i++) {
        const chunk = bytes.subarray(i * MAX_FRAGMENT, (i + 1) * MAX_FRAGMENT);
        const payload = new Uint8Array(chunk.length + 1);
        payload[0] = i === n - 1 ? 1 : 0; // bit 0: último trozo del mensaje
        payload.set(chunk, 1);
        this.queue.push(i === n - 1 ? { payload, done, fail } : { payload, fail });
      }
      this.pump();
    });
  }

  /** Suelta el cable. La promesa se cumple cuando el puerto ha quedado libre de verdad. */
  close(): Promise<void> {
    if (this.status === 'closed') return Promise.resolve();
    this.failAll('cerrado');
    this.role = null;
    this.setStatus('closed');
    try {
      const r = this.transport.close();
      return r ? r.catch(() => undefined) : Promise.resolve();
    } catch {
      return Promise.resolve(); // el transporte ya estaba cerrado
    }
  }

  // ------------------------------------------------------------------ interno

  private newNonce(): number {
    return (Math.floor(this.rnd() * 0xfffffffe) + 1) >>> 0;
  }

  private setStatus(s: LinkStatus): void {
    if (this.status === s) return;
    this.status = s;
    this.onStatus?.(s);
  }

  private raw(frame: Uint8Array): void {
    this.stats.tx++;
    this.lastTx = this.now;
    try {
      const r = this.transport.write(frame);
      if (r) r.catch(() => undefined); // si el puerto muere lo avisa el transporte por onClose
    } catch {
      /* idem */
    }
  }

  private sendHello(linked: boolean): void {
    const p = new Uint8Array(9);
    p[0] = LINK_PROTO;
    put32(p, 1, this.mine);
    put32(p, 5, this.theirs);
    this.lastHello = this.now;
    // El campo ack del saludo dice si este extremo ya da el enlace por hecho.
    this.raw(encodeFrame(F_HELLO, 0, linked ? 1 : 0, 0, p));
  }

  private pump(): void {
    if (this.status !== 'linked' || this.flight || this.queue.length === 0) return;
    const p = this.queue.shift()!;
    const seq = this.txSeq;
    this.txSeq = (this.txSeq + 1) & 0xff;
    const frame = encodeFrame(F_DATA, seq, 0, this.sess, p.payload);
    this.flight = { ...p, seq, frame, sentAt: this.now, tries: 0 };
    this.raw(frame);
  }

  private receive(data: Uint8Array): void {
    if (this.status === 'closed') return;
    const frames = this.dec.push(data);
    this.stats.bad = this.dec.bad;
    for (const f of frames) {
      this.stats.rx++;
      this.handle(f);
    }
  }

  private handle(f: Frame): void {
    if (f.type === F_HELLO) return this.onHello(f);
    if (this.status !== 'linked' || f.sess !== this.sess) return;
    this.lastRx = this.now;
    if (f.type === F_ACK) {
      if (this.flight && f.ack === this.flight.seq) {
        const fl = this.flight;
        this.flight = null;
        fl.done?.();
        this.pump();
      }
    } else if (f.type === F_DATA) {
      if (f.seq === this.rxSeq) {
        this.rxSeq = (this.rxSeq + 1) & 0xff;
        this.raw(encodeFrame(F_ACK, 0, f.seq, this.sess));
        this.deliver(f.payload);
      } else if (f.seq === ((this.rxSeq - 1) & 0xff)) {
        // Repetida: se perdió nuestra confirmación. Se confirma otra vez y no se entrega dos veces.
        this.raw(encodeFrame(F_ACK, 0, f.seq, this.sess));
      }
    }
  }

  private onHello(f: Frame): void {
    const p = f.payload;
    if (p.length < 9) return;
    const m = get32(p, 1);
    const y = get32(p, 5);
    if (m === this.mine) {
      // Mi propio saludo de vuelta: el cable está puenteado sobre sí mismo.
      if (this.status === 'searching') this.setStatus('loopback');
      return;
    }
    if (p[0] !== LINK_PROTO) {
      this.incompatible = true;
      return;
    }
    const peerLinked = f.ack === 1;
    if (this.status === 'linked') {
      if (m !== this.theirs) {
        // El otro extremo ha reiniciado: el enlace viejo ya no vale.
        this.drop('peer-reset', m);
        this.sendHello(false);
      } else if (!peerLinked) {
        this.sendHello(true); // sigue saludando: aún no sabe que el enlace está hecho
      }
      return;
    }
    if (this.status === 'loopback') this.setStatus('searching');
    this.theirs = m;
    if (y === this.mine) {
      if (!peerLinked) this.sendHello(true); // primero la respuesta, luego los datos
      this.linkUp();
    } else {
      this.sendHello(false); // todavía no conoce mi número
    }
  }

  private linkUp(): void {
    this.resetArq();
    this.sess = (((this.mine ^ this.theirs) >>> 0) % 255) + 1;
    this.role = this.mine > this.theirs ? 'host' : 'guest';
    this.lastRx = this.now;
    this.lastTx = this.now;
    this.setStatus('linked');
  }

  private resetArq(): void {
    this.txSeq = 0;
    this.rxSeq = 0;
    this.queue = [];
    this.flight = null;
    this.parts = [];
    this.partsLen = 0;
  }

  private failAll(why: string): void {
    const pending = [...(this.flight ? [this.flight] : []), ...this.queue];
    this.resetArq();
    const err = new Error(why);
    for (const p of pending) p.fail(err);
  }

  /** El enlace establecido se cae: número nuevo y a saludar otra vez. */
  private drop(why: string, peer: number): void {
    this.failAll(why);
    this.mine = this.newNonce();
    this.theirs = peer;
    this.role = null;
    this.lastHello = -1e12;
    this.status = 'searching';
    this.onLost?.(why);
    this.onStatus?.('searching');
  }

  private shutdown(why: string): void {
    if (this.status === 'closed') return;
    const wasLinked = this.status === 'linked';
    this.failAll(why);
    this.role = null;
    this.closeReason = why;
    this.status = 'closed';
    if (wasLinked) this.onLost?.('closed');
    this.onStatus?.('closed');
  }

  private deliver(p: Uint8Array): void {
    if (p.length < 1) return;
    this.parts.push(p.subarray(1));
    this.partsLen += p.length - 1;
    if (this.partsLen > MAX_MESSAGE) {
      this.parts = [];
      this.partsLen = 0;
      return;
    }
    if ((p[0] & 1) === 0) return;
    const all = new Uint8Array(this.partsLen);
    let o = 0;
    for (const c of this.parts) {
      all.set(c, o);
      o += c.length;
    }
    this.parts = [];
    this.partsLen = 0;
    let msg: unknown;
    try {
      msg = JSON.parse(new TextDecoder().decode(all));
    } catch {
      return;
    }
    this.onMessage?.(msg);
  }
}
