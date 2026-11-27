"use client";
import { useRef, useState } from "react";
import { Archive, Check, FolderOpen, Link, Loader2, X } from "lucide-react";
import type { CompatibilityChange } from "@/db/schema";
interface ImportResult { project: { id: string; name: string }; mainFile: string; candidates: string[]; fileCount: number; warnings: string[]; compatibility: CompatibilityChange[] }
export default function ImportProjectDialog({ onClose, onImported }: { onClose: () => void; onImported: (id: string, main: string) => Promise<void> }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [main, setMain] = useState("");
  const importNow = async () => {
    setBusy(true); setError("");
    try {
      let response: Response;
      if (file) {
        const form = new FormData(); form.set("file", file); form.set("name", name || file.name.replace(/\.[^.]+$/, ""));
        response = await fetch("/api/projects/import", { method: "POST", body: form });
      } else {
        response = await fetch("/api/projects/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, url }) });
      }
      const json = await response.json(); if (!response.ok) throw new Error(json.error || "No se pudo importar el ZIP.");
      setResult(json); setMain(json.mainFile);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  const finish = async (apply: boolean) => {
    if (!result) return;
    setBusy(true); setError("");
    try {
      if (main !== result.mainFile) {
        const r = await fetch(`/api/projects/${result.project.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mainFile: main }) });
        if (!r.ok) throw new Error("No se pudo cambiar el principal.");
      }
      if (apply && result.compatibility.length) {
        const r = await fetch(`/api/projects/${result.project.id}/files`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ changeIds: result.compatibility.map((c) => c.id), apply: true }) });
        const j = await r.json(); if (!r.ok) throw new Error(j.error || "No se pudieron aplicar los ajustes.");
      }
      await onImported(result.project.id, main); onClose();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-4" onClick={() => !busy && onClose()}>
    <section className="max-h-[90vh] w-full max-w-2xl overflow-auto border border-rule bg-sheet shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <header className="flex items-center gap-3 border-b border-rule px-6 py-5"><Archive size={24} className="text-red"/><div><p className="label text-red">Importar proyecto completo</p><h2 className="font-display text-2xl">ZIP → ocho formatos</h2></div><button disabled={busy} onClick={onClose} className="ml-auto p-2" aria-label="Cerrar importación"><X size={18}/></button></header>
      <div className="space-y-5 p-6">
        {!result ? <>
          <p className="text-sm leading-relaxed text-muted">Conserva carpetas, capítulos, imágenes, bibliografía y estilos locales. Se comprueba la firma real del ZIP: también funciona si lo renombraste a .jpg.</p>
          <label className="label block text-muted">Nombre del proyecto<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mi Tesis" className="mt-2 w-full border border-rule bg-paper px-3 py-2 text-sm normal-case tracking-normal text-ink outline-none focus:border-red"/></label>
          <input ref={input} type="file" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setUrl(""); }}/>
          <button disabled={busy} onClick={() => input.current?.click()} className="flex w-full items-center justify-center gap-3 border border-dashed border-muted bg-paper/50 px-5 py-8 text-sm hover:border-red hover:text-red"><FolderOpen size={22}/>{file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB` : "Seleccionar ZIP del sistema de archivos"}</button>
          <div className="flex items-center gap-3 text-[10px] text-muted"><span className="h-px flex-1 bg-rule"/>O PEGAR UN ENLACE PÚBLICO DE GOOGLE DRIVE<span className="h-px flex-1 bg-rule"/></div>
          <label className="flex items-center gap-2 border border-rule bg-paper px-3 py-2 text-blue"><Link size={15}/><input value={url} onChange={(e) => { setUrl(e.target.value); setFile(null); }} placeholder="https://drive.google.com/uc?export=download&id=…" className="min-w-0 flex-1 bg-transparent text-xs outline-none"/></label>
          <p className="text-[11px] text-muted">Límites: 30 MB comprimidos / 80 MB extraídos / 1500 archivos. Se rechazan rutas que salgan del proyecto y enlaces simbólicos.</p>
        </> : <>
          <p className="flex items-center gap-2 text-blue"><Check size={18}/>{result.project.name} · {result.fileCount} archivos importados</p>
          <label className="label block text-muted">Archivo principal<select value={main} onChange={(e) => setMain(e.target.value)} className="mt-2 w-full border border-rule bg-paper px-3 py-2 text-xs normal-case tracking-normal text-ink">{result.candidates.map((c) => <option key={c}>{c}</option>)}</select></label>
          <h3 className="font-display text-xl">{result.compatibility.length} ajustes de compatibilidad propuestos</h3>
          {result.compatibility.map((c) => <div key={c.id} className="border border-rule bg-paper/50 p-3"><p className="label text-blue">{c.path}</p><p className="mt-1 text-xs leading-relaxed">{c.description}</p>{c.after && <pre className="mt-2 overflow-auto text-[10px] text-muted">{c.after}</pre>}</div>)}
          {result.warnings.map((w) => <p key={w} className="text-xs text-red">{w}</p>)}
          <p className="text-xs leading-relaxed text-muted">El ZIP original permanece intacto y descargable. Si eliges aplicar los ajustes, quedarán registrados y podrás revertirlos desde Configurar. Todos los formatos usarán la misma copia editable.</p>
        </>}
        {error && <p role="alert" className="border border-red bg-red/5 p-3 text-xs leading-relaxed text-red">{error}</p>}
        <footer className="flex flex-wrap justify-end gap-2 border-t border-rule pt-4">
          {busy ? <p className="label mr-auto flex items-center gap-2 text-blue"><Loader2 className="animate-spin" size={14}/>Procesando proyecto…</p> : null}
          {!result ? <button disabled={busy || (!file && !url)} onClick={() => void importNow()} className="label border border-red bg-red px-5 py-2.5 text-paper disabled:opacity-40">Importar sin modificar originales</button> : <><button disabled={busy} onClick={() => void finish(false)} className="label border border-rule px-4 py-2 text-ink disabled:opacity-40">Abrir sin ajustes</button>{result.compatibility.length > 0 && <button disabled={busy} onClick={() => void finish(true)} className="label border border-red bg-red px-4 py-2 text-paper disabled:opacity-40">Aplicar ajustes y abrir</button>}</>}
        </footer>
      </div>
    </section>
  </div>;
}
