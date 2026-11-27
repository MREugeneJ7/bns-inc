import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { AnalyticsRow, CategoryGroup, Metric } from './types';

/** Parsea un valor de porcentaje tipo "11 %", "< 1 %", 0.11, "3,5%" → número 0..100 */
export function parsePct(x: unknown): number | null {
  if (x === null || x === undefined) return null;
  const raw = String(x);
  if (!raw.trim()) return null;
  const lt = raw.includes('<');
  const hadPct = raw.includes('%');
  const s = raw.replace(/[<%\s]/g, '').replace(',', '.');
  if (!s) return null;
  const n = parseFloat(s);
  if (Number.isNaN(n)) return null;
  if (lt) return Math.min(n, 0.5);
  if (!hadPct && n > 0 && n <= 1) return n * 100; // fracción 0..1
  return n;
}

export function formatPct(p: number): string {
  if (p < 1) return '< 1 %';
  return `${Number.isInteger(p) ? p : p.toFixed(1)} %`;
}

/** "12.623" / "12623" → 12623; fechas y textos → null */
export function parseMetricNum(v: string): number | null {
  const s = v.trim();
  if (!/^\d{1,3}(\.\d{3})+$|^\d+$/.test(s)) return null;
  const n = Number(s.replace(/\./g, ''));
  return Number.isFinite(n) ? n : null;
}

const norm = (s: unknown): string => String(s ?? '').trim();

/* ---------- Etiquetas del bloque de métricas del XLS ---------- */

const METRIC_KEYS: [RegExp, string][] = [
  [/^url\b/i, 'url'],
  [/^fecha/i, 'fecha'],
  [/^hora/i, 'hora'],
  [/impresion/i, 'impresiones'],
  [/miembros alcanzados|alcance/i, 'alcance'],
  [/visualizaciones del perfil/i, 'vistas_perfil'],
  [/seguidores/i, 'seguidores'],
  [/interacciones sociales/i, 'interacciones'],
  [/reaccion/i, 'reacciones'],
  [/comentari/i, 'comentarios'],
  [/compartid/i, 'compartidos'],
  [/guardad/i, 'guardados'],
  [/env[ií]os/i, 'envios'],
  [/enlace/i, 'enlace'],
  [/premium/i, 'premium'],
];

export function metricKey(label: string): string {
  const hit = METRIC_KEYS.find(([re]) => re.test(label.trim()));
  if (hit) return hit[1];
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export interface ParsedSheet {
  rows: AnalyticsRow[];
  metrics: Metric[];
  url: string | null;
  fecha: string | null;
  hora: string | null;
}

const EMPTY_SHEET: ParsedSheet = { rows: [], metrics: [], url: null, fecha: null, hora: null };

/**
 * Lee la hoja completa: bloque de métricas (URL, fecha, impresiones, alcance…)
 * + tabla «Información detallada de las visualizaciones» (Categoría / Valor / %).
 * Tolera hojas que solo tengan la tabla.
 */
export function parseSheetGrid(grid: unknown[][]): ParsedSheet {
  if (!grid || !grid.length) return EMPTY_SHEET;
  const rows = grid.map((r) => (Array.isArray(r) ? r.map((c) => norm(c)) : []));

  // ¿Dónde empieza la tabla detallada?
  const tableIdx = rows.findIndex((r) => r.some((c) => /informaci[oó]n detallada/i.test(c)));
  const scanStart = tableIdx >= 0 ? tableIdx + 1 : 0;

  let headerIdx = -1;
  let catCol = 0;
  let valCol = 1;
  let pctCol = 2;
  for (let i = scanStart; i < Math.min(rows.length, scanStart + 6); i++) {
    const cells = rows[i].map((c) => c.toLowerCase());
    const ci = cells.findIndex((c) => c.includes('categor'));
    const vi = cells.findIndex((c, j) => j !== ci && (c === 'valor' || c.includes('value')));
    if (ci >= 0 && vi >= 0) {
      headerIdx = i;
      catCol = ci;
      valCol = vi;
      pctCol = cells.findIndex(
        (c, j) => j !== ci && j !== vi && (c.includes('%') || c.includes('porc') || c === 'pct')
      );
      if (pctCol < 0) pctCol = cells.findIndex((_, j) => j !== ci && j !== vi);
      break;
    }
  }
  if (headerIdx < 0 && tableIdx < 0) {
    // Sin sección recognizable: buscamos la cabecera como antes, en las primeras filas
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const cells = rows[i].map((c) => c.toLowerCase());
      const ci = cells.findIndex((c) => c.includes('categor'));
      const vi = cells.findIndex((c, j) => j !== ci && (c === 'valor' || c.includes('value')));
      if (ci >= 0 && vi >= 0) {
        headerIdx = i;
        catCol = ci;
        valCol = vi;
        pctCol = cells.findIndex(
          (c, j) => j !== ci && j !== vi && (c.includes('%') || c.includes('porc') || c === 'pct')
        );
        if (pctCol < 0) pctCol = cells.findIndex((_, j) => j !== ci && j !== vi);
        break;
      }
    }
  }

  // --- tabla de audiencia ---
  const out: AnalyticsRow[] = [];
  const start = headerIdx >= 0 ? headerIdx + 1 : 0;
  for (let i = start; i < rows.length; i++) {
    const r = rows[i];
    const cat = r[catCol] ?? '';
    const val = r[valCol] ?? '';
    if (!cat && !val) continue;
    if (headerIdx >= 0 && cat.toLowerCase().includes('categor')) continue; // cabecera repetida
    if (/^informaci[oó]n detallada/i.test(cat)) continue;
    const pct = parsePct(r[pctCol]);
    if (!val || pct === null) continue;
    out.push({ categoria: cat || 'Otros', valor: val, pct });
  }

  // --- bloque de métricas (por encima de la tabla) ---
  const metricsEnd = tableIdx >= 0 ? tableIdx : headerIdx >= 0 ? headerIdx : 0;
  const metrics: Metric[] = [];
  let url: string | null = null;
  let fecha: string | null = null;
  let hora: string | null = null;
  for (let i = 0; i < metricsEnd; i++) {
    const r = rows[i];
    if (r.length < 2) continue;
    const label = r[0];
    const value = r.slice(1).join(' ').trim();
    if (!label || !value) continue;
    if (/^informaci/i.test(label)) continue;
    const key = metricKey(label);
    if (key === 'url' && /^https?:\/\//.test(value)) url = value;
    if (key === 'fecha') fecha = value;
    if (key === 'hora') hora = value;
    metrics.push({ key, label, value, num: parseMetricNum(value) });
  }

  return { rows: out, metrics, url, fecha, hora };
}

/**
 * Lee un .xls/.xlsx real, un .xls disfrazado de tabla HTML, un CSV/TSV
 * o el texto pegado desde LibreOffice (pestañas o columnas separadas por 2+ espacios).
 */
export async function parseAnalyticsFile(file: File): Promise<ParsedSheet> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv') || name.endsWith('.tsv') || name.endsWith('.txt')) {
    return parseCsvText(await file.text());
  }
  const buf = await file.arrayBuffer();
  let sheet: ParsedSheet = EMPTY_SHEET;
  try {
    const wb = XLSX.read(buf, { type: 'array' });
    for (const sn of wb.SheetNames) {
      const grid = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sn], {
        header: 1,
        defval: '',
        raw: true,
        blankrows: false,
      });
      const parsed = parseSheetGrid(grid);
      if (parsed.rows.length + parsed.metrics.length > sheet.rows.length + sheet.metrics.length) {
        sheet = parsed;
      }
    }
  } catch {
    /* probamos como texto abajo */
  }
  if (!sheet.rows.length && !sheet.metrics.length) {
    const text = new TextDecoder('utf-8').decode(buf);
    try {
      const wb2 = XLSX.read(text, { type: 'string' });
      for (const sn of wb2.SheetNames) {
        const grid = XLSX.utils.sheet_to_json<unknown[]>(wb2.Sheets[sn], {
          header: 1,
          defval: '',
          raw: true,
          blankrows: false,
        });
        const parsed = parseSheetGrid(grid);
        if (parsed.rows.length + parsed.metrics.length > sheet.rows.length + sheet.metrics.length) {
          sheet = parsed;
        }
      }
    } catch {
      /* no era nada legible */
    }
  }
  return sheet;
}

export function parseCsvText(text: string): ParsedSheet {
  const parsed = Papa.parse<unknown[]>(text.trim(), { skipEmptyLines: 'greedy' });
  return parseSheetGrid(parsed.data as unknown[][]);
}

/** Texto copiado de LibreOffice/Excel: pestañas o columnas separadas por 2+ espacios. */
export function parsePastedText(text: string): ParsedSheet {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/[ \t]+$/, ''))
    .filter((l) => l.trim().length > 0);
  const grid = lines.map((l) => {
    if (l.includes('\t')) return l.split('\t').map((c) => c.trim());
    const parts = l.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
    return parts.length ? parts : [l.trim()];
  });
  return parseSheetGrid(grid);
}

/** Agrupa filas por categoría, ordenadas por % dentro de cada grupo. */
export function groupRows(rows: AnalyticsRow[]): CategoryGroup[] {
  const map = new Map<string, AnalyticsRow[]>();
  for (const r of rows) {
    if (!map.has(r.categoria)) map.set(r.categoria, []);
    map.get(r.categoria)!.push(r);
  }
  return [...map.entries()].map(([categoria, items]) => ({
    categoria,
    items: [...items].sort((a, b) => b.pct - a.pct),
    total: items.reduce((s, r) => s + r.pct, 0),
  }));
}

/** Suma los % por valor (audiencia agregada de varios posts). */
export function aggregateValores(
  rows: AnalyticsRow[],
  top = 8
): { valor: string; pct: number; categoria: string }[] {
  const map = new Map<string, { valor: string; pct: number; categoria: string }>();
  for (const r of rows) {
    const k = r.valor.toLowerCase();
    const cur = map.get(k);
    if (cur) cur.pct += r.pct;
    else map.set(k, { valor: r.valor, pct: r.pct, categoria: r.categoria });
  }
  return [...map.values()].sort((a, b) => b.pct - a.pct).slice(0, top);
}


