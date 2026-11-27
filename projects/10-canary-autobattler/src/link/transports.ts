import type { LinkTransport } from './session';

/**
 * CABLE LINK · transportes físicos.
 *
 * Dos formas de llegar al cable desde el navegador, las dos sin red ni servidor:
 *
 *  1. PUERTO SERIE (Web Serial). El sistema operativo ya trae el driver del adaptador y
 *     el navegador abre el puerto. Es la vía buena en Chrome/Edge de escritorio. Sirve
 *     cualquier cable que sea serie por dentro: cable USB null-módem (dos chips FTDI
 *     espalda con espalda), dos adaptadores USB-TTL con TX y RX cruzados, o un RS-232.
 *
 *  2. USB DIRECTO (WebUSB). El navegador habla con el chip del adaptador sin driver del
 *     sistema: aquí van los drivers de FTDI, CP210x, CH34x y CDC-ACM. Es la vía en
 *     Android, donde Chrome no ofrece puertos serie por USB. También intenta los cables
 *     puente PC-a-PC de Prolific (PL25A1/PL27A1).
 *
 * Línea: 115200 baudios, 8N1, sin control de flujo. Tres hilos bastan: TX, RX y masa.
 */

export const LINK_BAUD = 115200;

export class CableError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'CableError';
    this.code = code;
  }
}

// ------------------------------------------------------------------ tipos mínimos de las APIs

interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
  bluetoothServiceClassId?: unknown;
}

export interface SerialPortLike {
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  open(options: { baudRate: number; dataBits?: number; stopBits?: number; parity?: string; flowControl?: string; bufferSize?: number }): Promise<void>;
  close(): Promise<void>;
  getInfo?(): SerialPortInfo;
  setSignals?(signals: { dataTerminalReady?: boolean; requestToSend?: boolean }): Promise<void>;
}

interface SerialLike {
  requestPort(options?: { filters?: unknown[] }): Promise<SerialPortLike>;
  getPorts(): Promise<SerialPortLike[]>;
}

interface UsbEndpointLike {
  endpointNumber: number;
  direction: 'in' | 'out';
  type: string;
  packetSize: number;
}

interface UsbInterfaceLike {
  interfaceNumber: number;
  alternate: { interfaceClass: number; endpoints: UsbEndpointLike[] };
}

interface UsbSetup {
  requestType: 'standard' | 'class' | 'vendor';
  recipient: 'device' | 'interface' | 'endpoint' | 'other';
  request: number;
  value: number;
  index: number;
}

interface UsbInResult {
  data?: DataView;
  status?: string;
}

export interface UsbDeviceLike {
  vendorId: number;
  productId: number;
  deviceVersionMajor: number;
  productName?: string | null;
  configuration: { interfaces: UsbInterfaceLike[] } | null;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(value: number): Promise<void>;
  claimInterface(n: number): Promise<void>;
  controlTransferOut(setup: UsbSetup, data?: Uint8Array): Promise<unknown>;
  controlTransferIn(setup: UsbSetup, length: number): Promise<UsbInResult>;
  transferIn(endpoint: number, length: number): Promise<UsbInResult>;
  transferOut(endpoint: number, data: Uint8Array): Promise<unknown>;
  clearHalt?(direction: 'in' | 'out', endpoint: number): Promise<void>;
}

interface UsbLike {
  requestDevice(options: { filters: unknown[] }): Promise<UsbDeviceLike>;
}

const nav = (): { serial?: SerialLike; usb?: UsbLike; userAgent?: string } =>
  typeof navigator === 'undefined' ? {} : (navigator as unknown as { serial?: SerialLike; usb?: UsbLike; userAgent?: string });

export interface CableSupport {
  serial: boolean;
  usb: boolean;
  /** Página servida por https o localhost (el navegador lo exige para tocar puertos). */
  secure: boolean;
  /** El juego está incrustado en otra página: el visor puede bloquear los puertos. */
  framed: boolean;
  android: boolean;
}

export function cableSupport(): CableSupport {
  const n = nav();
  const w = typeof window === 'undefined' ? undefined : window;
  let framed = false;
  try {
    framed = !!w && w.self !== w.top;
  } catch {
    framed = true;
  }
  return {
    serial: !!n.serial,
    usb: !!n.usb,
    secure: !w || w.isSecureContext !== false,
    framed,
    android: /Android/i.test(n.userAgent ?? ''),
  };
}

export function explainCableError(e: unknown): string {
  if (e instanceof CableError) return e.message;
  const name = (e as { name?: string } | null)?.name ?? '';
  const msg = (e as { message?: string } | null)?.message ?? String(e);
  if (name === 'NotFoundError') return 'No elegiste ningún cable en la ventana del navegador.';
  if (name === 'SecurityError') return 'El navegador ha bloqueado el acceso al cable. Abre el juego en su propia pestaña (https o localhost): incrustado en un visor no se puede.';
  if (name === 'InvalidStateError') return 'Ese cable ya está abierto (¿en otra pestaña?). Ciérralo allí y vuelve a intentarlo.';
  if (name === 'NetworkError') return `No se pudo abrir el cable: lo usa otro programa o el sistema no deja reclamarlo. (${msg})`;
  return `No se pudo conectar el cable: ${msg}`;
}

// ------------------------------------------------------------------ 1. puerto serie (Web Serial)

export class SerialCable implements LinkTransport {
  onData: ((data: Uint8Array) => void) | null = null;
  onClose: ((reason: string) => void) | null = null;
  readonly label: string;
  private readonly port: SerialPortLike;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private loop: Promise<void> = Promise.resolve();
  private closed = false;

  private constructor(port: SerialPortLike, label: string) {
    this.port = port;
    this.label = label;
  }

  static async open(port: SerialPortLike): Promise<SerialCable> {
    const info = port.getInfo?.() ?? {};
    if (info.bluetoothServiceClassId !== undefined) {
      throw new CableError('bluetooth', 'Eso es un puerto Bluetooth. En el Club del Cable solo vale un cable de verdad.');
    }
    await port.open({ baudRate: LINK_BAUD, dataBits: 8, stopBits: 1, parity: 'none', flowControl: 'none', bufferSize: 4096 });
    try {
      await port.setSignals?.({ dataTerminalReady: true, requestToSend: true });
    } catch {
      /* cable de tres hilos: no hay señales de control que mover */
    }
    const usb = info.usbVendorId !== undefined
      ? ` USB ${info.usbVendorId.toString(16).padStart(4, '0')}:${(info.usbProductId ?? 0).toString(16).padStart(4, '0')}`
      : '';
    const cable = new SerialCable(port, `PUERTO SERIE${usb} · ${LINK_BAUD} 8N1`);
    if (!port.writable || !port.readable) throw new CableError('no-streams', 'El puerto se abrió pero no deja leer ni escribir.');
    cable.writer = port.writable.getWriter();
    cable.loop = cable.readLoop();
    return cable;
  }

  write(data: Uint8Array): Promise<void> {
    if (this.closed || !this.writer) return Promise.resolve();
    return this.writer.write(data).catch((e: unknown) => {
      this.finish('No se pudo escribir en el puerto (¿cable desenchufado?).');
      throw e;
    });
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await this.release();
  }

  private async readLoop(): Promise<void> {
    let lineErrors = 0;
    while (!this.closed && this.port.readable) {
      const reader = this.port.readable.getReader();
      this.reader = reader;
      let ended = false;
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) {
            ended = true;
            break;
          }
          if (value && value.length) {
            lineErrors = 0;
            this.onData?.(value);
          }
        }
      } catch {
        // Error de línea (trama, paridad, desbordamiento): el navegador rehace el stream y se sigue.
        if (++lineErrors > 25) ended = true;
      } finally {
        try {
          reader.releaseLock();
        } catch {
          /* ya liberado */
        }
        this.reader = null;
      }
      if (ended) break;
    }
    if (!this.closed) this.finish('El puerto serie se cerró (¿cable desenchufado?).');
  }

  private finish(reason: string): void {
    if (this.closed) return;
    this.closed = true;
    void this.release();
    this.onClose?.(reason);
  }

  /** Orden que pide el navegador: cancelar la lectura, soltar los dos candados y cerrar el puerto. */
  private async release(): Promise<void> {
    try {
      await this.reader?.cancel();
    } catch {
      /* la lectura ya había terminado */
    }
    await this.loop.catch(() => undefined);
    try {
      this.writer?.releaseLock();
    } catch {
      /* ya liberado */
    }
    this.writer = null;
    try {
      await this.port.close();
    } catch {
      /* el puerto ya no existe */
    }
  }
}

export async function requestSerialCable(): Promise<SerialCable> {
  const serial = nav().serial;
  if (!serial) throw new CableError('no-serial', 'Este navegador no tiene puertos serie. Usa Chrome o Edge de escritorio, o la opción USB DIRECTO.');
  return SerialCable.open(await serial.requestPort());
}

/** Cables a los que ya diste permiso en visitas anteriores (no hace falta volver a elegirlos). */
export async function rememberedSerialPorts(): Promise<SerialPortLike[]> {
  const serial = nav().serial;
  if (!serial) return [];
  try {
    return await serial.getPorts();
  } catch {
    return [];
  }
}

// ------------------------------------------------------------------ 2. USB directo (WebUSB)

export type UsbChip = 'ftdi' | 'cp210x' | 'ch34x' | 'cdc' | 'bridge';

const FTDI_VID = 0x0403;
const SILABS_VID = 0x10c4;
const WCH_VID = 0x1a86;
const CH34X_PIDS = [0x7523, 0x5523, 0x7522];
/** Cables puente PC-a-PC (Prolific PL2301/2302/25A1/27A1 y clones): dos tuberías bulk, sin UART. */
const BRIDGES: readonly (readonly [number, number])[] = [
  [0x067b, 0x25a1], [0x067b, 0x27a1], [0x067b, 0x0000], [0x067b, 0x0001], [0x050d, 0x258a], [0x3923, 0x7825],
];

export const USB_FILTERS: unknown[] = [
  { vendorId: FTDI_VID },
  { vendorId: SILABS_VID },
  ...CH34X_PIDS.map((productId) => ({ vendorId: WCH_VID, productId })),
  ...BRIDGES.map(([vendorId, productId]) => ({ vendorId, productId })),
  { classCode: 0x02 },
  { classCode: 0x0a },
];

const isBulk = (i: UsbInterfaceLike, dir: 'in' | 'out') => i.alternate.endpoints.find((e) => e.type === 'bulk' && e.direction === dir);

export function identifyUsbChip(d: UsbDeviceLike): UsbChip | null {
  if (d.vendorId === FTDI_VID) return 'ftdi';
  if (d.vendorId === SILABS_VID) return 'cp210x';
  if (d.vendorId === WCH_VID && CH34X_PIDS.includes(d.productId)) return 'ch34x';
  if (BRIDGES.some(([v, p]) => v === d.vendorId && p === d.productId)) return 'bridge';
  if (d.configuration?.interfaces.some((i) => i.alternate.interfaceClass === 0x0a)) return 'cdc';
  return null;
}

const CHIP_NAME: Record<UsbChip, string> = {
  ftdi: 'FTDI',
  cp210x: 'CP210x',
  ch34x: 'CH34x',
  cdc: 'CDC-ACM',
  bridge: 'PUENTE USB (experimental)',
};

/** FTDI (FT232R, FT-X, FT2232, FT232H…). Peticiones de control del driver ftdi_sio de Linux. */
async function initFtdi(d: UsbDeviceLike, ifaceNumber: number, interfaces: number): Promise<void> {
  const major = d.deviceVersionMajor;
  const port = interfaces > 1 ? ifaceNumber + 1 : 0;
  const highSpeed = major === 7 || major === 8 || major === 9; // FT2232H, FT4232H, FT232H
  const out = (request: number, value: number, index: number) =>
    d.controlTransferOut({ requestType: 'vendor', recipient: 'device', request, value, index });
  await out(0x00, 0x0000, port); // SIO_RESET
  // 115200 baudios: 3 MHz / 26 en los chips clásicos; 12 MHz / 104,125 en los de alta velocidad.
  if (highSpeed) await out(0x03, 0xc068, 0x0200 | port);
  else await out(0x03, 0x001a, port);
  await out(0x04, 0x0008, port); // SIO_SET_DATA: 8 bits, sin paridad, 1 stop
  await out(0x02, 0x0000, port); // SIO_SET_FLOW_CTRL: ninguno
  try {
    await out(0x09, 0x0002, port); // temporizador de latencia: 2 ms
    await out(0x01, 0x0303, port); // DTR + RTS
  } catch {
    /* opcionales */
  }
}

/** Silicon Labs CP2102/CP2104/CP2105 (driver cp210x de Linux). */
async function initCp210x(d: UsbDeviceLike, iface: number): Promise<void> {
  const out = (request: number, value: number, data?: Uint8Array) =>
    d.controlTransferOut({ requestType: 'vendor', recipient: 'interface', request, value, index: iface }, data);
  await out(0x00, 0x0001); // IFC_ENABLE
  await out(0x1e, 0x0000, new Uint8Array([0x00, 0xc2, 0x01, 0x00])); // SET_BAUDRATE: 115200 (little endian)
  await out(0x03, 0x0800); // SET_LINE_CTL: 8 bits, sin paridad, 1 stop
  try {
    await out(0x07, 0x0303); // SET_MHS: DTR + RTS
  } catch {
    /* opcional */
  }
}

/** WCH CH340/CH341 (driver ch341 de Linux). */
async function initCh34x(d: UsbDeviceLike): Promise<void> {
  const out = (request: number, value: number, index: number) =>
    d.controlTransferOut({ requestType: 'vendor', recipient: 'device', request, value, index });
  let version = 0x30;
  try {
    const r = await d.controlTransferIn({ requestType: 'vendor', recipient: 'device', request: 0x5f, value: 0, index: 0 }, 2);
    if (r.data && r.data.byteLength > 0) version = r.data.getUint8(0);
  } catch {
    /* se asume un chip moderno */
  }
  await out(0xa1, 0x0000, 0x0000); // inicialización serie
  // Divisor de 115200 (0xCC03). El bit 7 hace que el chip no espere a llenar 32 bytes para entregar.
  await out(0x9a, 0x1312, version > 0x27 ? 0xcc83 : 0xcc03);
  if (version >= 0x30) await out(0x9a, 0x2518, 0x00c3); // LCR: recepción + transmisión, 8 bits
  try {
    await out(0xa4, 0xff9f, 0x0000); // DTR + RTS (activos a nivel bajo)
  } catch {
    /* opcional */
  }
}

/** CDC-ACM estándar (placas con USB nativo, CH9102…). */
async function initCdc(d: UsbDeviceLike, commIface: number): Promise<void> {
  const out = (request: number, value: number, data?: Uint8Array) =>
    d.controlTransferOut({ requestType: 'class', recipient: 'interface', request, value, index: commIface }, data);
  try {
    await out(0x20, 0x0000, new Uint8Array([0x00, 0xc2, 0x01, 0x00, 0x00, 0x00, 0x08])); // SET_LINE_CODING: 115200 8N1
    await out(0x22, 0x0003); // SET_CONTROL_LINE_STATE: DTR + RTS
  } catch {
    /* hay puentes CDC que ignoran la velocidad */
  }
}

export class UsbCable implements LinkTransport {
  onData: ((data: Uint8Array) => void) | null = null;
  onClose: ((reason: string) => void) | null = null;
  readonly label: string;
  readonly chip: UsbChip;
  private readonly dev: UsbDeviceLike;
  private readonly epIn: UsbEndpointLike;
  private readonly epOut: UsbEndpointLike;
  private tx: Promise<unknown> = Promise.resolve();
  private closed = false;

  private constructor(dev: UsbDeviceLike, chip: UsbChip, epIn: UsbEndpointLike, epOut: UsbEndpointLike) {
    this.dev = dev;
    this.chip = chip;
    this.epIn = epIn;
    this.epOut = epOut;
    const id = `${dev.vendorId.toString(16).padStart(4, '0')}:${dev.productId.toString(16).padStart(4, '0')}`;
    this.label = `USB DIRECTO · ${CHIP_NAME[chip]} ${id}${chip === 'bridge' ? '' : ` · ${LINK_BAUD} 8N1`}`;
  }

  static async open(dev: UsbDeviceLike): Promise<UsbCable> {
    await dev.open();
    if (!dev.configuration) await dev.selectConfiguration(1);
    const chip = identifyUsbChip(dev);
    const ifaces = dev.configuration?.interfaces ?? [];
    const usable = (i: UsbInterfaceLike) => !!isBulk(i, 'in') && !!isBulk(i, 'out');
    const data = (chip === 'cdc' ? ifaces.find((i) => i.alternate.interfaceClass === 0x0a && usable(i)) : undefined) ?? ifaces.find(usable);
    if (!chip || !data) {
      await dev.close().catch(() => undefined);
      throw new CableError('unknown-usb', 'Ese dispositivo USB no es un adaptador de cable que el juego sepa manejar (FTDI, CP210x, CH34x, CDC-ACM o puente Prolific).');
    }
    try {
      await dev.claimInterface(data.interfaceNumber);
      if (chip === 'ftdi') await initFtdi(dev, data.interfaceNumber, ifaces.length);
      else if (chip === 'cp210x') await initCp210x(dev, data.interfaceNumber);
      else if (chip === 'ch34x') await initCh34x(dev);
      else if (chip === 'cdc') {
        const comm = ifaces.find((i) => i.alternate.interfaceClass === 0x02);
        if (comm && comm !== data) await dev.claimInterface(comm.interfaceNumber).catch(() => undefined);
        await initCdc(dev, comm ? comm.interfaceNumber : data.interfaceNumber);
      } else {
        // Puente Prolific: reinicia las dos tuberías y marca "hay alguien al otro lado" (driver plusb de Linux).
        await dev.controlTransferOut({ requestType: 'vendor', recipient: 'device', request: 3, value: 0x99, index: 0 }).catch(() => undefined);
      }
    } catch (e) {
      await dev.close().catch(() => undefined);
      throw e;
    }
    const cable = new UsbCable(dev, chip, isBulk(data, 'in')!, isBulk(data, 'out')!);
    void cable.readLoop();
    return cable;
  }

  write(data: Uint8Array): Promise<void> {
    if (this.closed) return Promise.resolve();
    const next = this.tx.then(() => (this.closed ? undefined : this.dev.transferOut(this.epOut.endpointNumber, data)));
    this.tx = next.catch(() => undefined);
    return next.then(
      () => undefined,
      (e: unknown) => {
        this.finish('No se pudo escribir en el cable USB (¿desenchufado?).');
        throw e;
      },
    );
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await this.dev.close().catch(() => undefined);
  }

  private async readLoop(): Promise<void> {
    // Un paquete USB por lectura. Los FTDI anteponen 2 bytes de estado del módem a CADA paquete.
    const size = Math.max(8, this.epIn.packetSize);
    const skip = this.chip === 'ftdi' ? 2 : 0;
    let errors = 0;
    while (!this.closed) {
      try {
        const r = await this.dev.transferIn(this.epIn.endpointNumber, size);
        if (r.status === 'stall') {
          await this.dev.clearHalt?.('in', this.epIn.endpointNumber);
          continue;
        }
        errors = 0;
        const dv = r.data;
        if (!dv || dv.byteLength <= skip) continue;
        this.onData?.(new Uint8Array(dv.buffer.slice(dv.byteOffset + skip, dv.byteOffset + dv.byteLength)));
      } catch {
        if (this.closed) return;
        if (++errors > 3) return this.finish('El cable USB dejó de responder (¿desenchufado?).');
      }
    }
  }

  private finish(reason: string): void {
    if (this.closed) return;
    this.closed = true;
    void this.dev.close().catch(() => undefined);
    this.onClose?.(reason);
  }
}

export async function requestUsbCable(): Promise<UsbCable> {
  const usb = nav().usb;
  if (!usb) throw new CableError('no-usb', 'Este navegador no tiene WebUSB. Usa Chrome o Edge.');
  return UsbCable.open(await usb.requestDevice({ filters: USB_FILTERS }));
}
