import JSZip from "jszip";
import { DOMParser, XMLSerializer, type Document, type Element, type Node } from "@xmldom/xmldom";
import { resolveLatexLengthToTwips, type LatexImage, type LatexPageGeometry } from "./latex-semantics";

const NS = {
  office: "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
  style: "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
  text: "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
  draw: "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
  svg: "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",
  fo: "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
  dc: "http://purl.org/dc/elements/1.1/",
};

function parseXml(xml: string): Document {
  return new DOMParser({
    onError: (level, message) => {
      if (level !== "warning") throw new Error(`ODT XML: ${message}`);
    },
  }).parseFromString(xml, "application/xml");
}

function elements(root: Document | Element, ns: string, name: string): Element[] {
  return Array.from(root.getElementsByTagNameNS(ns, name));
}

function paragraphOf(element: Element): Element | null {
  let node = element.parentNode;
  while (node) {
    if (node.nodeType === 1) {
      const element = node as Element;
      if (element.namespaceURI === NS.text && element.localName === "p") return element;
    }
    node = node.parentNode;
  }
  return null;
}

/** 1 cm = 1440/2.54 twips = 566.9291 twips */
const TWIPS_PER_CM = 566.9291;
const PT_PER_CM = 28.3464567;

/**
 * Targeted ODT interoperability correction. Pandoc still generates the full document.
 * Repairs paragraph alignment/anchoring and the explicit LaTeX sizes (width/height/scale)
 * of source images; keeps the document's language defaults. Captions, formula objects,
 * page styles and explicit foreign-language spans are untouched.
 */
export async function preserveOdtSemantics(
  data: Buffer,
  sourceImages: LatexImage[],
  language: string | undefined,
  geometry?: LatexPageGeometry
): Promise<{ data: Buffer; warnings: string[] }> {
  const zip = await JSZip.loadAsync(data);
  const contentEntry = zip.file("content.xml");
  const stylesEntry = zip.file("styles.xml");
  const metaEntry = zip.file("meta.xml");
  if (!contentEntry || !stylesEntry || !metaEntry) throw new Error("El ODT generado no contiene los XML obligatorios.");

  const content = parseXml(await contentEntry.async("string"));
  const styles = parseXml(await stylesEntry.async("string"));
  const meta = parseXml(await metaEntry.async("string"));
  const warnings: string[] = [];

  // An explicit metadata language makes Pandoc localize its default text styles.
  // Also guarantee the paragraph/text defaults exist for consumers that do not inherit the same way.
  // Never rewrite named/automatic text styles: they can represent \foreignlanguage{english}{...}.
  if (language) {
    const parts = new Intl.Locale(language);
    const lang = parts.language;
    const country = parts.region ?? "none";
    const officeStyles = elements(styles, NS.office, "styles")[0];
    if (officeStyles) {
      for (const family of ["paragraph", "text"]) {
        let defaultStyle = elements(officeStyles, NS.style, "default-style").find(
          (element) => element.getAttributeNS(NS.style, "family") === family
        );
        if (!defaultStyle) {
          defaultStyle = styles.createElementNS(NS.style, "style:default-style");
          defaultStyle.setAttributeNS(NS.style, "style:family", family);
          officeStyles.insertBefore(defaultStyle, officeStyles.firstChild);
        }
        let properties = elements(defaultStyle, NS.style, "text-properties")[0];
        if (!properties) {
          properties = styles.createElementNS(NS.style, "style:text-properties");
          defaultStyle.appendChild(properties);
        }
        properties.setAttributeNS(NS.fo, "fo:language", lang);
        properties.setAttributeNS(NS.fo, "fo:country", country);
      }
    }
    const metadata = elements(meta, NS.office, "meta")[0];
    if (metadata) {
      let langElement = elements(metadata, NS.dc, "language")[0];
      if (!langElement) {
        langElement = meta.createElementNS(NS.dc, "dc:language");
        metadata.appendChild(langElement);
      }
      langElement.textContent = language;
    }
  }

  const frames = elements(content, NS.draw, "image")
    .map((image) => image.parentNode as Element)
    .filter((parent) => parent.namespaceURI === NS.draw && parent.localName === "frame");

  // Pandoc emits picture frames in reading order. Do not silently associate the wrong
  // image if a macro/unsupported construct has changed the source-to-output cardinality.
  if (frames.length !== sourceImages.length) {
    warnings.push(
      `ODT: hay ${frames.length} imágenes convertidas y ${sourceImages.length} identificadas en la fuente; no se ha inferido su alineación.`
    );
  } else {
    let automaticStyles = elements(content, NS.office, "automatic-styles")[0];
    if (!automaticStyles) {
      automaticStyles = content.createElementNS(NS.office, "office:automatic-styles");
      content.documentElement!.insertBefore(automaticStyles, content.documentElement!.firstChild);
    }

    const usedStyleNames = new Set(
      elements(content, NS.style, "style").map((element) => element.getAttributeNS(NS.style, "name"))
    );
    const paragraphStyles = new Map<Element, string>();

    frames.forEach((frame, index) => {
      const image = sourceImages[index];
      const paragraph = paragraphOf(frame);

      // ODF otherwise defaults frames to a floating paragraph anchor, which can ignore
      // the paragraph's alignment. Inline anchoring makes the actual paragraph control position.
      frame.setAttributeNS(NS.text, "text:anchor-type", "as-char");

      // Pandoc's ODT writer drops explicit graphicx lengths (width=\textwidth, 0.5\textwidth,
      // scale=...): the frame keeps the image's natural pixel size in points and can render
      // a full-width figure many times larger than the text column. Restore the declared size.
      const naturalW = Number.parseFloat(frame.getAttributeNS(NS.svg, "width") ?? "") / PT_PER_CM;
      const naturalH = Number.parseFloat(frame.getAttributeNS(NS.svg, "height") ?? "") / PT_PER_CM;
      const aspect = Number.isFinite(naturalW) && Number.isFinite(naturalH) && naturalH > 0 ? naturalW / naturalH : 1;
      let targetW: number | undefined;
      if (image.width && geometry) {
        const twips = resolveLatexLengthToTwips(image.width, geometry.textWidthTwips, geometry.paperWidthTwips);
        if (twips) targetW = twips / TWIPS_PER_CM;
      } else if (image.height && geometry) {
        const twips = resolveLatexLengthToTwips(image.height, geometry.textHeightTwips, geometry.paperHeightTwips);
        if (twips) targetW = (twips / TWIPS_PER_CM) * aspect;
      } else if (image.scale !== undefined) {
        if (Number.isFinite(naturalW) && naturalW > 0) targetW = naturalW * image.scale;
      }
      if (targetW !== undefined && Number.isFinite(targetW) && targetW > 0) {
        const targetH = targetW / aspect;
        frame.setAttributeNS(NS.style, "style:width", `${targetW.toFixed(2)}cm`);
        frame.setAttributeNS(NS.style, "style:height", `${targetH.toFixed(2)}cm`);
        frame.removeAttributeNS(NS.style, "rel-width");
        frame.removeAttributeNS(NS.style, "rel-height");
      }

      if (!paragraph || (!image.block && !image.alignment)) return;

      const align = image.alignment ?? "left";
      if (paragraphStyles.has(paragraph)) return; // multiple images on the same source line
      const parentStyle = paragraph.getAttributeNS(NS.text, "style-name") || "Standard";
      let name = `LatexImage_${align}_${index + 1}`;
      while (usedStyleNames.has(name)) name += "_";
      usedStyleNames.add(name);

      const style = content.createElementNS(NS.style, "style:style");
      style.setAttributeNS(NS.style, "style:name", name);
      style.setAttributeNS(NS.style, "style:family", "paragraph");
      style.setAttributeNS(NS.style, "style:parent-style-name", parentStyle);
      const properties = content.createElementNS(NS.style, "style:paragraph-properties");
      properties.setAttributeNS(NS.fo, "fo:text-align", align);
      style.appendChild(properties);
      automaticStyles.appendChild(style);
      paragraph.setAttributeNS(NS.text, "text:style-name", name);
      paragraphStyles.set(paragraph, name);
    });
  }

  // Los saltos de página (\newpage) son marcadores en la copia de conversión:
  // se convierten en un párrafo vacío con fo:break-before="page" en su posición original.
  {
    const markerTest = /TALLERPB\d{4}TALLER/;
    const markerStrip = /TALLERPB\d{4}TALLER/g;
    for (const p of elements(content, NS.text, "p")) {
      const textNodes: Node[] = [];
      const collect = (node: Node) => {
        if (node.nodeType === 3) textNodes.push(node);
        for (let child = node.firstChild; child; child = child.nextSibling) collect(child);
      };
      collect(p);
      const hasMarker = textNodes.some((t) => markerTest.test(t.nodeValue ?? ""));
      if (!hasMarker) continue;
      for (const t of textNodes) {
        if (t.nodeValue) t.nodeValue = t.nodeValue.replace(markerStrip, "");
      }
      if (!(p.textContent ?? "").trim()) {
        while (p.firstChild) p.removeChild(p.firstChild);
      }
      p.setAttributeNS(NS.fo, "fo:break-before", "page");
    }
  }

  const serializer = new XMLSerializer();
  zip.file("content.xml", serializer.serializeToString(content));
  zip.file("styles.xml", serializer.serializeToString(styles));
  zip.file("meta.xml", serializer.serializeToString(meta));

  // Keep the mandatory first ZIP entry uncompressed, as required by the ODF package format.
  const output = new JSZip();
  output.file("mimetype", "application/vnd.oasis.opendocument.text", { compression: "STORE" });
  for (const entry of Object.values(zip.files)) {
    if (entry.name === "mimetype" || entry.dir) continue;
    output.file(entry.name, await entry.async("nodebuffer"));
  }

  return {
    data: await output.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }),
    warnings,
  };
}
