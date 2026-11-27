import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, projectFiles, projects } from "@/db/schema";
import { parse, wordCount } from "./latex";
import { proposeCompatibility, readProjectZip, zipProject, type ArchiveEntry, type ProjectBundle } from "./archive";

export async function importArchive(data: Buffer, name: string) {
  const archive = await readProjectZip(data);
  const compatibility = proposeCompatibility(archive.files);
  const mainText = archive.files.find((f) => f.path === archive.mainFile)?.text ?? "";
  const engine = /!\s*TeX\s+program\s*=\s*(xelatex|lualatex)/i.exec(mainText)?.[1]?.toLowerCase() ?? (/\\usepackage(?:\[[^\]]*\])?\{fontspec\}/.test(mainText) ? "xelatex" : "pdflatex");
  const project = await db.transaction(async (tx) => {
    const [p] = await tx.insert(projects).values({ name: name.trim() || "Proyecto importado", mainFile: archive.mainFile, engine, compatibility }).returning();
    for (const f of archive.files) {
      await tx.insert(projectFiles).values({ projectId: p.id, path: f.path, original: f.data.toString("base64"), isText: f.text !== undefined, size: f.data.length });
      if (f.text !== undefined) {
        const isTex = /\.tex$/i.test(f.path);
        const parsed = isTex ? parse(f.text) : null;
        await tx.insert(documents).values({ projectId: p.id, parentId: null, filePath: f.path, slug: f.path.replace(/\.tex$/i, ""), title: f.path, kind: f.path === archive.mainFile ? "base" : isTex ? "texto" : "archivo", source: f.text, words: parsed ? wordCount(parsed.blocks) : 0, blocks: parsed?.blocks.length ?? 0 });
      }
    }
    return p;
  });
  return { project, mainFile: archive.mainFile, candidates: archive.candidates, compatibility, warnings: archive.warnings, fileCount: archive.files.length };
}

export async function getProjectBundle(id: string, override?: { path: string; source: string }): Promise<ProjectBundle> {
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project?.mainFile) throw new Error("El proyecto no tiene un archivo principal ZIP.");
  const [entries, edits] = await Promise.all([
    db.select().from(projectFiles).where(eq(projectFiles.projectId, id)),
    db.select().from(documents).where(eq(documents.projectId, id)),
  ]);
  const sources = new Map(edits.filter((d) => d.filePath).map((d) => [d.filePath!, d.source]));
  if (override?.path && typeof override.source === "string") sources.set(override.path, override.source);
  const files: ArchiveEntry[] = entries.filter((f) => !f.excluded).map((f) => {
    const source = sources.get(f.path);
    const data = source === undefined ? Buffer.from(f.original, "base64") : Buffer.from(source, "utf8");
    return { path: f.path, data, ...(source !== undefined ? { text: source } : {}) };
  });
  // New editable files added since import must also be materialized.
  for (const d of edits) if (d.filePath && !entries.some((f) => f.path === d.filePath)) {
    const content = sources.get(d.filePath) ?? d.source;
    files.push({ path: d.filePath, data: Buffer.from(content), text: content });
  }
  return { mainFile: project.mainFile, engine: project.engine as ProjectBundle["engine"], files, compatibility: project.compatibility };
}

export async function projectArchive(id: string, original: boolean): Promise<Buffer> {
  if (original) {
    const files = await db.select().from(projectFiles).where(eq(projectFiles.projectId, id));
    return zipProject(files.map((f) => ({ path: f.path, data: Buffer.from(f.original, "base64") })));
  }
  const bundle = await getProjectBundle(id);
  const [p] = await db.select().from(projects).where(eq(projects.id, id));
  return zipProject([...bundle.files, { path: "taller-build.json", data: Buffer.from(JSON.stringify({ mainFile: bundle.mainFile, engine: bundle.engine, compatibility: p.compatibility }, null, 2)) }]);
}

export async function setCompatibility(projectId: string, ids: string[], apply: boolean) {
  return db.transaction(async (tx) => {
    const [p] = await tx.select().from(projects).where(eq(projects.id, projectId)).for("update");
    if (!p) throw new Error("Proyecto no encontrado.");
    const changes = p.compatibility.map((c) => ({ ...c }));
    for (const c of changes) {
      if (!ids.includes(c.id) || c.applied === apply) continue;
      if (c.action === "exclude") {
        await tx.update(projectFiles).set({ excluded: apply }).where(and(eq(projectFiles.projectId, projectId), eq(projectFiles.path, c.path)));
      } else {
        const [d] = await tx.select().from(documents).where(and(eq(documents.projectId, projectId), eq(documents.filePath, c.path)));
        if (!d) throw new Error(`No existe ${c.path}`);
        const before = apply ? c.before! : c.after!;
        const after = apply ? c.after! : c.before!;
        if (!d.source.includes(before)) throw new Error(`${c.path} ha cambiado: revisa el ajuste antes de aplicarlo.`);
        await tx.update(documents).set({ source: d.source.replace(before, () => after), updatedAt: new Date() }).where(eq(documents.id, d.id));
      }
      c.applied = apply;
    }
    const [updated] = await tx.update(projects).set({ compatibility: changes, updatedAt: new Date() }).where(eq(projects.id, projectId)).returning();
    return updated;
  });
}
