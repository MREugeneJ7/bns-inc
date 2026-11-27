import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BedDouble,
  Flower2,
  MoonStar,
  Sparkles,
  Check,
  Plus,
  Minus,
  ReceiptText,
  Send,
  RotateCcw,
  Crown,
  Leaf,
  Gem,
  BadgeCheck,
  Info,
} from "lucide-react";
import { coffins, flowers, ceremonies, extras } from "../data";

const fmt = (n: number) => n.toLocaleString("es-ES") + "€";

export function Configurador() {
  const [coffin, setCoffin] = useState("nogal");
  const [flower, setFlower] = useState("luna");
  const [ceremony, setCeremony] = useState("nocturna");
  const [selectedExtras, setSelectedExtras] = useState<string[]>(["piano", "libro"]);
  const [showSummary, setShowSummary] = useState(false);
  const [sent, setSent] = useState(false);

  const toggleExtra = (id: string) =>
    setSelectedExtras((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));

  const total = useMemo(() => {
    const c = coffins.find((x) => x.id === coffin)?.price ?? 0;
    const f = flowers.find((x) => x.id === flower)?.price ?? 0;
    const ce = ceremonies.find((x) => x.id === ceremony)?.price ?? 0;
    const ex = extras.filter((x) => selectedExtras.includes(x.id)).reduce((a, b) => a + b.price, 0);
    return c + f + ce + ex;
  }, [coffin, flower, ceremony, selectedExtras]);

  const reset = () => {
    setCoffin("nogal");
    setFlower("luna");
    setCeremony("nocturna");
    setSelectedExtras(["piano", "libro"]);
  };

  const selCoffin = coffins.find((x) => x.id === coffin)!;
  const selFlower = flowers.find((x) => x.id === flower)!;
  const selCeremony = ceremonies.find((x) => x.id === ceremony)!;

  return (
    <section id="configurador" className="relative py-24 sm:py-32 bg-[#070709] overflow-hidden">
      <div className="absolute -top-20 right-0 w-[600px] h-[400px] bg-[#7f1d1d]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#c9a86a]/30 bg-[#c9a86a]/5 text-[11px] tracking-[0.25em] uppercase text-[#ecd9ab]">
            <Sparkles size={14} /> Configurador interactivo
          </div>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl text-[#f4efe3]">
            Diseña la despedida <span className="gold-text italic font-accent">a tu manera</span>
          </h2>
          <p className="mt-4 text-stone-400 font-light">
            Elige féretro, flores, ceremonia y extras. Carlisle lo revisa todo personalmente antes de enviarte el
            presupuesto. Sin compromiso. Sin prisa. Sin sustos.
          </p>
        </div>

        <div className="mt-12 grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div className="flex flex-col gap-8">
            {/* ataudes */}
            <div className="rounded-3xl border border-white/8 bg-white/[0.015] p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#c9a86a]/10 border border-[#c9a86a]/25 flex items-center justify-center text-[#c9a86a]">
                  <BedDouble size={18} />
                </div>
                <div>
                  <h3 className="font-display text-xl text-white">01 · El último lecho</h3>
                  <p className="text-xs text-stone-500">Tallados y restaurados por Rosalie Hale</p>
                </div>
              </div>
              <div className="mt-5 grid sm:grid-cols-2 gap-3">
                {coffins.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCoffin(c.id)}
                    className={`text-left rounded-2xl border p-4 transition-all ${
                      coffin === c.id
                        ? "border-[#c9a86a] bg-[#c9a86a]/8 shadow-[0_0_24px_rgba(201,168,106,0.15)]"
                        : "border-white/8 hover:border-white/25 bg-black/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-white text-[15px]">{c.name}</div>
                      {coffin === c.id ? (
                        <span className="h-5 w-5 rounded-full bg-[#c9a86a] text-black flex items-center justify-center shrink-0">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      ) : c.tag ? (
                        <span className="text-[10px] tracking-widest uppercase text-[#c9a86a] border border-[#c9a86a]/30 rounded-full px-2 py-0.5 whitespace-nowrap">
                          {c.tag}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-stone-500">{c.desc}</div>
                    <div className="mt-2 text-sm text-[#ecd9ab]">{fmt(c.price)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* flores + ceremonia */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="rounded-3xl border border-white/8 bg-white/[0.015] p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#c9a86a]/10 border border-[#c9a86a]/25 flex items-center justify-center text-[#c9a86a]">
                    <Flower2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-white">02 · Flores</h3>
                    <p className="text-xs text-stone-500">Diseño de Esme Cullen</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-3">
                  {flowers.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFlower(f.id)}
                      className={`text-left rounded-2xl border p-4 transition-all ${
                        flower === f.id ? "border-[#c9a86a] bg-[#c9a86a]/8" : "border-white/8 hover:border-white/25 bg-black/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-white text-[15px]">{f.name}</div>
                        <div className="text-sm text-[#ecd9ab]">{fmt(f.price)}</div>
                      </div>
                      <div className="mt-0.5 text-xs text-stone-500">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/8 bg-white/[0.015] p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#c9a86a]/10 border border-[#c9a86a]/25 flex items-center justify-center text-[#c9a86a]">
                    <MoonStar size={18} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-white">03 · Ceremonia</h3>
                    <p className="text-xs text-stone-500">Coordinada por Alice (ya lo sabía)</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-3">
                  {ceremonies.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCeremony(c.id)}
                      className={`text-left rounded-2xl border p-4 transition-all ${
                        ceremony === c.id
                          ? "border-[#c9a86a] bg-[#c9a86a]/8"
                          : "border-white/8 hover:border-white/25 bg-black/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-white text-[15px]">{c.name}</div>
                        <div className="text-sm text-[#ecd9ab] whitespace-nowrap">{fmt(c.price)}</div>
                      </div>
                      <div className="mt-0.5 text-xs text-stone-500">{c.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* extras */}
            <div className="rounded-3xl border border-white/8 bg-white/[0.015] p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#c9a86a]/10 border border-[#c9a86a]/25 flex items-center justify-center text-[#c9a86a]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-display text-xl text-white">04 · Toques eternos (extras)</h3>
                  <p className="text-xs text-stone-500">Los detalles que convierten un adiós en memoria</p>
                </div>
              </div>
              <div className="mt-5 grid sm:grid-cols-2 gap-3">
                {extras.map((e) => {
                  const on = selectedExtras.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      onClick={() => toggleExtra(e.id)}
                      className={`text-left rounded-2xl border p-4 transition-all flex gap-3 ${
                        on ? "border-[#c9a86a]/70 bg-[#c9a86a]/8" : "border-white/8 hover:border-white/25 bg-black/20"
                      }`}
                    >
                      <span
                        className={`mt-0.5 h-6 w-6 rounded-full border flex items-center justify-center shrink-0 transition ${
                          on ? "bg-[#c9a86a] border-[#c9a86a] text-black" : "border-white/20 text-transparent"
                        }`}
                      >
                        {on ? <Check size={13} strokeWidth={3} /> : <Plus size={13} />}
                      </span>
                      <span>
                        <span className="flex items-center gap-2 font-medium text-white text-[15px]">
                          {e.name}
                        </span>
                        <span className="block mt-0.5 text-xs text-stone-500">{e.desc}</span>
                        <span className="block mt-1.5 text-sm text-[#ecd9ab]">+{fmt(e.price)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* resumen sticky */}
          <div className="lg:sticky lg:top-32">
            <div className="rounded-3xl overflow-hidden border border-[#c9a86a]/30 bg-gradient-to-b from-[#1a1812] to-[#0d0d11]">
              <div className="relative h-40 overflow-hidden">
                <img src="/images/ataud-detalle.jpg" alt="Detalle" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d11] to-transparent" />
                <div className="absolute bottom-3 left-5 flex items-center gap-2 text-[#ecd9ab] text-[11px] tracking-[0.25em] uppercase">
                  <ReceiptText size={14} /> Tu presupuesto
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-stone-400">{selCoffin.name}</span>
                    <span className="text-white whitespace-nowrap">{fmt(selCoffin.price)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-stone-400">{selFlower.name}</span>
                    <span className="text-white whitespace-nowrap">{fmt(selFlower.price)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-stone-400">{selCeremony.name}</span>
                    <span className="text-white whitespace-nowrap">{fmt(selCeremony.price)}</span>
                  </div>
                  {extras
                    .filter((e) => selectedExtras.includes(e.id))
                    .map((e) => (
                      <div key={e.id} className="flex justify-between gap-3">
                        <span className="text-stone-400 flex items-center gap-1.5">
                          <button onClick={() => toggleExtra(e.id)} className="hover:text-red-400 transition" aria-label="Quitar">
                            <Minus size={12} />
                          </button>
                          {e.name}
                        </span>
                        <span className="text-white whitespace-nowrap">{fmt(e.price)}</span>
                      </div>
                    ))}
                  {selectedExtras.length === 0 && (
                    <div className="text-xs text-stone-600 italic">Sin extras. A veces menos es más.</div>
                  )}
                </div>

                <div className="hairline my-5" />

                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500">Total estimado</div>
                    <div className="font-display text-4xl gold-text font-semibold">{fmt(total)}</div>
                    <div className="text-[11px] text-stone-500 mt-1">IVA incluido · o {fmt(Math.round(total / 24))}/mes × 24</div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2.5">
                  <button
                    onClick={() => {
                      setShowSummary(true);
                      setSent(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-[#c9a86a] text-black font-medium hover:bg-[#ecd9ab] transition"
                  >
                    <Send size={15} /> Solicitar presupuesto
                  </button>
                  <button
                    onClick={reset}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-white/15 text-stone-300 hover:border-white/40 transition text-sm"
                  >
                    <RotateCcw size={14} /> Restablecer
                  </button>
                </div>

                <p className="mt-4 text-[11px] text-stone-600 leading-relaxed flex gap-1.5">
                  <Info size={12} className="shrink-0 mt-0.5" />
                  Presupuesto orientativo. Carlisle lo revisa y te llama en menos de 2h con el precio cerrado. Aceptamos
                  todos los seguros de decesos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* modal */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowSummary(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-[#c9a86a]/30 bg-[#101014] p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#c9a86a] to-transparent" />
              {!sent ? (
                <>
                  <h3 className="font-display text-2xl text-white">Confirmar solicitud</h3>
                  <p className="mt-2 text-sm text-stone-400">
                    Te llamaremos en menos de 2 horas (Alice dice que ya descolgaste). Presupuesto:{" "}
                    <strong className="text-[#ecd9ab]">{fmt(total)}</strong>
                  </p>
                  <form
                    className="mt-6 flex flex-col gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSent(true);
                    }}
                  >
                    <input required placeholder="Tu nombre" className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm placeholder:text-stone-600 focus:border-[#c9a86a] outline-none transition" />
                    <input required type="tel" placeholder="Teléfono" className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm placeholder:text-stone-600 focus:border-[#c9a86a] outline-none transition" />
                    <button className="mt-2 w-full py-3.5 rounded-full bg-[#c9a86a] text-black font-medium hover:bg-[#ecd9ab] transition">
                      Enviar a Carlisle
                    </button>
                    <button type="button" onClick={() => setShowSummary(false)} className="text-xs text-stone-500 hover:text-stone-300">
                      Volver al configurador
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <Check size={24} className="text-emerald-400" />
                  </div>
                  <h3 className="mt-4 font-display text-2xl text-white">Recibido con solemnidad</h3>
                  <p className="mt-2 text-sm text-stone-400 leading-relaxed">
                    Carlisle ya está revisando tu despedida a la luz de las velas.
                    <br />
                    Te llamaremos enseguida. Gracias por confiar en nosotros.
                  </p>
                  <div className="mt-5 rounded-2xl bg-black/30 border border-white/10 p-4 text-left text-xs text-stone-400">
                    <div className="flex justify-between"><span>{selCoffin.name}</span><span className="text-white">{fmt(selCoffin.price)}</span></div>
                    <div className="flex justify-between mt-1"><span>{selCeremony.name}</span><span className="text-white">{fmt(selCeremony.price)}</span></div>
                    <div className="flex justify-between mt-2 pt-2 border-t border-white/10 font-medium"><span className="text-[#ecd9ab]">Total</span><span className="text-[#ecd9ab]">{fmt(total)}</span></div>
                  </div>
                  <button onClick={() => setShowSummary(false)} className="mt-5 w-full py-3 rounded-full border border-white/15 text-sm hover:border-[#c9a86a] hover:text-[#ecd9ab] transition">
                    Cerrar
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

const plans = [
  {
    icon: Leaf,
    name: "Esencial Terrenal",
    price: "1.950€",
    per: "pago único",
    desc: "Digno, sencillo y sin letra pequeña. Lo necesario, bien hecho.",
    features: ["Recogida y traslado 24h", "Sala privada 12h", "Féretro de roble o ecológico", "Corona de lirios de Esme", "Gestión de certificados", "Ceremonia laica o religiosa", "Apoyo al duelo (2 sesiones)"],
    cta: "Elegir Esencial",
    featured: false,
  },
  {
    icon: Crown,
    name: "Eterno Carlisle",
    price: "3.900€",
    per: "o 162€/mes × 24",
    desc: "Nuestro best-seller. La Nocturna Signature con todo el cariño de la familia.",
    features: [
      "Todo lo del Esencial",
      "Ceremonia Nocturna 22h–04h",
      "300 velas + Féretro Nogal Forks",
      "Piano en directo (Edward)",
      "Jardín de Medianoche floral",
      "Libro de Recuerdos Eterno",
      "Catering nocturno + chocolate 2AM",
      "Duelo completo (6 sesiones)",
    ],
    cta: "Elegir Eterno",
    featured: true,
  },
  {
    icon: Gem,
    name: "Inmortal",
    price: "7.500€",
    per: "o 312€/mes × 24",
    desc: "Para quienes quieren partir como vivieron: a lo grande. Sin límites.",
    features: [
      "Todo lo del Eterno",
      "Féretro Gótico Nocturno o Volturi",
      "Claro del Bosque o catedral",
      "Cuarteto + 100 mariposas blancas",
      "Retrato al óleo póstumo",
      "Vídeo homenaje cinematográfico",
      "Repatriación incluida si se desea",
      "Acompañamiento familiar 1 año",
    ],
    cta: "Hablar con Carlisle",
    featured: false,
  },
];

export function Planes() {
  return (
    <section id="planes" className="relative py-24 sm:py-28 bg-[#0b0b0f] border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-[11px] tracking-[0.3em] uppercase text-[#c9a86a]">Planes cerrados · Sin sorpresas</div>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl text-[#f4efe3]">
            Precios claros. <span className="gold-text italic font-accent">Como la luna llena.</span>
          </h2>
          <p className="mt-4 text-stone-400 font-light">
            La media nacional es 3.500€ con letra pequeña. Nosotros publicamos todo. Y si tienes seguro de decesos, lo
            tramitamos por ti y te devolvemos la diferencia.
          </p>
        </div>

        <div className="mt-12 grid lg:grid-cols-3 gap-6 items-stretch">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-3xl p-8 flex flex-col ${
                p.featured
                  ? "bg-gradient-to-b from-[#221d12] to-[#0e0e12] border border-[#c9a86a]/60 shadow-[0_0_60px_rgba(201,168,106,0.18)] lg:-translate-y-3"
                  : "card-border"
              }`}
            >
              {p.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#c9a86a] text-black text-[10px] tracking-[0.2em] uppercase font-semibold whitespace-nowrap">
                  ★ El favorito de Forks
                </div>
              )}
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${p.featured ? "bg-[#c9a86a] text-black" : "bg-[#c9a86a]/10 border border-[#c9a86a]/25 text-[#c9a86a]"}`}>
                <p.icon size={22} />
              </div>
              <h3 className="mt-5 font-display text-2xl text-white">{p.name}</h3>
              <p className="mt-1.5 text-sm text-stone-400 font-light min-h-[40px]">{p.desc}</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className={`font-display text-5xl font-semibold ${p.featured ? "gold-text" : "text-white"}`}>{p.price}</span>
              </div>
              <div className="text-xs text-stone-500 tracking-wide">{p.per} · IVA incluido</div>
              <div className="hairline my-6" />
              <ul className="flex flex-col gap-3 text-sm flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-stone-300">
                    <BadgeCheck size={16} className="text-[#c9a86a] shrink-0 mt-0.5" />
                    <span className="font-light">{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#contacto"
                className={`mt-8 w-full py-3.5 rounded-full text-center font-medium transition ${
                  p.featured ? "bg-[#c9a86a] text-black hover:bg-[#ecd9ab]" : "border border-white/15 text-[#f4efe3] hover:border-[#c9a86a] hover:text-[#ecd9ab]"
                }`}
              >
                {p.cta}
              </a>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-stone-600">
          * Precios orientativos para Madrid / Forks. Volterra y repatriaciones, consultar. Financiación sin intereses sujeta a una sonrisa.
        </p>
      </div>
    </section>
  );
}
