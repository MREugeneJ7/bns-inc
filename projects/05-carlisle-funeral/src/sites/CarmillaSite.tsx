import { useState } from "react";
import { Check, Clock, EyeOff, MapPin, Star } from "lucide-react";
import { sisterSites } from "../data";
import { circleLinks, scrollToId } from "./shared";

/* Lo que publica la funeraria (maquillado) frente a lo que ella entregó: sale de los mismos datos. */
const me = sisterSites.find((s) => s.id === "carmilla");
const translation = (me?.bullets ?? []).map((censored, i) => ({ censored, plain: me?.before?.[i] ?? censored }));

const services = [
  {
    id: "clasico",
    name: "El Clásico",
    time: "60 min",
    price: 70,
    text: "Masaje relajante con final feliz. El de toda la vida. Y yo llevo unas cuantas.",
  },
  {
    id: "estiria",
    name: "El Estiria",
    time: "90 min",
    price: 100,
    text: "Como el clásico, pero sin mirar el reloj. Receta de la casa desde 1872.",
  },
  {
    id: "cuatro",
    name: "A cuatro manos",
    time: "60 min",
    price: 130,
    text: "Te atendemos Carmilla y Millarca. Sí, los nombres se parecen mucho. No, no preguntes.",
  },
  {
    id: "after",
    name: "El After",
    time: "De 3:00 a 5:00",
    price: 80,
    text: "Para quien sale de Veronicas y todavía no quiere irse a casa. Se entra con cita y sin cantar.",
  },
];

const slots = ["22:00", "00:00", "02:00", "04:00"];

const statement = [
  ["12/07", "MIRCALLA S.L. · SERV. BIENESTAR", "−70,00 €", true],
  ["12/07", "CAFETERÍA AEROPUERTO TFS", "−4,20 €", false],
  ["11/07", "SUPERMERCADO ADEJE", "−38,15 €", false],
] as const;

const reviews = [
  { text: "Fui por una contractura. Salí sin contractura y sin preguntas.", who: "Íñigo, Bilbao" },
  { text: "Tengo el bono de cinco. En casa creen que hago pilates.", who: "Anónimo, Los Cristianos" },
  { text: "Me dijo que nos conocíamos de un sueño de cuando éramos niñas. Volví el jueves.", who: "Laura, Estiria" },
];

const rules = [
  "Solo mayores de 18. Se pide el DNI y se mira la fecha.",
  "Se viene con cita, duchado y con educación.",
  "No muerdo. Lo dejé. Si insistes mucho, tampoco.",
  "Lo que pasa en Las Américas se queda en Las Américas.",
];

const nav: [string, string][] = [
  ["La carta", "carta"],
  ["Discreción", "discrecion"],
  ["Reservar", "reservar"],
];

const cta =
  "inline-flex items-center justify-center rounded-full bg-[#ff3d9a] px-7 py-3.5 font-semibold text-[#1a0520] shadow-[0_0_28px_rgba(255,61,154,0.55)] transition hover:bg-[#ff66b0]";

export function CarmillaSite() {
  const [service, setService] = useState(services[0].id);
  const [slot, setSlot] = useState(slots[1]);
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);

  const links = circleLinks("carmilla");
  const picked = services.find((s) => s.id === service) ?? services[0];

  return (
    <div className="min-h-screen bg-[#12051c] text-[#f6e3f2] font-body antialiased">
      <button
        onClick={() => scrollToId("circulo")}
        className="block w-full bg-[#ff3d9a] text-[#1a0520] text-sm font-semibold py-2 px-4 text-center hover:bg-[#ff66b0] transition"
      >
        Socia del Círculo de ex-vampiros. <span className="underline underline-offset-4">Mira qué gente tan seria</span>
      </button>

      <header className="sticky top-0 z-30 border-b border-[#ff3d9a]/25 bg-[#12051c]/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3">
            <span className="font-neon neon-pink text-3xl leading-none">Carmilla</span>
            <span className="rounded-md border border-[#ff8a3d] px-1.5 py-0.5 text-xs font-bold text-[#ffb27a]">+18</span>
          </button>
          <nav className="hidden md:flex items-center gap-7 text-[#f6e3f2]/90">
            {nav.map(([text, id]) => (
              <button key={id} onClick={() => scrollToId(id)} className="hover:text-[#ff8ac4] transition">
                {text}
              </button>
            ))}
          </nav>
          <button
            onClick={() => scrollToId("reservar")}
            className="rounded-full bg-[#ff3d9a] px-5 py-2.5 text-sm font-semibold text-[#1a0520] shadow-[0_0_22px_rgba(255,61,154,0.5)] transition hover:bg-[#ff66b0]"
          >
            Pedir hora
          </button>
        </div>
      </header>

      {/* portada */}
      <section className="relative overflow-hidden">
        <img src="/images/sites/carmilla.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#12051c]/75 via-[#12051c]/55 to-[#12051c]" />
        <div className="relative max-w-4xl mx-auto px-5 pt-16 pb-24 text-center">
          <p className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-[#ff8a3d]/50 bg-[#12051c]/60 px-4 py-1.5 text-sm text-[#ffd2b0]">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} /> Playa de las Américas, Tenerife
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} /> Abierto hasta las 5:00
            </span>
          </p>
          <h1 className="mt-8">
            <span className="block font-neon neon-pink neon-flicker text-7xl sm:text-8xl lg:text-9xl leading-none">Carmilla</span>
            <span className="mt-5 block font-neon neon-orange text-3xl sm:text-5xl leading-tight">Masajes con final feliz</span>
          </h1>
          <p className="mt-7 text-lg sm:text-xl leading-relaxed text-[#f6e3f2]/95 max-w-2xl mx-auto">
            Sí, es justo lo que estás pensando. En la web de la funeraria me llaman «centro de bienestar». Aquí, que es
            mi casa, las cosas por su nombre.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => scrollToId("reservar")} className={cta}>
              Pedir hora para esta noche
            </button>
            <button
              onClick={() => scrollToId("carta")}
              className="inline-flex items-center justify-center rounded-full border border-[#f6e3f2]/60 px-7 py-3.5 font-semibold hover:border-[#ff8ac4] hover:text-[#ff8ac4] transition"
            >
              Ver la carta
            </button>
          </div>
          <ul className="mt-8 flex flex-wrap justify-center gap-2 text-sm">
            {["Sin eufemismos", "Sin preguntas", "Sin sol"].map((t) => (
              <li key={t} className="rounded-full bg-[#12051c]/70 border border-[#ff3d9a]/40 px-4 py-1.5 text-[#ffc3df]">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* traducción */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <h2 className="font-neon text-4xl sm:text-5xl text-[#ff8ac4]">Traducción simultánea</h2>
        <p className="mt-3 text-lg text-[#f6e3f2]/85 max-w-2xl">
          Para entrar en el Círculo, una señora muy amable llamada Esme me corrigió el texto tres veces. Te lo devuelvo
          a como estaba.
        </p>
        <div className="mt-8 flex flex-col gap-4">
          {translation.map((r) => (
            <div key={r.plain} className="grid md:grid-cols-2 gap-px rounded-2xl overflow-hidden border border-[#ff3d9a]/30 bg-[#ff3d9a]/30">
              <div className="bg-[#1b0a29] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#c7a6c9]">En la web de la funeraria</p>
                <p className="mt-2 font-accent italic text-xl text-[#c7a6c9] line-through decoration-[#ff3d9a]">{r.censored}</p>
              </div>
              <div className="bg-[#260c38] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#ffb27a]">Aquí</p>
                <p className="mt-2 text-xl font-semibold text-white">{r.plain}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* carta */}
      <section id="carta" className="scroll-mt-20 bg-[#1b0a29] border-y border-[#ff3d9a]/25">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <h2 className="font-neon text-4xl sm:text-5xl text-[#ff8ac4]">La carta</h2>
          <p className="mt-3 text-lg text-[#f6e3f2]/85">Cuatro cosas y las cuatro bien hechas. El final viene incluido en el precio.</p>
          <div className="mt-8 grid sm:grid-cols-2 gap-5">
            {services.map((s) => (
              <article key={s.id} className="flex flex-col rounded-3xl border border-[#ff3d9a]/35 bg-[#12051c] p-6">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-neon text-3xl text-[#ffe3f1]">{s.name}</h3>
                  <p className="font-neon text-3xl text-[#ffb27a] tabular-nums">{s.price} €</p>
                </div>
                <p className="mt-1 text-sm uppercase tracking-[0.15em] text-[#c7a6c9]">{s.time}</p>
                <p className="mt-4 text-lg leading-relaxed text-[#f6e3f2]/95">{s.text}</p>
                <button
                  onClick={() => {
                    setService(s.id);
                    setDone(false);
                    scrollToId("reservar");
                  }}
                  className="mt-6 self-start rounded-full border border-[#ff3d9a] px-5 py-2.5 font-semibold text-[#ff8ac4] hover:bg-[#ff3d9a] hover:text-[#1a0520] transition"
                >
                  Lo quiero
                </button>
              </article>
            ))}
          </div>
          <p className="mt-6 rounded-2xl border border-[#ff8a3d]/50 bg-[#ff8a3d]/10 px-5 py-4 text-lg text-[#ffd2b0]">
            <strong className="text-white">Bono de 5 sesiones al precio de 4.</strong> No caduca. Yo tampoco.
          </p>
        </div>
      </section>

      {/* discreción */}
      <section id="discrecion" className="scroll-mt-20">
        <div className="max-w-6xl mx-auto px-5 py-16 grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="flex items-center gap-3 font-neon text-4xl sm:text-5xl text-[#ff8ac4]">
              <EyeOff size={34} className="shrink-0" /> Discreción
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[#f6e3f2]/95">
              En el extracto del banco no pone nada raro. Pone «Mircalla S.L.», que es Carmilla con las letras
              cambiadas. Llevo usando el truco desde 1698 y todavía cuela.
            </p>
            <h3 className="mt-8 text-sm uppercase tracking-[0.2em] text-[#ffb27a]">Normas de la casa</h3>
            <ul className="mt-3 flex flex-col gap-3 text-lg">
              {rules.map((r) => (
                <li key={r} className="flex items-start gap-3">
                  <Check size={18} className="mt-1.5 shrink-0 text-[#ff8ac4]" />
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-lg text-[#f6e3f2]/85">
              <strong className="text-white">Horario:</strong> de 18:00 a 05:00, todos los días. De día no abro. No es
              pereza, es dermatológico.
            </p>
          </div>

          <figure className="rounded-2xl bg-[#f4f1ea] text-[#22202a] p-6 font-mono text-sm shadow-[0_0_60px_rgba(255,61,154,0.25)]">
            <figcaption className="flex items-center justify-between border-b border-[#22202a]/20 pb-3 font-body">
              <span className="font-semibold">Tu banco · Movimientos</span>
              <span className="text-[#5d5a66]">Julio</span>
            </figcaption>
            <ul>
              {statement.map(([date, concept, amount, mine]) => (
                <li
                  key={concept}
                  className={`flex items-baseline justify-between gap-3 py-3 border-b border-[#22202a]/10 ${mine ? "bg-[#ffe1ef] -mx-3 px-3 rounded-md font-semibold" : ""}`}
                >
                  <span className="text-[#5d5a66] shrink-0">{date}</span>
                  <span className="flex-1 min-w-0 break-words">{concept}</span>
                  <span className="shrink-0 tabular-nums">{amount}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 font-body text-[#5d5a66]">¿Ves? Bienestar. Nadie pregunta por el bienestar.</p>
          </figure>
        </div>
      </section>

      {/* opiniones */}
      <section className="bg-[#1b0a29] border-y border-[#ff3d9a]/25">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <h2 className="font-neon text-4xl sm:text-5xl text-[#ff8ac4]">Repiten</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-5">
            {reviews.map((r) => (
              <figure key={r.who} className="rounded-3xl border border-[#ff3d9a]/30 bg-[#12051c] p-6">
                <div className="flex gap-1 text-[#ffb27a]" role="img" aria-label="5 de 5 estrellas">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} className="fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 text-xl leading-relaxed text-white">«{r.text}»</blockquote>
                <figcaption className="mt-4 text-[#c7a6c9]">{r.who}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* reservar */}
      <section id="reservar" className="scroll-mt-20">
        <div className="max-w-3xl mx-auto px-5 py-16">
          <h2 className="font-neon text-4xl sm:text-5xl text-[#ff8ac4]">Pide hora</h2>
          <div className="mt-8 rounded-3xl border border-[#ff3d9a]/40 bg-[#1b0a29] p-6 sm:p-8">
            {done ? (
              <div role="status">
                <p className="font-neon neon-pink text-4xl">Hecho, {name.trim() || "cielo"}.</p>
                <p className="mt-4 text-xl leading-relaxed">
                  {picked.name} a las {slot}. Son {picked.price} €. En el banco pondrá «Mircalla S.L.» y aquí no ha
                  venido nadie.
                </p>
                <button
                  onClick={() => setDone(false)}
                  className="mt-6 rounded-full border border-[#f6e3f2]/60 px-6 py-3 font-semibold hover:border-[#ff8ac4] hover:text-[#ff8ac4] transition"
                >
                  Cambiar la reserva
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setDone(true);
                }}
                className="flex flex-col gap-7"
              >
                <fieldset>
                  <legend className="text-sm uppercase tracking-[0.2em] text-[#ffb27a]">Qué quieres</legend>
                  <div className="mt-3 grid sm:grid-cols-2 gap-2.5">
                    {services.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={service === s.id}
                        onClick={() => setService(s.id)}
                        className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-lg transition ${
                          service === s.id
                            ? "border-[#ff3d9a] bg-[#ff3d9a] text-[#1a0520] font-semibold"
                            : "border-[#f6e3f2]/30 hover:border-[#ff8ac4]"
                        }`}
                      >
                        <span>{s.name}</span>
                        <span className="tabular-nums">{s.price} €</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-sm uppercase tracking-[0.2em] text-[#ffb27a]">A qué hora</legend>
                  <div className="mt-3 grid grid-cols-4 gap-2.5">
                    {slots.map((t) => (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={slot === t}
                        onClick={() => setSlot(t)}
                        className={`rounded-2xl border py-3 text-lg tabular-nums transition ${
                          slot === t
                            ? "border-[#ff8a3d] bg-[#ff8a3d] text-[#1a0520] font-semibold"
                            : "border-[#f6e3f2]/30 hover:border-[#ffb27a]"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="block">
                  <span className="text-sm uppercase tracking-[0.2em] text-[#ffb27a]">Un nombre (el que quieras)</span>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="No hace falta que sea el tuyo"
                    className="mt-3 w-full rounded-2xl border border-[#f6e3f2]/30 bg-[#12051c] px-4 py-3.5 text-lg placeholder:text-[#a98aad] focus:border-[#ff3d9a] focus:outline-none"
                  />
                </label>

                <button className={cta}>Reservar</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* pie */}
      <footer id="circulo" className="scroll-mt-20 border-t border-[#ff3d9a]/25 bg-[#0c0313]">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <h2 className="font-neon text-3xl text-[#ff8ac4]">El Círculo</h2>
          <p className="mt-2 text-lg text-[#f6e3f2]/85 max-w-2xl">
            Mis socios. Gente muy formal, todos con su negocio. El dominio de esta web lo eligió Esme; el resto, yo.
          </p>
          <ul className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="flex h-full flex-col rounded-2xl border border-[#ff3d9a]/35 px-5 py-4 hover:border-[#ff3d9a] hover:bg-[#ff3d9a]/10 transition"
                >
                  <span className="text-lg font-semibold text-white">{l.label}</span>
                  <span className="text-sm text-[#c7a6c9]">{l.domain}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm leading-relaxed text-[#c7a6c9] max-w-3xl">
            Carmilla · Local 18, Playa de las Américas, Tenerife. Contenido para mayores de 18 años. Parodia sin ánimo
            de lucro inspirada en «Carmilla», de Sheridan Le Fanu. Este local no existe y aquí no se reserva nada.
          </p>
        </div>
      </footer>
    </div>
  );
}
