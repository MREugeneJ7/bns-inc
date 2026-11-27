import zlib from "node:zlib";

export interface ImageDimensions {
  width: number;
  height: number;
  type: "jpeg" | "png";
}

/**
 * Lee las dimensiones reales de un JPEG (SOF0/SOF1/SOF2, tenga o no cabecera JFIF/Exif)
 * o de un PNG (chunk IHDR).
 */
export function readImageDimensions(buf: Buffer): ImageDimensions | null {
  if (buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width > 0 && height > 0) return { width, height, type: "png" };
    return null;
  }

  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      while (i < buf.length - 1 && buf[i + 1] === 0xff) i++;
      if (i >= buf.length - 1) break;
      const marker = buf[i + 1];
      if (marker === 0xd9 || marker === 0xda) break; // EOI / SOS
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
        i += 2;
        continue;
      }
      if (i + 4 > buf.length) break;
      const segLen = buf.readUInt16BE(i + 2);
      if (segLen < 2 || i + 2 + segLen > buf.length) break;

      const isSof =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);
      if (isSof && segLen >= 7) {
        const height = buf.readUInt16BE(i + 5);
        const width = buf.readUInt16BE(i + 7);
        if (width > 0 && height > 0) return { width, height, type: "jpeg" };
        return null;
      }
      i += 2 + segLen;
    }
  }
  return null;
}

const JFIF_APP0 = Buffer.from([
  0xff, 0xe0, 0x00, 0x10,
  0x4a, 0x46, 0x49, 0x46, 0x00, // "JFIF\0"
  0x01, 0x01, // v1.1
  0x01, // units = DPI
  0x00, 0x60, 0x00, 0x60, // 96x96 DPI
  0x00, 0x00, // no thumbnail
]);

/**
 * Algunos generadores producen JPEG válidos que comienzan por FF D8 FF DB (sin APP0 JFIF).
 * Pandoc 2.17 no reconoce el tipo/tamaño de esos JPEG si falta APP0/APP1.
 * Insertar APP0 JFIF tras SOI (FF D8) no recodifica ni altera ningún píxel.
 */
export function ensureJpegJfifHeader(buf: Buffer): Buffer {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return buf;
  if (buf[2] === 0xff && (buf[3] === 0xe0 || buf[3] === 0xe1)) return buf;
  return Buffer.concat([buf.subarray(0, 2), JFIF_APP0, buf.subarray(2)]);
}

/* ------------------------------------------------------------------ */
/* Recorte PNG puro en Node (para ecuaciones renderizadas por TeX)     */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

export interface CroppedPng {
  png: Buffer;
  width: number;
  height: number;
  /** Coordenadas de la caja recortada en el PNG original (útil para calcular baseline) */
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
}

/**
 * Recorta los márgenes blancos de un PNG 8-bit (Grayscale, RGB o RGBA) generado por pdftoppm.
 */
export function cropPngWhitespace(pngBuf: Buffer, padX = 10, padY = 8, whiteThreshold = 248): CroppedPng {
  if (pngBuf.length < 33 || pngBuf[0] !== 0x89 || pngBuf[1] !== 0x50) {
    throw new Error("PNG no válido");
  }

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatParts: Buffer[] = [];

  let offset = 8;
  while (offset + 8 <= pngBuf.length) {
    const length = pngBuf.readUInt32BE(offset);
    const type = pngBuf.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > pngBuf.length) break;

    if (type === "IHDR") {
      width = pngBuf.readUInt32BE(dataStart);
      height = pngBuf.readUInt32BE(dataStart + 4);
      bitDepth = pngBuf[dataStart + 8];
      colorType = pngBuf[dataStart + 9];
    } else if (type === "IDAT") {
      idatParts.push(pngBuf.subarray(dataStart, dataEnd));
    } else if (type === "IEND") {
      break;
    }
    offset = dataEnd + 4;
  }

  const channels = colorType === 0 ? 1 : colorType === 2 ? 3 : colorType === 6 ? 4 : 0;
  if (bitDepth !== 8 || channels === 0 || width <= 0 || height <= 0) {
    return {
      png: pngBuf,
      width: Math.max(1, width),
      height: Math.max(1, height),
      bbox: { minX: 0, minY: 0, maxX: Math.max(0, width - 1), maxY: Math.max(0, height - 1) },
    };
  }

  const raw = zlib.inflateSync(Buffer.concat(idatParts));
  const stride = width * channels;
  const pixels = Buffer.alloc(height * stride);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    const filter = raw[rowStart];
    const dstStart = y * stride;
    for (let x = 0; x < stride; x++) {
      const byte = raw[rowStart + 1 + x];
      const a = x >= channels ? pixels[dstStart + x - channels] : 0;
      const b = y > 0 ? pixels[dstStart - stride + x] : 0;
      const c = x >= channels && y > 0 ? pixels[dstStart - stride + x - channels] : 0;
      let val = byte;
      if (filter === 1) val = (byte + a) & 0xff;
      else if (filter === 2) val = (byte + b) & 0xff;
      else if (filter === 3) val = (byte + ((a + b) >>> 1)) & 0xff;
      else if (filter === 4) val = (byte + paeth(a, b, c)) & 0xff;
      pixels[dstStart + x] = val;
    }
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    const row = y * stride;
    for (let x = 0; x < width; x++) {
      const p = row + x * channels;
      let isInk = false;
      if (channels === 1) {
        isInk = pixels[p] < whiteThreshold;
      } else if (channels === 3) {
        isInk = pixels[p] < whiteThreshold || pixels[p + 1] < whiteThreshold || pixels[p + 2] < whiteThreshold;
      } else {
        isInk =
          pixels[p + 3] > 10 &&
          (pixels[p] < whiteThreshold || pixels[p + 1] < whiteThreshold || pixels[p + 2] < whiteThreshold);
      }
      if (isInk) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return {
      png: pngBuf,
      width,
      height,
      bbox: { minX: 0, minY: 0, maxX: width - 1, maxY: height - 1 },
    };
  }

  const cropX0 = Math.max(0, minX - padX);
  const cropY0 = Math.max(0, minY - padY);
  const cropX1 = Math.min(width - 1, maxX + padX);
  const cropY1 = Math.min(height - 1, maxY + padY);
  const outW = cropX1 - cropX0 + 1;
  const outH = cropY1 - cropY0 + 1;

  const outStride = outW * channels;
  const outRaw = Buffer.alloc(outH * (outStride + 1));
  for (let y = 0; y < outH; y++) {
    const dst = y * (outStride + 1);
    outRaw[dst] = 0; // filter None
    const src = (cropY0 + y) * stride + cropX0 * channels;
    pixels.copy(outRaw, dst + 1, src, src + outStride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(outW, 0);
  ihdr.writeUInt32BE(outH, 4);
  ihdr[8] = 8;
  ihdr[9] = colorType;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // pHYs chunk: 300 DPI = 11811 pixels/meter
  const phys = Buffer.alloc(9);
  phys.writeUInt32BE(11811, 0);
  phys.writeUInt32BE(11811, 4);
  phys[8] = 1; // meters

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const compressed = zlib.deflateSync(outRaw, { level: 6 });
  const png = Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("pHYs", phys),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);

  return { png, width: outW, height: outH, bbox: { minX, minY, maxX, maxY } };
}
