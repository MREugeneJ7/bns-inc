import { useState } from "react";
import { BookOpen, CloudFog, Dices, Feather } from "lucide-react";
import { sisterSites } from "../data";
import { circleLinks, scrollToId } from "./shared";

/* Lo que publica la funeraria frente a lo que él entregó: sale de los mismos datos. */
const me = sisterSites.find((s) => s.id === "strahd");
const censored = me?.bullets[0] ?? "";
const delivered = me?.before?.[0] ?? "";

const books = [
  {
    title: "Tatiana y el Conde",
    from: "#7a1232",
    to: "#1c0610",
    blurb: "Ella iba a casarse con su hermano. Él tenía un castillo, un pacto recién firmado y ningún escrúpulo.",
    first: "Tatiana subió la escalera de caracol con una vela en la mano y ninguna intención de bajar.",
  },
  {
    title: "La niebla no te dejará marchar",
    from: "#3c4d61",
    to: "#0f141b",
    blurb: "Una forastera llega a un valle del que nadie sale. El conde tampoco puede, pero eso no se cuenta hasta el capítulo nueve.",
    first: "La niebla se cerró a su espalda como una puerta, y Tatiana pensó que, para ser una cárcel, tenía un dueño muy bien vestido.",
  },
  {
    title: "Reencarnada (otra vez)",
    from: "#5d2c72",
    to: "#160a1d",
    blurb: "Se llama Ireena. Bueno, se llama Tatiana. El autor insiste y tiene todo el tiempo del mundo.",
    first: "—No me llamo Tatiana —dijo Ireena. El conde sonrió con la paciencia de quien ya ha tenido esta conversación cuatro veces.",
  },
  {
    title: "Cincuenta sombras de Barovia",
    from: "#44403c",
    to: "#0c0b0a",
    blurb: "Tatiana, recién llegada. Él, señor feudal con mazmorra. La mazmorra ya estaba antes.",
    first: "El contrato tenía cuarenta cláusulas y Tatiana firmó sin leer la de la mazmorra.",
  },
  {
    title: "Mi hermano Sergei no la merecía",
    from: "#1f4d3c",
    to: "#07140f",
    blurb: "Autoficción. Tatiana elige mal. El narrador lo explica durante seiscientas páginas.",
    first: "Sergei era bueno, noble y aburrido, y Tatiana tardó trescientas páginas en darse cuenta. Esta vez.",
  },
  {
    title: "No te tires del balcón, Tatiana",
    from: "#7d3d13",
    to: "#1a0c05",
    blurb: "Final alternativo. El autor lo considera el definitivo y no admite discusión.",
    first: "Tatiana se asomó al balcón, miró abajo, miró al conde y, por primera vez en cinco siglos, entró a por una copa.",
  },
];

const roles = [
  "institutriz recién llegada al valle",
  "cartógrafa extraviada en la niebla",
  "hija del burgomaestre",
  "tabernera con carácter",
  "cazadora de vampiros, qué ironía",
  "pero esta vez pelirroja",
  "exactamente igual que la anterior",
];

const tour = [
  { place: "Aldea de Barovia", venue: "Taberna Sangre de la Vid", note: "Aforo: los que quedan.", status: "Confirmada", ok: true },
  { place: "Vallaki", venue: "Festival del Sol Abrasador", note: "Asistencia obligatoria. ¡Todo irá bien!", status: "Confirmada", ok: true },
  { place: "Castillo Ravenloft", venue: "Cena con el autor", note: "El carruaje pasa a recogerle. No es una sugerencia.", status: "Confirmada", ok: true },
  { place: "Madrid", venue: "Feria del Libro", note: "El autor no ha podido cruzar la frontera.", status: "Cancelada por niebla", ok: false },
  { place: "Tenerife", venue: "Presentación con Carmilla", note: "El autor no ha podido cruzar la frontera.", status: "Cancelada por niebla", ok: false },
  { place: "Lugar por determinar", venue: "Reunión con Vecna", note: "Orden del día: el exploit.", status: "Pendiente del exploit", ok: false },
];

const press = [
  {
    text: "Soy su fan número uno. Le llevo una docena de pasteles de sueños a cada firma. Nadie pregunta de qué están hechos y yo no pregunto por qué todas se llaman Tatiana.",
    who: "Morgantha, pastelera · El Viejo Mascahuesos",
  },
  { text: "Otra Tatiana.", who: "Rahadin, chambelán" },
  { text: "Me la leyó entera durante la cena. No había otra salida. Literalmente.", who: "Una invitada al castillo" },
  { text: "Las cartas dicen que tiene que superarlo.", who: "Madam Eva" },
  { text: "Cinco estrellas. Por favor, déjeme salir del valle.", who: "Lector verificado" },
];

const faq = [
  ["¿Por qué todas sus protagonistas se llaman Tatiana?", "Es una firma de la casa. Siguiente pregunta."],
  ["¿Está basada en alguien real?", "No. Y le agradecería que no volviera a preguntarlo en mi castillo."],
  [
    "¿Cuándo firmará fuera de Barovia?",
    "Estoy en negociaciones con los Poderes Oscuros. La niebla, de momento, dice que no. La niebla lleva diciendo que no desde el año 351.",
  ],
  [
    "¿Es cierto que trata con Vecna?",
    "Mi representante estudia con él si existe manera de que yo ejecute su exploit. Consiste en abandonar el plano propio convertido en dios, pero no del todo: lo justo para perforar la niebla y colarse en la Ciudad de las Puertas sin que la doña lo mate por ser un dios. Si eres dios entero, te mata. Si no eres nada, no entras. Vecna encontró el hueco: medio dios, medio inquilino.",
  ],
  [
    "¿Y usted lo entiende?",
    "A la tercera. La primera vez creí que era una metáfora. La segunda, un trámite. A la tercera comprendí que se trata de llegar a la puerta siendo lo bastante dios para empujarla y lo bastante poco dios para que la dueña no te considere competencia. Mi abogado lo llama «la maniobra» y cobra por hora.",
  ],
];

const nav: [string, string][] = [
  ["Novelas", "novelas"],
  ["Tatiana", "tatiana"],
  ["Gira", "gira"],
  ["Prensa", "prensa"],
];

const kicker = "font-body text-xs tracking-[0.3em] uppercase text-[#d9b676]";
const h2 = "mt-3 text-4xl sm:text-5xl font-semibold italic leading-tight text-[#f7ead8]";

export function StrahdSite() {
  const [open, setOpen] = useState<number | null>(0);
  const [tries, setTries] = useState(0);
  const [mail, setMail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const links = circleLinks("strahd");
  const role = roles[tries % roles.length];

  return (
    <div className="min-h-screen bg-[#14070d] text-[#f3e6d3] font-accent text-[19px] leading-relaxed antialiased">
      <button
        onClick={() => scrollToId("circulo")}
        className="block w-full border-b border-[#d9b676]/30 bg-[#200c15] px-4 py-2 text-center font-body text-xs tracking-[0.2em] uppercase text-[#d9b676] hover:text-[#f7ead8] transition"
      >
        Miembro provisional del Círculo de ex-vampiros · <span className="underline underline-offset-4">ver el Círculo</span>
      </button>

      <header className="sticky top-0 z-30 border-b border-[#d9b676]/20 bg-[#14070d]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-[68px] flex items-center justify-between gap-4">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3 text-left">
            <span className="font-script text-4xl leading-none text-[#f7ead8]">Strahd</span>
            <span className="hidden sm:block font-body text-[10px] tracking-[0.25em] uppercase text-[#b89e93] leading-tight">
              Firma
              <br />
              de la Casa
            </span>
            <span className="rounded border border-[#e0527a] px-1.5 py-0.5 font-body text-xs font-bold text-[#f08aa6]">+18</span>
          </button>
          <nav className="hidden md:flex items-center gap-7 text-lg italic">
            {nav.map(([text, id]) => (
              <button key={id} onClick={() => scrollToId(id)} className="hover:text-[#f08aa6] transition">
                {text}
              </button>
            ))}
          </nav>
          <button
            onClick={() => scrollToId("capitulo")}
            className="shrink-0 whitespace-nowrap border border-[#d9b676] px-3 sm:px-5 py-2 font-body text-xs tracking-[0.12em] sm:tracking-[0.18em] uppercase text-[#d9b676] hover:bg-[#d9b676] hover:text-[#14070d] transition"
          >
            Capítulo gratis
          </button>
        </div>
      </header>

      {/* portada */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-[520px] w-[520px] rounded-full bg-[#5a1030]/40 blur-[130px]" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-5 py-14 lg:py-20 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
          <div>
            <p className={kicker}>Novela erótica gótica · Sin ningún disimulo</p>
            <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl font-semibold italic leading-[1.02] text-[#f7ead8]">
              Yo soy el Antiguo. Yo soy la Tierra. Y ahora, además, escribo.
            </h1>
            <p className="mt-6 max-w-xl text-xl">
              Conde Strahd von Zarovich, señor de Barovia y autor de catorce novelas eróticas. Catorce heroínas
              distintas. Las catorce se llaman Tatiana.
            </p>
            <p className="mt-6 font-script text-6xl text-[#e0527a] leading-none">Strahd</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 font-body text-sm tracking-[0.16em] uppercase">
              <button
                onClick={() => scrollToId("novelas")}
                className="bg-[#9c1f45] px-7 py-4 font-semibold text-[#fbeee0] hover:bg-[#b3264f] transition"
              >
                Ver las novelas
              </button>
              <button
                onClick={() => scrollToId("tatiana")}
                className="border border-[#f3e6d3]/60 px-7 py-4 hover:border-[#f08aa6] hover:text-[#f08aa6] transition"
              >
                Conocer a Tatiana
              </button>
            </div>
          </div>

          <figure className="mx-auto w-full max-w-sm">
            <div className="rounded-t-full border border-[#d9b676]/60 p-2">
              <img
                src="./images/sites/strahd.jpg"
                alt="Escritorio del autor: pluma, tintero, una pila de manuscritos, una rosa y una copa, con la niebla al otro lado del ventanal"
                className="w-full aspect-[3/4] rounded-t-full object-cover bg-[#200c15]"
              />
            </div>
            <figcaption className="mt-3 text-center text-base italic text-[#b89e93]">
              Mi escritorio. La niebla del fondo no es decorativa.
            </figcaption>
          </figure>
        </div>

        <dl className="relative max-w-6xl mx-auto px-5 pb-14 grid grid-cols-3 gap-4 text-center">
          {[
            ["14", "novelas"],
            ["14", "Tatianas"],
            ["0", "firmas fuera de Barovia"],
          ].map(([n, t]) => (
            <div key={t} className="border-t border-[#d9b676]/40 pt-4">
              <dd className="text-5xl font-semibold text-[#d9b676]">{n}</dd>
              <dt className="font-body text-xs tracking-[0.2em] uppercase text-[#b89e93] mt-1">{t}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* nota sobre la censura */}
      {censored && delivered && (
        <section className="border-y border-[#d9b676]/20 bg-[#200c15]">
          <div className="max-w-4xl mx-auto px-5 py-10">
            <p className={kicker}>Nota del autor</p>
            <p className="mt-3 text-xl">
              En la web de la funeraria mi obra figura como{" "}
              <span className="line-through decoration-[#e0527a] text-[#b89e93]">«{censored}»</span>. Yo entregué:{" "}
              <strong className="text-[#f7ead8]">«{delivered}»</strong>. Lo cambió una señora llamada Esme, con muy buena
              letra. En mi casa mando yo.
            </p>
          </div>
        </section>
      )}

      {/* novelas */}
      <section id="novelas" className="scroll-mt-24">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <p className={kicker}>Catálogo</p>
          <h2 className={h2}>Las novelas</h2>
          <p className="mt-3 max-w-2xl text-xl">Seis de las catorce. Las otras ocho son estas mismas, con otro vestido.</p>

          <div className="mt-10 grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
            {books.map((b, i) => (
              <article key={b.title} className="flex flex-col">
                <div
                  className="relative aspect-[2/3] overflow-hidden rounded-md border border-[#d9b676]/30 shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
                  style={{ background: `linear-gradient(160deg, ${b.from}, ${b.to})` }}
                >
                  <div className="absolute inset-2 rounded-sm border border-[#d9b676]/40" aria-hidden />
                  <div className="absolute inset-0 flex flex-col items-center justify-between p-5 sm:p-7 text-center">
                    <span className="font-body text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-[#d9b676]">Strahd von Zarovich</span>
                    <span className="font-script text-[26px] sm:text-4xl leading-[1.05] text-[#f7ead8]">{b.title}</span>
                    <span className="font-body text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-[#f3e6d3]/85">Con Tatiana</span>
                  </div>
                </div>
                <h3 className="mt-4 text-2xl font-semibold italic leading-tight text-[#f7ead8]">{b.title}</h3>
                <p className="mt-2 text-lg leading-snug">{b.blurb}</p>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  className="mt-3 inline-flex items-center gap-2 self-start font-body text-xs tracking-[0.16em] uppercase text-[#f08aa6] underline underline-offset-4 hover:text-[#ffb3c6]"
                >
                  <BookOpen size={14} /> {open === i ? "Cerrar" : "Leer la primera frase"}
                </button>
                {open === i && (
                  <blockquote className="mt-3 border-l-2 border-[#e0527a] pl-4 text-lg italic text-[#f7ead8]">«{b.first}»</blockquote>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* tatiana */}
      <section id="tatiana" className="scroll-mt-24 border-y border-[#d9b676]/20 bg-[#200c15]">
        <div className="max-w-4xl mx-auto px-5 py-16 text-center">
          <p className={kicker}>La firma de la casa</p>
          <h2 className={h2}>Generador de protagonistas</h2>
          <p className="mt-4 text-xl max-w-2xl mx-auto">
            No es falta de imaginación. Es coherencia. Pruebe usted a generar la heroína de mi próxima novela.
          </p>

          <div className="mt-8 rounded-md border border-[#d9b676]/40 bg-[#14070d] px-6 py-10" aria-live="polite">
            <p className="font-script text-7xl sm:text-8xl leading-none text-[#e0527a]">Tatiana</p>
            <p className="mt-4 text-2xl italic text-[#f7ead8]">{tries === 0 ? "pulse el botón, por favor" : role}</p>
          </div>

          <button
            onClick={() => setTries((t) => t + 1)}
            className="mt-6 inline-flex items-center gap-3 bg-[#9c1f45] px-7 py-4 font-body text-sm font-semibold tracking-[0.16em] uppercase text-[#fbeee0] hover:bg-[#b3264f] transition"
          >
            <Dices size={18} /> Generar protagonista
          </button>
          <p className="mt-4 font-body text-sm text-[#b89e93]">
            Intentos: {tries} · Resultados que no eran Tatiana: 0
          </p>
        </div>
      </section>

      {/* gira */}
      <section id="gira" className="scroll-mt-24">
        <div className="max-w-5xl mx-auto px-5 py-16">
          <p className={kicker}>Gira de firmas</p>
          <h2 className={h2}>Dónde encontrarme</h2>
          <p className="mt-3 text-xl">En Barovia. La respuesta corta es: en Barovia.</p>
          <ul className="mt-8 border-b border-[#d9b676]/25">
            {tour.map((t) => (
              <li key={t.place + t.venue} className="grid sm:grid-cols-[1fr_auto] gap-x-6 gap-y-2 border-t border-[#d9b676]/25 py-5">
                <div>
                  <p className="text-2xl font-semibold italic text-[#f7ead8]">
                    {t.place} <span className="font-normal text-[#b89e93]">· {t.venue}</span>
                  </p>
                  <p className="text-lg">{t.note}</p>
                </div>
                <p
                  className={`self-center justify-self-start sm:justify-self-end inline-flex items-center gap-2 border px-3 py-1.5 font-body text-xs tracking-[0.14em] uppercase ${
                    t.ok ? "border-[#d9b676]/60 text-[#d9b676]" : "border-[#e0527a]/60 text-[#f08aa6]"
                  }`}
                >
                  {!t.ok && <CloudFog size={14} />}
                  {t.status}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* el exploit, explicado */}
      <section className="border-y border-[#d9b676]/20 bg-[#200c15]">
        <div className="max-w-4xl mx-auto px-5 py-14">
          <p className={kicker}>Nota al pie · con la venia del departamento jurídico</p>
          <h2 className={h2}>El exploit de Vecna, en cuatro pasos</h2>
          <p className="mt-3 max-w-2xl text-xl">
            Como veo que no soy el único que no lo entendía a la primera, lo expongo por escrito. Me lo explicó mi
            abogado, que cobra por hora y por eso tardó dos.
          </p>

          <ol className="mt-8 flex flex-col gap-5">
            {[
              {
                n: "Uno",
                t: "Salir del plano propio",
                d: "Del tuyo, no de este. Este es el de la niebla y no se puede, precisamente.",
              },
              {
                n: "Dos",
                t: "Convertirse en dios, pero a medias",
                d: "Ahí está el truco. Dios entero y la doña te mata en la puerta. Criatura corriente y la puerta ni se abre. Vecna se quedó en el término medio: lo bastante divino para atravesar la niebla, lo bastante poco para no parecer competencia.",
              },
              {
                n: "Tres",
                t: "Perforar la niebla",
                d: "Sin cerrar el plano al salir. Es el detalle que a mí se me atragantó tres tardes y a él le costó un milenio.",
              },
              {
                n: "Cuatro",
                t: "Entrar en la Ciudad de las Puertas sin morir",
                d: "La dueña del sitio no tolera dioses, por motivos que comprendo: son malos vecinos. Si entras como dios entero, te elimina. Si entras con la divinidad a medio terminar, te deja pasar y ni te mira.",
              },
            ].map((s) => (
              <li key={s.n} className="grid sm:grid-cols-[90px_1fr] gap-x-6 gap-y-1 border-t border-[#d9b676]/25 pt-4">
                <span className={kicker}>{s.n}</span>
                <div>
                  <h3 className="text-2xl font-semibold italic text-[#f7ead8]">{s.t}</h3>
                  <p className="mt-1 text-lg">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>

          <blockquote className="mt-8 border-l-2 border-[#e0527a] pl-5">
            <p className="text-2xl italic text-[#f7ead8]">
              «Ya lo entiendo. Sigo sin verle el negocio: entrar en una ciudad gobernada por una señora que mata dioses,
              con mi niebla al otro lado y el pasaporte caducado desde el año 351.»
            </p>
            <footer className="mt-2 font-body text-sm text-[#b89e93]">— Strahd von Zarovich, autor y aspirante a turista</footer>
          </blockquote>
        </div>
      </section>

      {/* prensa */}
      <section id="prensa" className="scroll-mt-24 border-y border-[#d9b676]/20 bg-[#200c15]">
        <div className="max-w-6xl mx-auto px-5 py-16 grid lg:grid-cols-2 gap-12">
          <div>
            <p className={kicker}>La crítica ha dicho</p>
            <h2 className={h2}>Prensa</h2>
            <div className="mt-8 flex flex-col gap-6">
              {press.map((p) => (
                <figure key={p.who} className="border-l-2 border-[#d9b676]/60 pl-5">
                  <blockquote className="text-2xl italic text-[#f7ead8]">«{p.text}»</blockquote>
                  <figcaption className="mt-1 font-body text-sm text-[#b89e93]">{p.who}</figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div>
            <p className={kicker}>Preguntas de los periodistas</p>
            <h2 className={h2}>El autor responde</h2>
            <dl className="mt-8 flex flex-col gap-6">
              {faq.map(([q, a]) => (
                <div key={q}>
                  <dt className="text-xl font-semibold text-[#f7ead8]">{q}</dt>
                  <dd className="mt-1 text-lg">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* capítulo gratis */}
      <section id="capitulo" className="scroll-mt-24">
        <div className="max-w-3xl mx-auto px-5 py-16 text-center">
          <Feather size={30} className="mx-auto text-[#d9b676]" />
          <h2 className={h2}>Un capítulo cada luna llena</h2>
          <p className="mt-3 text-xl">El primero es gratis. Tatiana también sale en ese.</p>
          {subscribed ? (
            <p role="status" className="mt-8 border border-[#d9b676]/50 bg-[#200c15] px-6 py-6 text-xl italic text-[#f7ead8]">
              Suscripción anotada. No podrá darse de baja. Yo tampoco puedo salir de aquí: estamos en paz.
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubscribed(true);
              }}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <label className="flex-1">
                <span className="sr-only">Correo electrónico</span>
                <input
                  required
                  type="email"
                  value={mail}
                  onChange={(e) => setMail(e.target.value)}
                  placeholder="su.correo@fuera-de-barovia.es"
                  className="w-full border border-[#d9b676]/50 bg-[#200c15] px-5 py-4 font-body text-base text-[#f7ead8] placeholder:text-[#9a827a] focus:border-[#e0527a] focus:outline-none"
                />
              </label>
              <button className="bg-[#9c1f45] px-7 py-4 font-body text-sm font-semibold tracking-[0.16em] uppercase text-[#fbeee0] hover:bg-[#b3264f] transition">
                Suscribirme
              </button>
            </form>
          )}
        </div>
      </section>

      {/* pie */}
      <footer id="circulo" className="scroll-mt-24 border-t border-[#d9b676]/25 bg-[#0d0408]">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <p className={kicker}>Círculo de ex-vampiros</p>
          <p className="mt-3 text-xl max-w-2xl">
            Me han admitido de forma provisional. Ellos pueden salir de sus casas. No lo digo con rencor.
          </p>
          <ul className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-px border border-[#d9b676]/25 bg-[#d9b676]/25">
            {links.map((l) => (
              <li key={l.href} className="bg-[#0d0408]">
                <a href={l.href} className="flex h-full flex-col px-5 py-4 hover:bg-[#200c15] transition">
                  <span className="text-xl font-semibold italic text-[#f7ead8]">{l.label}</span>
                  <span className="font-body text-sm text-[#b89e93]">{l.domain}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-10 font-body text-sm leading-relaxed text-[#b89e93] max-w-3xl">
            Firma de la Casa · Castillo Ravenloft, ala este, Barovia. Contenido para mayores de 18 años. Parodia sin
            ánimo de lucro inspirada en el escenario de Ravenloft de Dungeons &amp; Dragons. Estas novelas no existen,
            por suerte para Tatiana.
          </p>
        </div>
      </footer>
    </div>
  );
}
