import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import JSZip from "jszip";

async function main() {
const origin = process.env.TEST_ORIGIN || "http://localhost:3000";
const archivePath = process.env.TEST_TFM_ZIP;
if (!archivePath) throw new Error("Define TEST_TFM_ZIP con la ruta de tu ZIP local.");
const original = await readFile(archivePath);
const form = new FormData();
// Deliberately disguised as JPEG: validate server-side magic detection.
form.set("file", new File([new Uint8Array(original)], "tfm.jpg", { type: "image/jpeg" }));
form.set("name", "TFM — Dieta y rutina deportiva");
const importedResponse = await fetch(`${origin}/api/projects/import`, { method: "POST", body: form });
const imported = await importedResponse.json();
assert.equal(importedResponse.status, 201, JSON.stringify(imported));
assert.equal(imported.fileCount, 39);
assert.equal(imported.compatibility.length, 3);
const id = imported.project.id;
console.log("IMPORTED", id, imported.fileCount, "files; 3 unapplied proposals");

async function manifest() { return (await fetch(`${origin}/api/projects/${id}/files`)).json(); }
assert.ok((await manifest()).project.compatibility.every((c: { applied: boolean }) => !c.applied));
const ids = imported.compatibility.map((c: { id: string }) => c.id);
for (const apply of [true, false, true]) {
  const r = await fetch(`${origin}/api/projects/${id}/files`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ changeIds: ids, apply }) });
  assert.equal(r.status, 200, await r.text());
  assert.ok((await manifest()).project.compatibility.every((c: { applied: boolean }) => c.applied === apply));
}
console.log("COMPATIBILITY: apply / revert / reapply verified");
const sourceZip = await JSZip.loadAsync(original);
const originalResponse = await fetch(`${origin}/api/projects/${id}/archive?original=1`);
const returnedZip = await JSZip.loadAsync(await originalResponse.arrayBuffer());
for (const file of Object.values(sourceZip.files)) {
  if (file.dir) continue;
  assert.ok((await file.async("nodebuffer")).equals(await returnedZip.file(file.name)!.async("nodebuffer")), file.name + " original changed");
}
console.log("ORIGINALS: all 39 archive entries byte-for-byte intact");

const results: { format: string; url: string; size: number; warnings: string[] }[] = [];
for (const format of ["pdf", "tex", "odt", "rtf", "html", "epub", "md", "txt"]) {
  const r = await fetch(`${origin}/api/export`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: id, format, title: imported.project.name }) });
  const result = await r.json();
  assert.equal(r.status, 201, `${format}: ${JSON.stringify(result)}`);
  const dl = await fetch(origin + result.file.downloadUrl);
  assert.equal(dl.status, 200);
  const data = Buffer.from(await dl.arrayBuffer());
  assert.ok(data.length > 10000);
  if (format === "tex") {
    const z = await JSZip.loadAsync(data);
    assert.ok(z.file("main.tex")); assert.ok(z.file("main.bib")); assert.ok(z.file("images/login screen.png"));
    assert.match(await z.file("cap1.tex")!.async("string"), /\\protect\\hypertarget/);
    assert.equal(z.file("spanish.ldf"), null);
  }
  if (format === "html") {
    const html = data.toString();
    assert.ok(html.includes("Keycloak")); assert.ok(html.includes("Scrum")); assert.ok(!html.includes("\ufffd"));
    assert.ok((html.match(/<img\b/g) ?? []).length >= 10);
    assert.ok((html.match(/<table\b/g) ?? []).length >= 10);
  }
  if (format === "md" || format === "txt") assert.ok(data.toString().includes("Mifflin"));
  if (format === "pdf") { assert.ok(data.subarray(0, 5).equals(Buffer.from("%PDF-"))); await writeFile("/tmp/tfm-project-api.pdf", data); }
  if (format === "rtf") assert.ok(data.includes(Buffer.from("\\pict")));
  results.push({ format, url: result.file.downloadUrl, size: data.length, warnings: result.warnings });
  console.log(format.toUpperCase(), dl.status, data.length, "bytes", result.engine, result.warnings.length, "warnings");
}

const m = await manifest();
const chapter = m.files.find((f: { path: string }) => f.path === "cap1.tex");
const doc = await (await fetch(`${origin}/api/documents/${chapter.documentId}`)).json();
const marker = "OVERLAY-UNSAVED-VERIFY";
const overlay = await fetch(`${origin}/api/export`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: id, format: "html", editingFile: "cap1.tex", source: doc.source + "\n" + marker }) });
const overlayResult = await overlay.json();
assert.equal(overlay.status, 201, JSON.stringify(overlayResult));
assert.ok((await (await fetch(origin + overlayResult.file.downloadUrl)).text()).includes(marker));
assert.ok(!(await (await fetch(`${origin}/api/documents/${chapter.documentId}`)).json()).source.includes(marker));
console.log("UNSAVED OVERLAY: used in export, not silently persisted");

const compile = await fetch(`${origin}/api/compile`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: id, title: imported.project.name }) });
const compiled = await compile.json();
assert.equal(compiled.ok, true, JSON.stringify(compiled.errors));
assert.equal(compiled.pageCount, 55);
assert.equal(compiled.errors.length, 0);
assert.equal(compiled.pageUrls.length, 55);
console.log("COMPILE: 55 PDF pages, 0 errors; 55 preview pages");
await writeFile("/tmp/tfm-native-verification.json", JSON.stringify({ projectId: id, mainFile: imported.mainFile, mainDocumentId: m.files.find((f: { path: string }) => f.path === imported.mainFile).documentId, results, compiled }, null, 2));
console.log("ALL 8 FORMATS VERIFIED THROUGH LIVE API");

}
main().catch((error) => { console.error(error); process.exit(1); });
