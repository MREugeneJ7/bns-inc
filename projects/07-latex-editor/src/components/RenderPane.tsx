"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  HardDriveDownload,
  Loader2,
  Printer,
  RefreshCw,
  Terminal,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import "katex/dist/katex.min.css";
import type { DownloadItem } from "./DownloadsTray";

/**
 * KaTeX no admite `&` ni `\\` fuera de un entorno de alineación:
 * se envuelve la ecuación en `aligned` para la previsualización del editor Visual.
 */
export function normalizeDisplayMath(tex: string): string {
  const t = tex.trim();
  const hasBreak = t.includes("\\\\");
  const hasAlign = t.includes("&");
  if (!hasBreak && !hasAlign) return t;
  const inEnv =
    /\\begin\{(align|aligned|eqnarray|eqnarray\*|gather|gather\*|split|cases|dcases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix)\}/.test(
      t
    );
  if (inEnv) return t;
  const lines = t
    .split(/\\\\/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return t;
  const body = lines.map((l) => (l.includes("&") ? l : `& ${l}`)).join("\\\\\n");
  return `\\begin{aligned}\n${body}\n\\end{aligned}`;
}

export interface CompileBuild {
  ok: boolean;
  hasPdf: boolean;
  file: DownloadItem | null;
  pageCount: number;
  pageUrls: string[];
  errors: string[];
  warnings: string[];
  log: string;
  durationMs: number;
  wrappedFragment: boolean;
  engine?: string;
  mainFile?: string;
}

interface Props {
  compiling: boolean;
  build: CompileBuild | null;
  onCompile: () => void;
  onSaveToDisk?: (item: DownloadItem) => void;
}

export default function RenderPane({ compiling, build, onCompile, onSaveToDisk }: Props) {
  const [zoom, setZoom] = useState(100);
  const [showLog, setShowLog] = useState(false);

  const widthPx = Math.round((760 * zoom) / 100);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#E5E1D8]">
      {/* barra superior de compilación real pdflatex */}
      <div className="no-print flex shrink-0 flex-wrap items-center gap-2 border-b border-rule bg-sheet px-4 py-1.5">
        <div className="flex items-center gap-2">
          {compiling ? (
            <span className="label flex items-center gap-1.5 text-muted">
              <Loader2 size={12} className="animate-spin text-red" /> compilando con pdflatex…
            </span>
          ) : build ? (
            build.errors.length > 0 ? (
              <span className="label flex items-center gap-1.5 text-red">
                <AlertTriangle size={12} /> {build.errors.length} error{build.errors.length === 1 ? "" : "es"} · pdflatex
              </span>
            ) : (
              <span className="label flex items-center gap-1.5 text-blue">
                <CheckCircle2 size={12} /> {build.engine ?? "pdflatex"} · {build.pageCount} pág. · {build.durationMs} ms
              </span>
            )
          ) : (
            <span className="label text-muted">Sin compilar</span>
          )}
          {build?.mainFile ? <span className="label max-w-[14rem] truncate text-muted" title={`Principal del proyecto: ${build.mainFile}`}>{build.mainFile}</span> : null}
          {build?.wrappedFragment ? (
            <span
              className="label border border-dashed border-rule px-1.5 py-0.5 text-muted"
              title="Este subdocumento no tiene \documentclass; se envolvió en article estándar solo para compilarlo."
            >
              fragmento
            </span>
          ) : null}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <div className="flex items-center border border-rule bg-paper/60">
            <button
              onClick={() => setZoom((z) => Math.max(60, z - 15))}
              title="Alejar"
              className="p-1 text-muted hover:text-ink"
            >
              <ZoomOut size={13} />
            </button>
            <span className="px-1.5 font-mono text-[10.5px] text-ink">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(180, z + 15))}
              title="Acercar"
              className="p-1 text-muted hover:text-ink"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          <button
            onClick={() => setShowLog((v) => !v)}
            className={`label flex items-center gap-1 border px-2 py-1 transition-colors duration-150 ${
              showLog
                ? "border-ink bg-ink text-paper"
                : build?.errors.length
                  ? "border-red text-red hover:bg-red hover:text-paper"
                  : "border-rule text-muted hover:border-ink hover:text-ink"
            }`}
            title="Ver registro de pdflatex"
          >
            <Terminal size={12} /> Log
            {build && (build.errors.length > 0 || build.warnings.length > 0) ? (
              <span>({build.errors.length || build.warnings.length})</span>
            ) : null}
          </button>

          <button
            onClick={onCompile}
            disabled={compiling}
            title="Recompilar con pdflatex"
            className="label flex items-center gap-1 border border-rule px-2 py-1 text-muted hover:border-red hover:text-red disabled:opacity-40"
          >
            <RefreshCw size={11} className={compiling ? "animate-spin" : ""} /> Recompilar
          </button>

          {build?.file ? (
            <>
              <button
                onClick={() => window.print()}
                title="Imprimir o guardar como PDF desde el diálogo del navegador"
                className="label flex items-center gap-1 border border-rule px-2 py-1 text-ink hover:border-blue hover:text-blue"
              >
                <Printer size={12} /> Imprimir PDF
              </button>
              {onSaveToDisk ? (
                <button
                  onClick={() => build.file && onSaveToDisk(build.file)}
                  title="Guardar archivo PDF directamente en disco (File System Access)"
                  className="label flex items-center gap-1 border border-blue px-2 py-1 text-blue hover:bg-blue hover:text-paper"
                >
                  <HardDriveDownload size={12} /> Guardar
                </button>
              ) : null}
              <a
                href={build.file.downloadUrl}
                download={build.file.filename}
                title="Clic para descargar (o clic derecho → Guardar enlace como…)"
                className="label flex items-center gap-1 border border-red bg-red px-2 py-1 text-paper hover:border-ink hover:bg-ink"
              >
                <Download size={12} /> PDF
              </a>
            </>
          ) : null}
        </div>
      </div>

      {/* panel desplegable de log real de pdflatex */}
      {showLog && build ? (
        <div className="no-print max-h-[38%] shrink-0 overflow-auto border-b border-rule bg-[#1B1914] p-4 font-mono text-[11.5px] leading-relaxed text-[#E7E1D3]">
          {build.errors.length > 0 ? (
            <div className="mb-3 border-l-2 border-red pl-3">
              <p className="label mb-1 text-red">Errores de pdflatex</p>
              {build.errors.map((e, i) => (
                <p key={i} className="text-[#FF9E8A]">
                  {e}
                </p>
              ))}
            </div>
          ) : null}
          {build.warnings.length > 0 ? (
            <div className="mb-3 border-l-2 border-[#D4A74A] pl-3">
              <p className="label mb-1 text-[#D4A74A]">Avisos ({build.warnings.length})</p>
              {build.warnings.slice(0, 12).map((w, i) => (
                <p key={i} className="text-[#E6CFA0]">
                  {w}
                </p>
              ))}
            </div>
          ) : null}
          <details>
            <summary className="label cursor-pointer text-muted">Salida completa de main.log</summary>
            <pre className="mt-2 whitespace-pre-wrap text-[10.5px] text-[#BFB8A8]">{build.log}</pre>
          </details>
        </div>
      ) : null}

      {/* lienzo con las páginas exactas compiladas por pdflatex */}
      <div className="print-only-container min-h-0 flex-1 overflow-auto px-4 py-7 sm:px-8">
        {!build && compiling ? (
          <div className="no-print flex h-full flex-col items-center justify-center gap-3">
            <Loader2 size={22} className="animate-spin text-red" />
            <p className="label text-muted">Compilando documento con pdflatex…</p>
          </div>
        ) : build && build.pageUrls.length > 0 ? (
          <div className="flex flex-col items-center gap-6">
            {build.errors.length > 0 ? (
              <div className="no-print w-full max-w-[48rem] border border-red/50 bg-[#FFF5F2] px-4 py-3 text-left">
                <p className="label mb-1 text-red">
                  Compilado con {build.errors.length} error{build.errors.length === 1 ? "" : "es"} de LaTeX
                </p>
                {build.errors.slice(0, 3).map((e, i) => (
                  <p key={i} className="font-mono text-[11.5px] text-ink">
                    {e}
                  </p>
                ))}
              </div>
            ) : null}

            {build.pageUrls.map((url, idx) => (
              <div key={url} className="flex w-full flex-col items-center">
                <img
                  src={url}
                  alt={`Página ${idx + 1} de ${build.pageCount}`}
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                  style={{ width: `${widthPx}px` }}
                  className="print-page max-w-full bg-white shadow-[0_14px_40px_rgba(23,21,15,0.22)]"
                />
                <span className="no-print label mt-2 text-muted">
                  Página {idx + 1} / {build.pageCount}
                </span>
              </div>
            ))}
          </div>
        ) : build && build.errors.length > 0 ? (
          <div className="no-print mx-auto max-w-[46rem] border border-red bg-sheet p-6">
            <p className="label mb-2 text-red">Error de compilación en pdflatex</p>
            <p className="mb-4 font-mono text-[12px] text-muted">
              pdflatex no pudo generar el PDF por un error de sintaxis en el código LaTeX:
            </p>
            <div className="space-y-1.5 border border-rule bg-[#1B1914] p-4 font-mono text-[12px] text-[#FF9E8A]">
              {build.errors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
            <button
              onClick={() => setShowLog(true)}
              className="label mt-4 border border-rule px-3 py-1.5 text-ink hover:border-red hover:text-red"
            >
              Ver main.log completo
            </button>
          </div>
        ) : (
          <div className="no-print flex h-full flex-col items-center justify-center gap-3">
            <p className="label text-muted">Pulsa Compilar para generar el PDF con pdflatex</p>
            <button
              onClick={onCompile}
              className="label border border-red bg-red px-4 py-2 text-paper hover:border-ink hover:bg-ink"
            >
              Compilar con pdflatex
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
