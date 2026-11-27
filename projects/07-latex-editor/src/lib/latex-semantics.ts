/** LaTeX semantics lost by the Pandoc reader. This does not typeset or rewrite the document. */
export type ImageAlignment = "left" | "center" | "right";

export interface LatexImage {
  src: string;
  alignment?: ImageAlignment;
  block: boolean;
  width?: string;
  height?: string;
  scale?: number;
}

export interface LatexPageGeometry {
  paperWidthTwips: number;
  paperHeightTwips: number;
  marginLeftTwips: number;
  marginRightTwips: number;
  marginTopTwips: number;
  marginBottomTwips: number;
  textWidthTwips: number;
  textHeightTwips: number;
  fontSizePt: number;
}

interface Argument {
  value: string;
  end: number;
}

export function withoutLatexComments(source: string): string {
  return source.replace(/\\[\s\S]|%[^\r\n]*/g, (match) =>
    match.startsWith("%") ? " ".repeat(match.length) : match
  );
}

function argument(source: string, start: number, open = "{", close = "}"): Argument | null {
  let i = start;
  while (/\s/.test(source[i] ?? "") && i < source.length) i++;
  if (source[i] !== open) return null;
  const contentStart = ++i;
  let depth = 1;
  while (i < source.length) {
    if (source[i] === "\\") {
      i += 2;
      continue;
    }
    if (source[i] === open) depth++;
    if (source[i] === close && --depth === 0) {
      return { value: source.slice(contentStart, i), end: i + 1 };
    }
    i++;
  }
  return null;
}

const LANGUAGE_TAGS: Record<string, string> = {
  spanish: "es-ES", espanol: "es-ES", castellano: "es-ES", mexican: "es-MX",
  english: "en-US", american: "en-US", usenglish: "en-US", british: "en-GB", ukenglish: "en-GB",
  australian: "en-AU", canadian: "en-CA", newzealand: "en-NZ",
  french: "fr-FR", francais: "fr-FR", acadian: "fr-CA", canadien: "fr-CA",
  german: "de-DE", ngerman: "de-DE", austrian: "de-AT", naustrian: "de-AT", swissgerman: "de-CH",
  italian: "it-IT", portuguese: "pt-PT", brazil: "pt-BR", brazilian: "pt-BR",
  catalan: "ca-ES", galician: "gl-ES", basque: "eu-ES", dutch: "nl-NL",
  russian: "ru-RU", ukrainian: "uk-UA", polish: "pl-PL", czech: "cs-CZ",
  slovak: "sk-SK", danish: "da-DK", swedish: "sv-SE", norwegian: "nb-NO", norsk: "nb-NO",
  finnish: "fi-FI", greek: "el-GR", turkish: "tr-TR", romanian: "ro-RO",
  hungarian: "hu-HU", arabic: "ar", hebrew: "he-IL", japanese: "ja-JP", korean: "ko-KR",
};

function languageTag(name: string): string | undefined {
  const clean = name.trim().toLowerCase();
  if (LANGUAGE_TAGS[clean]) return LANGUAGE_TAGS[clean];
  if (/^[a-z]{2,3}(?:-[a-z]{2}|-[a-z]{4}(?:-[a-z]{2})?)?$/.test(clean)) {
    try {
      return Intl.getCanonicalLocales(clean)[0];
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function languageOptions(options: string): { last?: string; main?: string } {
  let last: string | undefined;
  let main: string | undefined;
  for (const part of options.split(",")) {
    const option = part.trim();
    const mainMatch = /^main\s*=\s*\{?([^}]+)\}?$/.exec(option);
    if (mainMatch) main = languageTag(mainMatch[1]);
    else if (!option.includes("=")) last = languageTag(option) ?? last;
  }
  return { last, main };
}

/** Babel's explicit main= wins; otherwise its last language option is the main language. */
export function detectLatexLanguage(source: string): string | undefined {
  const clean = withoutLatexComments(source);
  const beginDocument = /\\begin\s*\{document\}/.exec(clean);
  const preamble = beginDocument ? clean.slice(0, beginDocument.index) : clean;
  const commands = /\\(documentclass|usepackage|RequirePackage|PassOptionsToPackage|setdefaultlanguage|setmainlanguage|babelprovide|selectlanguage)\b/g;
  let classLanguage: string | undefined;
  let babelLast: string | undefined;
  let babelMain: string | undefined;
  let explicitLanguage: string | undefined;
  let hasBabel = false;
  let match: RegExpExecArray | null;

  while ((match = commands.exec(preamble))) {
    const cmd = match[1];
    const opts = argument(preamble, commands.lastIndex, "[", "]");
    const arg = argument(preamble, opts?.end ?? commands.lastIndex);
    if (!arg) continue;
    commands.lastIndex = arg.end;

    if (cmd === "documentclass") {
      const langs = languageOptions(opts?.value ?? "");
      classLanguage = langs.main ?? langs.last;
    } else if (cmd === "usepackage" || cmd === "RequirePackage") {
      if (!arg.value.split(",").some((p) => p.trim() === "babel")) continue;
      hasBabel = true;
      const langs = languageOptions(opts?.value ?? "");
      babelLast = langs.last ?? babelLast;
      babelMain = langs.main ?? babelMain;
    } else if (cmd === "PassOptionsToPackage") {
      const pkg = argument(preamble, arg.end);
      if (pkg?.value.trim() !== "babel") continue;
      commands.lastIndex = pkg.end;
      const langs = languageOptions(arg.value);
      babelLast = langs.last ?? babelLast;
      babelMain = langs.main ?? babelMain;
    } else if (cmd === "babelprovide") {
      if (/(?:^|,)\s*main(?:\s*=\s*true)?\s*(?:,|$)/.test(opts?.value ?? "")) {
        explicitLanguage = languageTag(arg.value) ?? explicitLanguage;
      }
    } else {
      let tag = languageTag(arg.value);
      const variant = /variant\s*=\s*([^,\]}]+)/.exec(opts?.value ?? "")?.[1]?.trim().toLowerCase();
      if (arg.value.trim() === "spanish" && variant === "mexican") tag = "es-MX";
      if (arg.value.trim() === "english" && variant) tag = languageTag(variant) ?? tag;
      explicitLanguage = tag ?? explicitLanguage;
    }
  }

  return explicitLanguage ?? (hasBabel ? babelMain ?? babelLast ?? classLanguage : undefined);
}

/** For analysis only: expand project inputs in the same order as Pandoc, including repeated inputs. */
export function expandLatexInputs(source: string, files: { slug: string; source: string }[] = []): string {
  const byName = new Map(files.map((f) => [f.slug.replace(/\.tex$/, ""), f.source]));
  const expand = (text: string, parents: Set<string>): string =>
    withoutLatexComments(text).replace(/\\(?:input|include)\s*\{([^}]+)\}/g, (original, name: string) => {
      const key = name.trim().replace(/\.tex$/, "");
      const child = byName.get(key);
      if (child === undefined || parents.has(key)) return original;
      const begin = /\\begin\{document\}/.exec(child);
      const end = /\\end\{document\}/.exec(child);
      const body = begin && end ? child.slice(begin.index + begin[0].length, end.index).replace(/\\maketitle\b/g, "") : child;
      return expand(body, new Set([...parents, key]));
    });
  return expand(source, new Set());
}

/**
 * Track standard alignment declarations, group boundaries and alignment environments.
 * Undefined alignment means inherit the normal LaTeX paragraph alignment, NOT center.
 * Macro expansion/layout remains the responsibility of TeX; unsupported mismatches are reported by the ODT adapter.
 */
export function inspectLatexImages(source: string): LatexImage[] {
  const clean = withoutLatexComments(source);
  const beginDocument = /\\begin\s*\{document\}/.exec(clean);
  const body = beginDocument ? clean.slice(beginDocument.index + beginDocument[0].length) : clean;
  const images: LatexImage[] = [];
  const stack: { alignment?: ImageAlignment; block: boolean; scope: string }[] = [{ block: false, scope: "root" }];
  const current = () => stack[stack.length - 1];
  const push = (scope: string, alignment?: ImageAlignment, block?: boolean) => {
    stack.push({ ...current(), scope, ...(alignment ? { alignment } : {}), ...(block !== undefined ? { block } : {}) });
  };
  let i = 0;
  while (i < body.length) {
    if (body[i] === "{") {
      push("group");
      i++;
      continue;
    }
    if (body[i] === "}") {
      if (stack.length > 1 && current().scope === "group") stack.pop();
      i++;
      continue;
    }
    if (body[i] !== "\\") {
      i++;
      continue;
    }
    const command = /^\\([a-zA-Z@]+)\*?|^\\[\s\S]/.exec(body.slice(i));
    if (!command) { i++; continue; }
    const cmd = command[1];
    i += command[0].length;
    if (cmd === "verb") {
      const delimiter = body[i];
      const end = delimiter ? body.indexOf(delimiter, i + 1) : -1;
      i = end === -1 ? body.length : end + 1;
    } else if (cmd === "begin" || cmd === "end") {
      const env = argument(body, i);
      if (!env) continue;
      i = env.end;
      if (cmd === "begin") {
        if (/^(verbatim\*?|Verbatim|lstlisting|minted|comment)$/.test(env.value)) {
          const end = body.indexOf(`\\end{${env.value}}`, i);
          i = end === -1 ? body.length : end + env.value.length + 6;
          continue;
        }
        const alignment = env.value === "center" ? "center" : env.value === "flushleft" ? "left" : env.value === "flushright" ? "right" : undefined;
        push(env.value, alignment, /^(figure\*?|center|flushleft|flushright)$/.test(env.value) ? true : undefined);
      } else {
        let idx = stack.length - 1;
        while (idx > 0 && stack[idx].scope !== env.value) idx--;
        if (idx > 0) stack.splice(idx);
      }
    } else if (cmd === "begingroup" || cmd === "bgroup") {
      push("group");
    } else if (cmd === "endgroup" || cmd === "egroup") {
      if (stack.length > 1 && current().scope === "group") stack.pop();
    } else if (cmd === "centering" || cmd === "Centering") {
      current().alignment = "center";
    } else if (cmd === "raggedright" || cmd === "RaggedRight") {
      current().alignment = "left";
    } else if (cmd === "raggedleft" || cmd === "RaggedLeft") {
      current().alignment = "right";
    } else if (cmd === "justifying") {
      current().alignment = undefined;
    } else if (cmd === "includegraphics") {
      const opts = argument(body, i, "[", "]");
      const file = argument(body, opts?.end ?? i);
      if (!file) continue;
      let width: string | undefined;
      let height: string | undefined;
      let scale: number | undefined;
      if (opts?.value) {
        for (const rawOpt of opts.value.split(",")) {
          const eq = rawOpt.indexOf("=");
          if (eq === -1) continue;
          const k = rawOpt.slice(0, eq).trim().toLowerCase();
          const v = rawOpt.slice(eq + 1).trim();
          if (k === "width") width = v;
          else if (k === "height") height = v;
          else if (k === "scale") {
            const n = Number(v.replace("%", ""));
            if (Number.isFinite(n) && n > 0) scale = v.endsWith("%") ? n / 100 : n;
          }
        }
      }
      images.push({
        src: file.value.trim(),
        alignment: current().alignment,
        block: current().block,
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
        ...(scale !== undefined ? { scale } : {}),
      });
      i = file.end;
    }
  }
  return images;
}

/** Convierte una longitud de LaTeX (cm, mm, in, pt, bp, pc, \textwidth, \linewidth, %) a twips (1in = 1440 twips). */
export function resolveLatexLengthToTwips(
  expr: string | undefined,
  textWidthTwips: number,
  pageWidthTwips: number
): number | undefined {
  if (!expr) return undefined;
  const clean = expr.trim();
  if (!clean) return undefined;

  const relMatch = /^([0-9]*\.?[0-9]+)?\s*\\(textwidth|linewidth|columnwidth|hsize|paperwidth)$/.exec(clean);
  if (relMatch) {
    const factor = relMatch[1] ? Number(relMatch[1]) : 1;
    if (!Number.isFinite(factor) || factor <= 0) return undefined;
    const base = relMatch[2] === "paperwidth" ? pageWidthTwips : textWidthTwips;
    return Math.round(factor * base);
  }

  const pctMatch = /^([0-9]*\.?[0-9]+)\s*%$/.exec(clean);
  if (pctMatch) {
    const pct = Number(pctMatch[1]);
    if (Number.isFinite(pct) && pct > 0) return Math.round((pct / 100) * textWidthTwips);
  }

  const absMatch = /^([0-9]*\.?[0-9]+)\s*(cm|mm|in|pt|bp|pc|px)$/.exec(clean);
  if (absMatch) {
    const val = Number(absMatch[1]);
    if (!Number.isFinite(val) || val <= 0) return undefined;
    switch (absMatch[2]) {
      case "in":
        return Math.round(val * 1440);
      case "cm":
        return Math.round((val / 2.54) * 1440);
      case "mm":
        return Math.round((val / 25.4) * 1440);
      case "pt":
        return Math.round((val / 72.27) * 1440);
      case "bp":
        return Math.round(val * 20);
      case "pc":
        return Math.round(val * 12 * (1440 / 72.27));
      case "px":
        return Math.round(val * 15);
    }
  }
  return undefined;
}

/** Extrae el tamaño de página, márgenes y cuerpo base declarados en el preámbulo LaTeX. */
export function inspectLatexPageGeometry(source: string): LatexPageGeometry {
  const clean = withoutLatexComments(source);
  const beginDoc = /\\begin\s*\{document\}/.exec(clean);
  const preamble = beginDoc ? clean.slice(0, beginDoc.index) : clean;

  // Defaults A4 (TeX Live Debian está configurado a A4) y márgenes estándar de article
  let paperWidthTwips = 11906; // 210mm
  let paperHeightTwips = 16838; // 297mm
  let fontSizePt = 11;

  const docCls = /\\documentclass(?:\[([^\]]*)\])?\{([^}]*)\}/.exec(preamble);
  const clsOpts = docCls?.[1] ?? "";
  if (/\bletterpaper\b/.test(clsOpts)) {
    paperWidthTwips = 12240; // 8.5in
    paperHeightTwips = 15840; // 11in
  } else if (/\ba5paper\b/.test(clsOpts)) {
    paperWidthTwips = 8391; // 148mm
    paperHeightTwips = 11906; // 210mm
  }
  const ptMatch = /\b(10|11|12)pt\b/.exec(clsOpts);
  if (ptMatch) fontSizePt = Number(ptMatch[1]);

  // Sin geometry, article 11pt en A4 tiene aprox. textwidth ~ 360pt (~7173 twips)
  let marginLeftTwips = Math.round((paperWidthTwips - 7200) / 2);
  let marginRightTwips = marginLeftTwips;
  let marginTopTwips = 1800;
  let marginBottomTwips = 1800;

  const geomSources: string[] = [];
  for (const m of preamble.matchAll(/\\usepackage\[([^\]]*)\]\{geometry\}/g)) geomSources.push(m[1]);
  for (const m of preamble.matchAll(/\\geometry\{([^}]*)\}/g)) geomSources.push(m[1]);

  for (const raw of geomSources) {
    if (/\bletterpaper\b/.test(raw)) {
      paperWidthTwips = 12240;
      paperHeightTwips = 15840;
    } else if (/\ba4paper\b/.test(raw)) {
      paperWidthTwips = 11906;
      paperHeightTwips = 16838;
    }
    for (const part of raw.split(",")) {
      const eq = part.indexOf("=");
      if (eq === -1) continue;
      const k = part.slice(0, eq).trim().toLowerCase();
      const v = part.slice(eq + 1).trim();
      const tw = resolveLatexLengthToTwips(v, paperWidthTwips, paperWidthTwips);
      if (!tw) continue;
      if (k === "margin") {
        marginLeftTwips = tw;
        marginRightTwips = tw;
        marginTopTwips = tw;
        marginBottomTwips = tw;
      } else if (k === "hmargin") {
        marginLeftTwips = tw;
        marginRightTwips = tw;
      } else if (k === "vmargin") {
        marginTopTwips = tw;
        marginBottomTwips = tw;
      } else if (k === "left" || k === "lmargin" || k === "inner") {
        marginLeftTwips = tw;
      } else if (k === "right" || k === "rmargin" || k === "outer") {
        marginRightTwips = tw;
      } else if (k === "top" || k === "tmargin") {
        marginTopTwips = tw;
      } else if (k === "bottom" || k === "bmargin") {
        marginBottomTwips = tw;
      }
    }
  }

  const textWidthTwips = Math.max(2880, paperWidthTwips - marginLeftTwips - marginRightTwips);
  const textHeightTwips = Math.max(2880, paperHeightTwips - marginTopTwips - marginBottomTwips);

  return {
    paperWidthTwips,
    paperHeightTwips,
    marginLeftTwips,
    marginRightTwips,
    marginTopTwips,
    marginBottomTwips,
    textWidthTwips,
    textHeightTwips,
    fontSizePt,
  };
}

export function hasLatexTitleCommand(source: string): boolean {
  const clean = withoutLatexComments(source);
  return /\\title\s*\{/.test(clean);
}

export function hasLatexMakeTitle(source: string): boolean {
  const clean = withoutLatexComments(source);
  return /\\maketitle\b/.test(clean);
}

/**
 * Extrae las declaraciones matemáticas y macros del preámbulo para compilar ecuaciones aisladas
 * con fidelidad tipográfica al documento original.
 */
export function extractLatexMathPreamble(source: string): { fontSizePt: number; lines: string[] } {
  const clean = withoutLatexComments(source);
  const beginDoc = /\\begin\s*\{document\}/.exec(clean);
  const preamble = beginDoc ? clean.slice(0, beginDoc.index) : "";
  const geom = inspectLatexPageGeometry(source);

  const SAFE_MATH_PKGS = new Set([
    "amsmath",
    "amssymb",
    "amsfonts",
    "amsthm",
    "mathtools",
    "bm",
    "mathrsfs",
    "stmaryrd",
    "siunitx",
    "physics",
    "braket",
    "cancel",
    "xcolor",
    "lmodern",
    "esint",
    "dsfont",
    "bbm",
  ]);

  const lines: string[] = [];
  for (const m of preamble.matchAll(/\\usepackage(\[[^\]]*\])?\{([^}]*)\}/g)) {
    const opts = m[1] ?? "";
    const pkgs = m[2]
      .split(",")
      .map((s) => s.trim())
      .filter((p) => SAFE_MATH_PKGS.has(p));
    if (pkgs.length > 0) lines.push(`\\usepackage${opts}{${pkgs.join(",")}}`);
  }

  // Conservar macros de usuario (\newcommand, \renewcommand, \DeclareMathOperator, \def) de una línea
  for (const line of preamble.split("\n")) {
    const t = line.trim();
    if (/^\\(newcommand|renewcommand|providecommand|DeclareMathOperator)\*?\b/.test(t)) {
      lines.push(t);
    }
  }

  return { fontSizePt: geom.fontSizePt, lines };
}

const RTF_LCID: Record<string, number> = {
  "es-ES": 3082,
  "es-MX": 2058,
  es: 3082,
  "en-US": 1033,
  "en-GB": 2057,
  "en-AU": 3081,
  "en-CA": 4105,
  "en-NZ": 5129,
  en: 1033,
  "fr-FR": 1036,
  "fr-CA": 3084,
  fr: 1036,
  "de-DE": 1031,
  "de-AT": 3079,
  "de-CH": 2055,
  de: 1031,
  "it-IT": 1040,
  it: 1040,
  "pt-PT": 2070,
  "pt-BR": 1046,
  pt: 2070,
  "ca-ES": 1027,
  ca: 1027,
  "gl-ES": 1110,
  gl: 1110,
  "eu-ES": 1069,
  eu: 1069,
  "nl-NL": 1043,
  nl: 1043,
  "ru-RU": 1049,
  "uk-UA": 1058,
  "pl-PL": 1045,
  "cs-CZ": 1029,
  "sk-SK": 1051,
  "da-DK": 1030,
  "sv-SE": 1053,
  "nb-NO": 1044,
  "fi-FI": 1035,
  "el-GR": 1032,
  "tr-TR": 1055,
  "ro-RO": 1048,
  "hu-HU": 1038,
  ar: 1025,
  "he-IL": 1037,
  "ja-JP": 1041,
  "ko-KR": 1042,
};

export function languageToRtfLcid(language?: string): number | undefined {
  if (!language) return undefined;
  if (RTF_LCID[language]) return RTF_LCID[language];
  const primary = language.split("-")[0]?.toLowerCase();
  return primary ? RTF_LCID[primary] : undefined;
}
