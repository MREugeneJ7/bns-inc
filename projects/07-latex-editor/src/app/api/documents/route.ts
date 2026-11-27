import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, projects } from "@/db/schema";
import { parse, wordCount } from "@/lib/latex";
import { slugify } from "@/lib/slug";
import { SAMPLES } from "@/lib/samples";
import { extractBody } from "@/lib/compose";
import { safeProjectPath } from "@/lib/archive";

export const dynamic = "force-dynamic";

async function seedIfEmpty() {
  const [row] = await db.select({ id: projects.id }).from(projects).limit(1);
  if (row) return;

  /* Proyecto 1: cuaderno compuesto por plantilla base + subdocumentos */
  const [p1] = await db.insert(projects).values({ name: "Cuaderno de composición" }).returning();

  const baseSource = `% Plantilla base del cuaderno
\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[spanish]{babel}
\\usepackage{lmodern}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{graphicx}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{hyperref}

\\title{Cuaderno de composición}
\\author{Marina Cifuentes --- Taller de edición}
\\date{14 de marzo de 2026}

\\begin{document}
\\maketitle

\\input{notas-estilo}

\\input{capitulo-tipografia}

\\newpage

\\input{capitulo-maxwell}

\\end{document}
`;
  const [base] = await db
    .insert(documents)
    .values({
      projectId: p1.id,
      parentId: null,
      slug: "plantilla-base",
      title: "Cuaderno de composición",
      kind: "base",
      source: baseSource,
      words: 0,
      blocks: 0,
    })
    .returning();

  const notasEstilo = `\\section*{Notas de estilo}

\\begin{quote}
Componer es repartir el blanco con la misma atención con la que se reparte la
tinta. El tipógrafo que solo mira las letras ha visto media página.
\\end{quote}

\\begin{enumerate}
  \\item Colisiones de viudas y huérfanas en la última página de cada capítulo.
  \\item Espacios dobles tras el punto final.
  \\item Coherencia de las comillas latinas de apertura y cierre.
\\end{enumerate}
`;
  const capituloTipografia = extractBody(SAMPLES[0].source);
  const capituloMaxwell = `\\section{Ecuaciones de Maxwell en medios materiales}\n\n${extractBody(SAMPLES[1].source)}`;

  const subs = [
    { slug: "notas-estilo", title: "Notas de estilo", kind: "tipo", source: notasEstilo },
    { slug: "capitulo-tipografia", title: "Capítulo: tipografía", kind: "texto", source: capituloTipografia },
    { slug: "capitulo-maxwell", title: "Capítulo: ecuaciones", kind: "texto", source: capituloMaxwell },
  ];
  for (const s of subs) {
    const p = parse(s.source);
    await db
      .insert(documents)
      .values({
        projectId: p1.id,
        parentId: base.id,
        slug: s.slug,
        title: s.title,
        kind: s.kind,
        source: s.source,
        words: wordCount(p.blocks),
        blocks: p.blocks.length,
      })
      .returning();
  }

  /* Proyecto 2: proyecto de un solo documento */
  const [p2] = await db.insert(projects).values({ name: "Actas de sesión" }).returning();
  const acta = parse(SAMPLES[2].source);
  await db
    .insert(documents)
    .values({
      projectId: p2.id,
      parentId: null,
      slug: "acta-14-marzo",
      title: "Acta — 14 de marzo",
      kind: "texto",
      source: SAMPLES[2].source,
      words: wordCount(acta.blocks),
      blocks: acta.blocks.length,
    })
    .returning();
}

export async function GET() {
  try {
    await seedIfEmpty();
    const rows = await db
      .select({
        id: documents.id,
        projectId: documents.projectId,
        parentId: documents.parentId,
        slug: documents.slug,
        filePath: documents.filePath,
        title: documents.title,
        kind: documents.kind,
        words: documents.words,
        blocks: documents.blocks,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .orderBy(asc(documents.createdAt));
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      projectId?: string;
      parentId?: string | null;
      title?: string;
      kind?: string;
      source?: string;
      filePath?: string;
    };
    if (!body.projectId) return NextResponse.json({ error: "Falta projectId" }, { status: 400 });

    const [project] = await db.select({ id: projects.id, mainFile: projects.mainFile }).from(projects).where(eq(projects.id, body.projectId));
    if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

    let parentId: string | null = null;
    if (body.parentId) {
      const [parent] = await db
        .select({ id: documents.id, projectId: documents.projectId })
        .from(documents)
        .where(eq(documents.id, body.parentId));
      if (!parent || parent.projectId !== project.id) {
        return NextResponse.json({ error: "Documento padre no válido" }, { status: 400 });
      }
      parentId = parent.id;
    }

    const title = body.title?.trim() || "Nuevo documento";
    const kind = body.kind === "base" || body.kind === "tipo" ? body.kind : "texto";
    const source = body.source ?? "";
    const filePath = project.mainFile ? safeProjectPath(body.filePath?.trim() || `${title}${/\.tex$/i.test(title) ? "" : ".tex"}`) : null;
    if (filePath) {
      const samePath = await db.select({ id: documents.id, path: documents.filePath }).from(documents).where(eq(documents.projectId, project.id));
      if (samePath.some((d) => d.path === filePath)) return NextResponse.json({ error: "Esta ruta ya existe en el proyecto." }, { status: 409 });
    }

    const existing = await db.select({ slug: documents.slug }).from(documents).where(eq(documents.projectId, project.id));
    const base = slugify(title);
    let slug = base;
    let n = 2;
    while (existing.some((e) => e.slug === slug)) slug = `${base}-${n++}`;

    const parsed = parse(source);
    const [row] = await db
      .insert(documents)
      .values({
        projectId: project.id,
        parentId,
        slug: filePath ? filePath.replace(/\.tex$/i, "") : slug,
        filePath,
        title,
        kind,
        source,
        words: wordCount(parsed.blocks),
        blocks: parsed.blocks.length,
      })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
