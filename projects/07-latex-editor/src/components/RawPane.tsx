"use client";

import { useMemo, useRef } from "react";
import { CornerDownRight } from "lucide-react";
import { inputSlugs } from "@/lib/latex";

interface Part {
  text: string;
  cls: string;
}

function highlight(src: string): Part[] {
  const parts: Part[] = [];
  const re = /(\\input\{[^}]+\})|(\\[a-zA-Z@]+\*?)|(\$\$?[^$]*\$\$?)|(%%?[^\n]*)|([{}])|(\[[^\]]*\])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m.index > last) parts.push({ text: src.slice(last, m.index), cls: "text-ink" });
    let cls = "text-ink";
    if (m[1]) cls = "text-blue font-semibold underline decoration-blue/40 underline-offset-2";
    else if (m[2]) cls = "text-red font-semibold";
    else if (m[3]) cls = "text-blue";
    else if (m[4]) cls = "text-muted/80 italic";
    else if (m[5]) cls = "text-muted";
    else if (m[6]) cls = "text-blue/70";
    parts.push({ text: m[0], cls });
    last = m.index + m[0].length;
  }
  if (last < src.length) parts.push({ text: src.slice(last), cls: "text-ink" });
  return parts;
}

const TEXT = "font-mono text-[13px] leading-[22px] whitespace-pre";

export default function RawPane({
  source,
  onChange,
  onNavigate,
  knownSlugs = [],
}: {
  source: string;
  onChange: (v: string) => void;
  onNavigate?: (slug: string) => void;
  knownSlugs?: string[];
}) {
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const parts = useMemo(() => highlight(source), [source]);
  const lineCount = useMemo(() => source.split("\n").length, [source]);
  const inputs = useMemo(() => inputSlugs(source), [source]);

  const sync = () => {
    const ta = taRef.current;
    if (!ta) return;
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
  };

  /**
   * Ctrl/⌘ + clic sobre un \input{slug}: abre ese subdocumento.
   * La posición del cursor tras el clic da el desplazamiento en la fuente.
   */
  const onRawClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey) || !onNavigate) return;
    const pos = e.currentTarget.selectionStart ?? 0;
    for (const m of source.matchAll(/\\input\{([^}]+)\}/g)) {
      if (typeof m.index === "number" && pos >= m.index && pos <= m.index + m[0].length) {
        e.preventDefault();
        e.currentTarget.setSelectionRange(0, 0);
        onNavigate(m[1].trim());
        return;
      }
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-sheet">
      {inputs.length ? (
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-rule bg-paper/60 px-4 py-1.5">
          <span className="label mr-1 text-muted">Compone</span>
          {inputs.map((slug) => {
            const normalizedSlug = slug.replace(/\.tex$/i, "");
            const known = knownSlugs.some((name) => {
              const normalized = name.replace(/\.tex$/i, "");
              return normalized === normalizedSlug || normalized.endsWith(`/${normalizedSlug}`);
            });
            return (
              <button
                key={slug}
                onClick={() => onNavigate?.(slug)}
                title={known ? `Abrir ${slug}.tex` : `No hay documento con slug "${slug}" en el proyecto`}
                className={`label flex items-center gap-1 border px-2 py-1 transition-colors duration-150 ${
                  known
                    ? "border-blue/40 bg-blue/5 text-blue hover:border-blue hover:bg-blue hover:text-paper"
                    : "border-dashed border-muted/50 text-muted hover:border-red hover:text-red"
                }`}
              >
                <CornerDownRight size={10} />
                {slug}
              </button>
            );
          })}
          <span className="label ml-auto hidden text-muted sm:inline">Ctrl/⌘ + clic en el texto para abrir</span>
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        <div
          ref={gutterRef}
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[4.25rem] overflow-hidden border-r border-rule bg-sheet pt-6"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="pr-3 text-right font-mono text-[11px] leading-[22px] text-muted/60">
              {i + 1}
            </div>
          ))}
        </div>

        <pre
          ref={preRef}
          aria-hidden
          className={`pointer-events-none absolute inset-0 overflow-hidden pb-24 pl-[5.5rem] pr-8 pt-6 ${TEXT}`}
        >
          {parts.map((p, i) => (
            <span key={i} className={p.cls}>
              {p.text}
            </span>
          ))}
        </pre>

        <textarea
          ref={taRef}
          value={source}
          spellCheck={false}
          wrap="off"
          onChange={(e) => onChange(e.target.value)}
          onScroll={sync}
          onClick={onRawClick}
          aria-label="Fuente LaTeX"
          className={`absolute inset-0 h-full w-full resize-none overflow-auto border-0 bg-transparent pb-24 pl-[5.5rem] pr-8 pt-6 text-transparent caret-red outline-none selection:bg-red/25 ${TEXT}`}
        />
      </div>

      <div className="pointer-events-none absolute bottom-4 right-5 border border-rule bg-sheet/90 px-3 py-1.5">
        <p className="label text-muted">
          LaTeX · {lineCount} línea{lineCount === 1 ? "" : "s"} · {source.length} car.
        </p>
      </div>
    </div>
  );
}
