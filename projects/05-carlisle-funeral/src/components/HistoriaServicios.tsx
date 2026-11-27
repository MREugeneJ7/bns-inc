import { motion } from "framer-motion";
import {
  Moon,
  Syringe,
  HeartPulse,
  Sunrise,
  Award,
  MoonStar,
  Church,
  Leaf,
  Plane,
  BookHeart,
  HandHeart,
  Music4,
  ArrowUpRight,
  BadgeCheck,
  Soup,
} from "lucide-react";
import { timeline } from "../data";
import { useState } from "react";

const icons = [Moon, Syringe, HeartPulse, Sunrise, Award];

export function Historia() {
  const [active, setActive] = useState(3);
  return (
    <section id="historia" className="relative py-24 sm:py-32 bg-[#070709] overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[700px] h-[400px] bg-[#c9a86a]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-14 items-start">
          <div className="lg:sticky lg:top-32">
            <div className="flex items-center gap-3 text-[#c9a86a] text-[11px] tracking-[0.3em] uppercase">
              <span className="h-px w-10 bg-[#c9a86a]" /> Nuestra historia
            </div>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl leading-tight text-[#f4efe3]">
              De cazar vampiros
              <br />
              a <span className="gold-text italic font-accent">ser uno.</span>
              <br />
              De ser uno a<br />
              cuidar despedidas.
            </h2>
            <p className="mt-6 text-stone-400 leading-relaxed max-w-lg font-light">
              Carlisle Cullen nació en 1640, fue transformado en 1663 y pasó 360 años negándose a hacer daño. Médico,
              padre, vegetariano estricto. En 2024 tomó su última gran decisión: dejar la eternidad para honrar la
              mortalidad de los demás.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-4 max-w-lg">
              <div className="rounded-2xl border border-[#c9a86a]/20 bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 text-[#ecd9ab]">
                  <BadgeCheck size={18} className="text-[#c9a86a]" />
                  <span className="text-sm font-medium">Certificado ex-vampiro</span>
                </div>
                <p className="mt-2 text-xs text-stone-500 leading-relaxed">
                  Verificado por el Consejo de Volterra y por Sanidad. Colmillos entregados y fundidos en alianza.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 text-[#ecd9ab]">
                  <Soup size={18} className="text-emerald-400" />
                  <span className="text-sm font-medium">Comemos ajo desde 2024</span>
                </div>
                <p className="mt-2 text-xs text-stone-500 leading-relaxed">
                  Nuestro catering incluye alioli. Impensable hace dos años. La redención sabe a ajo.
                </p>
              </div>
            </div>

            <div className="mt-8 relative rounded-3xl overflow-hidden border border-white/10 hidden lg:block">
              <img
                src="https://images.pexels.com/photos/7317686/pexels-photo-7317686.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
                alt="Sala de velatorio"
                className="h-56 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
                <div className="text-sm text-stone-200 font-accent italic text-lg">Capilla Forks · 300 velas · Anoche</div>
                <div className="text-[10px] tracking-[0.25em] uppercase text-[#ecd9ab] border border-[#c9a86a]/40 rounded-full px-3 py-1.5 bg-black/50 backdrop-blur">
                  En directo
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-[27px] top-2 bottom-2 w-px bg-gradient-to-b from-[#c9a86a]/60 via-[#c9a86a]/20 to-transparent" />
            <div className="flex flex-col gap-4">
              {timeline.map((t, i) => {
                const Icon = icons[i];
                const isActive = active === i;
                return (
                  <motion.button
                    key={t.year}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => setActive(i)}
                    className={`relative text-left rounded-2xl border p-6 pl-20 transition-all duration-300 ${
                      isActive
                        ? "border-[#c9a86a]/50 bg-gradient-to-br from-[#1c1a14] to-[#101014] shadow-[0_0_40px_rgba(201,168,106,0.12)]"
                        : "border-white/8 bg-white/[0.015] hover:border-white/20"
                    }`}
                  >
                    <div
                      className={`absolute left-4 top-6 h-7 w-7 rounded-full flex items-center justify-center border transition ${
                        isActive ? "bg-[#c9a86a] text-black border-[#c9a86a]" : "bg-[#16161d] text-stone-500 border-white/10"
                      }`}
                    >
                      <Icon size={14} />
                    </div>
                    <div className={`font-display text-2xl ${isActive ? "gold-text font-semibold" : "text-stone-500"}`}>
                      {t.year}
                    </div>
                    <div className={`mt-1 font-medium ${isActive ? "text-white" : "text-stone-300"}`}>{t.title}</div>
                    <p className={`mt-2 text-sm leading-relaxed ${isActive ? "text-stone-300" : "text-stone-500"}`}>
                      {t.text}
                    </p>
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#3f1a1e] to-[#16161d] border border-[#7f1d1d]/30 p-6 flex gap-4 items-start">
              <MoonStar className="text-[#c9a86a] shrink-0 mt-1" size={22} />
              <p className="text-sm text-stone-300 leading-relaxed font-light">
                <strong className="text-white font-medium">Nota de Carlisle:</strong> “Si vienes de noche y brillo un
                poco bajo la luna, no te asustes. Son 360 años de purpurina acumulada. Se quita con agua y paciencia.”
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const services = [
  {
    icon: Church,
    title: "Velatorio Integral 24h",
    desc: "Recogida en 2h, sala privada, capilla, certificado, gestión total. Tú solo ven a despedirte.",
    price: "desde 1.950€",
    tag: "El esencial",
  },
  {
    icon: MoonStar,
    title: "Nocturna Signature",
    desc: "Nuestra joya: 22h–04h, 300 velas, piano de Edward, chocolate a las 2AM. Inolvidable.",
    price: "desde 3.200€",
    tag: "Más pedida",
  },
  {
    icon: Leaf,
    title: "Ecológico & Cremación",
    desc: "Ataúd biodegradable, urna de semillas, árbol memorial. Vuelve al bosque de Forks.",
    price: "desde 1.650€",
    tag: "Verde",
  },
  {
    icon: Plane,
    title: "Repatriación Eterna",
    desc: "Volterra, Forks o cualquier rincón del mundo en 48–96h. Papeles, avión, consulado: todo.",
    price: "desde 2.900€",
    tag: "Internacional",
  },
  {
    icon: BookHeart,
    title: "Testamento Vital Eterno",
    desc: "Planifica tu despedida en vida: música, flores, discursos vetados. Precio congelado.",
    price: "desde 49€/mes",
    tag: "Anticipado",
  },
  {
    icon: HandHeart,
    title: "Duelo con Esme & Jasper",
    desc: "6 sesiones de acompañamiento al duelo. Jasper calma; Esme abraza. Incluye grupo de apoyo.",
    price: "incluido",
    tag: "Corazón",
  },
];

export function Servicios() {
  return (
    <section id="servicios" className="relative py-24 sm:py-28 bg-[#0b0b0f] border-y border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-[#c9a86a] text-[11px] tracking-[0.3em] uppercase">
              <span className="h-px w-10 bg-[#c9a86a]" /> Servicios
            </div>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl text-[#f4efe3]">
              Todo resuelto. <span className="gold-text italic font-accent">Con calma nocturna.</span>
            </h2>
            <p className="mt-4 text-stone-400 max-w-xl font-light">
              386 años viendo partir a gente nos han enseñado algo: las familias no necesitan trámites, necesitan paz.
              Nosotros nos encargamos de todo lo demás.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-stone-400">
            <Music4 size={18} className="text-[#c9a86a]" />
            <span>
              Todas las ceremonias incluyen música. <em className="font-accent italic text-[#ecd9ab]">Ninguna incluye mordiscos.</em>
            </span>
          </div>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.1 }}
              className="group card-border rounded-3xl p-7 hover:-translate-y-1.5 transition-all duration-300 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#c9a86a]/20 to-transparent border border-[#c9a86a]/25 flex items-center justify-center text-[#c9a86a] group-hover:bg-[#c9a86a] group-hover:text-black transition-all">
                  <s.icon size={22} />
                </div>
                <span className="text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-full border border-white/10 text-stone-400">
                  {s.tag}
                </span>
              </div>
              <h3 className="mt-5 font-display text-2xl text-white group-hover:text-[#ecd9ab] transition">{s.title}</h3>
              <p className="mt-2 text-sm text-stone-400 leading-relaxed font-light">{s.desc}</p>
              <div className="mt-6 flex items-center justify-between pt-5 border-t border-white/8">
                <span className="text-[#c9a86a] text-sm tracking-wide">{s.price}</span>
                <a href="#configurador" className="flex items-center gap-1 text-xs tracking-[0.15em] uppercase text-stone-500 group-hover:text-[#ecd9ab] transition">
                  Configurar <ArrowUpRight size={14} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* proceso */}
        <div className="mt-14 rounded-3xl border border-[#c9a86a]/20 bg-gradient-to-br from-[#141310] to-[#0b0b0f] p-8 sm:p-10">
          <div className="text-center">
            <div className="text-[11px] tracking-[0.3em] uppercase text-[#c9a86a]">Cómo funciona</div>
            <h3 className="mt-2 font-display text-3xl text-white">En 4 pasos. Sin agobios.</h3>
          </div>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: "01", t: "Llámanos (o Alice te llama)", d: "900 164 036, 24h. En 2h estamos contigo. De verdad." },
              { n: "02", t: "Diseñamos la despedida", d: "Con Esme y Carlisle: flores, música, sala, tono." },
              { n: "03", t: "Nosotros lo movemos todo", d: "Papeles, traslado, iglesia o bosque, catering." },
              { n: "04", t: "Acompañamos el duelo", d: "Jasper y Esme, 6 sesiones. Y café siempre." },
            ].map((p) => (
              <div key={p.n} className="relative pl-5 border-l border-[#c9a86a]/25">
                <div className="font-display text-4xl gold-text font-semibold">{p.n}</div>
                <div className="mt-2 text-white font-medium">{p.t}</div>
                <div className="mt-1 text-sm text-stone-500">{p.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
