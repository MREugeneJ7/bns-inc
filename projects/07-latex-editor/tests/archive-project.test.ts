import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import { readFile } from "node:fs/promises";
import { readProjectZip, expandProjectSource, proposeCompatibility, safeProjectPath, type ProjectBundle } from "../src/lib/archive";
import { exportDocument } from "../src/lib/exporters";
import { SAMPLES } from "../src/lib/samples";

const root = String.raw`\documentclass[11pt,a4paper]{report}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[spanish]{babel}
\usepackage{graphicx}
\usepackage{amsmath}
\usepackage{hyperref}
\begin{document}
\tableofcontents
\chapter{Introducción}
\input{chapters/intro}
\bibliographystyle{plain}
\bibliography{refs}
\end{document}`;

async function fixture() {
  const z = new JSZip();
  z.file("thesis/main.tex", root);
  z.file("thesis/chapters/intro.tex", String.raw`Texto verificable sobre computación.\cite{source2026}
\begin{equation}E = mc^2\end{equation}
\begin{figure}\centering\includegraphics[width=.2\textwidth]{images/plate.jpg}\caption{Figura comprobable.}\end{figure}
\begin{tabular}{ll}Nombre & Valor \\ Dato & 42\end{tabular}`);
  z.file("thesis/refs.bib", "@book{source2026,author={Autora, Ana},title={Referencia verificable},publisher={Editorial},year={2026}}");
  z.file("thesis/images/plate.jpg", await readFile("public/images/plate.jpg"));
  return z.generateAsync({ type: "nodebuffer" });
}

test("ZIP signature is used, not the original filename; nested paths and binary bytes survive", async () => {
  const a = await readProjectZip(await fixture());
  assert.equal(a.mainFile, "thesis/main.tex");
  assert.equal(a.files.length, 4);
  assert.ok(a.files.find((f) => f.path.endsWith("plate.jpg"))!.data.equals(await readFile("public/images/plate.jpg")));
  const b: ProjectBundle = { mainFile: a.mainFile, engine: "pdflatex", files: a.files };
  const expanded = expandProjectSource(b);
  assert.match(expanded, /Texto verificable/);
  assert.doesNotMatch(expanded, /\\input\{chapters\/intro\}/);
});

test("path traversal, absolute paths and symlinks are rejected", async () => {
  for (const p of ["../file.tex", "/tmp/file", "safe/../../secret", "C:\\secret.tex", "a\u0000b"]) assert.throws(() => safeProjectPath(p));
  const z = new JSZip(); z.file("../escape.tex", root);
  const unsafeArchive = await z.generateAsync({ type: "nodebuffer" });
  await assert.rejects(() => readProjectZip(unsafeArchive), /Ruta/);
  const symlink = new JSZip(); symlink.file("main.tex", root); symlink.file("link", "/etc/passwd", { unixPermissions: 0o120777 });
  await assert.rejects(() => symlink.generateAsync({ type: "nodebuffer", platform: "UNIX" }).then(readProjectZip), /simbólico/);
});

test("compatibility proposals do not mutate originals and produce balanced hyperref syntax", () => {
  const source = String.raw`\subsubsection{\hypertarget{target}{MyFitnessPal}}`;
  const files = [{ path: "cap.tex", data: Buffer.from(source), text: source }, { path: "refs.bib", data: Buffer.from(""), text: "publisher={Scrum & Co.}," }];
  const changes = proposeCompatibility(files);
  assert.equal(files[0].text, source);
  assert.equal(changes[0].applied, false);
  assert.equal(changes[0].after, String.raw`\subsubsection{\texorpdfstring{\protect\hypertarget{target}{MyFitnessPal}}{MyFitnessPal}}`);
  assert.equal(changes[1].after, String.raw`publisher={Scrum \& Co.},`);
});

test("a complete nested project compiles bibliography and exports to all 8 formats", { timeout: 180000 }, async () => {
  const a = await readProjectZip(await fixture());
  const bundle: ProjectBundle = { mainFile: a.mainFile, engine: "pdflatex", files: a.files };
  for (const format of ["pdf", "tex", "odt", "html", "rtf", "epub", "md", "txt"] as const) {
    const r = await exportDocument(format, "Proyecto de prueba", root, [], bundle);
    assert.ok(r.data.length > 100, `${format}: empty export`);
    if (format === "pdf") assert.ok(r.data.subarray(0, 5).equals(Buffer.from("%PDF-")));
    if (format === "tex") {
      assert.match(r.filename, /-latex\.zip$/);
      const zip = await JSZip.loadAsync(r.data);
      assert.equal(await zip.file("thesis/main.tex")!.async("string"), root);
      assert.ok(zip.file("thesis/refs.bib")); assert.ok(zip.file("thesis/images/plate.jpg"));
    }
    if (format === "html") {
      const html = r.data.toString();
      assert.ok(html.includes("Texto verificable")); assert.ok(html.includes("Referencia verificable"));
      assert.ok(html.includes("data:image/")); assert.ok(html.includes("<table>")); assert.ok(html.includes('class="latex-display-math"'));
    }
    if (format === "odt" || format === "epub") {
      const z = await JSZip.loadAsync(r.data);
      const xmls = await Promise.all(Object.values(z.files).filter((f) => /\.(xml|xhtml)$/.test(f.name)).map((f) => f.async("string")));
      assert.ok(xmls.join("").includes("Referencia verificable"), `${format}: missing bibliography`);
    }
    if (format === "txt" || format === "md") assert.ok(r.data.toString().includes("Referencia verificable"));
    if (format === "rtf") { assert.ok(r.data.includes(Buffer.from("\\pngblip"))); assert.ok(r.data.includes(Buffer.from("\\jpegblip"))); }
  }
});

test("existing single-document export remains exact", async () => {
  const r = await exportDocument("tex", SAMPLES[0].title, SAMPLES[0].source);
  assert.equal(r.data.toString(), SAMPLES[0].source);
});

const tfmPath = process.env.TEST_TFM_ZIP;
test("real TFM: all 8 exports, references, figures, tables and source integrity", { skip: !tfmPath, timeout: 300000 }, async () => {
  const archive = await readProjectZip(await readFile(tfmPath!));
  const changes = proposeCompatibility(archive.files);
  assert.equal(changes.length, 3);
  const originalCap = archive.files.find((f) => f.path === "cap1.tex")!.text!;
  const bundle: ProjectBundle = { mainFile: archive.mainFile, engine: "pdflatex", files: archive.files.map((f) => ({ ...f })), compatibility: changes };
  for (const c of changes) {
    if (c.action === "exclude") bundle.files = bundle.files.filter((f) => f.path !== c.path);
    else { const f = bundle.files.find((f) => f.path === c.path)!; f.text = f.text!.replace(c.before!, () => c.after!); f.data = Buffer.from(f.text); }
    c.applied = true;
  }
  assert.equal(archive.files.find((f) => f.path === "cap1.tex")!.text, originalCap);
  for (const format of ["pdf", "tex", "html", "odt", "rtf", "epub", "md", "txt"] as const) {
    const r = await exportDocument(format, "TFM", bundle.files.find((f) => f.path === bundle.mainFile)!.text!, [], bundle);
    assert.ok(r.data.length > 10000, `${format} is suspiciously small`);
    let content = "";
    if (format === "tex") {
      const z = await JSZip.loadAsync(r.data);
      assert.ok(z.file("main.bib")); assert.ok(z.file("images/login screen.png")); assert.ok(z.file("algorithm2e.sty")); assert.ok(z.file("taller-build.json"));
    } else if (format === "odt" || format === "epub") {
      const z = await JSZip.loadAsync(r.data);
      const texts = await Promise.all(Object.values(z.files).filter((e) => /\.(xml|xhtml)$/.test(e.name)).map((e) => e.async("string")));
      content = texts.join(" ");
      assert.ok(Object.keys(z.files).filter((n) => /\.(png|jpe?g)$/i.test(n)).length >= 10, `${format}: missing images`);
      if (format === "odt") {
        // graphicx lengths must survive: gantt \textwidth = 17 cm, postgres 0.5\textwidth = 8.5 cm,
        // and no image frame may exceed the text column.
        const widths = [...(await z.file("content.xml")!.async("string")).matchAll(/<draw:frame[^>]*style:width="([\d.]+)cm"/g)].map((m) => Number(m[1]));
        assert.ok(widths.length >= 10, "ODT: missing image frames");
        assert.ok(widths.some((w) => Math.abs(w - 17) < 0.05), "ODT: gantt lost its \\textwidth (17 cm) size");
        assert.ok(widths.some((w) => Math.abs(w - 8.5) < 0.05), "ODT: 0.5\\textwidth image lost its 8.5 cm size");
        assert.ok(Math.max(...widths) <= 17.5, `ODT: an image frame exceeds the text column (max ${Math.max(...widths)} cm)`);
      }
    } else if (format !== "pdf") content = r.data.toString();
    if (["html", "odt", "epub", "md", "txt"].includes(format)) {
      assert.ok(content.includes("Keycloak"), `${format}: body lost`);
      assert.ok(content.includes("Scrum"), `${format}: bibliography lost`);
      assert.ok(content.includes("Mifflin"), `${format}: cited reference lost`);
    }
    if (format === "html") { assert.ok((content.match(/<img\b/g) ?? []).length >= 10); assert.ok((content.match(/<table\b/g) ?? []).length >= 10); assert.ok(!content.includes("\ufffd")); }
    if (["html", "rtf", "md", "txt"].includes(format)) assert.ok(!r.data.toString("latin1").includes("TALLERPB"), `${format}: page-break marker leaked`);
    if (format === "html") assert.ok(content.includes("page-break-before:always"), "html: \\newpage breaks not restored");
    if (format === "rtf") assert.ok(r.data.toString("latin1").includes("\\page "), "rtf: \\newpage breaks not restored");
  }
});

test("real TFM ODT: portada first, page breaks restored, Resumen heading, fecha, no markers", { skip: !tfmPath, timeout: 300000 }, async () => {
  const archive = await readProjectZip(await readFile(tfmPath!));
  const changes = proposeCompatibility(archive.files);
  const bundle: ProjectBundle = { mainFile: archive.mainFile, engine: "pdflatex", files: archive.files.map((f) => ({ ...f })), compatibility: changes };
  for (const c of changes) {
    if (c.action === "exclude") bundle.files = bundle.files.filter((f) => f.path !== c.path);
    else { const f = bundle.files.find((f) => f.path === c.path)!; f.text = f.text!.replace(c.before!, () => c.after!); f.data = Buffer.from(f.text); }
    c.applied = true;
  }
  const r = await exportDocument("odt", "TFM", bundle.files.find((f) => f.path === bundle.mainFile)!.text!, [], bundle);
  const z = await JSZip.loadAsync(r.data);
  const content = await z.file("content.xml")!.async("string");
  assert.ok(!content.includes("TALLERPB"), "ODT: conversion marker leaked");

  const body = content.slice(content.indexOf("<office:text"));
  const firstParas = [...body.matchAll(/<text:p [^>]*>([\s\S]*?)<\/text:p>/g)].map((m) => m[1].replace(/<[^>]+>/g, "")).filter((t) => t.trim());
  assert.ok(firstParas[0].includes("Máster Universitario en Ingeniería Informática"), `ODT: first content is not the cover: ${firstParas[0].slice(0, 90)}`);

  const breaks = (content.match(/fo:break-before="page"/g) ?? []).length;
  assert.ok(breaks >= 5, `ODT: expected >= 5 page breaks, got ${breaks}`);

  assert.ok(content.includes("Resumen"), "ODT: Resumen heading missing");
  assert.ok(content.includes("Palabras clave"), "ODT: 'Palabras clave:' label missing");
  const date = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  assert.ok(content.includes(date), `ODT: \\today not resolved to ${date}`);

  const portadaIdx = content.indexOf("Máster Universitario en Ingeniería Informática");
  const resumenIdx = content.indexOf("Resumen");
  const capituloIdx = [...content.matchAll(/<text:h [^>]*>/g)].map((m) => m.index).find((idx) => content.slice(idx, idx + 200).includes("Introducción"));
  assert.ok(capituloIdx !== undefined, "ODT: chapter heading 'Introducción' missing");
  assert.ok(portadaIdx < resumenIdx && resumenIdx < capituloIdx, "ODT: front-matter order is wrong (cover → Resumen → chapters)");
});
