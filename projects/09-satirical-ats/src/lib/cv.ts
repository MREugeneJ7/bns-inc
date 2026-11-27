/**
 * Extracción local y deliberadamente conservadora de texto de un PDF.
 * No se transmite el archivo ni su contenido: la lectura se realiza
 * íntegramente en el navegador sobre los flujos y cadenas de texto.
 */

function cleanLiteral(literal: string): string {
  const unescaped = literal
    .slice(1, -1)
    .replace(/\\([nrtbf()\\])/g, (_, char: string) => {
      if (char === "n" || char === "r" || char === "t" || char === "b" || char === "f") return " ";
      return char;
    })
    .replace(/\\[0-7]{1,3}/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return unescaped.replace(/[^\p{L}\p{N}\s.,;:@+/#&%()¿?¡!'-]/gu, "").trim();
}

function literalsFrom(source: string): string[] {
  const matches = source.match(/\((?:\\.|[^\\()]){2,}\)/g) ?? [];
  return matches
    .map(cleanLiteral)
    .filter((value) => value.length >= 2);
}

async function inflateStreams(bytes: Uint8Array): Promise<string[]> {
  const collected: string[] = [];
  if (typeof DecompressionStream === "undefined") return collected;

  const latin = new TextDecoder("latin1").decode(bytes);
  let cursor = 0;
  let processed = 0;

  while (processed < 120) {
    const marker = latin.indexOf("stream", cursor);
    if (marker === -1) break;

    const end = latin.indexOf("endstream", marker + 6);
    if (end === -1) break;

    let start = marker + 6;
    if (latin[start] === "\r") start += 1;
    if (latin[start] === "\n") start += 1;

    cursor = end + 9;
    processed += 1;

    if (end - start < 12) continue;
    const slice = bytes.subarray(start, end);
    // Cabecera zlib habitual (los flujos binarios suelen comenzar por 0x78).
    if (slice[0] !== 0x78) continue;

    try {
      const copy = new Uint8Array(slice);
      const blob = new Blob([copy]);
      const stream = blob.stream().pipeThrough(new DecompressionStream("deflate"));
      const buffer = await new Response(stream).arrayBuffer();
      const content = new TextDecoder("latin1").decode(buffer);
      collected.push(...literalsFrom(content));
      if (collected.join(" ").length > 600_000) break;
    } catch {
      // Flujos no textuales o con filtros distintos: se omiten.
    }
  }

  return collected;
}

export async function extractPdfText(file: File): Promise<{ text: string; characters: number }> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const raw = new TextDecoder("latin1").decode(bytes);

  const fragments: string[] = [];

  // Título y metadatos visibles del documento.
  const title = raw.match(/\/Title\s*\((?:\\.|[^\\()])*\)/);
  if (title) {
    const value = cleanLiteral(title[0].replace(/\/Title\s*/, ""));
    if (value.length > 2) fragments.push(value);
  }

  // Cadenas literales de los operadores de texto sin comprimir.
  fragments.push(...literalsFrom(raw));

  // Cadenas literales dentro de flujos comprimidos (FlateDecode).
  try {
    fragments.push(...(await inflateStreams(bytes)));
  } catch {
    // Sin soporte de descompresión: se conserva lo extraído.
  }

  // Algunos generadores incluyen texto sin comprimir fuera de los flujos.
  const plainRuns = raw.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,;:@+/#-]{14,}/g) ?? [];
  for (const run of plainRuns) {
    const clean = run.replace(/\s+/g, " ").trim();
    if (
      clean.length > 20 &&
      !/(obj|endobj|stream|endstream|xref|trailer|startxref|font|mediabox|catalog)/i.test(clean)
    ) {
      fragments.push(clean);
    }
  }

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const fragment of fragments) {
    const normalized = fragment.toLowerCase().replace(/\s+/g, " ").trim();
    if (normalized.length < 2 || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(fragment);
    if (unique.join(" ").length > 900_000) break;
  }

  const text = unique.join(" ").replace(/\s+/g, " ").trim();
  return { text, characters: text.length };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
