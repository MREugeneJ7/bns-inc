"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Columns2,
  Download,
  FileDown,
  FileInput,
  FilePlus2,
  FileText,
  FolderOpen,
  LayoutTemplate,
  Loader2,
  PanelLeft,
  PenLine,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import RawPane from "./RawPane";
import ProjectWorkspace from "./ProjectWorkspace";
import ImportProjectDialog from "./ImportProjectDialog";
import type { CompatibilityChange } from "@/db/schema";
import VisualPane from "./VisualPane";
import RenderPane, { type CompileBuild } from "./RenderPane";
import DownloadsTray, { saveItemToDisk, type DownloadItem } from "./DownloadsTray";
import { parse, serialize, wordCount, type Block, type DocMeta } from "@/lib/latex";
import { composeDocument, withInputLine, type SubDoc } from "@/lib/compose";
import { FORMATS, FORMAT_LABEL, type ExportFormat } from "@/lib/formats";

type Mode = "raw" | "visual" | "render";
type Status = "idle" | "saving" | "saved" | "exported" | "error";

interface ProjectRow {
  id: string;
  name: string;
  mainFile?: string | null;
  engine?: string;
  compatibility?: CompatibilityChange[];
}
interface DocRow {
  id: string;
  projectId: string;
  parentId: string | null;
  slug: string;
  filePath?: string | null;
  title: string;
  kind: "base" | "tipo" | "texto" | "archivo";
  words: number;
  blocks: number;
  updatedAt: string;
}

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "raw", label: "Raw", hint: "Fuente LaTeX" },
  { id: "visual", label: "Visual", hint: "Bloques y arrastre" },
  { id: "render", label: "Render", hint: "PDF real (pdflatex)" },
];

const MODE_KEYS: Record<Mode, string> = { raw: "F1", visual: "F2", render: "F3" };

const KIND_LABEL: Record<DocRow["kind"], string> = { base: "plantilla", tipo: "tipo", texto: "texto", archivo: "archivo" };

const STORE_KEY = "taller-descargas-v2";

function kindIcon(kind: DocRow["kind"], active: boolean) {
  const cls = active ? "text-red" : "text-muted";
  if (kind === "base") return <LayoutTemplate size={13} className={cls} />;
  if (kind === "tipo") return <PenLine size={13} className={cls} />;
  return <FileText size={13} className={cls} />;
}

function starterFor(title: string, kind: string): string {
  if (kind === "base") {
    return `% Plantilla base
\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[spanish]{babel}
\\usepackage{lmodern}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{graphicx}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{hyperref}

\\title{${title}}
\\author{}
\\date{\\today}

\\begin{document}
\\maketitle

% Incorpora aquí los subdocumentos con \\input{slug}

\\end{document}
`;
  }
  return `% Subdocumento
\\section{${title}}

Texto del subdocumento.
`;
}

export default function Studio() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [descendants, setDescendants] = useState<SubDoc[]>([]);
  const [mode, setMode] = useState<Mode>("render");
  const [split, setSplit] = useState(true);
  const [panel, setPanel] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = useState(false);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [tray, setTray] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const [projectRevision, setProjectRevision] = useState(0);
  const [batchExport, setBatchExport] = useState(false);
  const [exportReport, setExportReport] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const [compiledAt, setCompiledAt] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [build, setBuild] = useState<CompileBuild | null>(null);
  const [sweep, setSweep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyExport, setBusyExport] = useState<ExportFormat | null>(null);

  const [creatingProject, setCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingDoc, setCreatingDoc] = useState<{ projectId: string; parentId: string | null } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newKind, setNewKind] = useState<string>("texto");

  const dirty = useRef(false);
  const draft = useRef({ id: activeId, title, source });
  draft.current = { id: activeId, title, source };
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const compileTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const compileAbort = useRef<AbortController | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeDoc = useMemo(() => docs.find((d) => d.id === activeId) ?? null, [docs, activeId]);
  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeDoc?.projectId) ?? null,
    [projects, activeDoc]
  );
  const projectDocs = useMemo(
    () => (activeDoc ? docs.filter((d) => d.projectId === activeDoc.projectId) : []),
    [docs, activeDoc]
  );

  const rawParsed = useMemo(() => parse(source), [source]);
  const composing = activeId !== null && descendants.length > 0;
  const composedSource = useMemo(
    () => (composing && activeId ? composeDocument(activeId, source, descendants) : source),
    [composing, activeId, source, descendants]
  );
  const parsed = useMemo(() => parse(composedSource), [composedSource]);
  const words = useMemo(() => wordCount(parsed.blocks), [parsed]);

  const auxFiles = useMemo(
    () => descendants.map((d) => ({ slug: d.slug, source: d.source })),
    [descendants]
  );

  const flash = useCallback((msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 5000);
  }, []);

  /* ---------------- compilación real pdflatex ---------------- */

  const runCompile = useCallback(
    async (srcOverride?: string, titleOverride?: string, filesOverride?: { slug: string; source: string }[], projectContext?: { id: string; path: string }) => {
      const native = projectContext ?? (activeDoc?.filePath ? { id: activeDoc.projectId, path: activeDoc.filePath } : undefined);
      const targetSource = srcOverride ?? (native ? source : composedSource);
      if (!targetSource.trim()) return;

      if (compileAbort.current) compileAbort.current.abort();
      const ctrl = new AbortController();
      compileAbort.current = ctrl;

      setCompiling(true);
      setSweep((s) => s + 1);
      try {
        const res = await fetch("/api/compile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: targetSource,
            title: titleOverride ?? title,
            files: filesOverride ?? auxFiles,
            projectId: native?.id,
            editingFile: native?.path,
          }),
          signal: ctrl.signal,
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || "No se pudo compilar el proyecto."); }
        const data = (await res.json()) as {
          ok: boolean;
          hasPdf: boolean;
          file: Omit<DownloadItem, "format"> | null;
          pageCount: number;
          pageUrls: string[];
          errors: string[];
          warnings: string[];
          log: string;
          durationMs: number;
          wrappedFragment: boolean;
          engine?: string;
          mainFile?: string;
        };
        if (ctrl.signal.aborted) return;

        const nextBuild: CompileBuild = {
          ok: data.ok,
          hasPdf: data.hasPdf,
          file: data.file ? { ...data.file, format: "pdf" } : null,
          pageCount: data.pageCount,
          pageUrls: data.pageUrls,
          errors: data.errors,
          warnings: data.warnings,
          log: data.log,
          durationMs: data.durationMs,
          wrappedFragment: data.wrappedFragment,
          engine: data.engine,
          mainFile: data.mainFile,
        };
        setBuild(nextBuild);
        setCompiledAt(
          new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        );
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        flash(err instanceof Error ? err.message : "No se pudo compilar el proyecto");
      } finally {
        if (!ctrl.signal.aborted) setCompiling(false);
      }
    },
    [composedSource, source, title, auxFiles, flash, activeDoc?.projectId, activeDoc?.filePath]
  );

  /* ---------------- datos ---------------- */

  const loadAll = useCallback(async () => {
    // The documents endpoint initializes samples if needed; load projects after that transaction.
    const dr = await fetch("/api/documents").then((r) => r.json());
    const pr = await fetch("/api/projects").then((r) => r.json());
    setProjects(pr as ProjectRow[]);
    setDocs(dr as DocRow[]);
    return { projects: pr as ProjectRow[], docs: dr as DocRow[] };
  }, []);

  const openDoc = useCallback(
    async (id: string) => {
      // Flush the current draft before navigation; do not autosave the old source into the new file.
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (compileTimer.current) clearTimeout(compileTimer.current);
      if (dirty.current && draft.current.id) {
        const old = draft.current;
        const saved = await fetch(`/api/documents/${old.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: old.title, source: old.source }) });
        if (!saved.ok) { flash("No se ha abierto otro archivo porque el guardado falló."); return; }
      }
      dirty.current = false;
      const res = await fetch(`/api/documents/${id}`);
      if (!res.ok) return;
      const d = (await res.json()) as DocRow & { source: string };
      setActiveId(id);
      setTitle(d.title);
      setSource(d.source);
      setStatus("idle");

      let nextDesc: SubDoc[] = [];
      const st = await fetch(`/api/documents/${id}/subtree`);
      if (st.ok) {
        const sj = (await st.json()) as { descendants: SubDoc[] };
        nextDesc = sj.descendants ?? [];
      }
      setDescendants(nextDesc);
      if (d.projectId) setExpanded((prev) => new Set(prev).add(d.projectId));

      const fullSrc = nextDesc.length > 0 ? composeDocument(id, d.source, nextDesc) : d.source;
      void runCompile(
        fullSrc,
        d.title,
        nextDesc.map((x) => ({ slug: x.slug, source: x.source })),
        d.filePath ? { id: d.projectId, path: d.filePath } : undefined
      );
      try { localStorage.setItem("taller-active-document", d.id); } catch { /* storage blocked */ }
    },
    [runCompile, flash]
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setDownloads(JSON.parse(raw) as DownloadItem[]);
    } catch {
      /* ignore */
    }
    (async () => {
      const { docs: dr, projects: loadedProjects } = await loadAll();
      const lastProject = [...loadedProjects].reverse().find((p) => p.mainFile);
      let savedId: string | null = null;
      try { savedId = localStorage.getItem("taller-active-document"); } catch { /* ignore */ }
      if (dr.length) await openDoc((dr.find((d) => d.id === savedId) ?? dr.find((d) => d.projectId === lastProject?.id && d.filePath === lastProject?.mainFile) ?? dr.find((d) => d.kind === "base") ?? dr[0]).id);
      else setSource(starterFor("Sin título", "base"));
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(downloads.slice(0, 24)));
    } catch {
      /* ignore */
    }
  }, [downloads]);

  /* ---------------- persistencia + autocompilación ---------------- */

  const save = useCallback(
    async (silent = false) => {
      if (!activeId) return;
      if (!silent) setStatus("saving");
      try {
        const res = await fetch(`/api/documents/${activeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, source }),
        });
        if (!res.ok) throw new Error("No se pudo guardar");
        const row = (await res.json()) as DocRow;
        dirty.current = false;
        setStatus("saved");
        setDocs((prev) => prev.map((d) => (d.id === activeId ? { ...d, ...row } : d)));
      } catch {
        setStatus("error");
      }
    },
    [activeId, title, source]
  );

  useEffect(() => {
    if (!dirty.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void save(true), 1000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [source, title, save]);

  useEffect(() => {
    if (!dirty.current) return;
    // Native theses can take several passes; compile them explicitly, not once per keystroke.
    if (activeDoc?.filePath) return;
    if (!(split || mode === "render")) return;
    if (compileTimer.current) clearTimeout(compileTimer.current);
    compileTimer.current = setTimeout(() => void runCompile(), 1200);
    return () => {
      if (compileTimer.current) clearTimeout(compileTimer.current);
    };
  }, [composedSource, split, mode, runCompile, activeDoc?.filePath]);

  const markDirty = () => {
    dirty.current = true;
    if (status === "saved" || status === "exported") setStatus("idle");
  };

  const onRawChange = (v: string) => {
    setSource(v);
    markDirty();
  };

  const onVisualChange = (meta: DocMeta, blocks: Block[]) => {
    setSource(serialize(meta, blocks));
    if (!meta.isFragment) setTitle(meta.title);
    markDirty();
  };

  const onTitleChange = (v: string) => {
    setTitle(v);
    setSource((prev) =>
      /\\title\s*\{/.test(prev) ? prev.replace(/\\title\s*\{[\s\S]*?\}/, `\\title{${v.replace(/[{}]/g, "")}}`) : prev
    );
    markDirty();
  };

  /* ---------------- navegación por \input ---------------- */

  const openBySlug = (slug: string) => {
    const normalize = (s: string) => { const parts: string[] = []; for (const part of s.split("/")) { if (part === "..") parts.pop(); else if (part && part !== ".") parts.push(part); } return parts.join("/").replace(/\.tex$/i, ""); };
    const mainDir = activeProject?.mainFile?.split("/").slice(0, -1).join("/") ?? "";
    const fileDir = activeDoc?.filePath?.split("/").slice(0, -1).join("/") ?? "";
    const paths = [slug, `${mainDir}/${slug}`, `${fileDir}/${slug}`].map(normalize);
    const target = docs.find((d) => d.projectId === activeDoc?.projectId && paths.includes(normalize(d.filePath ?? d.slug)));
    if (target) {
      void openDoc(target.id);
      flash(`Abierto ${slug}.tex`);
    } else {
      flash(`No hay ningún documento con slug «${slug}» en el proyecto`);
    }
  };

  /* ---------------- proyectos y árbol ---------------- */

  const createProject = async (name: string) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      setStatus("error");
      return;
    }
    const created = (await res.json()) as { project: ProjectRow; document: DocRow };
    setCreatingProject(false);
    setNewProjectName("");
    await loadAll();
    setExpanded((prev) => new Set(prev).add(created.project.id));
    await openDoc(created.document.id);
  };

  const renameProject = (id: string, name: string) => {
    const cur = projects.find((p) => p.id === id);
    if (!cur || !name.trim() || name.trim() === cur.name) return;
    void fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    })
      .then((r) => r.json())
      .then((p: ProjectRow) => setProjects((prev) => prev.map((x) => (x.id === p.id ? p : x))));
  };

  const deleteProject = async (id: string) => {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    const { docs: dr } = await loadAll();
    if (activeDoc?.projectId === id) {
      if (dr.length) await openDoc(dr[0].id);
      else {
        setActiveId(null);
        setDescendants([]);
        setBuild(null);
      }
    }
  };

  const createDoc = async (ctx: { projectId: string; parentId: string | null }) => {
    const t = newTitle.trim() || "Nuevo documento";
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: ctx.projectId,
        parentId: ctx.parentId,
        title: t,
        kind: newKind,
        source: starterFor(t, newKind),
      }),
    });
    if (!res.ok) {
      setStatus("error");
      return;
    }
    const row = (await res.json()) as DocRow;
    setCreatingDoc(null);
    setNewTitle("");
    setNewKind("texto");
    await loadAll();
    await openDoc(row.id);
  };

  const deleteDoc = async (id: string) => {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    const { docs: dr } = await loadAll();
    if (activeId === id) {
      if (dr.length) await openDoc(dr[0].id);
      else {
        setActiveId(null);
        setDescendants([]);
        setBuild(null);
      }
    }
  };

  const insertInput = async (d: DocRow) => {
    if (!d.parentId) return;
    const pres = await fetch(`/api/documents/${d.parentId}`);
    if (!pres.ok) return;
    const parent = (await pres.json()) as { id: string; source: string };
    const src = withInputLine(parent.source, d.slug);
    await fetch(`/api/documents/${parent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: src }),
    });
    if (parent.id === activeId) {
      setSource(src);
      void runCompile(composeDocument(parent.id, src, descendants));
    }
    await loadAll();
    flash(`\\input{${d.slug}} insertado en el documento padre`);
  };

  /* ---------------- abrir desde el sistema ---------------- */

  const openFromFileSystem = async () => {
    const pick = async (): Promise<File | null> => {
      const w = window as unknown as {
        showOpenFilePicker?: (opts: {
          types: { description: string; accept: Record<string, string[]> }[];
          multiple?: boolean;
        }) => Promise<Array<{ getFile: () => Promise<File> }>>;
      };
      if (w.showOpenFilePicker) {
        try {
          const handles = await w.showOpenFilePicker({
            types: [{ description: "LaTeX / texto", accept: { "text/x-tex": [".tex"], "text/plain": [".txt"] } }],
          });
          return await handles[0].getFile();
        } catch {
          return null;
        }
      }
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".tex,.txt";
        input.onchange = () => resolve(input.files?.[0] ?? null);
        input.click();
      });
    };
    const file = await pick();
    if (!file) return;
    const magic = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    if (magic[0] === 0x50 && magic[1] === 0x4b) {
      setImportDialog(true); flash("Importa el ZIP completo en el diálogo de proyecto."); return;
    }
    const text = await file.text();
    const base = file.name.replace(/\.[^.]+$/, "") || "documento";

    let target = projects[0];
    if (!target) {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Documentos locales" }),
      });
      const created = (await res.json()) as { project: ProjectRow };
      await loadAll();
      target = created.project;
    }
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: target.id, parentId: null, title: base, kind: "texto", source: text }),
    });
    if (!res.ok) {
      setStatus("error");
      return;
    }
    const row = (await res.json()) as DocRow;
    await loadAll();
    await openDoc(row.id);
    flash(`«${file.name}» abierto desde el sistema de archivos`);
  };

  /* ---------------- exportación determinista ---------------- */

  const attemptSameFrameDownload = (item: DownloadItem) => {
    // Sin target="_blank": evita bloqueos de allow-popups cuando allow-downloads sí está permitido.
    try {
      const a = document.createElement("a");
      a.href = item.downloadUrl;
      a.download = item.filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 1500);
    } catch {
      /* si el iframe bloquea allow-downloads queda la bandeja manual */
    }
  };

  const runExport = async (format: ExportFormat, autoDownload = true) => {
    setExportOpen(false);
    setBusyExport(format);
    setStatus("saving");
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: activeDoc?.filePath ? source : composedSource,
          title: activeDoc?.filePath ? activeProject?.name || title : parsed.meta.title || title,
          format,
          files: auxFiles,
          projectId: activeDoc?.filePath ? activeDoc.projectId : undefined,
          editingFile: activeDoc?.filePath ?? undefined,
        }),
      });
      const json = (await res.json()) as { file?: Omit<DownloadItem, "format">; engine?: string; error?: string; warnings?: string[] };
      if (!res.ok || !json.file) throw new Error(json.error || "Exportación fallida");

      const item: DownloadItem = { ...json.file, format, engine: json.engine ?? json.file.engine, warnings: json.warnings ?? [] };
      setDownloads((prev) => [item, ...prev.filter((d) => d.id !== item.id)].slice(0, 24));
      setStatus("exported");
      setTray(true);
      if (autoDownload) attemptSameFrameDownload(item);
      flash(`${item.filename} listo (${item.engine || format}) · disponible en Descargas`);
      return item;
    } catch (err) {
      setStatus("error");
      flash(err instanceof Error ? err.message : "No se pudo generar el archivo");
    } finally {
      setBusyExport(null);
    }
  };

  const runAllExports = async () => {
    setBatchExport(true); setExportOpen(false); setExportReport([]);
    let count = 0;
    for (const format of FORMATS) {
      flash(`Generando ${format.toUpperCase()} · ${count + 1}/8…`);
      const item = await runExport(format, false);
      if (item) count++;
      setExportReport((prev) => [...prev, `${format.toUpperCase()}: ${item ? "generado" : "error (reintenta este formato)"}`]);
    }
    setBatchExport(false); setTray(true); flash(`${count}/8 formatos generados. Revisa los informes en Descargas.`);
  };

  const handleProjectChange = async () => {
    const currentId = activeId;
    await loadAll(); setProjectRevision((n) => n + 1);
    if (currentId) await openDoc(currentId);
  };

  const handleImported = async (projectId: string, main: string) => {
    const loaded = await loadAll();
    const d = loaded.docs.find((d) => d.projectId === projectId && d.filePath === main);
    setExpanded((prev) => new Set(prev).add(projectId)); setPanel(true); setProjectRevision((n) => n + 1);
    if (d) await openDoc(d.id);
  };

  const handleSaveToDisk = async (item: DownloadItem) => {
    const res = await saveItemToDisk(item);
    if (res.ok) flash(`Guardado en disco: ${item.filename}`);
    else if (res.reason) flash(res.reason);
  };

  const removeDownload = (id: string) => {
    setDownloads((prev) => prev.filter((d) => d.id !== id));
    void fetch(`/api/export?id=${id}`, { method: "DELETE" });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
        void runCompile();
      }
      if (e.key === "F1") {
        e.preventDefault();
        setSplit(false);
        setMode("raw");
      }
      if (e.key === "F2") {
        e.preventDefault();
        setSplit(false);
        setMode("visual");
      }
      if (e.key === "F3") {
        e.preventDefault();
        setSplit(false);
        setMode("render");
        void runCompile();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save, runCompile]);

  /* ---------------- piezas ---------------- */

  const paneFor = (id: Mode) =>
    id === "raw" ? (
      <RawPane
        source={source}
        onChange={onRawChange}
        onNavigate={openBySlug}
        knownSlugs={projectDocs.map((d) => d.slug)}
      />
    ) : id === "visual" && activeDoc?.filePath ? (
      <div className="flex h-full flex-col bg-paper"><div className="border-b border-rule bg-sheet px-6 py-4"><p className="label text-blue">Proyecto nativo · fuente protegida</p><p className="mt-2 text-xs leading-relaxed text-muted">Este proyecto puede usar clases, macros y tablas que el editor de bloques no interpreta sin pérdidas. Se edita la fuente exacta; Render y los ocho exportadores usan el árbol completo y el archivo principal. No se reserializa el documento automáticamente.</p></div><div className="min-h-0 flex-1"><RawPane source={source} onChange={onRawChange} onNavigate={openBySlug} knownSlugs={projectDocs.map((d) => d.slug)}/></div></div>
    ) : id === "visual" ? (
      <VisualPane
        meta={rawParsed.meta}
        blocks={rawParsed.blocks}
        onChange={onVisualChange}
        available={projectDocs
          .filter((d) => d.id !== activeId)
          .map((d) => ({ slug: d.slug, title: d.title, kind: d.kind, parentId: d.parentId }))}
        onOpenSlug={openBySlug}
      />
    ) : (
      <RenderPane
        compiling={compiling}
        build={build}
        onCompile={() => void runCompile()}
        onSaveToDisk={(item) => void handleSaveToDisk(item)}
      />
    );

  const renderCreateForm = (depth: number) => {
    if (!creatingDoc) return null;
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void createDoc(creatingDoc);
        }}
        className="flex items-center gap-1.5 border border-dashed border-rule bg-paper/60 py-1.5 pr-2"
        style={{ paddingLeft: 10 + depth * 14 }}
      >
        <input
          autoFocus
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Título del documento"
          className="min-w-0 flex-1 bg-transparent font-mono text-[12px] outline-none"
        />
        <select
          value={newKind}
          onChange={(e) => setNewKind(e.target.value)}
          className="border border-rule bg-sheet px-1 py-0.5 font-mono text-[10.5px] outline-none"
        >
          <option value="base">plantilla</option>
          <option value="tipo">tipo</option>
          <option value="texto">texto</option>
        </select>
        <button type="submit" title="Crear" className="p-1 text-blue hover:text-red">
          <Check size={13} />
        </button>
        <button
          type="button"
          title="Cancelar"
          onClick={() => {
            setCreatingDoc(null);
            setNewTitle("");
          }}
          className="p-1 text-muted hover:text-red"
        >
          <X size={12} />
        </button>
      </form>
    );
  };

  const renderDoc = (d: DocRow, depth: number): ReactNode => {
    const children = docs.filter((x) => x.parentId === d.id);
    const isActive = d.id === activeId;
    return (
      <div key={d.id}>
        <div
          className={`group flex items-center gap-1.5 pr-2 transition-colors duration-150 ${
            isActive ? "bg-paper" : "hover:bg-paper/70"
          }`}
          style={{ paddingLeft: 10 + depth * 13 }}
        >
          {kindIcon(d.kind, isActive)}
          <button
            onClick={() => void openDoc(d.id)}
            className={`min-w-0 flex-1 truncate text-left font-mono text-[12px] leading-[1.95] hover:text-red ${
              isActive ? "text-red" : "text-ink"
            }`}
            title={`${d.title} · \\input{${d.slug}}`}
          >
            {d.title}
          </button>
          <span className="label hidden text-muted lg:inline">{KIND_LABEL[d.kind]}</span>
          <span className="flex items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <button
              title="Añadir subdocumento"
              onClick={() => setCreatingDoc({ projectId: d.projectId, parentId: d.id })}
              className="p-1 text-muted hover:text-blue"
            >
              <Plus size={12} />
            </button>
            {d.parentId ? (
              <button
                title={`Insertar \\input{${d.slug}} en el padre`}
                onClick={() => void insertInput(d)}
                className="p-1 text-muted hover:text-blue"
              >
                <FileInput size={12} />
              </button>
            ) : null}
            <button
              title="Eliminar (y subdocumentos)"
              onClick={() => void deleteDoc(d.id)}
              className="p-1 text-muted hover:text-red"
            >
              <Trash2 size={12} />
            </button>
          </span>
        </div>
        {children.map((c) => renderDoc(c, depth + 1))}
        {creatingDoc?.parentId === d.id ? renderCreateForm(depth + 1) : null}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* rail */}
      <aside className="no-print flex w-14 shrink-0 flex-col items-center justify-between border-r border-rule bg-sheet py-4">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center border border-ink bg-ink font-display text-[18px] text-paper">
            T
          </div>
          <span className="label text-muted">{MODE_KEYS[mode]}</span>
        </div>
        <p
          className="label whitespace-nowrap text-muted"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Taller · estación de composición
        </p>
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => setPanel((v) => !v)}
            title="Proyectos"
            className={`border p-2 transition-colors duration-150 ${
              panel ? "border-rule text-red" : "border-transparent text-muted hover:border-rule hover:text-red"
            }`}
          >
            <PanelLeft size={17} />
          </button>
          <button
            onClick={() => void runCompile()}
            title="Compilar con pdflatex"
            className="border border-transparent p-2 text-muted transition-colors duration-150 hover:border-rule hover:text-red"
          >
            <Sparkles size={17} />
          </button>
          <span
            className={`h-2.5 w-2.5 rounded-full transition-colors duration-200 ${
              status === "error" || (build && build.errors.length > 0)
                ? "bg-red"
                : status === "saving" || compiling
                  ? "bg-muted/50"
                  : "bg-blue"
            }`}
          />
        </div>
      </aside>

      {/* panel de proyectos: en flujo, como un IDE */}
      {panel ? (
        <aside className="no-print flex w-[16rem] shrink-0 flex-col border-r border-rule bg-sheet md:w-[18.5rem] xl:w-[20rem]">
          <div className="relative h-24 shrink-0 overflow-hidden border-b border-rule">
            <img src="images/typecase.jpg" alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-sheet via-sheet/55 to-transparent" />
            <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
              <div>
                <p className="label text-red">Proyectos</p>
                <p className="font-display text-[16px] leading-tight">
                  {projects.length} proyecto{projects.length === 1 ? "" : "s"} · {docs.length} doc.
                </p>
              </div>
              <button onClick={() => setPanel(false)} className="text-muted hover:text-red" title="Ocultar panel">
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-b border-rule px-2.5 py-2">
            <button
              onClick={() => setCreatingProject((v) => !v)}
              className="flex flex-1 items-center justify-center gap-1.5 border border-ink bg-ink px-2 py-1.5 text-paper transition-colors duration-150 hover:border-red hover:bg-red"
            >
              <FilePlus2 size={13} />
              <span className="label">Proyecto</span>
            </button>
            <button
              onClick={() => void openFromFileSystem()}
              title="Abrir un archivo .tex desde el sistema de archivos"
              className="flex flex-1 items-center justify-center gap-1.5 border border-rule px-2 py-1.5 text-ink transition-colors duration-150 hover:border-red hover:text-red"
            >
              <FolderOpen size={13} />
              <span className="label">Abrir</span>
            </button>
          </div>

          <div className="border-b border-rule px-2.5 py-2"><button onClick={() => setImportDialog(true)} className="label flex w-full items-center justify-center gap-2 border border-blue px-3 py-2 text-blue hover:bg-blue hover:text-paper"><FolderOpen size={13}/>Importar ZIP / Drive</button></div>
          <div className="min-h-0 flex-1 overflow-auto">
            {creatingProject ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void createProject(newProjectName);
                }}
                className="flex items-center gap-1.5 border-b border-rule/70 bg-paper/60 px-3 py-2"
              >
                <input
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Nombre del proyecto"
                  className="min-w-0 flex-1 bg-transparent font-mono text-[12px] outline-none"
                />
                <button type="submit" title="Crear" className="p-1 text-blue hover:text-red">
                  <Check size={13} />
                </button>
                <button
                  type="button"
                  title="Cancelar"
                  onClick={() => {
                    setCreatingProject(false);
                    setNewProjectName("");
                  }}
                  className="p-1 text-muted hover:text-red"
                >
                  <X size={12} />
                </button>
              </form>
            ) : null}

            {projects.map((p) => {
              const roots = docs.filter((d) => d.projectId === p.id && !d.parentId);
              const count = docs.filter((d) => d.projectId === p.id).length;
              const isOpen = expanded.has(p.id);
              return (
                <div key={p.id} className="border-b border-rule/70">
                  <div className="group flex items-center gap-1 px-1.5 py-1.5">
                    <button
                      onClick={() =>
                        setExpanded((prev) => {
                          const n = new Set(prev);
                          if (n.has(p.id)) n.delete(p.id);
                          else n.add(p.id);
                          return n;
                        })
                      }
                      className="p-1 text-muted hover:text-red"
                    >
                      {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>
                    <input
                      key={p.id + p.name}
                      defaultValue={p.name}
                      onBlur={(e) => renameProject(p.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                      }}
                      className="min-w-0 flex-1 border-b border-transparent bg-transparent px-1 py-0.5 font-mono text-[12.5px] font-semibold text-ink outline-none focus:border-red"
                    />
                    <span className="label text-muted">{count}</span>
                    <button
                      title="Añadir documento al proyecto"
                      onClick={() => setCreatingDoc({ projectId: p.id, parentId: null })}
                      className="p-1 text-muted hover:text-blue"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      title="Eliminar proyecto (y sus documentos)"
                      onClick={() => void deleteProject(p.id)}
                      className="p-1 text-muted opacity-0 transition-opacity duration-150 hover:text-red group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {isOpen ? (
                    <div className="pb-1.5">
                      {p.mainFile ? <ProjectWorkspace projectId={p.id} activeId={activeId} revision={projectRevision} onOpen={(id) => void openDoc(id)} onChange={() => void handleProjectChange()} beforeChange={async () => { if (dirty.current) await save(true); }}/> : roots.map((r) => renderDoc(r, 0))}
                      {roots.length === 0 ? (
                        <p className="px-4 py-1 font-mono text-[11px] text-muted">Sin documentos.</p>
                      ) : null}
                      {creatingDoc?.projectId === p.id && creatingDoc.parentId === null ? renderCreateForm(0) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {projects.length === 0 ? (
              <p className="px-3 py-5 font-mono text-[11px] text-muted">Sin proyectos. Crea uno o abre un .tex local.</p>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-rule px-3 py-2.5">
            <p className="text-[10.5px] leading-relaxed text-muted">
              Plantilla base → subdocumentos con{" "}
              <span className="font-mono text-red">\input{"{slug}"}</span>. Ctrl/⌘+clic en la fuente para saltar al
              subdocumento.
            </p>
          </div>
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* cabecera */}
        <header className="no-print relative border-b border-rule bg-sheet">
          <div className="flex flex-wrap items-end gap-x-7 gap-y-3 px-6 pb-3 pt-4">
            <div className="min-w-[14rem] flex-1">
              <p className="label mb-1.5 truncate text-red">
                {activeProject ? activeProject.name : "Proyecto"} · {activeDoc ? `${activeDoc.slug}.tex` : "—"}
              </p>
              <input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="w-full border-0 bg-transparent font-display text-[25px] leading-tight tracking-[-0.015em] outline-none focus:text-red"
                aria-label="Título del documento"
              />
            </div>
            <dl className="flex items-end gap-5">
              {[
                ["Palabras", words.toLocaleString("es-ES")],
                ["Páginas", build?.pageCount ? String(build.pageCount) : "—"],
                ["Líneas", String(source.split("\n").length)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="label text-muted">{k}</dt>
                  <dd className="font-display text-[19px] leading-none">{v}</dd>
                </div>
              ))}
              <div>
                <dt className="label text-muted">Estado</dt>
                <dd className="flex items-center gap-1.5 font-mono text-[11px] leading-none">
                  {status === "saving" ? (
                    <>
                      <Loader2 size={12} className="animate-spin text-muted" /> guardando
                    </>
                  ) : status === "saved" ? (
                    <>
                      <Check size={12} className="text-blue" /> guardado
                    </>
                  ) : status === "exported" ? (
                    <>
                      <Check size={12} className="text-blue" /> exportado
                    </>
                  ) : status === "error" ? (
                    <span className="text-red">error</span>
                  ) : (
                    <span className="text-muted">en espera</span>
                  )}
                </dd>
              </div>
            </dl>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTray((v) => !v)}
                className={`relative flex items-center gap-2 border px-3 py-2 transition-colors duration-150 ${
                  tray ? "border-blue bg-blue/5 text-blue" : "border-rule text-ink hover:border-blue hover:text-blue"
                }`}
                title="Archivos exportados (descarga manual / guardar en disco)"
              >
                <FileDown size={14} />
                <span className="label">Descargas</span>
                {downloads.length ? (
                  <span className="label ml-0.5 flex h-4 min-w-4 items-center justify-center border border-blue bg-blue px-1 text-paper">
                    {downloads.length}
                  </span>
                ) : null}
              </button>

              <div className="relative">
                <button
                  onClick={() => setExportOpen((v) => !v)}
                  className="flex items-center gap-2 border border-ink bg-ink px-4 py-2 text-paper transition-colors duration-150 hover:border-red hover:bg-red"
                >
                  {busyExport ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span className="label">Exportar</span>
                </button>
                {exportOpen ? (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setExportOpen(false)} />
                    <div className="settle absolute right-0 top-full z-40 mt-2 w-[20.5rem] border border-rule bg-sheet shadow-[0_20px_50px_rgba(23,21,15,0.18)]">
                      <div className="flex items-center justify-between border-b border-rule px-4 py-2">
                        <p className="label text-muted">Compilar / exportar (pdflatex · pandoc)</p>
                        <button onClick={() => setExportOpen(false)} className="text-muted hover:text-red">
                          <X size={13} />
                        </button>
                      </div>
                      <ul>
                        {FORMATS.map((f) => (
                          <li key={f}>
                            <button
                              onClick={() => void runExport(f)}
                              disabled={batchExport || !!busyExport}
                              className="flex w-full items-center justify-between gap-3 border-b border-rule/60 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-paper hover:text-red"
                            >
                              <span className="font-mono text-[12px]">{f === "tex" && activeDoc?.filePath ? "LaTeX — proyecto completo (.zip)" : FORMAT_LABEL[f]}</span>
                              <span className="label text-muted">{busyExport === f ? "…" : f}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                      <button disabled={batchExport || !!busyExport} onClick={() => void runAllExports()} className="label w-full border-y border-blue bg-blue/5 px-4 py-3 text-blue disabled:opacity-40">Generar los ocho formatos</button>
                      <p className="px-4 py-2.5 text-[10.5px] leading-relaxed text-muted">
                        PDF con <strong>pdflatex</strong> real; ODT, EPUB, RTF, HTML, MD y TXT con{" "}
                        <strong>pandoc</strong> desde el mismo .tex.
                      </p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* barra de pantallas */}
          <div className="flex flex-wrap items-center gap-3 border-t border-rule/70 px-6 py-2">
            <div className="flex items-center border border-rule">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSplit(false);
                    setMode(m.id);
                    if (m.id === "render" && !build) void runCompile();
                  }}
                  className={`flex items-center gap-2 px-4 py-1.5 transition-colors duration-150 ${
                    !split && mode === m.id ? "bg-ink text-paper" : "text-ink hover:text-red"
                  }`}
                >
                  <span className="label">{m.label}</span>
                  <span className={`text-[10px] ${!split && mode === m.id ? "text-paper/60" : "text-muted"}`}>
                    {m.hint}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setSplit((v) => !v)}
              className={`flex items-center gap-2 border px-3 py-1.5 transition-colors duration-150 ${
                split ? "border-red text-red" : "border-rule text-muted hover:text-ink"
              }`}
              title="Vista dividida: fuente + PDF real (pdflatex)"
            >
              <Columns2 size={14} />
              <span className="label">Dividida</span>
            </button>

            <button
              onClick={() => setPanel((v) => !v)}
              className={`flex items-center gap-2 border px-3 py-1.5 transition-colors duration-150 ${
                panel ? "border-rule text-red" : "border-rule text-muted hover:text-ink"
              }`}
            >
              <PanelLeft size={14} />
              <span className="label">{panel ? "Ocultar proyectos" : "Proyectos"}</span>
            </button>

            {notice ? (
              <p className="settle label max-w-[28rem] truncate text-blue" title={notice}>
                {notice}
              </p>
            ) : null}

            <div className="ml-auto flex items-center gap-3">
              {batchExport ? <p className="label text-blue">Exportando {busyExport?.toUpperCase()} · {exportReport.length}/8</p> : null}
              {compiledAt ? (
                <p key={sweep} className="settle label text-muted">
                  pdflatex · {compiledAt}
                </p>
              ) : (
                <p className="label text-muted">Sin compilar</p>
              )}
              <button
                onClick={() => void runCompile()}
                disabled={compiling}
                className="flex items-center gap-2 border border-red bg-red px-4 py-1.5 text-paper transition-colors duration-150 hover:border-ink hover:bg-ink disabled:opacity-50"
              >
                {compiling ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                <span className="label">Compilar</span>
              </button>
            </div>
          </div>

          <div key={sweep} className="sweep pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-red" />
        </header>

        {/* espacio de trabajo */}
        <main className="min-h-0 flex-1">
          {loading ? (
            <div className="no-print flex h-full items-center justify-center">
              <p className="label animate-pulse text-muted">Abriendo la caja de tipos…</p>
            </div>
          ) : split ? (
            <div className="grid h-full grid-cols-1 grid-rows-2 lg:grid-cols-2 lg:grid-rows-1">
              <div className="no-print min-h-0 overflow-hidden border-b border-rule lg:border-b-0 lg:border-r lg:border-rule">
                {paneFor("raw")}
              </div>
              <div className="min-h-0 overflow-hidden">{paneFor("render")}</div>
            </div>
          ) : (
            <div className="h-full">{paneFor(mode)}</div>
          )}
        </main>

        {/* barra de estado */}
        <footer className="no-print flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-rule bg-sheet px-6 py-2">
          <p className="label text-muted">
            taller / {activeProject ? activeProject.name.toLowerCase().replace(/\s+/g, "-") : "—"} /{" "}
            {activeDoc ? `${activeDoc.slug}.tex` : "—"}
          </p>
          <p className="label text-muted">
            {parsed.meta.documentClass} · pdflatex + pandoc
          </p>
          {composing ? (
            <p className="label text-blue">
              {descendants.length} subdocumento{descendants.length === 1 ? "" : "s"} compuesto
              {descendants.length === 1 ? "" : "s"}
            </p>
          ) : null}
          <p className="label ml-auto text-muted">Ctrl+S guardar y compilar · F1 raw · F2 visual · F3 render</p>
        </footer>
      </div>

      {importDialog ? <ImportProjectDialog onClose={() => { setImportDialog(false); void loadAll(); }} onImported={handleImported}/> : null}
      {tray ? (
        <DownloadsTray items={downloads} onRemove={removeDownload} onClose={() => setTray(false)} />
      ) : null}
    </div>
  );
}
