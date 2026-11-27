export interface CurlExtract {
  url: string | null;
  urn: string | null;
  bodyRaw: string | null;
  json: unknown | null;
  jsonPretty: string | null;
  text: string | null;
  textField: string | null;
}

const DATA_RE =
  /(?:--data(?:-raw|-ascii|-binary)?|-d)\s+(\$(?:'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|[^\s]+)/g;

const TEXT_KEYS = ['commentary', 'text', 'content', 'message', 'body', 'description', 'value'];

function unquoteShell(tok: string): string {
  if (tok.startsWith("$'") && tok.endsWith("'")) {
    return tok
      .slice(2, -1)
      .replace(/\\(.)/gs, (_, c: string) => ({ n: '\n', t: '\t', r: '\r' })[c] ?? c);
  }
  if (tok.startsWith("'") && tok.endsWith("'")) return tok.slice(1, -1); // los \" siguen siendo \" → JSON válido
  if (tok.startsWith('"') && tok.endsWith('"')) {
    return tok
      .slice(1, -1)
      .replace(/\\(.)/gs, (_, c: string) => ({ n: '\n', t: '\t', r: '\r' })[c] ?? c);
  }
  return tok;
}

function findTextField(obj: unknown): { value: string; path: string } | null {
  const holder: { best: { value: string; path: string } | null } = { best: null };
  const walk = (o: unknown, p: string) => {
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      const np = p ? `${p}.${k}` : k;
      if (
        typeof v === 'string' &&
        v.trim().length > 10 &&
        TEXT_KEYS.some((tk) => k.toLowerCase().includes(tk))
      ) {
        if (!holder.best || v.length > holder.best.value.length) holder.best = { value: v, path: np };
      } else if (v && typeof v === 'object') {
        walk(v, np);
      }
    }
  };
  walk(obj, '');
  return holder.best;
}

/**
 * Extrae del "Copy as cURL" de LinkedIn (petición voyager) la URL, el URN de la
 * actividad y el cuerpo del mensaje (campo commentary/text/... del JSON del --data-raw).
 */
export function extractFromCurl(curl: string): CurlExtract {
  const joined = curl.replace(/\\\r?\n/g, ' ').replace(/\s+/g, ' ').trim();

  const urlM = joined.match(/curl\s+(?:'([^']+)'|"([^"]+)"|(\S+))/i);
  const url = urlM ? urlM[1] ?? urlM[2] ?? urlM[3] ?? null : null;

  const urnM = curl.match(/urn:li:(?:activity|share|ugcPost):(\d+)/i);
  const urn = urnM ? urnM[1] : null;

  let bodyRaw: string | null = null;
  for (const m of joined.matchAll(DATA_RE)) {
    const tok = m[1];
    if (!bodyRaw || tok.length > bodyRaw.length) bodyRaw = tok;
  }

  let json: unknown = null;
  let text: string | null = null;
  let textField: string | null = null;
  let jsonPretty: string | null = null;

  if (bodyRaw) {
    const candidates = [bodyRaw, unquoteShell(bodyRaw)];
    for (const c of candidates) {
      try {
        json = JSON.parse(c);
        break;
      } catch {
        /* siguiente candidato */
      }
    }
    if (json === null) {
      try {
        json = JSON.parse(decodeURIComponent(unquoteShell(bodyRaw)));
      } catch {
        /* no era JSON */
      }
    }
    if (json && typeof json === 'object') {
      jsonPretty = JSON.stringify(json, null, 2);
      const found = findTextField(json);
      if (found) {
        text = found.value;
        textField = found.path;
      }
    } else {
      const plain = unquoteShell(bodyRaw);
      if (plain.trim().length > 10) text = plain;
    }
  }

  return { url, urn, bodyRaw, json, jsonPretty, text, textField };
}

export function urlHost(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
