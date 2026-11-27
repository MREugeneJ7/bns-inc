import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Umbrella,
  ShieldCheck,
  Baby,
  Flower,
  PenLine,
  ArrowUpRight,
  ExternalLink,
  Link2,
  Mail,
  Skull,
  Sparkles,
  Check,
  X,
  MapPin,
  BadgePercent,
  Eraser,
  Ban,
  Star,
  Copy,
  Puzzle,
  Rat,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { sisterSites, rejected, outOfFashion, inFashion, type SisterSite } from "../data";

type Theme = {
  icon: LucideIcon;
  badge: LucideIcon;
  gradient: string;
  border: string;
  glow: string;
  accent: string;
  chip: string;
  btn: string;
  iconBox: string;
  label: string;
};

const theme: Record<SisterSite["id"], Theme> = {
  dracula: {
    icon: Umbrella,
    badge: ShieldCheck,
    gradient: "from-[#3a1216] via-[#1d0f12] to-[#0d0d11]",
    border: "border-[#b4343c]/40 hover:border-[#e05560]/80",
    glow: "hover:shadow-[0_20px_70px_rgba(180,52,60,0.25)]",
    accent: "text-[#f08a92]",
    chip: "bg-[#b4343c]/15 border-[#b4343c]/40 text-[#f4b0b5]",
    btn: "bg-[#b4343c] text-white hover:bg-[#d24550]",
    iconBox: "bg-[#b4343c]/20 border-[#b4343c]/40 text-[#f08a92]",
    label: "Seguros · Mediación colegiada",
  },
  barlow: {
    icon: Baby,
    badge: Sparkles,
    gradient: "from-[#2a2112] via-[#17140f] to-[#0d0d11]",
    border: "border-[#e0b25a]/35 hover:border-[#f2cd85]/80",
    glow: "hover:shadow-[0_20px_70px_rgba(224,178,90,0.2)]",
    accent: "text-[#f2cd85]",
    chip: "bg-[#e0b25a]/12 border-[#e0b25a]/35 text-[#f2d9a6]",
    btn: "bg-[#e0b25a] text-black hover:bg-[#f2cd85]",
    iconBox: "bg-[#e0b25a]/15 border-[#e0b25a]/35 text-[#f2cd85]",
    label: "Educación infantil · 0–3 años",
  },
  carmilla: {
    icon: Flower,
    badge: Sparkles,
    gradient: "from-[#2e1424] via-[#190f16] to-[#0d0d11]",
    border: "border-[#c45c8a]/40 hover:border-[#e58bb2]/80",
    glow: "hover:shadow-[0_20px_70px_rgba(196,92,138,0.22)]",
    accent: "text-[#f0a3c4]",
    chip: "bg-[#c45c8a]/15 border-[#c45c8a]/40 text-[#f5c2d8]",
    btn: "bg-[#a8456f] text-white hover:bg-[#b84f7c]",
    iconBox: "bg-[#c45c8a]/20 border-[#c45c8a]/40 text-[#f0a3c4]",
    label: "Bienestar · Terapias manuales",
  },
  strahd: {
    icon: PenLine,
    badge: Sparkles,
    gradient: "from-[#221533] via-[#160f20] to-[#0d0d11]",
    border: "border-[#8b6cc4]/40 hover:border-[#ac8ee6]/80",
    glow: "hover:shadow-[0_20px_70px_rgba(139,108,196,0.22)]",
    accent: "text-[#c9b0f2]",
    chip: "bg-[#8b6cc4]/15 border-[#8b6cc4]/40 text-[#ddcdfa]",
    btn: "bg-[#6f52a8] text-white hover:bg-[#7d5cb8]",
    iconBox: "bg-[#8b6cc4]/20 border-[#8b6cc4]/40 text-[#c9b0f2]",
    label: "Literatura · Narrativa romántica",
  },
};

export function PaginasHermanas() {
  const newcomers = sisterSites.filter((s) => s.isNew).length;

  return (
    <section id="hermanas" className="relative bg-[#070709] border-t border-white/5 overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[300px] bg-[#b4343c]/8 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-[#e0b25a]/6 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-end">
          <div>
            <div className="flex items-center gap-3 text-[#c9a86a] text-[11px] tracking-[0.3em] uppercase">
              <Link2 size={14} /> Círculo de ex-vampiros
            </div>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl text-[#f4efe3] leading-tight">
              Visita nuestras <span className="gold-text italic font-accent">páginas hermanas</span>
            </h2>
            <p className="mt-4 text-stone-400 font-light max-w-xl">
              Todos están dejando el vampirismo. Está pasadísimo de moda. Primero fuimos nosotros; ahora medio Gotha
              tiene negocio con horario de oficina y licencia municipal.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
                <ShieldCheck size={13} /> {sisterSites.length} negocios hermanos
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#c45c8a]/30 bg-[#c45c8a]/10 text-[#f5c2d8]">
                <Eraser size={13} /> {newcomers} fichajes maquillados
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/12 text-stone-400">
                <Ban size={13} /> 1 solicitud denegada
              </span>
            </div>
          </div>

          {/* in / out */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-4">
              <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500 mb-3 flex items-center gap-1.5">
                <Skull size={12} /> Pasado de moda
              </div>
              <ul className="flex flex-col gap-2">
                {outOfFashion.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-stone-500 line-through decoration-[#b4343c]/70">
                    <X size={14} className="shrink-0 mt-0.5 text-[#b4343c]" />
                    <span className="font-light">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-[#c9a86a]/25 bg-[#c9a86a]/[0.04] p-4">
              <div className="text-[10px] tracking-[0.25em] uppercase text-[#c9a86a] mb-3 flex items-center gap-1.5">
                <Sparkles size={12} /> Tendencia 2026
              </div>
              <ul className="flex flex-col gap-2">
                {inFashion.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-stone-200">
                    <Check size={14} className="shrink-0 mt-0.5 text-emerald-400" />
                    <span className="font-light">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <MemberCarousel />

        <DeniedApplication />

        {/* unirse */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-6 rounded-3xl border border-dashed border-[#c9a86a]/30 bg-white/[0.015] p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#c9a86a]/10 border border-[#c9a86a]/25 flex items-center justify-center text-[#c9a86a] shrink-0">
              <Link2 size={20} />
            </div>
            <div>
              <div className="font-display text-xl text-white">¿Tú también colgaste los colmillos?</div>
              <p className="text-sm text-stone-500 mt-1 font-light">
                Si has montado algo decente y con horario, pide plaza en el círculo. Dos requisitos: haber sido vampiro
                (demostrable) y haberlo dejado.
              </p>
            </div>
          </div>
          <a
            href="mailto:circulo@funeraria-carlisle.es?subject=Quiero%20entrar%20en%20el%20c%C3%ADrculo%20de%20ex-vampiros"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-[#c9a86a]/40 text-[#ecd9ab] hover:bg-[#c9a86a] hover:text-black transition text-sm font-medium whitespace-nowrap"
          >
            <Mail size={15} /> Unirme al círculo
          </a>
        </motion.div>
      </div>

      <LinkReel />
    </section>
  );
}

/* ── Carrusel de miembros ───────────────────────────────────────── */

function MemberCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [perView, setPerView] = useState(1);
  const count = sisterSites.length;

  function metrics() {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return { cardW: 0, gap: 0, step: 0 };
    const gap = parseFloat(getComputedStyle(track).columnGap || "24") || 0;
    return { cardW: first.offsetWidth, gap, step: first.offsetWidth + gap };
  }

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      const { gap, step } = metrics();
      if (track && step > 0) {
        setPerView(Math.max(1, Math.floor((track.clientWidth + gap) / step)));
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const pages = Math.max(1, Math.ceil(count / perView));
  const safePage = Math.min(page, pages - 1);

  const goTo = (p: number) => {
    const track = trackRef.current;
    const { step: s } = metrics();
    if (!track || !s) return;
    const target = ((p % pages) + pages) % pages;
    const index = Math.min(target * perView, Math.max(0, count - perView));
    track.scrollTo({ left: index * s, behavior: "smooth" });
    setPage(target);
  };

  const onScroll = () => {
    const { step: s } = metrics();
    if (!s) return;
    const raw = (trackRef.current?.scrollLeft ?? 0) / s;
    setPage(Math.min(pages - 1, Math.max(0, Math.round(raw / perView))));
  };

  return (
    <div className="mt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-[#c9a86a]">Los negocios del círculo</div>
          <div className="mt-1 font-display text-xl text-white">
            {count} socios y contando
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-stone-500">
            <span className="text-[#ecd9ab]">{String(safePage + 1).padStart(2, "0")}</span> / {String(pages).padStart(2, "0")}
          </span>
          <button
            onClick={() => goTo(safePage - 1)}
            aria-label="Miembros anteriores"
            className="h-10 w-10 rounded-full border border-white/15 text-stone-300 hover:bg-[#c9a86a] hover:text-black hover:border-[#c9a86a] transition flex items-center justify-center"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => goTo(safePage + 1)}
            aria-label="Miembros siguientes"
            className="h-10 w-10 rounded-full border border-white/15 text-stone-300 hover:bg-[#c9a86a] hover:text-black hover:border-[#c9a86a] transition flex items-center justify-center"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={onScroll}
        role="region"
        aria-roledescription="carrusel"
        aria-label="Negocios de las páginas hermanas"
        tabIndex={0}
        className="no-scrollbar mt-5 flex items-stretch gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a86a]/60 rounded-3xl"
      >
        {sisterSites.map((site) => (
          <MemberCard key={site.id} site={site} />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {Array.from({ length: pages }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Ir a la página ${i + 1} de ${pages}`}
            aria-current={i === safePage ? "true" : undefined}
            className={`h-1.5 rounded-full transition-all ${i === safePage ? "w-8 bg-[#c9a86a]" : "w-1.5 bg-white/20 hover:bg-white/40"}`}
          />
        ))}
        <span className="ml-3 text-[11px] text-stone-600">Desliza para ver más</span>
      </div>
    </div>
  );
}

/* ── Tarjeta de miembro ─────────────────────────────────────────── */

function MemberCard({ site }: { site: SisterSite }) {
  const [showDraft, setShowDraft] = useState(false);
  const t = theme[site.id];
  const Icon = t.icon;
  const Badge = t.badge;
  const hasDraft = Boolean(site.before?.length);

  return (
    <article
      role="group"
      aria-roledescription="diapositiva"
      className={`group relative flex h-auto w-full shrink-0 snap-start flex-col rounded-3xl border bg-gradient-to-br ${t.gradient} ${t.border} ${t.glow} p-6 sm:p-7 lg:w-[calc(50%-12px)] transition-all duration-300`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className={`h-14 w-14 rounded-2xl border flex items-center justify-center ${t.iconBox}`}>
          <Icon size={26} />
        </div>
        <div className="flex flex-col items-end gap-2">
          {site.isNew && (
            <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase px-3 py-1 rounded-full bg-[#a8456f] text-white font-semibold">
              <Sparkles size={11} /> Nueva incorporación
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase px-3 py-1.5 rounded-full border ${t.chip}`}>
            <Badge size={12} /> {t.label}
          </span>
        </div>
      </div>

      <h3 className="mt-5 font-display text-2xl sm:text-[26px] leading-tight text-white">{site.name}</h3>
      <p className={`mt-2 font-accent italic text-xl ${t.accent}`}>“{site.tagline}”</p>
      <p className="mt-3 text-sm text-stone-400 font-light leading-relaxed">{site.desc}</p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500">Servicios</div>
        {hasDraft && (
          <button
            type="button"
            onClick={() => setShowDraft((v) => !v)}
            aria-pressed={showDraft}
            aria-label={`${showDraft ? "Ocultar" : "Ver"} el borrador original de ${site.name}`}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] transition ${
              showDraft
                ? "border-white/40 bg-white/10 text-white"
                : "border-white/15 text-stone-300 hover:border-white/40 hover:text-white"
            }`}
          >
            <Eraser size={12} />
            {showDraft ? "Ocultar borrador" : "Ver borrador original"}
          </button>
        )}
      </div>

      <ul className="mt-3 flex flex-col gap-2.5 text-sm">
        {site.bullets.map((b, i) => (
          <li key={b} className="flex items-start gap-2.5 text-stone-200 font-light">
            <Check size={15} className={`shrink-0 mt-0.5 ${t.accent}`} />
            <span>
              <AnimatePresence initial={false}>
                {showDraft && site.before?.[i] && (
                  <motion.del
                    key="draft"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="block overflow-hidden line-through text-[#f0a3c4]/75 decoration-[#c45c8a]"
                  >
                    {site.before[i]}
                  </motion.del>
                )}
              </AnimatePresence>
              <span className="block">{b}</span>
            </span>
          </li>
        ))}
      </ul>

      {hasDraft && (
        <p className="mt-3 text-[11px] text-stone-500 leading-relaxed">
          Texto maquillado por Esme en tres rondas de corrección. Misma mano que con Carmilla.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <MapPin size={13} /> {site.seat}
        </span>
        <span className="flex items-center gap-1.5 text-emerald-300/90">
          <ShieldCheck size={13} /> Ex-vampiro verificado
        </span>
      </div>

      <div className="pt-5 mt-auto border-t border-white/10 flex flex-col gap-4">
        <span className="inline-flex items-center gap-2 text-xs text-[#ecd9ab]">
          <BadgePercent size={15} className="text-[#c9a86a] shrink-0" />
          {site.perk}
        </span>
        <a
          href={site.url}
          className={`group/btn inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition ${t.btn}`}
        >
          {site.domain}
          <ArrowUpRight size={16} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition" />
        </a>
      </div>
    </article>
  );
}

/* ── Solicitud denegada ─────────────────────────────────────────── */

const reasonIcons: LucideIcon[] = [Copy, Puzzle, Rat];

function DeniedApplication() {
  const r = rejected;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative mt-8 rounded-3xl border border-[#7d8a66]/25 bg-gradient-to-br from-[#15170f] via-[#101110] to-[#0c0c10] p-7 sm:p-8"
    >
      <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-8 lg:gap-12">
        <div>
          <div className="flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-[#a9b58f]">
            <Ban size={14} /> Solicitud denegada · {r.file}
          </div>
          <h3 className="mt-4 font-display text-2xl sm:text-[28px] leading-tight text-stone-200">
            {r.name}, <span className="font-accent italic text-stone-400">«{r.alias}»</span>
          </h3>
          <p className="mt-1.5 text-sm text-stone-400">{r.business}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-stone-500">
            <MapPin size={13} /> {r.seat}
          </p>
          <p className="mt-4 text-sm text-stone-400 font-light leading-relaxed">
            Pidió plaza en el círculo y la junta votó que no. No enlazamos su web hasta que se aclare lo suyo.
          </p>
          <div className="mt-6 inline-flex -rotate-6 items-center rounded-md border-2 border-[#d24550]/70 px-4 py-2 font-display text-sm uppercase tracking-[0.3em] text-[#e8727c]">
            Denegada
          </div>
        </div>

        <ol className="flex flex-col gap-4">
          {r.reasons.map((reason, i) => {
            const Icon = reasonIcons[i] ?? Ban;
            return (
              <li key={reason.title} className="flex gap-4 rounded-2xl border border-white/8 bg-black/25 p-4 sm:p-5">
                <div className="h-10 w-10 shrink-0 rounded-xl border border-[#7d8a66]/30 bg-[#7d8a66]/10 flex items-center justify-center text-[#a9b58f]">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500">Motivo {i + 1}</div>
                  <div className="mt-0.5 text-white font-medium">{reason.title}</div>
                  <p className="mt-1 text-sm text-stone-400 font-light leading-relaxed">{reason.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* reseñas */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500">
              Motivo {r.reasons.length + 1} · Las reseñas
            </div>
            <div className="mt-1 font-display text-xl text-white">No paran de llegarnos quejas de su clínica</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-display text-4xl leading-none text-[#e8727c]">{r.rating}</span>
            <span className="text-xs text-stone-500 leading-snug">
              de 5
              <br />
              {r.reviewCount.toLocaleString("es-ES")} reseñas
            </span>
          </div>
        </div>

        <div className="mt-5 grid md:grid-cols-3 gap-4">
          {r.reviews.map((rev) => (
            <figure key={rev.text} className="rounded-2xl border border-white/8 bg-black/25 p-5">
              <div className="flex gap-0.5" role="img" aria-label="1 de 5 estrellas">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i === 0 ? "fill-[#c9a86a] text-[#c9a86a]" : "text-stone-700"} />
                ))}
              </div>
              <blockquote className="mt-3 font-accent italic text-lg leading-snug text-stone-200">“{rev.text}”</blockquote>
              <figcaption className="mt-3 text-xs text-stone-500">
                {rev.author} · {rev.place}
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mt-5 text-xs text-stone-500">
          Podrá volver a solicitarlo cuando Sanidad cierre el expediente y Drácula retire la demanda.
        </p>
      </div>
    </motion.article>
  );
}

/* ── Reel de enlaces ────────────────────────────────────────────── */

type ReelItem = { site: SisterSite } | { note: string };

function LinkReel() {
  const notes = [
    "Pasado de moda: chupar cuellos",
    "Tendencia 2026: dejar el vampirismo",
    `${rejected.alias}: solicitud denegada`,
  ];
  const items = sisterSites.flatMap((site, i): ReelItem[] =>
    notes[i] ? [{ site }, { note: notes[i] }] : [{ site }]
  );
  // 8 tandas idénticas: la animación recorre la mitad y vuelve a empezar sin salto
  const sets = Array.from({ length: 8 });

  return (
    <nav
      aria-label="Páginas hermanas"
      className="relative border-t border-[#c9a86a]/20 bg-[#0b0b0f] overflow-hidden motion-reduce:overflow-x-auto group"
    >
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0b0b0f] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0b0b0f] to-transparent z-10 pointer-events-none" />
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#c9a86a] text-black text-[10px] tracking-[0.2em] uppercase font-semibold pointer-events-none">
        <Link2 size={12} /> Círculo
      </div>
      <div
        className="flex w-max animate-marquee py-5 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
        style={{ animationDuration: "140s" }}
      >
        {sets.map((_, k) => (
          <div key={k} className="flex items-center" aria-hidden={k > 0 || undefined}>
            {items.map((it, i) =>
              "site" in it ? (
                <a
                  key={i}
                  href={it.site.url}
                  tabIndex={k > 0 ? -1 : undefined}
                  className="flex items-center gap-3 px-6 text-[13px] tracking-[0.18em] uppercase text-[#ecd9ab] hover:text-white transition whitespace-nowrap"
                >
                  {it.site.short}
                  <span className="text-[11px] normal-case tracking-normal text-stone-500">{it.site.domain}</span>
                  <ExternalLink size={13} className="text-[#c9a86a]" />
                  <span className="ml-3 text-[#c9a86a]/30">✦</span>
                </a>
              ) : (
                <span key={i} className="flex items-center gap-3 px-6 text-[12px] tracking-[0.18em] uppercase text-stone-500 whitespace-nowrap">
                  {it.note}
                  <span className="ml-3 text-[#c9a86a]/30">✦</span>
                </span>
              )
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
