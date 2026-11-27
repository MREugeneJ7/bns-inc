import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import { DOMParser, type Document, type Element } from "@xmldom/xmldom";
import { detectLatexLanguage, expandLatexInputs, inspectLatexImages } from "../src/lib/latex-semantics";
import { parse, serialize, serializeBlock } from "../src/lib/latex";
import { compileLatexToPdf, convertLatexWithPandoc } from "../src/lib/compiler";
import { SAMPLES } from "../src/lib/samples";

const NS = {
  office: "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
  style: "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
  text: "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
  draw: "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
  fo: "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
  dc: "http://purl.org/dc/elements/1.1/",
};

function xml(text: string): Document {
  return new DOMParser().parseFromString(text, "application/xml");
}
function all(root: Document | Element, ns: string, name: string): Element[] {
  return Array.from(root.getElementsByTagNameNS(ns, name));
}
function ancestorParagraph(element: Element): Element {
  let p = element.parentNode;
  while (p) {
    if (p.nodeType === 1 && (p as Element).namespaceURI === NS.text && (p as Element).localName === "p") return p as Element;
    p = p.parentNode;
  }
  throw new Error("Missing image paragraph");
}
function alignmentOf(frame: Element, content: Document): string | null {
  const paragraph = ancestorParagraph(frame);
  const style = all(content, NS.style, "style").find(
    (s) => s.getAttributeNS(NS.style, "name") === paragraph.getAttributeNS(NS.text, "style-name")
  );
  return style ? all(style, NS.style, "paragraph-properties")[0]?.getAttributeNS(NS.fo, "text-align") ?? null : null;
}
function imageFrames(content: Document): Element[] {
  return all(content, NS.draw, "image").map((image) => image.parentNode as Element);
}
function checkDefaultLanguage(styles: Document, lang: string, country: string) {
  for (const family of ["paragraph", "text"]) {
    const defaults = all(styles, NS.style, "default-style").find((s) => s.getAttributeNS(NS.style, "family") === family);
    assert.ok(defaults, `default ${family} style`);
    const props = all(defaults, NS.style, "text-properties")[0];
    assert.equal(props.getAttributeNS(NS.fo, "language"), lang);
    assert.equal(props.getAttributeNS(NS.fo, "country"), country);
  }
}

const fixture = String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[english,main=spanish]{babel}
\usepackage{graphicx}
\usepackage{amsmath}
\begin{document}
Texto español con ortografía, composición y ecuación.
\foreignlanguage{english}{This passage is deliberately in English.}
\begin{figure}[htbp]
  \centering
  \includegraphics[width=0.2\textwidth]{images/plate.jpg}
  \caption{Centrada expresamente.}
\end{figure}
\begin{figure}[htbp]
  \includegraphics[width=0.2\textwidth]{images/plate.jpg}
  \caption{Sin orden de centrado.}
\end{figure}
\begin{figure}[htbp]
  \raggedleft
  \includegraphics[width=0.2\textwidth]{images/plate.jpg}
  \caption{Alineación a la derecha.}
\end{figure}
\begin{equation}E = mc^{2}\end{equation}
\end{document}`;

const languageCases: [string, string | undefined][] = [
  [String.raw`\usepackage[spanish]{babel}`, "es-ES"],
  [String.raw`\usepackage[english,spanish]{babel}`, "es-ES"],
  [String.raw`\usepackage[spanish,english]{babel}`, "en-US"],
  [String.raw`\usepackage[main=spanish,english]{babel}`, "es-ES"],
  [String.raw`\documentclass[spanish]{article}\usepackage{babel}`, "es-ES"],
  [String.raw`\PassOptionsToPackage{main=spanish,english}{babel}\usepackage{babel}`, "es-ES"],
  [String.raw`\setdefaultlanguage[variant=mexican]{spanish}`, "es-MX"],
  [String.raw`\setmainlanguage{german}`, "de-DE"],
  [String.raw`\usepackage{babel}\babelprovide[import,main]{spanish}`, "es-ES"],
  ["% \\usepackage[spanish]{babel}\n\\usepackage[british]{babel}", "en-GB"],
  [String.raw`\documentclass{article}\begin{document}spanish español`, undefined],
];
for (const [source, expected] of languageCases) {
  test(`language: ${source} -> ${expected}`, () => assert.equal(detectLatexLanguage(source), expected));
}

test("image alignment is scoped per figure, not a global center-all rule", () => {
  const images = inspectLatexImages(fixture);
  assert.deepEqual(images.map((i) => i.alignment), ["center", undefined, "right"]);
  assert.deepEqual(images.map((i) => i.block), [true, true, true]);
});

test("groups, alignment environments, comments and verbatim do not leak alignment", () => {
  const images = inspectLatexImages(String.raw`
% \centering\includegraphics{comment.jpg}
\begin{verbatim}\includegraphics{verbatim.jpg}\end{verbatim}
{\centering\includegraphics{center.jpg}}
\includegraphics{normal.jpg}
\begin{flushright}\includegraphics{right.jpg}\end{flushright}
\begin{flushleft}\includegraphics{left.jpg}\end{flushleft}`);
  assert.deepEqual(images.map((i) => i.src), ["center.jpg", "normal.jpg", "right.jpg", "left.jpg"]);
  assert.deepEqual(images.map((i) => i.alignment), ["center", undefined, "right", "left"]);
});

test("visual round-trip preserves per-figure alignment and Babel options", () => {
  const parsed = parse(fixture);
  const output = serialize(parsed.meta, parsed.blocks);
  assert.match(output, /\\usepackage\[english,main=spanish\]\{babel\}/);
  assert.equal((output.match(/\\centering\b/g) ?? []).length, 1);
  assert.equal((output.match(/\\raggedleft\b/g) ?? []).length, 1);
  const images = parse(output).blocks.filter((b) => b.type === "image");
  assert.deepEqual(images.map((b) => b.alignment), ["center", undefined, "right"]);
});

test("a new image block does not invent a centering declaration", () => {
  const output = serializeBlock({ type: "image", src: "images/plate.jpg", caption: "", width: "0.2\\textwidth" });
  assert.doesNotMatch(output, /\\centering/);
});

test("ODT contains the real Spanish defaults, explicit foreign language, and per-image alignment", async () => {
  const result = await convertLatexWithPandoc(fixture, "odt", "Prueba de semántica");
  assert.ok(!result.warnings.some((w) => w.startsWith("ODT:")), result.warnings.join("\n"));
  const zip = await JSZip.loadAsync(result.data);
  const content = xml(await zip.file("content.xml")!.async("string"));
  const styles = xml(await zip.file("styles.xml")!.async("string"));
  const meta = xml(await zip.file("meta.xml")!.async("string"));
  checkDefaultLanguage(styles, "es", "ES");
  assert.equal(all(meta, NS.dc, "language")[0]?.textContent, "es-ES");

  const frames = imageFrames(content);
  assert.equal(frames.length, 3);
  assert.deepEqual(frames.map((frame) => alignmentOf(frame, content)), ["center", "left", "right"]);
  assert.deepEqual(frames.map((frame) => frame.getAttributeNS(NS.text, "anchor-type")), ["as-char", "as-char", "as-char"]);
  // width=0.2\textwidth must survive as an explicit ODF size (0.2 × 12.7 cm text column ≈ 2.54 cm),
  // not the image's natural pixel size.
  const NS_SVG = "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0";
  const widths = frames.map((frame) => Number.parseFloat(frame.getAttributeNS(NS.style, "width") ?? ""));
  assert.deepEqual(widths.map((w) => w.toFixed(2)), ["2.54", "2.54", "2.54"]);
  assert.ok(frames.every((frame) => !frame.hasAttributeNS(NS_SVG, "rel-width")));
  // Formula objects are not picture frames and must never be modified by the adapter.
  const formulas = all(content, NS.draw, "object");
  assert.equal(formulas.length, 1);
  assert.ok(Object.keys(zip.files).some((p) => /^Formula-.*\/content\.xml$/.test(p)));

  // Preserve the deliberately English span instead of globally replacing every language with Spanish.
  const englishSpan = all(content, NS.text, "span").find((s) => s.textContent?.includes("deliberately"));
  assert.ok(englishSpan);
  const englishStyle = all(content, NS.style, "style").find(
    (s) => s.getAttributeNS(NS.style, "name") === englishSpan.getAttributeNS(NS.text, "style-name")
  );
  assert.ok(englishStyle);
  assert.equal(all(englishStyle, NS.style, "text-properties")[0]?.getAttributeNS(NS.fo, "language"), "en");
  assert.equal(result.data.readUInt16LE(8), 0, "ODF mimetype must remain uncompressed");
});

test("an English source stays English even when it contains Spanish text", async () => {
  const source = String.raw`\documentclass{article}\usepackage[english]{babel}\begin{document}Texto español.\end{document}`;
  const result = await convertLatexWithPandoc(source, "odt", "English document");
  const zip = await JSZip.loadAsync(result.data);
  checkDefaultLanguage(xml(await zip.file("styles.xml")!.async("string")), "en", "US");
});

test("main document language and image alignment propagate through project inputs", async () => {
  const source = String.raw`\documentclass{article}\usepackage[spanish]{babel}\usepackage{graphicx}\begin{document}\input{chapter}\end{document}`;
  const files = [{ slug: "chapter", source: String.raw`\begin{figure}\centering\includegraphics[width=0.2\textwidth]{images/plate.jpg}\caption{Figura del capítulo.}\end{figure}` }];
  assert.equal(inspectLatexImages(expandLatexInputs(source, files))[0].alignment, "center");
  const result = await convertLatexWithPandoc(source, "odt", "Proyecto", files);
  const zip = await JSZip.loadAsync(result.data);
  const content = xml(await zip.file("content.xml")!.async("string"));
  assert.equal(alignmentOf(imageFrames(content)[0], content), "center");
  checkDefaultLanguage(xml(await zip.file("styles.xml")!.async("string")), "es", "ES");
});

test("the supplied typography example really declares centering, and the ODT preserves it", async () => {
  assert.match(SAMPLES[0].source, /\\centering\s+\\includegraphics/);
  const result = await convertLatexWithPandoc(SAMPLES[0].source, "odt", SAMPLES[0].title);
  const zip = await JSZip.loadAsync(result.data);
  const content = xml(await zip.file("content.xml")!.async("string"));
  assert.equal(alignmentOf(imageFrames(content)[0], content), "center");
  checkDefaultLanguage(xml(await zip.file("styles.xml")!.async("string")), "es", "ES");
});

test("PDF still uses the original pdflatex pipeline and compiles the same example", async () => {
  const result = await compileLatexToPdf(SAMPLES[0].source, [], false);
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.ok(result.pdf?.subarray(0, 5).equals(Buffer.from("%PDF-")));
  assert.ok(result.pageCount > 0);
});
