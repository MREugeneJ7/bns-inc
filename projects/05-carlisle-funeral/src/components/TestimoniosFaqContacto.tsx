import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Plus,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  MoonStar,
  ShieldCheck,
  MessageCircleHeart,
  FlameKindling,
} from "lucide-react";
import { testimonials, faqs, phoneDisplay, phoneHref } from "../data";

export function Testimonios() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    const t = setInterval(() => {
      setDir(1);
      setIdx((p) => (p + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  const go = (n: number) => {
    setDir(n > idx ? 1 : -1);
    setIdx((n + testimonials.length) % testimonials.length);
  };

  const t = testimonials[idx];

  return (
    <section className="relative py-24 sm:py-28 bg-[#070709] overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <div className="text-[11px] tracking-[0.3em] uppercase text-[#c9a86a]">Testimonios · 4.9/5 en 2.140 reseñas</div>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl text-[#f4efe3]">
          Lo que dicen <span className="gold-text italic font-accent">las familias</span>
        </h2>

        <div className="mt-10 relative rounded-3xl border border-[#c9a86a]/20 bg-gradient-to-b from-[#14141a] to-[#0b0b0f] p-8 sm:p-12 min-h-[280px] flex flex-col justify-center overflow-hidden">
          <div className="absolute top-6 left-8 font-display text-7xl text-[#c9a86a]/15 select-none">“</div>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={idx}
              custom={dir}
              initial={{ opacity: 0, x: dir * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -60 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex justify-center gap-1">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={16} className="fill-[#c9a86a] text-[#c9a86a]" />
                ))}
              </div>
              <p className="mt-5 font-accent italic text-xl sm:text-2xl leading-relaxed text-[#f4efe3] max-w-3xl mx-auto">
                “{t.text}”
              </p>
              <div className="mt-6">
                <div className="text-white font-medium">{t.name}</div>
                <div className="text-xs tracking-[0.2em] uppercase text-stone-500 mt-1">{t.place}</div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-4">
            <button onClick={() => go(idx - 1)} className="h-9 w-9 rounded-full border border-white/15 flex items-center justify-center text-stone-400 hover:border-[#c9a86a] hover:text-[#ecd9ab] transition" aria-label="Anterior">
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-[#c9a86a]" : "w-1.5 bg-white/20 hover:bg-white/40"}`}
                  aria-label={`Ir a ${i}`}
                />
              ))}
            </div>
            <button onClick={() => go(idx + 1)} className="h-9 w-9 rounded-full border border-white/15 flex items-center justify-center text-stone-400 hover:border-[#c9a86a] hover:text-[#ecd9ab] transition" aria-label="Siguiente">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="relative py-8 sm:py-12 bg-[#070709] pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center">
          <div className="text-[11px] tracking-[0.3em] uppercase text-[#c9a86a]">Preguntas que nos hacen (mucho)</div>
          <h2 className="mt-4 font-display text-4xl text-[#f4efe3]">
            Dudas <span className="gold-text italic font-accent">eternas</span>
          </h2>
        </div>
        <div className="mt-10 flex flex-col gap-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen ? "border-[#c9a86a]/50 bg-[#121218]" : "border-white/8 bg-white/[0.015] hover:border-white/20"
                }`}
              >
                <button onClick={() => setOpen(isOpen ? -1 : i)} className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left">
                  <span className={`font-medium ${isOpen ? "text-[#ecd9ab]" : "text-stone-200"}`}>{f.q}</span>
                  <span className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? "bg-[#c9a86a] text-black border-[#c9a86a] rotate-45" : "border-white/15 text-stone-400"}`}>
                    <Plus size={16} />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                      <p className="px-5 sm:px-6 pb-6 text-sm text-stone-400 leading-relaxed font-light">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Contacto() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", type: "Urgencia inmediata", message: "" });

  return (
    <section id="contacto" className="relative py-24 sm:py-28 bg-[#0b0b0f] border-t border-white/5 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-[600px] h-[300px] bg-[#c9a86a]/5 blur-[100px] rounded-full" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12">
        <div>
          <div className="flex items-center gap-3 text-[#c9a86a] text-[11px] tracking-[0.3em] uppercase">
            <span className="h-px w-10 bg-[#c9a86a]" /> Contacto 24h
          </div>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl text-[#f4efe3] leading-tight">
            Estamos aquí.
            <br />
            <span className="gold-text italic font-accent">Incluso a las 3 de la mañana.</span>
          </h2>
          <p className="mt-5 text-stone-400 font-light max-w-md">
            Sobre todo a las 3 de la mañana, que es cuando más se nos necesita y cuando mejor trabajamos. Viejas
            costumbres nocturnas, ahora al servicio del cuidado.
          </p>

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <a href={phoneHref} className="group rounded-2xl border border-[#c9a86a]/30 bg-gradient-to-br from-[#1d1a12] to-black p-5 hover:border-[#c9a86a] transition">
              <Phone size={20} className="text-[#c9a86a]" />
              <div className="mt-3 text-[10px] tracking-[0.25em] uppercase text-stone-500">Urgencias 24h</div>
              <div className="font-display text-2xl text-white group-hover:text-[#ecd9ab] transition">{phoneDisplay}</div>
              <div className="text-xs text-stone-500 mt-1">Gratuito · Responde Bella</div>
            </a>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <Mail size={20} className="text-[#c9a86a]" />
              <div className="mt-3 text-[10px] tracking-[0.25em] uppercase text-stone-500">Escríbenos</div>
              <div className="text-white font-medium mt-1">hola@funeraria-carlisle.es</div>
              <div className="text-xs text-stone-500 mt-1">Respondemos en 1h · Día y noche</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <MapPin size={20} className="text-[#c9a86a]" />
              <div className="mt-3 text-[10px] tracking-[0.25em] uppercase text-stone-500">Sedes</div>
              <div className="text-sm text-stone-300 mt-1 leading-relaxed">
                Calle de la Eternidad 13, Madrid
                <br />
                Huckleberry Ln 7, Forks
                <br />
                Via della Luna 1, Volterra
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <Clock size={20} className="text-[#c9a86a]" />
              <div className="mt-3 text-[10px] tracking-[0.25em] uppercase text-stone-500">Horario</div>
              <div className="text-sm text-stone-300 mt-1 leading-relaxed">
                Lunes – Domingo: <strong className="text-white">siempre abierto</strong>
                <br />
                Visitas nocturnas con cita
                <br />
                Luna llena: horario extendido
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 text-xs text-stone-500">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
            Empresa autorizada · Nº 1663 · Todos los seguros de decesos · Protección de datos garantizada por Alice (ve el futuro, no tus datos).
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#14141b] to-[#0c0c10] p-7 sm:p-9">
          {!sent ? (
            <>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-[#c9a86a]/10 border border-[#c9a86a]/25 flex items-center justify-center text-[#c9a86a]">
                  <MessageCircleHeart size={20} />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-white">Pide ayuda o planifica</h3>
                  <p className="text-xs text-stone-500">Te llamamos en menos de 2 horas</p>
                </div>
              </div>
              <form
                className="mt-6 flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs tracking-[0.15em] uppercase text-stone-500">Nombre</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Tu nombre"
                      className="mt-1.5 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm placeholder:text-stone-600 focus:border-[#c9a86a] outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs tracking-[0.15em] uppercase text-stone-500">Teléfono</label>
                    <input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="600 000 000"
                      className="mt-1.5 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm placeholder:text-stone-600 focus:border-[#c9a86a] outline-none transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs tracking-[0.15em] uppercase text-stone-500">¿Qué necesitas?</label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {["Urgencia inmediata", "Planificar", "Duelo"].map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setForm({ ...form, type: t })}
                        className={`py-2.5 rounded-xl border text-xs sm:text-sm transition ${
                          form.type === t
                            ? "bg-[#c9a86a] text-black border-[#c9a86a] font-medium"
                            : "border-white/10 text-stone-400 hover:border-white/30"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs tracking-[0.15em] uppercase text-stone-500">Cuéntanos (opcional)</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={4}
                    placeholder="Estamos aquí para escucharte, sin prisa…"
                    className="mt-1.5 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm placeholder:text-stone-600 focus:border-[#c9a86a] outline-none transition resize-none"
                  />
                </div>
                <button className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-[#c9a86a] text-black font-medium hover:bg-[#ecd9ab] hover:shadow-[0_0_30px_rgba(201,168,106,0.3)] transition">
                  <Send size={16} /> Enviar mensaje
                </button>
                <p className="text-[11px] text-stone-600 text-center">
                  Al enviar aceptas que te llamemos con voz grave y amable. Nada de spam. Los vampiros jubilados odian el spam.
                </p>
              </form>
            </>
          ) : (
            <div className="text-center py-10">
              <CheckCircle2 size={52} className="mx-auto text-emerald-400" />
              <h3 className="mt-5 font-display text-3xl text-white">Mensaje recibido, {form.name.split(" ")[0] || "amigo"}.</h3>
              <p className="mt-3 text-stone-400 text-sm leading-relaxed max-w-sm mx-auto">
                Bella ya tiene tu número (<strong className="text-white">{form.phone}</strong>) y Carlisle ha encendido una
                vela a tu nombre. Te llamamos en menos de 2 horas por tu solicitud de{" "}
                <strong className="text-[#ecd9ab]">{form.type.toLowerCase()}</strong>.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 px-6 py-3 rounded-full border border-white/15 text-sm hover:border-[#c9a86a] hover:text-[#ecd9ab] transition"
              >
                Enviar otro mensaje
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="relative bg-black border-t border-[#c9a86a]/15 pt-16 pb-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 flex items-center justify-center rounded-full border border-[#c9a86a]/40 bg-gradient-to-br from-[#1a1a22] to-black">
                <MoonStar size={20} className="text-[#c9a86a]" />
              </div>
              <div className="leading-tight">
                <div className="font-display text-xl text-[#f4efe3]">
                  Funeraria <span className="gold-text font-semibold">Carlisle</span>
                </div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-stone-500">Desde 1640</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-stone-500 font-light leading-relaxed">
              El Dr. Carlisle Cullen dejó el vampirismo en 2024 para organizar las despedidas más cuidadas de este siglo…
              y de los tres anteriores.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs">
              <FlameKindling size={12} /> No mordemos desde 2024 · Certificado
            </div>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.25em] uppercase text-[#c9a86a]">Servicios</div>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-stone-400">
              {["Velatorio Integral 24h", "Nocturna Signature", "Cremación ecológica", "Repatriación internacional", "Testamento Vital Eterno", "Acompañamiento al duelo"].map((s) => (
                <li key={s}><a href="#servicios" className="hover:text-[#ecd9ab] transition">{s}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.25em] uppercase text-[#c9a86a]">La casa</div>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-stone-400">
              {[
                ["Nuestra historia", "#historia"],
                ["Crea tu despedida", "#configurador"],
                ["Planes y precios", "#planes"],
                ["Obituarios", "#obituarios"],
                ["El equipo", "#equipo"],
                ["Contacto", "#contacto"],
                ["Páginas hermanas", "#hermanas"],
              ].map(([label, href]) => (
                <li key={href + label}><a href={href} className="hover:text-[#ecd9ab] transition">{label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.25em] uppercase text-[#c9a86a]">Urgencias</div>
            <a href={phoneHref} className="mt-4 block font-display text-3xl text-white hover:text-[#ecd9ab] transition">
              {phoneDisplay}
            </a>
            <p className="mt-2 text-xs text-stone-500">24h · 365 noches al año · Festivos incluidos</p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs text-stone-500 leading-relaxed">
              Calle de la Eternidad 13, Madrid
              <br />hola@funeraria-carlisle.es
            </div>
          </div>
        </div>
        <div className="hairline my-8" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-600 tracking-wide">
          <span>© 2026 Funeraria Carlisle S.L. · Colegiado funerario nº 1663 · Forks — Volterra — Madrid</span>
          <span className="font-accent italic text-sm text-stone-500">“La muerte es solo el principio de una buena despedida.” — C. Cullen</span>
        </div>
        <p className="mt-4 text-center text-[10px] text-stone-700 max-w-3xl mx-auto leading-relaxed">
          Página de ficción inspirada en Crepúsculo, Drácula, Salem's Lot, Carmilla, Nosferatu y Ravenloft. Ningún vampiro real ha sido obligado a trabajar aquí ni en nuestras páginas hermanas. Todos están jubilados y contentos.
        </p>
        <p className="text-center leading-none">
          <a
            href="#/legal"
            className="text-[1px] text-black focus-visible:text-[13px] focus-visible:text-[#ecd9ab] focus-visible:underline"
          >
            Aviso legal
          </a>
        </p>
      </div>
    </footer>
  );
}
