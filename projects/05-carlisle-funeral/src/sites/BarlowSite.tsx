import { useState } from "react";
import { Baby, BedDouble, Blocks, BookOpen, Check, Music, Sun, Utensils, type LucideIcon } from "lucide-react";
import { circleLinks, scrollToId } from "./shared";

const card = "rounded-[28px] border-2 border-[#2b2d42] shadow-[5px_5px_0_#2b2d42]";
const btn =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#2b2d42] px-6 py-3 font-semibold transition hover:-translate-y-0.5";

type Slot = { time: string; title: string; icon: LucideIcon; color: string; text: string };

const day: Slot[] = [
  {
    time: "7:00",
    title: "Acogida",
    icon: Sun,
    color: "#ffe59a",
    text: "Abre la puerta el Sr. Straker, que es de mañanas. El director saluda desde el fondo del pasillo, lejos de la ventana. Saluda con muchísimo cariño.",
  },
  {
    time: "10:00",
    title: "Canciones",
    icon: Music,
    color: "#c4e6ff",
    text: "Cantamos «Sol, solecito». El director la tararea desde su despacho con la puerta cerrada. Se la sabe entera, aunque le cuesta.",
  },
  {
    time: "12:00",
    title: "Comida",
    icon: Utensils,
    color: "#ffc9bf",
    text: "Cocina propia. Mucha remolacha, mucho tomate y nada de ajo, por una alergia del director. Los jueves hay morcilla y solo repite él.",
  },
  {
    time: "13:00",
    title: "Siesta",
    icon: BedDouble,
    color: "#ddd3ff",
    text: "¡Nuestra especialidad! Persianas opacas de calidad profesional y tres horas de silencio. El director predica con el ejemplo: no hay quien lo despierte.",
  },
  {
    time: "16:00",
    title: "Patio",
    icon: Blocks,
    color: "#bdeed8",
    text: "Patio a la sombra, con toldo. Mucho toldo. Tenemos arenero, triciclos y un huerto donde hemos plantado de todo menos una cosa.",
  },
  {
    time: "19:00",
    title: "Cuentos",
    icon: BookOpen,
    color: "#ffd9ad",
    text: "Al caer el sol el director entra en plena forma. Hace todas las voces menos la del lobo, que se niega por principios. La del conde le sale clavada.",
  },
];

const rooms = [
  {
    name: "Murcielaguitos",
    age: "0 a 1 año",
    color: "#ddd3ff",
    text: "Gateo, mantita y nanas. Duermen boca arriba y en su cuna, no colgados. Lo hemos hablado con el director.",
  },
  {
    name: "Búhos",
    age: "1 a 2 años",
    color: "#ffe59a",
    text: "Primeros pasos y primeras palabras. La favorita de este curso es «no». El director dice que la entiende.",
  },
  {
    name: "Lobitos",
    age: "2 a 3 años",
    color: "#bdeed8",
    text: "El nombre venía con el local. Desde la funeraria nos han pedido por escrito que lo cambiemos. Estamos pensando.",
  },
];

const menu = [
  ["Lunes", "Crema de remolacha"],
  ["Martes", "Macarrones con tomate"],
  ["Miércoles", "Lentejas con mucho hierro"],
  ["Jueves", "Arroz con morcilla"],
  ["Viernes", "Pizza de la casa"],
];

const incidents = [
  "Lucas a Martina, por un cubo.",
  "Martina a Lucas, en legítima defensa.",
  "Hugo a un triciclo.",
  "Vega a su propio brazo, por curiosidad.",
  "Leo a la mesa de luz. Ganó la mesa.",
  "Lucas a Martina otra vez. Era el mismo cubo.",
];

const plans = [
  { name: "Mañanas", hours: "De 7:00 a 13:00", price: 290, note: "Con almuerzo de media mañana" },
  { name: "Día completo", hours: "De 7:00 a 17:00", price: 390, note: "Con comedor y siesta de tres horas", top: true },
  { name: "Hasta el anochecer", hours: "De 7:00 a 21:00", price: 460, note: "Con cuentacuentos del director" },
];

const nav: [string, string][] = [
  ["Un día aquí", "dia"],
  ["Aulas", "aulas"],
  ["Mordiscos", "mordiscos"],
  ["Tarifas", "tarifas"],
];

export function BarlowSite() {
  const [slot, setSlot] = useState(3);
  const [bites, setBites] = useState(3);
  const [kid, setKid] = useState("");
  const [room, setRoom] = useState(rooms[1].name);
  const [done, setDone] = useState(false);

  const links = circleLinks("barlow");
  const now = day[slot];
  const log = Array.from({ length: Math.min(3, bites) }, (_, k) => incidents[(bites - 1 - k) % incidents.length]);

  return (
    <div className="light-ui min-h-screen bg-[#fff7e8] text-[#2b2d42] font-fredoka antialiased">
      <button
        onClick={() => scrollToId("circulo")}
        className="block w-full bg-[#2b2d42] text-white text-sm py-2 px-4 text-center hover:bg-[#3a3d5c] transition"
      >
        🦇 Somos del Círculo de ex-vampiros. <span className="underline underline-offset-4">¡Conoce a nuestros amigos!</span>
      </button>

      <header className="sticky top-0 z-30 px-4 pt-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 rounded-full border-2 border-[#2b2d42] bg-white pl-3 pr-2 py-2 shadow-[4px_4px_0_#2b2d42]">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex min-w-0 items-center gap-2.5 text-left">
            <span className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 grid place-items-center rounded-full bg-[#ffd24a] border-2 border-[#2b2d42]">
              <Baby size={20} />
            </span>
            <span className="leading-none whitespace-nowrap">
              <span className="block text-base sm:text-lg font-bold">Dientes de Leche</span>
              <span className="block text-xs font-medium mt-0.5">Guardería Barlow</span>
            </span>
          </button>
          <nav className="hidden md:flex items-center gap-6 font-medium">
            {nav.map(([text, id]) => (
              <button key={id} onClick={() => scrollToId(id)} className="hover:underline underline-offset-4 decoration-2 decoration-[#ffd24a]">
                {text}
              </button>
            ))}
          </nav>
          <button
            onClick={() => scrollToId("tarifas")}
            className="shrink-0 whitespace-nowrap rounded-full bg-[#2b2d42] text-white px-4 sm:px-5 py-2.5 font-semibold hover:bg-[#3a3d5c] transition"
          >
            Reservar<span className="hidden sm:inline"> plaza</span>
          </button>
        </div>
      </header>

      {/* portada */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-[#ffd24a]" aria-hidden />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#c4e6ff]" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-5 pt-12 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="inline-block rounded-full bg-[#ffc9bf] border-2 border-[#2b2d42] px-4 py-1.5 text-sm font-semibold">
              Escuela infantil de 0 a 3 años · Jerusalem's Lot
            </p>
            <h1 className="mt-5 text-5xl sm:text-6xl font-bold leading-[1.02]">
              ¡Aquí los únicos colmillos son{" "}
              <span className="bg-[#ffd24a] px-2 rounded-xl box-decoration-clone">de leche</span>!
            </h1>
            <p className="mt-5 text-xl leading-relaxed max-w-xl">
              La dirige Kurt Barlow, que lleva siglos despierto de noche y por fin le ha encontrado utilidad: ¡tenemos el
              horario más amplio de todo Maine!
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <button onClick={() => scrollToId("tarifas")} className={`${btn} bg-[#2b2d42] text-white shadow-[4px_4px_0_#ffd24a]`}>
                Reservar plaza
              </button>
              <button onClick={() => scrollToId("dia")} className={`${btn} bg-white`}>
                Ver un día aquí
              </button>
            </div>
          </div>

          <figure className="relative">
            <img
              src="./images/sites/barlow.jpg"
              alt="Aula con camitas para la siesta, mesa de bloques, un murciélago de peluche y las cortinas opacas echadas"
              className="w-full aspect-[4/3] object-cover bg-[#ffe59a] rounded-[40px] border-2 border-[#2b2d42] shadow-[6px_6px_0_#2b2d42]"
            />
            <span className="absolute -top-4 left-6 -rotate-3 rounded-full bg-white border-2 border-[#2b2d42] px-4 py-1.5 font-semibold shadow-[3px_3px_0_#2b2d42]">
              Cortinas opacas ✓
            </span>
            <span className="absolute -bottom-4 right-6 rotate-2 rounded-full bg-[#bdeed8] border-2 border-[#2b2d42] px-4 py-1.5 font-semibold shadow-[3px_3px_0_#2b2d42]">
              El peluche se llama Kurt
            </span>
          </figure>
        </div>
      </section>

      {/* un día */}
      <section id="dia" className="scroll-mt-28">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <h2 className="text-4xl sm:text-5xl font-bold">Un día en Dientes de Leche</h2>
          <p className="mt-3 text-lg max-w-2xl">Toca cada hora para ver qué hacemos. ¡Spoiler: a la una se duerme!</p>

          <div className="mt-8 grid lg:grid-cols-[300px_1fr] gap-6 items-start">
            <div role="tablist" aria-label="Horario del día" className="grid grid-cols-3 lg:grid-cols-1 gap-2.5">
              {day.map((d, i) => (
                <button
                  key={d.time}
                  role="tab"
                  aria-selected={slot === i}
                  onClick={() => setSlot(i)}
                  className={`flex flex-col lg:flex-row lg:items-center gap-0.5 lg:gap-3 rounded-2xl border-2 border-[#2b2d42] px-2.5 sm:px-3.5 py-2.5 text-left transition ${
                    slot === i ? "bg-[#2b2d42] text-white" : "bg-white hover:-translate-y-0.5"
                  }`}
                >
                  <span className="font-bold tabular-nums lg:w-14">{d.time}</span>
                  <span className="font-medium">{d.title}</span>
                </button>
              ))}
            </div>

            <div role="tabpanel" className={`${card} p-7 sm:p-9`} style={{ background: now.color }}>
              <now.icon size={40} />
              <p className="mt-4 font-semibold tabular-nums">{now.time}</p>
              <h3 className="text-4xl font-bold">{now.title}</h3>
              <p className="mt-3 text-xl leading-relaxed max-w-xl">{now.text}</p>
            </div>
          </div>

          <h3 className="mt-14 text-2xl font-bold">Menú de la semana (sin ajo)</h3>
          <ul className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            {menu.map(([d, plate]) => (
              <li key={d} className="rounded-2xl border-2 border-[#2b2d42] bg-white p-4">
                <span className="block text-sm font-semibold text-[#5a5d7a]">{d}</span>
                <span className="block mt-1 text-lg font-semibold leading-snug">{plate}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[#5a5d7a]">De postre, siempre fruta roja. Es casualidad.</p>
        </div>
      </section>

      {/* aulas */}
      <section id="aulas" className="scroll-mt-28 bg-[#ffefc7] border-y-2 border-[#2b2d42]">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <h2 className="text-4xl sm:text-5xl font-bold">Nuestras aulas</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {rooms.map((r) => (
              <article key={r.name} className={`${card} p-6`} style={{ background: r.color }}>
                <p className="inline-block rounded-full bg-white border-2 border-[#2b2d42] px-3 py-1 text-sm font-semibold">{r.age}</p>
                <h3 className="mt-4 text-3xl font-bold">{r.name}</h3>
                <p className="mt-2 text-lg leading-relaxed">{r.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* mordiscos */}
      <section id="mordiscos" className="scroll-mt-28">
        <div className="max-w-6xl mx-auto px-5 py-14 grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold">Política de mordiscos</h2>
            <p className="mt-4 text-xl leading-relaxed">
              A los dos años se muerde. Es una etapa y se pasa. Os lo decimos con conocimiento de causa.
            </p>
            <ul className="mt-6 flex flex-col gap-3 text-lg">
              {[
                "Avisamos a las familias el mismo día, con el nombre del cubo implicado",
                "Hielo, mimo y a seguir jugando",
                "El director no interviene: dice que no es quién para dar lecciones",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-1 h-6 w-6 shrink-0 grid place-items-center rounded-full bg-[#bdeed8] border-2 border-[#2b2d42]">
                    <Check size={13} strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>

            <blockquote className={`${card} mt-8 bg-white p-6`}>
              <p className="text-lg leading-relaxed italic">
                «Estimadas familias: he visto caer imperios y nada me había preparado para el periodo de adaptación de
                septiembre. Gracias por vuestra confianza. Pasad cuando queráis; esta vez invito yo.»
              </p>
              <footer className="mt-3 font-semibold">K. Barlow, director</footer>
            </blockquote>
          </div>

          <div className={`${card} bg-white p-6 sm:p-8`}>
            <p className="font-semibold text-[#5a5d7a]">Parte de mordiscos de hoy</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-[#bdeed8] border-2 border-[#2b2d42] p-4">
                <p className="text-6xl font-bold tabular-nums">0</p>
                <p className="mt-1 font-semibold">Del personal</p>
                <p className="text-sm">Desde que abrimos. Se dice pronto.</p>
              </div>
              <div className="rounded-2xl bg-[#ffc9bf] border-2 border-[#2b2d42] p-4">
                <p className="text-6xl font-bold tabular-nums" aria-live="polite">
                  {bites}
                </p>
                <p className="mt-1 font-semibold">Entre alumnos</p>
                <p className="text-sm">Es la edad.</p>
              </div>
            </div>
            <ul className="mt-5 flex flex-col gap-2">
              {log.map((t, i) => (
                <li key={`${bites}-${i}`} className="rounded-xl bg-[#fff7e8] border-2 border-[#2b2d42] px-4 py-2.5">
                  {t}
                </li>
              ))}
            </ul>
            <button onClick={() => setBites((b) => b + 1)} className={`${btn} mt-5 w-full bg-[#ffd24a]`}>
              Apuntar otro mordisco
            </button>
          </div>
        </div>
      </section>

      {/* equipo */}
      <section className="bg-[#c4e6ff] border-y-2 border-[#2b2d42]">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <h2 className="text-4xl sm:text-5xl font-bold">El equipo</h2>
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <article className={`${card} bg-white p-6`}>
              <h3 className="text-2xl font-bold">Kurt Barlow</h3>
              <p className="font-semibold text-[#5a5d7a]">Director · Turno de tarde y de noche</p>
              <p className="mt-3 text-lg leading-relaxed">
                Varios siglos de experiencia tratando con gente mucho más joven que él. Tiene una paciencia infinita, en
                sentido literal.
              </p>
            </article>
            <article className={`${card} bg-white p-6`}>
              <h3 className="text-2xl font-bold">Richard Straker</h3>
              <p className="font-semibold text-[#5a5d7a]">Secretaría · Turno de mañana</p>
              <p className="mt-3 text-lg leading-relaxed">
                Antes llevaba la tienda de antigüedades del pueblo. Trata cada juguete como una pieza de museo y pide
                que no se chupen.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* tarifas */}
      <section id="tarifas" className="scroll-mt-28">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <h2 className="text-4xl sm:text-5xl font-bold">Tarifas y plazas</h2>
          <p className="mt-3 text-lg">¡La primera semana de adaptación es gratis! Y plazas hay muchas: el pueblo está muy tranquilo desde 1975.</p>

          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <article key={p.name} className={`${card} p-6 ${p.top ? "bg-[#ffd24a]" : "bg-white"}`}>
                {p.top && <p className="inline-block rounded-full bg-[#2b2d42] text-white px-3 py-1 text-sm font-semibold">La que más piden</p>}
                <h3 className={`text-2xl font-bold ${p.top ? "mt-3" : ""}`}>{p.name}</h3>
                <p className="font-medium">{p.hours}</p>
                <p className="mt-4 text-5xl font-bold tabular-nums">
                  {p.price} €<span className="text-lg font-semibold"> al mes</span>
                </p>
                <p className="mt-2">{p.note}</p>
              </article>
            ))}
          </div>

          <div className={`${card} mt-10 bg-white p-6 sm:p-8`}>
            {done ? (
              <div role="status">
                <h3 className="text-3xl font-bold">¡Plaza guardada para {kid.trim() || "vuestro peque"}!</h3>
                <p className="mt-2 text-lg">
                  Os esperamos el lunes en el aula de {room}. Traed mantita, chupete y ninguna ristra de nada.
                </p>
                <button onClick={() => setDone(false)} className={`${btn} mt-5 bg-[#fff7e8]`}>
                  Reservar otra plaza
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setDone(true);
                }}
                className="grid md:grid-cols-[1fr_1fr_auto] gap-4 items-end"
              >
                <label className="block">
                  <span className="font-semibold">Nombre del peque</span>
                  <input
                    required
                    value={kid}
                    onChange={(e) => setKid(e.target.value)}
                    placeholder="Por ejemplo, Martina"
                    className="mt-1.5 w-full rounded-2xl border-2 border-[#2b2d42] bg-[#fff7e8] px-4 py-3 text-lg placeholder:text-[#8b8da6] focus:outline-none focus:ring-4 focus:ring-[#ffd24a]"
                  />
                </label>
                <label className="block">
                  <span className="font-semibold">Aula</span>
                  <select
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border-2 border-[#2b2d42] bg-[#fff7e8] px-4 py-3 text-lg focus:outline-none focus:ring-4 focus:ring-[#ffd24a]"
                  >
                    {rooms.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name} ({r.age})
                      </option>
                    ))}
                  </select>
                </label>
                <button className={`${btn} bg-[#2b2d42] text-white`}>Guardar plaza</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* pie */}
      <footer id="circulo" className="scroll-mt-28 bg-[#2b2d42] text-[#fff7e8]">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <h2 className="text-3xl font-bold">Nuestros amigos del Círculo 🦇</h2>
          <p className="mt-2 text-lg text-[#fff7e8]/85 max-w-2xl">
            Todos lo hemos dejado y todos tenemos un negocio con horario. ¡Pasad a saludar!
          </p>
          <ul className="mt-6 flex flex-wrap gap-3">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="inline-flex flex-col rounded-2xl border-2 border-[#fff7e8] px-5 py-3 hover:bg-[#fff7e8] hover:text-[#2b2d42] transition"
                >
                  <span className="text-lg font-semibold">{l.label}</span>
                  <span className="text-sm opacity-80">{l.domain}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm text-[#fff7e8]/75 leading-relaxed max-w-3xl">
            Guardería Barlow · Dientes de Leche. Casa Marsten (reformada), Jerusalem's Lot, Maine. Parodia sin ánimo de
            lucro inspirada en «El misterio de Salem's Lot», de Stephen King. Esta guardería no existe y no admite
            matrículas.
          </p>
        </div>
      </footer>
    </div>
  );
}
