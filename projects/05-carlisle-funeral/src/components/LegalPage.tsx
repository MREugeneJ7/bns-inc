import { useEffect, useState } from "react";
import { ArrowLeft, MoonStar, Scale, Printer, FileText } from "lucide-react";
import {
  legalMeta,
  legalHolder,
  exponen,
  clauses,
  dispositions,
  closing,
  signatories,
} from "../legal";

function scrollToClause(id: string) {
  document.getElementById(`clausula-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function LegalPage() {
  const [active, setActive] = useState<string>("1");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace("clausula-", ""));
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    clauses.forEach((c) => {
      const el = document.getElementById(`clausula-${c.id}`);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#070709]">
      {/* cabecera mínima */}
      <header className="sticky top-0 z-40 border-b border-[#c9a86a]/15 bg-[#070709]/90 backdrop-blur-xl print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a href="#/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 flex items-center justify-center rounded-full border border-[#c9a86a]/40 bg-gradient-to-br from-[#1a1a22] to-black group-hover:border-[#c9a86a] transition">
              <MoonStar size={18} className="text-[#c9a86a]" />
            </div>
            <div className="font-display text-lg text-[#f4efe3] leading-tight">
              Funeraria <span className="gold-text font-semibold">Carlisle</span>
            </div>
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-xs tracking-[0.12em] uppercase text-stone-300 hover:border-[#c9a86a] hover:text-[#ecd9ab] transition"
            >
              <Printer size={14} /> Imprimir
            </button>
            <a
              href="#/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c9a86a] text-black text-xs tracking-[0.12em] uppercase font-medium hover:bg-[#ecd9ab] transition"
            >
              <ArrowLeft size={14} /> Volver
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 grid lg:grid-cols-[260px_1fr] gap-10">
        {/* índice */}
        <aside className="hidden lg:block print:hidden">
          <nav aria-label="Índice de cláusulas" className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-[#c9a86a] mb-3">
              <FileText size={13} /> Índice
            </div>
            <ol className="flex flex-col gap-0.5 text-[12.5px]">
              {clauses.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => scrollToClause(c.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg transition leading-snug ${
                      active === c.id
                        ? "bg-[#c9a86a]/10 text-[#ecd9ab]"
                        : "text-stone-500 hover:text-stone-200 hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className="font-display text-[11px] text-[#c9a86a]/80 mr-1.5">{c.id}.</span>
                    {c.title}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        {/* documento */}
        <article className="min-w-0 rounded-3xl border border-white/8 bg-[#0d0d11] px-5 py-8 sm:px-10 sm:py-12 print:border-0 print:bg-white print:text-black">
          <div className="flex items-center gap-3 text-[#c9a86a] text-[11px] tracking-[0.3em] uppercase">
            <Scale size={14} /> Documento jurídico · {legalMeta.version}
          </div>
          <h1 className="mt-4 font-display text-2xl sm:text-4xl leading-tight text-[#f4efe3] print:text-black">
            {legalMeta.title}
          </h1>
          <p className="mt-3 text-xs text-stone-500">
            Última actualización: {legalMeta.updated} · {legalMeta.ref}
          </p>

          <div className="hairline my-8" />

          {/* identificación */}
          <h2 className="text-xs tracking-[0.25em] uppercase text-[#c9a86a] mb-4">Datos identificativos del titular</h2>
          <dl className="grid sm:grid-cols-[170px_1fr] gap-x-6 gap-y-2 text-[14px] leading-snug">
            {legalHolder.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-stone-500">{k}</dt>
                <dd className="text-stone-200 print:text-black">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="hairline my-8" />

          <div lang="es" className="font-accent text-[15.5px] leading-[1.5] text-stone-300 text-justify hyphens-auto print:text-black">
            <h2 className="font-display text-lg tracking-[0.2em] uppercase text-center text-[#ecd9ab] print:text-black">Reunidos</h2>
            <p className="mt-3 indent-6">
              De una parte, D. CARLISLE CULLEN, mayor de edad (en un sentido muy amplio del término), con domicilio a
              efectos de notificaciones en el indicado en el encabezamiento, en nombre y representación de FUNERARIA
              CARLISLE, S.L.U. Y de otra, el USUARIO, cliente o tercero que accede al sitio web, cuyos datos de
              identificación se darán por reproducidos a todos los efectos, aunque no los facilite. Ambos se reconocen
              recíprocamente la capacidad legal necesaria para el otorgamiento del presente Texto y, a tal efecto,
            </p>

            <h2 className="mt-8 font-display text-lg tracking-[0.2em] uppercase text-center text-[#ecd9ab] print:text-black">Exponen</h2>
            <div className="mt-3 flex flex-col gap-3">
              {exponen.map((p) => (
                <p key={p} className="indent-6">
                  {p}
                </p>
              ))}
            </div>

            <h2 className="mt-10 font-display text-lg tracking-[0.2em] uppercase text-center text-[#ecd9ab] print:text-black">Cláusulas</h2>

            {clauses.map((c) => (
              <section key={c.id} id={`clausula-${c.id}`} className="mt-8 scroll-mt-24">
                <h3 className="font-display text-[15px] tracking-[0.12em] uppercase text-[#f4efe3] print:text-black">
                  <span className="text-[#c9a86a]">{c.label}.</span> {c.title}.
                </h3>
                <div className="mt-2.5 flex flex-col gap-2.5">
                  {c.paras.map((p, i) => (
                    <p key={i} className={/^[a-i]\) /.test(p) ? "pl-6" : "indent-6"}>
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            <h2 className="mt-12 font-display text-lg tracking-[0.2em] uppercase text-center text-[#ecd9ab] print:text-black">Disposiciones</h2>
            <div className="mt-3 flex flex-col gap-4">
              {dispositions.map((d) => (
                <section key={d.label}>
                  <h3 className="font-display text-[14px] tracking-[0.1em] uppercase text-[#f4efe3] print:text-black">{d.label}.</h3>
                  <p className="mt-1.5 indent-6">{d.text}</p>
                </section>
              ))}
            </div>

            <p className="mt-10 indent-6">{closing}</p>

            <div className="mt-10 grid sm:grid-cols-3 gap-8 text-center not-italic">
              {signatories.map((s) => (
                <div key={s.name}>
                  <div className="h-12 border-b border-stone-600" />
                  <div className="mt-2 font-display text-[14px] text-stone-200 print:text-black">{s.name}</div>
                  <div className="text-[12px] text-stone-500 leading-snug">{s.role}</div>
                </div>
              ))}
            </div>

            <p className="mt-12 text-center text-[12px] text-stone-600">
              — Fin del Texto refundido. Si ha llegado hasta aquí, consulte la Disposición adicional primera. —
            </p>
          </div>

          <div className="mt-10 flex justify-center print:hidden">
            <a
              href="#/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#c9a86a]/40 text-[#ecd9ab] hover:bg-[#c9a86a] hover:text-black transition text-sm"
            >
              <ArrowLeft size={15} /> Volver a la funeraria
            </a>
          </div>
        </article>
      </main>
    </div>
  );
}
