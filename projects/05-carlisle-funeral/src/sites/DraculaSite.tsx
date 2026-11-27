import { useState } from "react";
import { ArrowRight, Check, Flame, Gavel, HeartPulse, Home, Scale, Ship, Skull, type LucideIcon } from "lucide-react";
import { circleLinks, scrollToId } from "./shared";

const eur = (n: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

type Policy = { id: string; num: string; icon: LucideIcon; name: string; base: number; text: string };

const policies: Policy[] = [
  {
    id: "decesos",
    num: "I",
    icon: Skull,
    name: "Decesos Eterno",
    base: 9,
    text: "Sin fecha de vencimiento, como el tomador. Incluye velatorio nocturno en Funeraria Carlisle y traslado en coche de caballos.",
  },
  {
    id: "hogar",
    num: "II",
    icon: Home,
    name: "Hogar Anti-Ajo y Anti-Cruces",
    base: 14,
    text: "Cubre ristras en las ventanas, crucifijos sobrevenidos, agua bendita por filtración y visitas que entran sin haber sido invitadas.",
  },
  {
    id: "accidentes",
    num: "III",
    icon: Flame,
    name: "Accidentes: Estaca, Sol y Turba",
    base: 21,
    text: "Estaca de fresno o de roble, exposición solar accidental y turba con antorchas. Las horquillas se contratan en anexo.",
  },
  {
    id: "transporte",
    num: "IV",
    icon: Ship,
    name: "Transporte de Tierra Natal",
    base: 30,
    text: "Cincuenta cajas de tierra, puerta a puerta. Nos avala la experiencia propia en la ruta Varna–Whitby. La tripulación no está incluida.",
  },
  {
    id: "rc",
    num: "V",
    icon: Scale,
    name: "Responsabilidad Civil por Mordedura",
    base: 26,
    text: "Para quien lo ha dejado y, aun así, tuvo un mal día. Defensa jurídica incluida. No se formulan preguntas.",
  },
  {
    id: "vida",
    num: "VI",
    icon: HeartPulse,
    name: "Vida, en sentido amplio",
    base: 18,
    text: "Capital garantizado a trescientos años. Beneficiario habitual: usted mismo, más adelante.",
  },
];

const factors = [
  { id: "iglesia", label: "Reside a menos de 200 metros de una iglesia", pct: 20 },
  { id: "holandes", label: "Le sigue un profesor holandés con maletín", pct: 35 },
  { id: "sol", label: "Sale de casa en horas de sol", pct: 25 },
  { id: "tierra", label: "Duerme sobre tierra natal, en caja cerrada", pct: -10 },
  { id: "invita", label: "Jamás invita a nadie a entrar", pct: -5 },
];

const claims = [
  {
    year: "1897",
    place: "Paso del Borgo",
    what: "Cuchillo kukri al cuello y bowie al corazón. Ninguna estaca reglamentaria.",
    result: "No lo mataron bien del todo. Indemnizado.",
  },
  {
    year: "1922",
    place: "Wisborg",
    what: "Plagio integral de la persona del Conde por un tal Orlok.",
    result: "Sentencia favorable en 1925. Continúa en ejecución.",
  },
  {
    year: "1958",
    place: "Biblioteca del castillo",
    what: "Exposición solar por apertura dolosa de cortinas.",
    result: "Reducido a cenizas. Reconstituido para la secuela.",
  },
  {
    year: "2024",
    place: "Madrid",
    what: "Reproche en una sobremesa: «pero tú eres vampiro».",
    result: "4.000 folios remitidos. La contraparte se mudó de país.",
  },
];

const nav: [string, string][] = [
  ["Pólizas", "polizas"],
  ["Calculadora", "calculadora"],
  ["Siniestros", "siniestros"],
  ["Litigios", "litigios"],
];

const kicker = "text-[11px] tracking-[0.28em] uppercase text-[#7d6124]";
const h2 = "mt-3 font-cinzel text-3xl sm:text-4xl font-semibold leading-tight";

export function DraculaSite() {
  const [policy, setPolicy] = useState("decesos");
  const [on, setOn] = useState<string[]>(["holandes"]);
  const [carlisle, setCarlisle] = useState(true);
  const [sent, setSent] = useState(false);

  const links = circleLinks("dracula");
  const sel = policies.find((p) => p.id === policy) ?? policies[0];
  const load = factors.filter((f) => on.includes(f.id)).reduce((a, f) => a + f.pct, 0);
  const gross = sel.base * (1 + load / 100);
  const premium = carlisle ? gross * 0.85 : gross;
  const verdict =
    load >= 50
      ? "Elevado. Le sugerimos mudarse."
      : load >= 20
        ? "Moderado. Vigile las ventanas."
        : load < 0
          ? "Bajo. Se nota la experiencia."
          : "Aceptable, para lo que hemos visto.";

  const choose = (id: string) => {
    setSent(false);
    setPolicy(id);
  };
  const toggle = (id: string) => {
    setSent(false);
    setOn((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };
  const quote = (id: string) => {
    choose(id);
    scrollToId("calculadora");
  };

  return (
    <div className="light-ui min-h-screen bg-[#f4eee2] text-[#1d1517] font-plex antialiased">
      {/* barra superior */}
      <div className="bg-[#7a1420] text-[#f4eee2]">
        <div className="max-w-6xl mx-auto px-5 py-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-[11px] tracking-[0.14em] uppercase">
          <span>Mediador colegiado · Clave J-1897</span>
          <button
            onClick={() => scrollToId("circulo")}
            className="uppercase tracking-[0.14em] underline underline-offset-4 decoration-[#f4eee2]/50 hover:decoration-[#f4eee2]"
          >
            Miembro del Círculo de ex-vampiros
          </button>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-[#d9cdb8] bg-[#f4eee2]/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-5 h-[72px] flex items-center justify-between gap-4">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3 text-left">
            <span className="h-11 w-11 shrink-0 grid place-items-center border-2 border-[#7a1420] text-[#7a1420] font-cinzel text-xl font-bold">
              D
            </span>
            <span>
              <span className="block font-cinzel text-lg font-semibold tracking-[0.18em] leading-none">DRÁCULA</span>
              <span className="block text-[10px] tracking-[0.2em] uppercase text-[#5b4f4a] mt-1.5">Correduría de Seguros</span>
            </span>
          </button>
          <nav className="hidden md:flex items-center gap-7 text-[14px] text-[#3a2f2c]">
            {nav.map(([text, id]) => (
              <button key={id} onClick={() => scrollToId(id)} className="underline-offset-4 hover:text-[#7a1420] hover:underline">
                {text}
              </button>
            ))}
          </nav>
          <button
            onClick={() => scrollToId("calculadora")}
            className="shrink-0 px-5 py-2.5 bg-[#7a1420] text-[#f4eee2] text-[12px] tracking-[0.14em] uppercase hover:bg-[#5c0d17] transition"
          >
            Cotizar
          </button>
        </div>
      </header>

      {/* portada */}
      <section className="border-b border-[#d9cdb8]">
        <div className="max-w-6xl mx-auto px-5 py-14 lg:py-20 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
          <div>
            <p className={kicker}>Casa fundada en 1897 · Transilvania, Londres, Madrid</p>
            <h1 className="mt-5 font-cinzel text-4xl sm:text-5xl lg:text-[54px] leading-[1.1] font-semibold">
              Cinco siglos evitando riesgos. Ahora evitamos los suyos.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[#3a2f2c]">
              Al frente de esta casa está el Conde Drácula en persona. En 1897 lo dieron por muerto y resultó que no lo
              habían matado bien del todo. Desde entonces sabe, con precisión, en qué punto falla un plan. Esa
              experiencia está hoy a disposición de usted.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => scrollToId("calculadora")}
                className="inline-flex items-center justify-center gap-3 px-7 py-4 bg-[#7a1420] text-[#f4eee2] text-[13px] tracking-[0.14em] uppercase hover:bg-[#5c0d17] transition"
              >
                Calcular mi prima <ArrowRight size={16} />
              </button>
              <button
                onClick={() => scrollToId("polizas")}
                className="inline-flex items-center justify-center px-7 py-4 border border-[#1d1517] text-[13px] tracking-[0.14em] uppercase hover:bg-[#1d1517] hover:text-[#f4eee2] transition"
              >
                Consultar pólizas
              </button>
            </div>
            <p className="mt-6 font-cinzel text-sm text-[#5b4f4a]">«Entre libremente y por su propia voluntad.»</p>
          </div>

          <figure>
            <div className="border border-[#a8853f] p-2 bg-[#fbf8f1]">
              <img
                src="./images/sites/dracula.jpg"
                alt="Despacho de la correduría: escritorio con expedientes lacrados, archivadores y cortinas de terciopelo echadas"
                className="w-full aspect-[4/5] object-cover bg-[#2a1215]"
              />
            </div>
            <figcaption className="mt-3 text-xs leading-relaxed text-[#5b4f4a]">
              Despacho del Conde. Las cortinas permanecen cerradas por política de prevención de riesgos laborales.
            </figcaption>
          </figure>
        </div>

        <dl className="max-w-6xl mx-auto px-5 pb-14 grid sm:grid-cols-3 gap-6">
          {[
            ["1897", "Año de fundación y de defunción provisional"],
            ["0", "Siniestros propios con resultado definitivo"],
            ["4.000", "Folios por trimestre que despacha nuestro departamento jurídico"],
          ].map(([n, t]) => (
            <div key={t} className="border-t-2 border-[#7a1420] pt-4">
              <dd className="font-cinzel text-4xl font-semibold text-[#7a1420]">{n}</dd>
              <dt className="mt-1 text-sm text-[#3a2f2c]">{t}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* pólizas */}
      <section id="polizas" className="scroll-mt-24">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <p className={kicker}>Catálogo de pólizas</p>
          <h2 className={h2}>Seis coberturas. Las seis, probadas en carne propia.</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {policies.map((p) => (
              <article key={p.id} className="flex flex-col border border-[#d9cdb8] bg-[#fbf8f1] p-6">
                <div className="flex items-center justify-between text-[#7a1420]">
                  <p.icon size={22} strokeWidth={1.5} />
                  <span className="font-cinzel text-sm tracking-[0.2em]">{p.num}</span>
                </div>
                <h3 className="mt-5 font-cinzel text-xl font-semibold leading-snug">{p.name}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[#3a2f2c]">{p.text}</p>
                <div className="mt-auto pt-6 flex items-end justify-between gap-3">
                  <span className="text-sm text-[#5b4f4a]">
                    Desde <strong className="text-lg font-semibold text-[#1d1517]">{p.base} €</strong> al mes
                  </span>
                  <button
                    onClick={() => quote(p.id)}
                    className="text-[12px] tracking-[0.14em] uppercase text-[#7a1420] underline underline-offset-4 hover:text-[#5c0d17]"
                  >
                    Cotizar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* calculadora */}
      <section id="calculadora" className="scroll-mt-24 bg-[#ebe3d3] border-y border-[#d9cdb8]">
        <div className="max-w-6xl mx-auto px-5 py-16 grid lg:grid-cols-[1.2fr_0.8fr] gap-10">
          <div>
            <p className={kicker}>Calculadora de prima</p>
            <h2 className={h2}>Díganos cómo vive y le diremos cuánto le cuesta.</h2>

            <fieldset className="mt-8">
              <legend className={kicker}>1 · Póliza</legend>
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                {policies.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={policy === p.id}
                    onClick={() => choose(p.id)}
                    className={`text-left px-4 py-3 border text-[15px] transition ${
                      policy === p.id
                        ? "border-[#7a1420] bg-[#7a1420] text-[#f4eee2]"
                        : "border-[#cfc2aa] bg-[#fbf8f1] hover:border-[#7a1420]"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-8">
              <legend className={kicker}>2 · Circunstancias del tomador</legend>
              <div className="mt-2">
                {factors.map((f) => (
                  <label key={f.id} className="flex items-start gap-3 py-3 border-b border-[#cfc2aa] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={on.includes(f.id)}
                      onChange={() => toggle(f.id)}
                      className="mt-1 h-4 w-4 accent-[#7a1420]"
                    />
                    <span className="flex-1 text-[15px]">{f.label}</span>
                    <span className={`text-sm tabular-nums ${f.pct > 0 ? "text-[#7a1420]" : "text-[#2c6338]"}`}>
                      {f.pct > 0 ? "+" : "−"}
                      {Math.abs(f.pct)} %
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-8">
              <legend className={kicker}>3 · Bonificaciones</legend>
              <label className="mt-2 flex items-start gap-3 py-3 border-b border-[#cfc2aa] cursor-pointer">
                <input
                  type="checkbox"
                  checked={carlisle}
                  onChange={() => {
                    setSent(false);
                    setCarlisle((v) => !v);
                  }}
                  className="mt-1 h-4 w-4 accent-[#7a1420]"
                />
                <span className="flex-1 text-[15px]">Soy cliente de Funeraria Carlisle</span>
                <span className="text-sm tabular-nums text-[#2c6338]">−15 %</span>
              </label>
            </fieldset>
          </div>

          <aside className="self-start lg:sticky lg:top-28 bg-[#7a1420] text-[#f4eee2] p-7">
            <p className="text-[11px] tracking-[0.25em] uppercase text-[#f4eee2]/80">Prima mensual estimada</p>
            <p className="mt-2 font-cinzel text-5xl font-semibold tabular-nums">{eur(premium)}</p>
            <p className="mt-2 text-sm text-[#f4eee2]/85">{sel.name}</p>

            <dl className="mt-6 text-sm border-y border-[#f4eee2]/25 divide-y divide-[#f4eee2]/25">
              <div className="flex justify-between gap-4 py-2.5">
                <dt>Prima base</dt>
                <dd className="tabular-nums">{eur(sel.base)}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt>Recargos y descuentos</dt>
                <dd className="tabular-nums">
                  {load >= 0 ? "+" : "−"}
                  {Math.abs(load)} %
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt>Bonificación del Círculo</dt>
                <dd>{carlisle ? "−15 %" : "No aplicada"}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="shrink-0">Riesgo apreciado</dt>
                <dd className="text-right">{verdict}</dd>
              </div>
            </dl>

            <button
              onClick={() => setSent(true)}
              className="mt-6 w-full bg-[#f4eee2] text-[#7a1420] py-3.5 text-[12px] tracking-[0.16em] uppercase font-semibold hover:bg-white transition"
            >
              Solicitar esta póliza
            </button>
            {sent && (
              <p role="status" className="mt-4 text-sm leading-relaxed">
                Solicitud registrada. No hace falta que nos facilite su dirección: iremos nosotros. Eso sí, tendrá que
                invitarnos a pasar.
              </p>
            )}
            <p className="mt-4 text-xs leading-relaxed text-[#f4eee2]/75">
              Cálculo orientativo. La prima definitiva la fija el Conde tras mirarle a usted a los ojos.
            </p>
          </aside>
        </div>
      </section>

      {/* siniestros */}
      <section id="siniestros" className="scroll-mt-24">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <p className={kicker}>Historial de siniestros</p>
          <h2 className={h2}>Hemos sido el siniestro. Sabemos tramitarlo.</h2>
          <div className="mt-10 border-b border-[#d9cdb8]">
            <div className="hidden md:grid grid-cols-[80px_190px_1fr_1fr] gap-6 pb-3 text-[11px] tracking-[0.2em] uppercase text-[#7d6124]">
              <span>Año</span>
              <span>Lugar</span>
              <span>Siniestro</span>
              <span>Resolución</span>
            </div>
            {claims.map((c) => (
              <div key={c.year} className="grid md:grid-cols-[80px_190px_1fr_1fr] gap-x-6 gap-y-1 py-5 border-t border-[#d9cdb8]">
                <span className="font-cinzel text-xl font-semibold text-[#7a1420]">{c.year}</span>
                <span className="text-sm text-[#5b4f4a] md:pt-1">{c.place}</span>
                <span className="text-[15px] leading-relaxed">{c.what}</span>
                <span className="text-[15px] leading-relaxed font-medium">{c.result}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* litigios */}
      <section id="litigios" className="scroll-mt-24 bg-[#2d090e] text-[#f4eee2]">
        <div className="max-w-6xl mx-auto px-5 py-16 grid lg:grid-cols-[1.1fr_0.9fr] gap-12">
          <div>
            <p className="flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase text-[#d9b676]">
              <Gavel size={14} /> Departamento de Litigios
            </p>
            <h2 className="mt-3 font-cinzel text-3xl sm:text-4xl font-semibold leading-tight">
              Empapelamos hasta la muerte. La suya, se entiende.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-[#f4eee2]/85 max-w-xl">
              Esta casa asume la defensa de todos los miembros del Círculo frente a cualquier reproche por razón de
              Estirpe. Un comentario sobre el ajo durante una cena basta para abrir expediente.
            </p>
            <ul className="mt-6 flex flex-col gap-3 text-[15px]">
              {[
                "Burofax en menos de veinticuatro horas, entregado en mano y de noche",
                "Recursos en todas las instancias, incluidas las que no existen",
                "Costas a cargo del reprochante, con tres siglos de intereses compuestos",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <Check size={16} className="mt-1 shrink-0 text-[#d9b676]" />
                  {t}
                </li>
              ))}
            </ul>
            <a
              href="mailto:litigios@seguros-dracula.es?subject=Deseo%20denunciar%20un%20reproche"
              className="mt-8 inline-flex items-center gap-3 px-7 py-4 bg-[#f4eee2] text-[#7a1420] text-[13px] tracking-[0.14em] uppercase font-semibold hover:bg-white transition"
            >
              Denunciar un reproche <ArrowRight size={16} />
            </a>
          </div>

          <div className="flex flex-col gap-5">
            <div className="border border-[#f4eee2]/25 p-6">
              <p className="text-[11px] tracking-[0.25em] uppercase text-[#d9b676]">Sobre el Sr. Orlok</p>
              <p className="mt-3 text-[15px] leading-relaxed text-[#f4eee2]/90">
                Esta casa no hace comentarios sobre el Sr. Orlok. Los hacen nuestros abogados, por escrito y sin
                interrupción, desde 1922.
              </p>
            </div>
            <div className="border border-[#f4eee2]/25 p-6">
              <p className="text-[11px] tracking-[0.25em] uppercase text-[#d9b676]">Atención al cliente</p>
              <p className="mt-3 text-[15px] leading-relaxed text-[#f4eee2]/90">
                Le atenderá el Sr. Renfield, nuestro agente más entregado. Es puntual y conoce todos los expedientes. Si
                lo ve comer algo en el mostrador, le rogamos que no pregunte.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* pie */}
      <footer id="circulo" className="scroll-mt-24 bg-[#1d1517] text-[#d9cdb8]">
        <div className="max-w-6xl mx-auto px-5 py-14 grid md:grid-cols-[1fr_1.2fr] gap-10">
          <div>
            <p className="font-cinzel text-lg tracking-[0.18em] text-[#f4eee2]">DRÁCULA</p>
            <p className="mt-1 text-[11px] tracking-[0.22em] uppercase">Correduría de Seguros</p>
            <p className="mt-5 text-sm leading-relaxed max-w-sm">
              Transilvania 1897, 3.º izquierda. Centralita: 1897, extensión única. Horario de oficina: del ocaso al
              alba, festivos incluidos.
            </p>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.28em] uppercase text-[#d9b676]">Círculo de ex-vampiros</p>
            <p className="mt-2 text-sm leading-relaxed">
              Esta casa pertenece al Círculo y responde jurídicamente por todos sus miembros.
            </p>
            <ul className="mt-4 border-y border-[#f4eee2]/15 divide-y divide-[#f4eee2]/15">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="group flex items-center justify-between gap-4 py-3 hover:text-[#f4eee2]">
                    <span className="font-cinzel tracking-[0.06em]">{l.label}</span>
                    <span className="text-xs text-[#d9cdb8]/75 group-hover:text-[#f4eee2]">{l.domain} →</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-[#f4eee2]/15">
          <p className="max-w-6xl mx-auto px-5 py-5 text-xs leading-relaxed text-[#d9cdb8]/75">
            © 1897–2026 Correduría de Seguros Drácula. Parodia sin ánimo de lucro inspirada en «Drácula», de Bram Stoker.
            Ninguna póliza de esta página existe ni puede contratarse.
          </p>
        </div>
      </footer>
    </div>
  );
}
