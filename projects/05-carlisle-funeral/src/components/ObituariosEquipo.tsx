import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Flower2, MoonStar, MapPin, CalendarDays, Heart, Quote } from "lucide-react";
import { obituaries, team } from "../data";

export function Obituarios() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [sentFlowers, setSentFlowers] = useState<Record<number, number>>({});
  const [thanks, setThanks] = useState<number | null>(null);

  const ceremonies = ["Todos", ...Array.from(new Set(obituaries.map((o) => o.ceremony)))];

  const list = useMemo(() => {
    return obituaries.filter((o) => {
      const q = query.toLowerCase();
      const matchQ = o.name.toLowerCase().includes(q) || o.text.toLowerCase().includes(q);
      const matchF = filter === "Todos" || o.ceremony === filter;
      return matchQ && matchF;
    });
  }, [query, filter]);

  const sendFlower = (id: number) => {
    setSentFlowers((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
    setThanks(id);
    setTimeout(() => setThanks(null), 2200);
  };

  return (
    <section id="obituarios" className="relative py-24 sm:py-32 bg-[#070709]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-[#c9a86a] text-[11px] tracking-[0.3em] uppercase">
              <span className="h-px w-10 bg-[#c9a86a]" /> Obituarios recientes
            </div>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl text-[#f4efe3]">
              Historias que <span className="gold-text italic font-accent">acompañamos.</span>
            </h2>
            <p className="mt-4 text-stone-400 max-w-xl font-light">
              Cada nombre, una ceremonia diseñada con su familia. Puedes dejar una flor virtual: Esme las pone de verdad
              en la capilla cada domingo.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar nombre…"
                className="w-full sm:w-64 rounded-full bg-black/40 border border-white/10 pl-10 pr-4 py-3 text-sm placeholder:text-stone-600 focus:border-[#c9a86a] outline-none transition"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {ceremonies.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-4 py-2 rounded-full text-xs tracking-[0.12em] uppercase border transition ${
                filter === c
                  ? "bg-[#c9a86a] text-black border-[#c9a86a] font-medium"
                  : "border-white/12 text-stone-400 hover:border-white/30 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="mt-12 text-center py-16 rounded-3xl border border-dashed border-white/10">
            <MoonStar size={28} className="mx-auto text-stone-600" />
            <p className="mt-3 text-stone-500 font-accent italic text-xl">Nadie con ese nombre en nuestros registros eternos.</p>
          </div>
        ) : (
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((o, i) => (
              <motion.article
                key={o.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.08 }}
                className="group rounded-3xl overflow-hidden border border-white/8 bg-[#0e0e12] hover:border-[#c9a86a]/40 transition-all hover:-translate-y-1 duration-300"
              >
                <div className="relative h-52 overflow-hidden">
                  <img src={o.image} alt={o.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e12] via-[#0e0e12]/20 to-transparent" />
                  <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur border border-white/15 text-[10px] tracking-[0.18em] uppercase text-stone-300">
                    {o.ceremony}
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <div className="font-display text-xl text-white leading-tight">{o.name}</div>
                    <div className="text-xs text-[#c9a86a] tracking-widest mt-0.5">{o.dates} · {o.age} años</div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-stone-400 font-light leading-relaxed min-h-[60px]">{o.text}</p>
                  <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/8">
                    <div className="flex items-center gap-1.5 text-xs text-stone-500">
                      <Flower2 size={14} className="text-[#c9a86a]" />
                      {(o.flowers + (sentFlowers[o.id] ?? 0)).toLocaleString("es-ES")} flores
                    </div>
                    <button
                      onClick={() => sendFlower(o.id)}
                      className={`relative px-4 py-2 rounded-full text-xs tracking-wide transition flex items-center gap-1.5 ${
                        thanks === o.id
                          ? "bg-emerald-500 text-white"
                          : "bg-[#c9a86a]/10 border border-[#c9a86a]/30 text-[#ecd9ab] hover:bg-[#c9a86a] hover:text-black"
                      }`}
                    >
                      <Heart size={12} />
                      {thanks === o.id ? "¡Flor enviada!" : "Enviar flor"}
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.015] px-6 py-5 text-sm text-stone-500">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-[#c9a86a]" />
            Misa de recuerdo comunitaria: primer domingo de mes, 20h, Capilla Forks.
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-[#c9a86a]" />
            Libro de condolencias físico en las 3 sedes.
          </div>
        </div>
      </div>
    </section>
  );
}

export function Equipo() {
  return (
    <section id="equipo" className="relative py-24 sm:py-28 bg-[#0b0b0f] border-y border-white/5 overflow-hidden">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#c9a86a]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-[11px] tracking-[0.3em] uppercase text-[#c9a86a]">La familia · El aquelarre funerario</div>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl text-[#f4efe3]">
            Los de siempre. <span className="gold-text italic font-accent">Ahora de día también.</span>
          </h2>
          <p className="mt-4 text-stone-400 font-light">
            Toda la familia Cullen dejó la caza para dedicarse al cuidado. Mismas caras desde hace décadas
            (sospechosamente jóvenes, lo sabemos). Mismo corazón, más grande.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {team.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.08 }}
              className="group relative rounded-3xl border border-white/8 bg-gradient-to-b from-[#14141b] to-[#0d0d11] p-6 hover:border-[#c9a86a]/40 transition-all hover:-translate-y-1.5 duration-300 overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-[#c9a86a]/8 blur-2xl group-hover:bg-[#c9a86a]/15 transition" />
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#2a2620] to-black border border-[#c9a86a]/30 flex items-center justify-center font-display text-lg gold-text font-semibold">
                  {m.initials}
                </div>
                <div>
                  <div className="text-white font-medium leading-tight">{m.name}</div>
                  <div className="text-[11px] tracking-[0.12em] uppercase text-[#c9a86a] mt-1">{m.role}</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Quote size={14} className="text-[#c9a86a]/50 shrink-0 mt-0.5" />
                <p className="font-accent italic text-[15px] text-stone-200 leading-snug">{m.quote}</p>
              </div>
              <p className="mt-3 text-xs text-stone-500 leading-relaxed border-t border-white/8 pt-3">{m.detail}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-xs tracking-[0.2em] uppercase text-stone-600">
            ¿Echas en falta a Jacob? Viene a aullarle a la luna los viernes. Es nuestro vigilante externo.
          </p>
        </div>
      </div>
    </section>
  );
}
