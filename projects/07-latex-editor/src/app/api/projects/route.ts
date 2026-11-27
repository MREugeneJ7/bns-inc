import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, projects } from "@/db/schema";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select({ id: projects.id, name: projects.name, mainFile: projects.mainFile, engine: projects.engine, compatibility: projects.compatibility, createdAt: projects.createdAt })
      .from(projects)
      .orderBy(asc(projects.createdAt));
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: string };
    const name = body.name?.trim() || "Nuevo proyecto";

    const [project] = await db.insert(projects).values({ name }).returning();

    // Documento raíz: plantilla base con preámbulo y huecos \input{...}
    const baseSource = `% Plantilla base — ${name}
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

\\title{${name}}
\\author{Taller de edición}
\\date{\\today}

\\begin{document}
\\maketitle

% Incorpora aquí los subdocumentos con \\input{slug}

\\end{document}
`;
    const [base] = await db
      .insert(documents)
      .values({
        projectId: project.id,
        parentId: null,
        slug: "plantilla-base",
        title: name,
        kind: "base",
        source: baseSource,
        words: 0,
        blocks: 0,
      })
      .returning();

    return NextResponse.json({ project, document: base }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
