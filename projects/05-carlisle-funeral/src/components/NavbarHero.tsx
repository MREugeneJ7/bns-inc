import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoonStar,
  Phone,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  Clock,
  Sparkles,
  HeartHandshake,
  ArrowRight,
  Flame,
  FlameKindling,
} from "lucide-react";
import { phoneDisplay, phoneHref } from "../data";

const links = [
  { label: "Historia", href: "#historia" },
  { label: "Servicios", href: "#servicios" },
  { label: "Crea tu despedida", href: "#configurador" },
  { label: "Planes", href: "#planes" },
  { label: "Obituarios", href: "#obituarios" },
  { label: "Equipo", href: "#equipo" },
  { label: "Contacto", href: "#contacto" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* top bar */}
      <div className="fixed top-0 inset-x-0 z-50 bg-[#0b0b0f]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-9 text-[11px] sm:text-xs tracking-[0.18em] uppercase text-stone-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="hidden sm:inline">Servicio 24h · Incluso de madrugada · Incluso en luna llena</span>
            <span className="sm:hidden">Servicio 24h</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-stone-500">Forks · Volterra · Madrid</span>
            <a href={phoneHref} className="flex items-center gap-1.5 text-[#ecd9ab] hover:text-white transition">
              <Phone size={12} /> {phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      <header
        className={`fixed top-9 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-[#070709]/90 backdrop-blur-xl border-b border-[#c9a86a]/15 py-2" : "bg-transparent py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <a href="#inicio" className="flex items-center gap-3 group">
            <div className="relative h-11 w-11 flex items-center justify-center rounded-full border border-[#c9a86a]/40 bg-gradient-to-br from-[#1a1a22] to-black group-hover:border-[#c9a86a] transition">
              <MoonStar size={20} className="text-[#c9a86a]" />
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#c9a86a] flex items-center justify-center">
                <FlameKindling size={9} className="text-black" />
              </div>
            </div>
            <div className="leading-tight">
              <div className="font-display text-xl tracking-wide text-[#f4efe3]">
                Funeraria <span className="gold-text font-semibold">Carlisle</span>
              </div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-stone-500">Desde 1640 · Ex-vampiros</div>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-7 text-[13px] tracking-[0.12em] uppercase text-stone-300">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-[#ecd9ab] transition relative group">
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-[#c9a86a] group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <a
              href="#configurador"
              className="px-5 py-2.5 rounded-full text-[12px] tracking-[0.15em] uppercase border border-[#c9a86a]/40 text-[#ecd9ab] hover:bg-[#c9a86a] hover:text-black transition-all duration-300"
            >
              Planificar
            </a>
            <a
              href={phoneHref}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] tracking-[0.15em] uppercase bg-[#c9a86a] text-black hover:bg-[#ecd9ab] transition font-medium"
            >
              <Phone size={14} /> Urgencias
            </a>
          </div>

          <button onClick={() => setOpen(!open)} className="lg:hidden text-[#ecd9ab] p-2" aria-label="Menú">
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden bg-[#0b0b0f]/98 backdrop-blur-xl border-t border-white/5"
            >
              <div className="px-6 py-6 flex flex-col gap-4">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="text-lg font-accent text-stone-200 hover:text-[#ecd9ab] border-b border-white/5 pb-3"
                  >
                    {l.label}
                  </a>
                ))}
                <a
                  href={phoneHref}
                  className="mt-2 flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-[#c9a86a] text-black font-medium"
                >
                  <Phone size={16} /> {phoneDisplay} · 24h
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

export function Hero() {
  const [moths] = useState(() => Array.from({ length: 14 }, (_, i) => i));
  return (
    <section id="inicio" className="relative min-h-screen flex items-center grain overflow-hidden pt-36 pb-20">
      {/* BG */}
      <div className="absolute inset-0">
        <img
          src="/images/capilla-nocturna.jpg"
          alt="Capilla nocturna"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070709]/80 via-[#070709]/55 to-[#070709]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070709]/90 via-[#070709]/30 to-transparent" />
        {/* mist */}
        <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-[#070709] to-transparent" />
        <div className="animate-mist absolute top-1/3 -left-20 w-[600px] h-[300px] rounded-full bg-[#c9a86a]/5 blur-[100px]" />
        <div className="animate-mist absolute bottom-20 right-0 w-[500px] h-[250px] rounded-full bg-[#7f1d1d]/10 blur-[100px]" style={{ animationDelay: "-6s" }} />
        {/* floating embers */}
        {moths.map((i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-[#ecd9ab]/60"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${(i * 73) % 100}%`,
              top: `${20 + ((i * 37) % 70)}%`,
            }}
            animate={{ y: [-20, -120], opacity: [0, 1, 0] }}
            transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: i * 0.7 }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center w-full">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#c9a86a]/30 bg-black/40 backdrop-blur text-[11px] sm:text-xs tracking-[0.22em] uppercase text-[#ecd9ab]"
          >
            <Sparkles size={14} className="text-[#c9a86a]" />
            El Dr. Cullen dejó el vampirismo · Ahora organiza velatorios
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-6 font-display text-[2.8rem] leading-[1.02] sm:text-6xl lg:text-7xl text-[#f4efe3]"
          >
            La despedida
            <br />
            también merece
            <br />
            <span className="gold-text italic font-accent">eternidad.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 max-w-xl text-stone-300 text-base sm:text-lg font-light leading-relaxed"
          >
            Tras tres siglos bebiendo <em className="font-accent italic text-[#ecd9ab]">sangre de mentira</em> y salvando
            vidas, el Dr. <strong className="text-white font-medium">Carlisle Cullen</strong> colgó los colmillos para
            dedicarse a lo que mejor sabe hacer: <strong className="text-white font-medium">cuidar personas hasta el final. Y más allá.</strong>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-8 flex flex-col sm:flex-row gap-4"
          >
            <a
              href="#configurador"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#c9a86a] text-black font-medium tracking-wide hover:bg-[#ecd9ab] hover:shadow-[0_0_40px_rgba(201,168,106,0.4)] transition-all"
            >
              <FlameKindling size={18} />
              Crear mi despedida
              <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
            </a>
            <a
              href={phoneHref}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full border border-white/20 text-[#f4efe3] hover:border-[#c9a86a] hover:text-[#ecd9ab] backdrop-blur bg-white/5 transition-all"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-400"></span>
              </span>
              {phoneDisplay} · 24h
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 grid grid-cols-3 max-w-lg divide-x divide-white/10"
          >
            {[
              { n: "386", l: "años de experiencia" },
              { n: "12.400+", l: "familias acompañadas" },
              { n: "0", l: "mordiscos desde 2024" },
            ].map((s) => (
              <div key={s.l} className="px-4 first:pl-0">
                <div className="font-display text-3xl sm:text-4xl gold-text font-semibold">{s.n}</div>
                <div className="text-[11px] tracking-[0.15em] uppercase text-stone-400 mt-1">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* card testimonio doctor */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative hidden lg:block"
        >
          <div className="card-border rounded-3xl overflow-hidden backdrop-blur">
            <div className="relative h-72 overflow-hidden">
              <img src="/images/carlisle-portrait.jpg" alt="Dr. Carlisle Cullen" className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101014] via-transparent to-transparent" />
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur border border-[#c9a86a]/30 text-[10px] tracking-[0.2em] uppercase text-[#ecd9ab]">
                <ShieldCheck size={12} /> Ex-vampiro colegiado nº 1663
              </div>
            </div>
            <div className="p-7 -mt-6 relative">
              <Flame size={28} className="text-[#c9a86a] flame mb-3" />
              <p className="font-accent italic text-xl leading-relaxed text-[#f4efe3]">
                “Vi morir a miles sin poder despedirlos. Ahora cada velatorio que organizo es mi redención. Ninguna
                familia volverá a sentirse sola en la oscuridad.”
              </p>
              <div className="mt-5 flex items-center justify-between">
                <div>
                  <div className="font-display text-lg text-white">Dr. Carlisle Cullen</div>
                  <div className="text-xs tracking-[0.2em] uppercase text-stone-500">Fundador · Ex-vampiro · Funerario</div>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-[#c9a86a]">★</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-5 -left-5 flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/80 backdrop-blur border border-white/10 shadow-2xl animate-float-slow">
            <div className="h-10 w-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <Clock size={18} className="text-emerald-400" />
            </div>
            <div className="text-sm">
              <div className="text-white font-medium">Llegamos en 2h</div>
              <div className="text-stone-400 text-xs">De día. De noche. Siempre.</div>
            </div>
          </div>

          <div className="absolute -top-4 -right-3 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#c9a86a] text-black shadow-xl rotate-3">
            <HeartHandshake size={16} />
            <span className="text-xs font-semibold tracking-wide">Dieta 100% vegetariana</span>
          </div>
        </motion.div>
      </div>

      <a href="#historia" className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-stone-500 hover:text-[#ecd9ab] transition z-10">
        <span className="text-[10px] tracking-[0.3em] uppercase">Descubre la historia</span>
        <ChevronDown size={20} className="animate-bounce" />
      </a>
    </section>
  );
}

export function Marquee() {
  const items = [
    "Velatorios nocturnos",
    "Cero mordiscos garantizado",
    "Piano en directo",
    "Repatriación Volterra — Forks",
    "300 velas por ceremonia",
    "Apoyo al duelo con Jasper",
    "Flores de Esme",
    "Atención 24h",
  ];
  return (
    <div className="relative border-y border-[#c9a86a]/20 bg-[#0b0b0f] py-4 overflow-hidden">
      <div className="flex whitespace-nowrap animate-marquee gap-0 w-max">
        {[0, 1].map((k) => (
          <div key={k} className="flex items-center">
            {items.map((it, i) => (
              <span key={i} className="flex items-center gap-6 px-6 text-[12px] tracking-[0.25em] uppercase text-[#c9a86a]/90">
                {it} <span className="text-[#c9a86a]/30">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
