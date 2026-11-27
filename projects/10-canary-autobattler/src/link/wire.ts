/**
 * CABLE LINK · capa de trama.
 *
 * Un cable serie es un chorro de bytes sin principio ni fin, y además mete ruido.
 * Aquí se convierte en tramas con comprobación:
 *
 *   0x00 | COBS( tipo, seq, ack, sesion, datos..., crc16 ) | 0x00
 *
 * - COBS garantiza que dentro de la trama no hay ningún 0x00, así que el 0x00 marca
 *   el límite y, si entra basura, basta esperar al siguiente 0x00 para resincronizar.
 * - El CRC-16 descarta cualquier trama tocada por el ruido (la capa de enlace reenvía).
 */

export const F_HELLO = 1;
export const F_DATA = 2;
export const F_ACK = 3;
export const F_PING = 4;

/** Bytes de mensaje por trama; los mensajes largos se trocean. */
export const MAX_FRAGMENT = 180;

const HEADER = 4;
const MAX_RAW = HEADER + 1 + MAX_FRAGMENT + 2;
const MAX_PACKET = MAX_RAW + Math.ceil(MAX_RAW / 254) + 2;
const EMPTY = new Uint8Array(0);

export interface Frame {
  type: number;
  seq: number;
  ack: number;
  sess: number;
  payload: Uint8Array;
}

/** CRC-16/CCITT-FALSE (polinomio 0x1021, inicio 0xFFFF). */
export function crc16(data: Uint8Array, len: number = data.length): number {
  let crc = 0xffff;
  for (let i = 0; i < len; i++) {
    crc ^= data[i] << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc;
}

export function cobsEncode(src: Uint8Array): Uint8Array {
  const out = new Uint8Array(src.length + Math.ceil(src.length / 254) + 2);
  let codeAt = 0;
  let w = 1;
  let code = 1;
  for (let i = 0; i < src.length; i++) {
    if (src[i] === 0) {
      out[codeAt] = code;
      codeAt = w++;
      code = 1;
    } else {
      out[w++] = src[i];
      if (++code === 0xff) {
        out[codeAt] = code;
        codeAt = w++;
        code = 1;
      }
    }
  }
  out[codeAt] = code;
  return out.subarray(0, w);
}

/** Devuelve null si el bloque no es COBS válido. */
export function cobsDecode(src: Uint8Array): Uint8Array | null {
  const out = new Uint8Array(src.length);
  let w = 0;
  let i = 0;
  while (i < src.length) {
    const code = src[i++];
    if (code === 0) return null;
    const end = i + code - 1;
    if (end > src.length) return null;
    while (i < end) out[w++] = src[i++];
    if (code !== 0xff && i < src.length) out[w++] = 0;
  }
  return out.subarray(0, w);
}

export function encodeFrame(type: number, seq: number, ack: number, sess: number, payload: Uint8Array = EMPTY): Uint8Array {
  const raw = new Uint8Array(HEADER + payload.length + 2);
  raw[0] = type & 0xff;
  raw[1] = seq & 0xff;
  raw[2] = ack & 0xff;
  raw[3] = sess & 0xff;
  raw.set(payload, HEADER);
  const crc = crc16(raw, raw.length - 2);
  raw[raw.length - 2] = crc >> 8;
  raw[raw.length - 1] = crc & 0xff;
  const enc = cobsEncode(raw);
  const out = new Uint8Array(enc.length + 2);
  out.set(enc, 1); // out[0] y el último byte quedan a 0x00: delimitadores
  return out;
}

/** Recompone tramas a partir de trozos de cualquier tamaño (como llegan de un puerto serie). */
export class FrameDecoder {
  /** Tramas tiradas por ruido: CRC malo, COBS roto o tamaño imposible. */
  bad = 0;
  private readonly buf = new Uint8Array(MAX_PACKET);
  private len = 0;
  private overflow = false;

  push(chunk: Uint8Array): Frame[] {
    const frames: Frame[] = [];
    for (let i = 0; i < chunk.length; i++) {
      const b = chunk[i];
      if (b !== 0) {
        if (this.len < this.buf.length) this.buf[this.len++] = b;
        else this.overflow = true;
        continue;
      }
      if (this.overflow) {
        this.bad++;
      } else if (this.len > 0) {
        const raw = cobsDecode(this.buf.subarray(0, this.len));
        const n = raw ? raw.length : 0;
        if (raw && n >= HEADER + 2 && crc16(raw, n - 2) === ((raw[n - 2] << 8) | raw[n - 1])) {
          frames.push({ type: raw[0], seq: raw[1], ack: raw[2], sess: raw[3], payload: raw.slice(HEADER, n - 2) });
        } else {
          this.bad++;
        }
      }
      this.len = 0;
      this.overflow = false;
    }
    return frames;
  }
}
