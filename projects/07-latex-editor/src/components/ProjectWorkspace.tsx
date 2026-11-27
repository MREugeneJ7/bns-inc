"use client";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, FileText, Folder, Package, ShieldCheck, X, Loader2 } from "lucide-react";
import type { CompatibilityChange } from "@/db/schema";
interface Entry { id: string; path: string; isText: boolean; excluded: boolean; size: number; documentId: string | null }
interface Manifest { project: { id: string; name: string; mainFile: string; engine: string; compatibility: CompatibilityChange[] }; files: Entry[] }
interface Props { projectId: string; activeId: string | null; revision: number; onOpen: (id: string) => void; onChange: () => void; beforeChange?: () => Promise<void> }

export default function ProjectWorkspace({ projectId, activeId, revision, onOpen, onChange, beforeChange }: Props) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [settings, setSettings] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const reload = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/files`);
    if (!res.ok) throw new Error("No se pudo cargar el árbol de archivos.");
    setManifest(await res.json());
  }, [projectId]);
  useEffect(() => { void reload().catch((e) => setError(String(e))); }, [reload, revision]);
  const update = async (url: string, body: object) => {
    setBusy(true); setError("");
    try {
      await beforeChange?.();
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json(); if (!res.ok) throw new Error(json.error || "No se pudo actualizar.");
      await reload(); onChange();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  if (!manifest) return <p className="px-4 py-3 text-[11px] text-muted">Cargando archivos…</p>;
  const p = manifest.project;
  const pending = p.compatibility.filter((c) => !c.applied);
  const renderDirectory = (prefix: string, depth: number): React.ReactNode => {
    const children = manifest.files.filter((f) => f.path.startsWith(prefix));
    const folders = [...new Set(children.map((f) => f.path.slice(prefix.length)).filter((s) => s.includes("/")).map((s) => s.split("/")[0]))].sort();
    const files = children.filter((f) => !f.path.slice(prefix.length).includes("/")).sort((a, b) => a.path.localeCompare(b.path));
    return <>
      {folders.map((folder) => {
        const key = `${prefix}${folder}/`; const collapsed = closed.has(key);
        return <div key={key}>
          <button onClick={() => setClosed((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; })} className="flex w-full items-center gap-1.5 py-1 pr-2 text-left text-[11.5px] text-muted hover:bg-paper" style={{ paddingLeft: 12 + depth * 12 }}>
            {collapsed ? <ChevronRight size={11}/> : <ChevronDown size={11}/>}<Folder size={12}/>{folder}
          </button>
          {!collapsed && renderDirectory(key, depth + 1)}
        </div>;
      })}
      {files.map((f) => <div key={f.id} className={`flex min-w-0 items-center gap-1.5 py-1 pr-2 text-[11px] ${f.documentId === activeId ? "bg-paper text-red" : "text-ink"} ${f.excluded ? "opacity-45" : ""}`} style={{ paddingLeft: 16 + depth * 12 }} title={`${f.path} · ${(f.size / 1024).toFixed(1)} kB${f.excluded ? " · excluido de compilación" : ""}`}>
        {f.isText ? <FileText size={12} className="shrink-0"/> : <Package size={12} className="shrink-0 text-muted"/>}
        {f.documentId ? <button onClick={() => onOpen(f.documentId!)} className={`min-w-0 flex-1 truncate text-left hover:text-red ${f.excluded ? "line-through" : ""}`}>{f.path.slice(prefix.length)}</button> : <a href={`/api/projects/${projectId}/assets?path=${encodeURIComponent(f.path)}`} download className="min-w-0 flex-1 truncate hover:text-blue">{f.path.slice(prefix.length)}</a>}
        {f.path === p.mainFile && <span className="text-[8px] tracking-widest text-blue">MAIN</span>}
      </div>)}
    </>;
  };
  return <>
    <div className="mx-2 mb-1 flex items-center justify-between gap-2 border-y border-rule py-2">
      <span className="text-[10px] text-muted">{manifest.files.length} archivos · {p.engine}</span>
      <button onClick={() => setSettings(true)} className={`label flex items-center gap-1 ${pending.length ? "text-red" : "text-blue"}`}><ShieldCheck size={12}/>Configurar{pending.length ? ` (${pending.length})` : ""}</button>
    </div>
    {renderDirectory("", 0)}
    {settings && <div className="fixed inset-0 z-[65] flex items-center justify-center bg-ink/45 p-5" onClick={() => setSettings(false)}>
      <section className="max-h-[88vh] w-full max-w-3xl overflow-auto border border-rule bg-sheet shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="sticky top-0 flex items-center gap-3 border-b border-rule bg-sheet px-6 py-4"><div><p className="label text-red">Proyecto LaTeX nativo</p><h2 className="font-display text-2xl">{p.name}</h2></div><button onClick={() => setSettings(false)} className="ml-auto p-2" aria-label="Cerrar configuración"><X size={18}/></button></header>
        <div className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="label text-muted">Documento principal<select value={p.mainFile} disabled={busy} onChange={(e) => void update(`/api/projects/${projectId}`, { mainFile: e.target.value })} className="mt-2 w-full border border-rule bg-paper p-2 text-xs normal-case tracking-normal text-ink">{manifest.files.filter((f) => /\.tex$/i.test(f.path)).map((f) => <option key={f.id}>{f.path}</option>)}</select></label>
            <label className="label text-muted">Motor<select value={p.engine} disabled={busy} onChange={(e) => void update(`/api/projects/${projectId}`, { engine: e.target.value })} className="mt-2 w-full border border-rule bg-paper p-2 text-xs normal-case tracking-normal text-ink"><option>pdflatex</option><option>xelatex</option><option>lualatex</option></select></label>
          </div>
          <div className="flex flex-wrap gap-2"><a href={`/api/projects/${projectId}/archive?original=1`} download className="label border border-rule px-3 py-2 text-blue">ZIP original intacto</a><a href={`/api/projects/${projectId}/archive`} download className="label border border-rule px-3 py-2 text-ink">ZIP con ediciones y ajustes</a></div>
          <div><h3 className="font-display text-xl">Compatibilidad · cambios explícitos</h3><p className="mt-2 text-xs leading-relaxed text-muted">El ZIP original nunca se modifica. Estos cambios solo se aplican a la copia editable, se registran y se pueden revertir. El mismo estado se usa en los ocho formatos.</p></div>
          {pending.length > 0 && <button disabled={busy} onClick={() => void update(`/api/projects/${projectId}/files`, { changeIds: pending.map((c) => c.id), apply: true })} className="label flex items-center gap-2 border border-red bg-red px-4 py-2 text-paper disabled:opacity-50">{busy && <Loader2 size={12} className="animate-spin"/>}Aplicar {pending.length} ajustes propuestos</button>}
          {error && <p role="alert" className="border border-red p-3 text-xs text-red">{error}</p>}
          {p.compatibility.length === 0 && <p className="text-xs text-blue">No se han detectado incompatibilidades conocidas.</p>}
          {p.compatibility.map((c) => <article key={c.id} className="border border-rule bg-paper/40 p-4"><div className="flex items-start gap-4"><div className="min-w-0 flex-1"><p className="label text-blue">{c.path} · {c.applied ? "aplicado" : "pendiente"}</p><p className="mt-2 text-xs leading-relaxed">{c.description}</p></div><button disabled={busy} onClick={() => void update(`/api/projects/${projectId}/files`, { changeIds: [c.id], apply: !c.applied })} className="label border border-rule px-3 py-1.5 text-red disabled:opacity-40">{c.applied ? "Revertir" : "Aplicar"}</button></div>{c.before && <div className="mt-3 grid gap-2 text-[10px] sm:grid-cols-2"><pre className="overflow-auto border border-rule bg-sheet p-2 text-muted">{c.before}</pre><pre className="overflow-auto border border-rule bg-sheet p-2 text-blue">{c.after}</pre></div>}</article>)}
        </div>
      </section>
    </div>}
  </>;
}
