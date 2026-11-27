"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Eye,
  FileDown,
  HardDriveDownload,
  Printer,
  Trash2,
  X,
} from "lucide-react";

export interface DownloadItem {
  id: string;
  filename: string;
  mime: string;
  size: number;
  format: string;
  downloadUrl: string;
  viewUrl: string;
  expiresAt: string;
  createdAt: string;
  pageCount?: number;
  pageUrls?: string[];
  engine?: string;
  warnings?: string[];
}

const TEXTY = /^(text\/|application\/(x-tex|rtf|json))/i;

function humanSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function absolute(url: string): string {
  if (typeof window === "undefined") return url;
  return new URL(url, window.location.origin).toString();
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Intenta guardar el archivo directamente en el sistema de archivos local con
 * File System Access API (showSaveFilePicker), que evita el pipeline de descargas del iframe.
 */
export async function saveItemToDisk(item: DownloadItem): Promise<{ ok: boolean; reason?: string }> {
  const w = window as unknown as {
    showSaveFilePicker?: (opts: {
      suggestedName: string;
      types?: { description: string; accept: Record<string, string[]> }[];
    }) => Promise<{
      createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
    }>;
  };
  if (!w.showSaveFilePicker) {
    return {
      ok: false,
      reason: "Este navegador/iframe no expone showSaveFilePicker. Haz clic derecho en «Descargar» → «Guardar enlace como…» o copia la URL en una pestaña nueva.",
    };
  }
  try {
    const ext = "." + (item.filename.split(".").pop() || item.format);
    const mimeClean = item.mime.split(";")[0].trim() || "application/octet-stream";
    const handle = await w.showSaveFilePicker({
      suggestedName: item.filename,
      types: [{ description: item.format.toUpperCase(), accept: { [mimeClean]: [ext] } }],
    });
    const res = await fetch(item.downloadUrl);
    if (!res.ok) return { ok: false, reason: "No se pudo leer el archivo del servidor." };
    const blob = await res.blob();
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return { ok: true };
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "AbortError") return { ok: false, reason: "Guardado cancelado." };
    return {
      ok: false,
      reason:
        "El iframe bloquea guardar directo a disco. Haz clic derecho en «Descargar» → «Guardar enlace como…» o pega la URL en una pestaña nueva.",
    };
  }
}

export default function DownloadsTray({
  items,
  onRemove,
  onClose,
}: {
  items: DownloadItem[];
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const [viewing, setViewing] = useState<DownloadItem | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [htmlPreview, setHtmlPreview] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!viewing) {
      setText(null);
      return;
    }
    if (!TEXTY.test(viewing.mime)) return;
    let alive = true;
    fetch(`${viewing.viewUrl}&text=1`)
      .then((r) => (r.ok ? r.text() : "No se pudo leer el archivo."))
      .then((t) => {
        if (alive) setText(t);
      })
      .catch(() => alive && setText("No se pudo leer el archivo."));
    return () => {
      alive = false;
    };
  }, [viewing]);

  const onCopyUrl = async (item: DownloadItem) => {
    await copyToClipboard(absolute(item.downloadUrl));
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const onCopyContent = async (item: DownloadItem) => {
    try {
      const res = await fetch(`${item.viewUrl}&text=1`);
      if (!res.ok) return;
      const content = await res.text();
      await copyToClipboard(content);
      setCopiedTextId(item.id);
      setTimeout(() => setCopiedTextId(null), 1800);
    } catch {
      /* ignore */
    }
  };

  const onDiskSave = async (item: DownloadItem) => {
    setFeedback(null);
    const res = await saveItemToDisk(item);
    if (res.ok) {
      setFeedback(`Guardado en disco: ${item.filename}`);
    } else if (res.reason) {
      setFeedback(res.reason);
    }
  };

  return (
    <>
      <section className="no-print fixed bottom-4 right-4 z-50 flex max-h-[76vh] w-[25rem] max-w-[94vw] flex-col border border-rule bg-sheet shadow-[0_24px_60px_rgba(23,21,15,0.28)]">
        <header className="flex items-center gap-2 border-b border-rule bg-paper/60 px-4 py-2">
          <FileDown size={14} className="text-red" />
          <p className="label text-ink">Descargas · archivos en servidor</p>
          <button onClick={onClose} className="ml-auto text-muted hover:text-red" title="Cerrar">
            <X size={14} />
          </button>
        </header>

        {feedback ? (
          <div className="flex items-start justify-between gap-2 border-b border-rule bg-paper px-4 py-2 text-[11px] leading-snug text-blue">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)} className="shrink-0 text-muted hover:text-red">
              <X size={12} />
            </button>
          </div>
        ) : null}

        <ul className="min-h-0 flex-1 overflow-auto">
          {items.length === 0 ? (
            <li className="px-4 py-5">
              <p className="label text-muted">Sin exportaciones todavía.</p>
            </li>
          ) : null}
          {items.map((item) => {
            const isText = TEXTY.test(item.mime);
            return (
              <li key={item.id} className="group border-b border-rule/70 px-4 py-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[12px] font-medium text-ink" title={item.filename}>
                      {item.filename}
                    </p>
                    <p className="label mt-1 text-muted">
                      {item.format.toUpperCase()} · {humanSize(item.size)}
                      {item.engine ? ` · ${item.engine}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemove(item.id)}
                    title="Eliminar del servidor"
                    className="p-1 text-muted opacity-0 transition-opacity duration-150 hover:text-red group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <a
                    href={item.downloadUrl}
                    download={item.filename}
                    title="Clic para descargar, o clic derecho → «Guardar enlace como…»"
                    className="label flex items-center gap-1 border border-red bg-red px-2 py-1.5 text-paper transition-colors duration-150 hover:border-ink hover:bg-ink"
                  >
                    <Download size={11} /> Descargar
                  </a>

                  <button
                    onClick={() => void onDiskSave(item)}
                    title="Guardar directamente en disco (File System Access API)"
                    className="label flex items-center gap-1 border border-blue px-2 py-1.5 text-blue transition-colors duration-150 hover:bg-blue hover:text-paper"
                  >
                    <HardDriveDownload size={11} /> Guardar en disco
                  </button>

                  <button
                    onClick={() => setViewing(item)}
                    className="label flex items-center gap-1 border border-rule px-2 py-1.5 text-ink transition-colors duration-150 hover:border-blue hover:text-blue"
                  >
                    <Eye size={11} /> Ver aquí
                  </button>

                  {isText ? (
                    <button
                      onClick={() => void onCopyContent(item)}
                      className="label flex items-center gap-1 border border-rule px-2 py-1.5 text-ink transition-colors duration-150 hover:border-blue hover:text-blue"
                    >
                      {copiedTextId === item.id ? <Check size={11} /> : <Copy size={11} />}
                      {copiedTextId === item.id ? "copiado" : "Copiar texto"}
                    </button>
                  ) : null}

                  <button
                    onClick={() => void onCopyUrl(item)}
                    className="label flex items-center gap-1 border border-rule px-2 py-1.5 text-muted transition-colors duration-150 hover:border-blue hover:text-blue"
                  >
                    {copiedId === item.id ? <Check size={11} /> : <Copy size={11} />}
                    {copiedId === item.id ? "URL copiada" : "URL"}
                  </button>
                </div>

                {item.warnings && item.warnings.length > 0 ? <details className="mt-2 border border-rule bg-paper/60 p-2 text-[10.5px] leading-relaxed text-muted"><summary className="cursor-pointer text-blue">Informe de conversión · {item.warnings.length} avisos</summary><ul className="mt-2 list-disc space-y-1 pl-4">{item.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></details> : null}
                <input
                  readOnly
                  value={absolute(item.downloadUrl)}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Enlace directo de descarga"
                  className="mt-2 w-full border border-rule/70 bg-paper/70 px-2 py-1 font-mono text-[10.5px] text-muted outline-none focus:border-blue focus:text-blue"
                />
              </li>
            );
          })}
        </ul>

        <footer className="border-t border-rule bg-paper/50 px-4 py-2">
          <p className="text-[10.5px] leading-relaxed text-muted">
            En iframes con <span className="font-mono">sandbox</span> sin <span className="font-mono">allow-downloads</span>,
            el navegador ignora el clic normal: usa <strong>Guardar en disco</strong>, <strong>clic derecho en «Descargar» → «Guardar enlace como…»</strong>,
            o pega la URL en una pestaña nueva.
          </p>
        </footer>
      </section>

      {viewing ? (
        <div
          className="no-print fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4"
          onClick={() => setViewing(null)}
        >
          <div
            className="flex max-h-[90vh] w-[min(66rem,96vw)] flex-col border border-rule bg-sheet shadow-[0_30px_80px_rgba(23,21,15,0.4)]"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex flex-wrap items-center gap-2 border-b border-rule px-4 py-2">
              <p className="truncate font-mono text-[12px] font-medium text-ink">{viewing.filename}</p>
              <span className="label text-muted">
                {humanSize(viewing.size)}
                {viewing.engine ? ` · ${viewing.engine}` : ""}
              </span>
              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                {viewing.mime.startsWith("text/html") ? (
                  <button
                    onClick={() => setHtmlPreview((v) => !v)}
                    className="label border border-rule px-2 py-1 text-ink hover:border-blue hover:text-blue"
                  >
                    {htmlPreview ? "Ver código HTML" : "Ver página HTML"}
                  </button>
                ) : null}
                {viewing.mime === "application/pdf" ? (
                  <button
                    onClick={() => window.print()}
                    className="label flex items-center gap-1 border border-rule px-2 py-1 text-ink hover:border-blue hover:text-blue"
                  >
                    <Printer size={11} /> Imprimir PDF
                  </button>
                ) : null}
                {TEXTY.test(viewing.mime) ? (
                  <button
                    onClick={() => void onCopyContent(viewing)}
                    className="label flex items-center gap-1 border border-rule px-2 py-1 text-ink hover:border-blue hover:text-blue"
                  >
                    <Copy size={11} /> {copiedTextId === viewing.id ? "Copiado" : "Copiar todo"}
                  </button>
                ) : null}
                <button
                  onClick={() => void onDiskSave(viewing)}
                  className="label flex items-center gap-1 border border-blue px-2 py-1 text-blue hover:bg-blue hover:text-paper"
                >
                  <HardDriveDownload size={11} /> Guardar en disco
                </button>
                <a
                  href={viewing.downloadUrl}
                  download={viewing.filename}
                  className="label flex items-center gap-1 border border-red bg-red px-2 py-1 text-paper hover:bg-ink"
                >
                  <Download size={11} /> Descargar
                </a>
                <button onClick={() => setViewing(null)} className="ml-1 text-muted hover:text-red">
                  <X size={15} />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-auto bg-[#E5E1D8]">
              {viewing.mime === "application/pdf" && viewing.pageUrls && viewing.pageUrls.length > 0 ? (
                <div className="flex flex-col items-center gap-5 p-6">
                  {viewing.pageUrls.map((url, idx) => (
                    <div key={url} className="flex flex-col items-center">
                      <img
                        src={url}
                        alt={`Página ${idx + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="w-[min(740px,100%)] bg-white shadow-[0_14px_40px_rgba(23,21,15,0.22)]"
                      />
                      <span className="label mt-2 text-muted">
                        Página {idx + 1} / {viewing.pageUrls?.length}
                      </span>
                    </div>
                  ))}
                </div>
              ) : viewing.mime === "application/pdf" ? (
                <iframe src={`${viewing.viewUrl}#toolbar=1&view=FitH`} title={viewing.filename} className="h-[72vh] w-full bg-white" />
              ) : viewing.mime.startsWith("text/html") && htmlPreview && text !== null ? (
                <iframe
                  srcDoc={text}
                  title={viewing.filename}
                  sandbox=""
                  className="h-[72vh] w-full bg-white"
                />
              ) : TEXTY.test(viewing.mime) ? (
                <textarea
                  readOnly
                  value={text ?? "Cargando…"}
                  onFocus={(e) => e.currentTarget.select()}
                  className="h-[70vh] w-full resize-none border-0 bg-white p-5 font-mono text-[11.5px] leading-relaxed text-ink outline-none"
                />
              ) : (
                <div className="flex h-64 flex-col items-center justify-center gap-3 bg-white p-6 text-center">
                  <p className="font-mono text-[12px] text-ink">
                    <strong>{viewing.filename}</strong> ({humanSize(viewing.size)}) — generado con{" "}
                    <span className="text-blue">{viewing.engine || "pandoc"}</span>.
                  </p>
                  <p className="max-w-md font-mono text-[11px] text-muted">
                    Los paquetes ODT/EPUB son archivos binarios ZIP. Usa «Guardar en disco», haz clic derecho en
                    «Descargar» → «Guardar enlace como…», o ejecuta el comando <span className="text-ink">curl</span> de abajo.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => void onDiskSave(viewing)}
                      className="label border border-blue bg-blue px-3 py-2 text-paper hover:bg-ink"
                    >
                      Guardar en disco
                    </button>
                    <a
                      href={viewing.downloadUrl}
                      download={viewing.filename}
                      className="label border border-red bg-red px-3 py-2 text-paper hover:bg-ink"
                    >
                      Descargar {viewing.filename}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-rule bg-paper/60 px-4 py-2.5">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="label mb-1 text-muted">Enlace directo (clic derecho o abrir en pestaña nueva)</p>
                  <input
                    readOnly
                    value={absolute(viewing.downloadUrl)}
                    onFocus={(e) => e.currentTarget.select()}
                    className="w-full border border-rule bg-sheet px-2 py-1 font-mono text-[11px] text-blue outline-none"
                  />
                </div>
                <div>
                  <p className="label mb-1 text-muted">Terminal (curl)</p>
                  <input
                    readOnly
                    value={`curl -L "${absolute(viewing.downloadUrl)}" -o "${viewing.filename}"`}
                    onFocus={(e) => e.currentTarget.select()}
                    className="w-full border border-rule bg-sheet px-2 py-1 font-mono text-[11px] text-ink outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
