export type ExportFormat = "pdf" | "tex" | "odt" | "md" | "txt" | "rtf" | "html" | "epub";

export const FORMATS: ExportFormat[] = ["pdf", "tex", "odt", "md", "txt", "rtf", "html", "epub"];

export const FORMAT_LABEL: Record<ExportFormat, string> = {
  pdf: "PDF — pdflatex real",
  tex: "LaTeX — fuente .tex",
  odt: "ODT — OpenDocument (pandoc)",
  md: "Markdown (pandoc)",
  txt: "Texto plano (pandoc)",
  rtf: "RTF — Rich Text (pandoc)",
  html: "HTML5 + MathML (pandoc)",
  epub: "EPUB 3 (pandoc)",
};

export const EXTENSION: Record<ExportFormat, string> = {
  pdf: "pdf",
  tex: "tex",
  odt: "odt",
  md: "md",
  txt: "txt",
  rtf: "rtf",
  html: "html",
  epub: "epub",
};
