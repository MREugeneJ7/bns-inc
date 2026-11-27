import { escapeRe } from "./slug";

export interface SubDoc {
  id: string;
  parentId: string;
  slug: string;
  source: string;
  depth: number;
}

/** Cuerpo de un documento: lo que hay entre \begin{document} y \end{document}, sin \maketitle duplicado. */
export function extractBody(src: string): string {
  const begin = /\\begin\{document\}/.exec(src);
  const end = /\\end\{document\}/.exec(src);
  if (begin && end && end.index > begin.index) {
    return src
      .slice(begin.index + begin[0].length, end.index)
      .replace(/^\s*\\maketitle\s*/m, "")
      .trim();
  }
  return src.trim();
}

/**
 * Compone un documento de plantilla con sus subdocumentos:
 * cada línea \input{slug} se sustituye por el cuerpo (ya compuesto) del hijo.
 * `descendants` contiene TODOS los descendientes (el propio documento no).
 */
export function composeDocument(rootId: string, rootSource: string, descendants: SubDoc[]): string {
  const childrenOf = (pid: string) => descendants.filter((d) => d.parentId === pid);

  const rec = (node: { id: string; source: string }): string => {
    let s = node.source;
    for (const ch of childrenOf(node.id)) {
      const body = extractBody(rec(ch));
      s = s.replace(new RegExp(`\\\\input\\{${escapeRe(ch.slug)}\\}`, "g"), () => body);
    }
    return s;
  };

  let out = rootSource;
  for (const ch of childrenOf(rootId)) {
    const body = extractBody(rec(ch));
    out = out.replace(new RegExp(`\\\\input\\{${escapeRe(ch.slug)}\\}`, "g"), () => body);
  }
  return out;
}

/** Añade la línea \input{slug} al final del cuerpo del documento padre. */
export function withInputLine(parentSource: string, slug: string): string {
  const line = `\\input{${slug}}`;
  if (parentSource.includes(line)) return parentSource;
  const end = /\\end\{document\}/.exec(parentSource);
  if (end) return parentSource.slice(0, end.index) + line + "\n" + parentSource.slice(end.index);
  return parentSource.replace(/\n?$/, "\n") + line + "\n";
}
