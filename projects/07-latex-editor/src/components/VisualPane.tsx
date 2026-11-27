"use client";

import { useRef, useState } from "react";
import katex from "katex";
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import type { Block, DocMeta, Inline } from "@/lib/latex";
import { parseInline, serializeInline } from "@/lib/latex";
import { normalizeDisplayMath } from "./RenderPane";

interface Sibling {
  slug: string;
  title: string;
  kind: string;
  parentId: string | null;
}

interface Props {
  meta: DocMeta;
  blocks: Block[];
  onChange: (meta: DocMeta, blocks: Block[]) => void;
  /** documentos disponibles en el proyecto, para el selector de \input */
  available?: Sibling[];
  /** abre el subdocumento indicado */
  onOpenSlug?: (slug: string) => void;
}

const TYPE_LABEL: Record<Block["type"], string> = {
  titleblock: "Portada",
  include: "Subdocumento",
  heading: "Sección",
  paragraph: "Párrafo",
  list: "Lista",
  quote: "Cita",
  equation: "Ecuación",
  code: "Código",
  image: "Figura",
  pagebreak: "Salto",
  raw: "Crudo",
};

const NEW_BLOCK: Record<string, Block> = {
  include: { type: "include", slug: "" },
  paragraph: { type: "paragraph", inlines: [{ type: "text", text: "" }] },
  heading: { type: "heading", level: 1, text: "Nueva sección" },
  list: { type: "list", ordered: false, items: [[{ type: "text", text: "Primer punto" }]] },
  quote: { type: "quote", inlines: [{ type: "text", text: "" }] },
  equation: { type: "equation", math: "E = m c^{2}", numbered: true },
  code: { type: "code", text: "" },
  image: { type: "image", src: "images/plate.jpg", caption: "", width: "0.62\\textwidth" },
  pagebreak: { type: "pagebreak" },
};

function previewMath(tex: string, display: boolean): string {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode: display, output: "html", strict: false });
  } catch {
    return "";
  }
}

function TextArea({
  value,
  onChange,
  rows = 3,
  placeholder,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  inputRef?: (el: HTMLTextAreaElement | null) => void;
}) {
  return (
    <textarea
      ref={inputRef}
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full resize-y border border-rule bg-paper/60 px-3 py-2 font-mono text-[13px] leading-[1.7] text-ink outline-none transition-colors duration-150 focus:border-red focus:bg-paper"
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label mb-1.5 block text-muted">{label}</span>
      {children}
    </label>
  );
}

export default function VisualPane({ meta, blocks, onChange, available = [], onOpenSlug }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const editors = useRef<Record<number, HTMLTextAreaElement | null>>({});

  const commit = (next: Block[], nextMeta: DocMeta = meta) => onChange(nextMeta, next);

  const update = (i: number, block: Block) => commit(blocks.map((b, j) => (j === i ? block : b)));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length || from === to) return;
    const next = [...blocks];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    commit(next);
  };

  const remove = (i: number) => commit(blocks.filter((_, j) => j !== i));

  const add = (kind: string) => {
    const block = NEW_BLOCK[kind];
    if (block) commit([...blocks, block]);
  };

  const wrap = (i: number, before: string, after: string) => {
    const el = editors.current[i];
    const b = blocks[i];
    if (!el || !b) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const raw = el.value;
    const next = raw.slice(0, start) + before + raw.slice(start, end) + after + raw.slice(end);
    if (b.type === "paragraph" || b.type === "quote") update(i, { ...b, inlines: parseInline(next) });
    else if (b.type === "heading") update(i, { ...b, text: next });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    });
  };

  const setInlines = (i: number, text: string) => {
    const b = blocks[i];
    if (b && (b.type === "paragraph" || b.type === "quote")) update(i, { ...b, inlines: parseInline(text) });
  };

  const inlineText = (nodes: Inline[]): string => serializeInline(nodes);

  return (
    <div className="h-full overflow-auto bg-paper">
      <div className="mx-auto max-w-[58rem] px-6 py-8 lg:px-10">
        {/* ficha del documento (solo en documentos completos con preámbulo) */}
        {meta.isFragment ? (
          <section className="mb-6 border border-dashed border-rule bg-sheet px-5 py-3">
            <p className="label text-blue">Subdocumento (fragmento LaTeX)</p>
            <p className="mt-1 font-mono text-[11.5px] text-muted">
              Este archivo no lleva preámbulo propio; se incluye en la plantilla base mediante \input{"{slug}"}.
            </p>
          </section>
        ) : (
        <section className="mb-8 border border-rule bg-sheet p-6">
          <p className="label mb-4 text-red">Preámbulo y ficha del documento</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título">
              <input
                value={meta.title}
                onChange={(e) => commit(blocks, { ...meta, title: e.target.value })}
                className="w-full border border-rule bg-paper/60 px-3 py-2 font-mono text-[13px] outline-none focus:border-red"
              />
            </Field>
            <Field label="Autoría">
              <input
                value={meta.author}
                onChange={(e) => commit(blocks, { ...meta, author: e.target.value })}
                className="w-full border border-rule bg-paper/60 px-3 py-2 font-mono text-[13px] outline-none focus:border-red"
              />
            </Field>
            <Field label="Fecha">
              <input
                value={meta.date}
                onChange={(e) => commit(blocks, { ...meta, date: e.target.value })}
                className="w-full border border-rule bg-paper/60 px-3 py-2 font-mono text-[13px] outline-none focus:border-red"
              />
            </Field>
            <Field label="Clase de documento">
              <select
                value={meta.documentClass}
                onChange={(e) => commit(blocks, { ...meta, documentClass: e.target.value })}
                className="w-full border border-rule bg-paper/60 px-3 py-2 font-mono text-[13px] outline-none focus:border-red"
              >
                <option value="article">article</option>
                <option value="report">report</option>
                <option value="book">book</option>
                <option value="letter">letter</option>
              </select>
            </Field>
          </div>
        </section>
        )}

        {/* bloques */}
        <div className="space-y-3">
          {blocks.map((b, i) => {
            const dragging = dragIndex === i;
            const over = overIndex === i && dragIndex !== null && dragIndex !== i;
            return (
              <section
                key={i}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverIndex(i);
                }}
                onDragLeave={() => setOverIndex((o) => (o === i ? null : o))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null) move(dragIndex, i);
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                className={`border bg-sheet transition-[border-color,transform,box-shadow] duration-150 ${
                  over ? "border-red shadow-[0_10px_30px_rgba(196,69,44,0.14)]" : "border-rule"
                } ${dragging ? "opacity-40" : ""}`}
              >
                <header className="flex items-center gap-3 border-b border-rule/70 bg-paper/50 px-3 py-2">
                  <span
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setOverIndex(null);
                    }}
                    title="Arrastrar para reordenar"
                    className="cursor-grab text-muted transition-colors duration-150 hover:text-red active:cursor-grabbing"
                  >
                    <GripVertical size={15} />
                  </span>
                  <span className="label text-muted">
                    {String(i + 1).padStart(2, "0")} · {TYPE_LABEL[b.type]}
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    {b.type === "heading" ? (
                      <select
                        value={b.level}
                        onChange={(e) => update(i, { ...b, level: Number(e.target.value) as 1 | 2 | 3 })}
                        className="border border-rule bg-paper/60 px-1.5 py-1 font-mono text-[11px] outline-none focus:border-red"
                      >
                        <option value={1}>Nivel 1</option>
                        <option value={2}>Nivel 2</option>
                        <option value={3}>Nivel 3</option>
                      </select>
                    ) : null}
                    <button
                      onClick={() => move(i, i - 1)}
                      title="Subir"
                      className="border border-transparent p-1 text-muted transition-colors duration-150 hover:border-rule hover:text-ink"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => move(i, i + 1)}
                      title="Bajar"
                      className="border border-transparent p-1 text-muted transition-colors duration-150 hover:border-rule hover:text-ink"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      onClick={() => remove(i)}
                      title="Eliminar bloque"
                      className="border border-transparent p-1 text-muted transition-colors duration-150 hover:border-red hover:text-red"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </header>

                <div className="p-4">
                  {b.type === "heading" ? (
                    <input
                      value={b.text}
                      onChange={(e) => update(i, { ...b, text: e.target.value })}
                      className="w-full border border-rule bg-paper/60 px-3 py-2 font-display text-[18px] outline-none focus:border-red"
                    />
                  ) : null}

                  {b.type === "include" ? (
                    <div className="border-l-2 border-blue bg-paper/40 p-3">
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[12rem] flex-1">
                          <span className="label mb-1.5 block text-muted">Subdocumento · \input{}</span>
                          <div className="flex items-center border border-rule bg-sheet focus-within:border-blue">
                            <span className="pl-2 font-mono text-[12px] text-muted">\input{"{"}</span>
                            <input
                              value={b.slug}
                              onChange={(e) => update(i, { ...b, slug: e.target.value.replace(/[{}]/g, "").trim() })}
                              placeholder="slug-del-documento"
                              className="min-w-0 flex-1 bg-transparent px-1 py-2 font-mono text-[13px] text-blue outline-none"
                            />
                            <span className="pr-2 font-mono text-[12px] text-muted">{"}"}</span>
                          </div>
                        </div>
                        {available.length ? (
                          <label className="min-w-[12rem] flex-1">
                            <span className="label mb-1.5 block text-muted">Elegir del proyecto</span>
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) update(i, { ...b, slug: e.target.value });
                              }}
                              className="w-full border border-rule bg-sheet px-2 py-2 font-mono text-[12px] outline-none focus:border-blue"
                            >
                              <option value="">— seleccionar —</option>
                              {available.map((d) => (
                                <option key={d.slug} value={d.slug}>
                                  {d.title} ({d.slug})
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : null}
                        <button
                          type="button"
                          disabled={!b.slug || !onOpenSlug}
                          onClick={() => b.slug && onOpenSlug?.(b.slug)}
                          className="label border border-blue px-3 py-2 text-blue transition-colors duration-150 hover:bg-blue hover:text-paper disabled:opacity-40"
                        >
                          Abrir documento
                        </button>
                      </div>
                      <p className="mt-2 font-mono text-[11px] leading-relaxed text-muted">
                        Se compone al renderizar y al exportar: el cuerpo del subdocumento sustituye a esta orden.
                      </p>
                    </div>
                  ) : null}

                  {b.type === "paragraph" || b.type === "quote" ? (
                    <div>
                      <div className="mb-2 flex flex-wrap gap-1">
                        {[
                          ["Negrita", "\\textbf{", "}"],
                          ["Cursiva", "\\emph{", "}"],
                          ["Monoespaciada", "\\texttt{", "}"],
                          ["Matemática", "$", "$"],
                          ["Enlace", "\\href{https://}{", "}"],
                        ].map(([label, before, after]) => (
                          <button
                            key={label}
                            onClick={() => wrap(i, before, after)}
                            className="label border border-rule px-2 py-1 text-muted transition-colors duration-150 hover:border-red hover:text-red"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <TextArea
                        inputRef={(el) => {
                          editors.current[i] = el;
                        }}
                        value={inlineText(b.inlines)}
                        onChange={(v) => setInlines(i, v)}
                        rows={b.type === "quote" ? 3 : 4}
                        placeholder="Escribe el texto. Las órdenes LaTeX aparecerán en el renderizado."
                      />
                    </div>
                  ) : null}

                  {b.type === "list" ? (
                    <div className="space-y-2">
                      <div className="mb-2 flex items-center gap-2">
                        <button
                          onClick={() => update(i, { ...b, ordered: !b.ordered })}
                          className="label border border-rule px-2 py-1 text-muted transition-colors duration-150 hover:border-red hover:text-red"
                        >
                          {b.ordered ? "Enumerada" : "Con viñetas"}
                        </button>
                        <button
                          onClick={() => update(i, { ...b, items: [...b.items, [{ type: "text", text: "" }]] })}
                          className="label flex items-center gap-1 border border-rule px-2 py-1 text-muted transition-colors duration-150 hover:border-red hover:text-red"
                        >
                          <Plus size={12} /> Añadir punto
                        </button>
                      </div>
                      {b.items.map((it, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <span className="label mt-2 w-6 shrink-0 text-red">{String(j + 1).padStart(2, "0")}</span>
                          <TextArea
                            value={inlineText(it)}
                            rows={2}
                            onChange={(v) =>
                              update(i, { ...b, items: b.items.map((x, k) => (k === j ? parseInline(v) : x)) })
                            }
                          />
                          <button
                            onClick={() => update(i, { ...b, items: b.items.filter((_, k) => k !== j) })}
                            className="mt-1 p-1 text-muted transition-colors duration-150 hover:text-red"
                            title="Quitar punto"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {b.type === "equation" ? (
                    <div className="grid gap-3 lg:grid-cols-2">
                      <TextArea value={b.math} rows={4} onChange={(v) => update(i, { ...b, math: v })} />
                      <div className="flex items-center justify-center border border-dashed border-rule bg-paper/50 px-3 py-4">
                        <div
                          className="max-w-full overflow-x-auto text-blue"
                          dangerouslySetInnerHTML={{ __html: previewMath(normalizeDisplayMath(b.math), true) }}
                        />
                      </div>
                      <label className="label flex items-center gap-2 text-muted lg:col-span-2">
                        <input
                          type="checkbox"
                          checked={b.numbered}
                          onChange={(e) => update(i, { ...b, numbered: e.target.checked })}
                          className="accent-[#C4452C]"
                        />
                        Numerar la ecuación
                      </label>
                    </div>
                  ) : null}

                  {b.type === "code" ? (
                    <TextArea value={b.text} rows={5} onChange={(v) => update(i, { ...b, text: v })} placeholder="verbatim" />
                  ) : null}

                  {b.type === "image" ? (
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <div className="space-y-3">
                        <Field label="Origen de la figura">
                          <input
                            value={b.src}
                            onChange={(e) => update(i, { ...b, src: e.target.value })}
                            className="w-full border border-rule bg-paper/60 px-3 py-2 font-mono text-[13px] outline-none focus:border-red"
                          />
                        </Field>
                        <Field label="Pie de figura">
                          <input
                            value={b.caption}
                            onChange={(e) => update(i, { ...b, caption: e.target.value })}
                            className="w-full border border-rule bg-paper/60 px-3 py-2 font-mono text-[13px] outline-none focus:border-red"
                          />
                        </Field>
                        <Field label="Ancho (LaTeX)">
                          <input
                            value={b.width}
                            onChange={(e) => update(i, { ...b, width: e.target.value })}
                            className="w-full border border-rule bg-paper/60 px-3 py-2 font-mono text-[13px] outline-none focus:border-red"
                          />
                        </Field>
                        <Field label="Alineación de la imagen">
                          <select
                            value={b.alignment ?? ""}
                            onChange={(e) => update(i, { ...b, alignment: (e.target.value || undefined) as typeof b.alignment })}
                            className="w-full border border-rule bg-paper/60 px-3 py-2 font-mono text-[12px] outline-none focus:border-red"
                          >
                            <option value="">Heredar de LaTeX (sin añadir órdenes)</option>
                            <option value="left">Izquierda — \raggedright</option>
                            <option value="center">Centro — \centering</option>
                            <option value="right">Derecha — \raggedleft</option>
                          </select>
                        </Field>
                      </div>
                      <div className="h-40 w-full border border-rule bg-paper/50 p-2 sm:w-56">
                        <img src={b.src} alt="" className="h-full w-full object-cover" />
                      </div>
                    </div>
                  ) : null}

                  {b.type === "pagebreak" ? (
                    <p className="label text-muted">Salto de página · \newpage</p>
                  ) : null}

                  {b.type === "raw" ? <pre className="font-mono text-[12px] text-muted">{b.text}</pre> : null}
                </div>
              </section>
            );
          })}
        </div>

        {/* añadir bloque */}
        <div className="mt-6 border border-dashed border-rule p-4">
          <p className="label mb-3 text-muted">Añadir bloque</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(NEW_BLOCK).map((kind) => (
              <button
                key={kind}
                onClick={() => add(kind)}
                className="label flex items-center gap-1.5 border border-rule bg-sheet px-3 py-2 text-ink transition-colors duration-150 hover:border-red hover:text-red"
              >
                <Plus size={12} /> {TYPE_LABEL[kind as Block["type"]]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
