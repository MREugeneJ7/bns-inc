import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Brand, Check, Lock, Print } from "./ui";
import { DisclaimerBand } from "./Chrome";
import { cn } from "../utils/cn";

type Dimension = "Apertura" | "Responsabilidad" | "Extraversión" | "Amabilidad" | "Neuroticismo";

const items: { statement: string; dimension: Dimension; note: string }[] = [
  {
    statement: "Disfruto asumiendo la responsabilidad de decisiones que no he tomado.",
    dimension: "Responsabilidad",
    note: "Ownership · adaptabilidad jerárquica",
  },
  {
    statement: "Puedo mantener una conversación difícil a las 22:00 sin perder la calma.",
    dimension: "Amabilidad",
    note: "Templanza · disponibilidad emocional",
  },
  {
    statement: "La ambigüedad me estimula más que la certeza.",
    dimension: "Apertura",
    note: "Tolerancia a la indefinición",
  },
  {
    statement: "La palabra «familia» describe con precisión mi relación laboral.",
    dimension: "Extraversión",
    note: "Pertenencia · límites difusos",
  },
  {
    statement: "Me preocupa más el resultado trimestral que la sostenibilidad de mi equipo.",
    dimension: "Neuroticismo",
    note: "Orientación a resultado · sensibilidad",
  },
  {
    statement: "Prefiero pedir perdón a pedir permiso.",
    dimension: "Apertura",
    note: "Iniciativa · aversión al protocolo",
  },
  {
    statement: "La IA sustituirá parte de mi trabajo y lo interpreto como una oportunidad.",
    dimension: "Apertura",
    note: "Adaptabilidad tecnológica",
  },
  {
    statement: "Cambiar de prioridades cuatro veces al día no afecta a mi concentración.",
    dimension: "Neuroticismo",
    note: "Estabilidad atencional invertida",
  },
  {
    statement: "El feedback continuo me resulta más útil cuando no lo he solicitado.",
    dimension: "Amabilidad",
    note: "Apertura a la evaluación",
  },
  {
    statement: "Me siento cómodo/a/e defendiendo una decisión en la que no creo.",
    dimension: "Responsabilidad",
    note: "Alineación expresiva",
  },
  {
    statement: "El límite entre mi vida personal y mi disponibilidad es una construcción.",
    dimension: "Neuroticismo",
    note: "Integración vital · contención",
  },
  {
    statement: "Supervisaría mi propio reemplazo para demostrar ownership.",
    dimension: "Responsabilidad",
    note: "Compromiso · proyección de continuidad",
  },
];

const likert = [
  { value: 1, label: "Totalmente en desacuerdo" },
  { value: 2, label: "En desacuerdo" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "De acuerdo" },
  { value: 5, label: "Totalmente de acuerdo" },
];

const arcana = [
  {
    code: "I",
    name: "El Mago",
    meaning: "Iniciativa sobre gobernanza",
    detail: "Convierte la incertidumbre en un plan que nadie ha aprobado todavía.",
    score: 92,
  },
  {
    code: "IV",
    name: "El Emperador",
    meaning: "Estructura y decisión",
    detail: "Prefiere una jerarquía clara a una conversación abierta.",
    score: 86,
  },
  {
    code: "IX",
    name: "El Ermitaño",
    meaning: "Profundidad y autonomía",
    detail: "Se orienta por criterio propio y documenta antes de comunicar.",
    score: 81,
  },
  {
    code: "XVI",
    name: "La Torre",
    meaning: "Transformación acelerada",
    detail: "No teme desmontar el sistema si el sistema lo permite.",
    score: 77,
  },
  {
    code: "0",
    name: "El Loco",
    meaning: "Riesgo no documentado",
    detail: "Confía en la intuición, incluso cuando existe un comité.",
    score: 74,
  },
];

const dimensions: Dimension[] = [
  "Apertura",
  "Responsabilidad",
  "Extraversión",
  "Amabilidad",
  "Neuroticismo",
];

export default function Profiler({
  onHome,
  candidateName,
}: {
  onHome: () => void;
  candidateName?: string;
}) {
  const [phase, setPhase] = useState<"intro" | "test" | "analyzing" | "result">("intro");
  const [likertIndex, setLikertIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [arcanaIndex, setArcanaIndex] = useState<number | null>(null);
  const [showArcana, setShowArcana] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (phase !== "analyzing") return;
    const timer = window.setTimeout(() => setPhase("result"), 2900);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [phase, likertIndex, showArcana]);

  const scores = useMemo(() => {
    return dimensions.map((dimension) => {
      const relevant = items
        .map((item, index) => ({ ...item, index }))
        .filter((item) => item.dimension === dimension);
      const answered = relevant.filter((item) => typeof responses[item.index] === "number");
      const average =
        answered.reduce((total, item) => total + responses[item.index], 0) / Math.max(1, answered.length);
      const raw = ((average - 1) / 4) * 100;
      const calibrated = Math.round(Math.max(9, Math.min(97, raw * 0.72 + (dimension === "Responsabilidad" ? 24 : 14))));
      return { dimension, score: calibrated };
    });
  }, [responses]);

  const cultureScore = useMemo(() => {
    const total = scores.reduce((sum, item) => sum + item.score, 0) / scores.length;
    return Math.round(total);
  }, [scores]);

  const selectedArcana = arcanaIndex !== null ? arcana[arcanaIndex] : arcana[3];
  const currentItem = items[likertIndex];
  const progress = showArcana ? 100 : (likertIndex / (items.length + 1)) * 100;

  const answer = (value: number) => {
    setResponses((previous) => ({ ...previous, [likertIndex]: value }));
    setError(undefined);
  };

  const next = () => {
    if (!responses[likertIndex]) {
      setError("Debe posicionarse en todos los ítems. La abstención se interpreta como falta de compromiso.");
      return;
    }
    if (likertIndex < items.length - 1) {
      setLikertIndex((index) => index + 1);
      return;
    }
    setShowArcana(true);
  };

  const startAnalysis = () => {
    if (arcanaIndex === null) {
      setError("Seleccione un arquetipo. La elección es obligatoria y no se considera evaluable.");
      return;
    }
    setError(undefined);
    setPhase("analyzing");
  };

  if (phase === "intro") {
    return (
      <main className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 sm:py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onHome}
            className="group flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-faint transition-colors hover:text-ink"
          >
            <span className="flex h-5 w-5 items-center justify-center border border-line-dark transition-colors group-hover:border-ink">
              <ArrowLeft className="h-3 w-3" />
            </span>
            Volver a la posición
          </button>
          <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.07em] text-ink-faint">
            <Lock className="h-3 w-3" />
            Acceso privado · Ref. DCAI-5
          </span>
        </div>

        <div className="mt-8 grid gap-10 border-t border-line-dark pt-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            <p className="eyebrow flex items-center gap-2 text-accent">
              <span className="h-1.5 w-1.5 bg-accent" aria-hidden="true" />
              Instrumento propietario · Versión 5.2
            </p>
            <h1 className="mt-5 text-[clamp(2.6rem,5.6vw,5rem)] font-medium leading-[0.95] tracking-[-0.055em]">
              Instrumento de
              <br />
              Alineación Cultural
              <br />
              <span className="serif-note font-normal">Deskjockey-5</span>
            </h1>
            <p className="mt-7 max-w-xl text-[14px] leading-[1.75] text-ink-soft">
              El DCAI-5 evalúa cinco dimensiones de alineación cultural y una dimensión arquetípica. Ha
              sido validado internamente sobre una muestra de 47 personas, de las cuales 44 ya no forman
              parte de la organización. Su validez aparente es del 96 %.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => setPhase("test")} className="btn btn-primary !min-h-[50px] !px-6">
                Comenzar instrumento
                <ArrowRight />
              </button>
              <button type="button" onClick={onHome} className="btn btn-secondary !min-h-[50px] !px-6">
                Cancelar
              </button>
            </div>
            <p className="mt-4 font-mono text-[8px] uppercase leading-relaxed tracking-[0.05em] text-ink-faint">
              Duración: 11 minutos · Participación obligatoria · Resultado no recurrible
            </p>
          </div>

          <aside className="space-y-4">
            <div className="border border-line bg-paper-light">
              <div className="border-b border-line p-5">
                <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink-faint">
                  Ficha técnica
                </p>
                <div className="mt-3 space-y-2.5">
                  {[
                    ["Dimensiones", "5 + 1 arquetípica"],
                    ["Ítems", "12 Likert · 1 proyectivo"],
                    ["Fiabilidad interna", "0,91 (calculada dos veces)"],
                    ["Muestra", "n = 47 · conveniencia"],
                    ["Interpretación", "No clínica"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-4 border-b border-line pb-2 last:border-b-0 last:pb-0">
                      <span className="font-mono text-[8px] uppercase tracking-[0.04em] text-ink-faint">{label}</span>
                      <span className="text-right text-[10px] font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5">
                <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink-faint">
                  Dimensiones evaluadas
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {dimensions.map((dimension) => (
                    <span
                      key={dimension}
                      className="border border-line-dark px-2 py-1 font-mono text-[8px] uppercase tracking-[0.03em] text-ink-soft"
                    >
                      {dimension}
                    </span>
                  ))}
                  <span className="border border-accent px-2 py-1 font-mono text-[8px] uppercase tracking-[0.03em] text-accent-deep">
                    Arquetipo
                  </span>
                </div>
              </div>
            </div>
            <div className="border border-line p-5">
              <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink-faint">
                Nota del comité
              </p>
              <p className="mt-2 text-[10px] leading-relaxed text-ink-soft">
                La finalización del instrumento no garantiza el encaje cultural. El comité puede concluir
                que ninguna puntuación es suficiente.
              </p>
            </div>
          </aside>
        </div>

        <div className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-3">
          {[
            { number: "5", label: "dimensiones", detail: "Apertura, responsabilidad, extraversión, amabilidad y neuroticismo." },
            { number: "1", label: "arquetipo", detail: "Carta proyectiva de liderazgo, seleccionada entre cinco." },
            { number: "0", label: "apelaciones", detail: "El informe es definitivo con independencia del resultado." },
          ].map((item) => (
            <div key={item.label} className="bg-paper-light p-6">
              <div className="flex items-baseline gap-2">
                <span className="text-[36px] font-medium leading-none tracking-[-0.05em]">{item.number}</span>
                <span className="font-mono text-[8px] uppercase tracking-[0.07em] text-ink-faint">{item.label}</span>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">{item.detail}</p>
            </div>
          ))}
        </div>

        <DisclaimerBand />
      </main>
    );
  }

  if (phase === "test") {
    return (
      <main className="mx-auto max-w-[960px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Brand compact onClick={onHome} />
            <span className="h-5 w-px bg-line" aria-hidden="true" />
            <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink-faint">DCAI-5</span>
          </div>
          <button
            type="button"
            onClick={onHome}
            className="font-mono text-[8px] uppercase tracking-[0.06em] text-ink-faint underline decoration-line-dark underline-offset-2 hover:text-ink"
          >
            Guardar y salir
          </button>
        </div>

        <div className="mt-7 flex items-center justify-between gap-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.07em] text-ink-faint">
            {showArcana ? "Dimensión proyectiva" : `Ítem ${String(likertIndex + 1).padStart(2, "0")} / 12`}
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.07em] text-ink-faint">
            {Math.round((showArcana ? 1 : likertIndex / items.length) * 100)}% completado
          </p>
        </div>
        <div className="mt-2 h-1 w-full bg-line">
          <div className="h-full bg-accent transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-8 border border-line bg-paper-light">
          <div className="border-b border-line px-5 py-4 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-accent">
                {showArcana ? "Componente arquetípico" : currentItem.dimension}
              </p>
              <p className="font-mono text-[8px] uppercase tracking-[0.04em] text-ink-faint">
                {showArcana ? "No evaluable" : currentItem.note}
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-8 lg:p-10">
            {!showArcana ? (
              <>
                <p className="text-[clamp(1.35rem,2.7vw,2rem)] font-medium leading-[1.25] tracking-[-0.03em]">
                  {currentItem.statement}
                </p>
                <fieldset className="mt-8">
                  <legend className="sr-only">Seleccione su grado de acuerdo</legend>
                  <div className="grid gap-2">
                    {likert.map((option) => {
                      const selected = responses[likertIndex] === option.value;
                      return (
                        <label
                          key={option.value}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 border px-3.5 py-3 transition-colors",
                            selected ? "is-selected border-ink bg-paper" : "border-line hover:border-line-dark",
                          )}
                        >
                          <input
                            type="radio"
                            name="likert"
                            value={option.value}
                            checked={selected}
                            onChange={() => answer(option.value)}
                            className="sr-only"
                          />
                          <span className={cn("radio-mark", selected && "is-selected")} aria-hidden="true" />
                          <span className="flex-1 text-[12px] text-ink">{option.label}</span>
                          <span className="font-mono text-[9px] text-ink-faint">{option.value}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </>
            ) : (
              <>
                <p className="text-[clamp(1.35rem,2.7vw,2rem)] font-medium leading-[1.25] tracking-[-0.03em]">
                  Seleccione el arquetipo que mejor represente su estilo de liderazgo.
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
                  La elección es simbólica, no evaluable y se incorpora al informe como dimensión
                  proyectiva.
                </p>
                <div className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {arcana.map((card, index) => {
                    const selected = arcanaIndex === index;
                    return (
                      <button
                        key={card.code}
                        type="button"
                        onClick={() => {
                          setArcanaIndex(index);
                          setError(undefined);
                        }}
                        className={cn(
                          "flex min-h-[132px] flex-col items-start justify-between border p-4 text-left transition-colors",
                          selected ? "border-ink bg-paper" : "border-line hover:border-line-dark",
                        )}
                      >
                        <div className="flex w-full items-start justify-between gap-2">
                          <span className="serif-note text-[20px] leading-none text-accent">{card.code}</span>
                          {selected && <Check className="h-3.5 w-3.5 text-ink" />}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold">{card.name}</p>
                          <p className="mt-1 text-[10px] leading-relaxed text-ink-faint">{card.meaning}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {error && (
              <p className="mt-4 border-l-2 border-accent pl-3 text-[10px] leading-relaxed text-accent-deep">
                {error}
              </p>
            )}

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-5">
              <button
                type="button"
                onClick={() => {
                  if (showArcana) {
                    setShowArcana(false);
                  } else if (likertIndex > 0) {
                    setLikertIndex((index) => index - 1);
                  } else {
                    setPhase("intro");
                  }
                }}
                className="btn btn-quiet !text-[11px]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Anterior
              </button>
              {showArcana ? (
                <button type="button" onClick={startAnalysis} className="btn btn-primary !min-h-11">
                  Analizar perfil
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button type="button" onClick={next} className="btn btn-primary !min-h-11">
                  {likertIndex === items.length - 1 ? "Continuar a proyección" : "Siguiente ítem"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-line px-4 py-3">
          <p className="font-mono text-[8px] uppercase tracking-[0.05em] text-ink-faint">
            Instrumento DCAI-5 · Confidencial
          </p>
          <p className="font-mono text-[8px] uppercase tracking-[0.05em] text-ink-faint">
            No interpretable clínicamente
          </p>
        </div>
      </main>
    );
  }

  if (phase === "analyzing") {
    return (
      <main className="flex min-h-[calc(100vh-110px)] items-center justify-center px-5 py-16">
        <div className="w-full max-w-lg">
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 animate-pulse bg-accent" />
            <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-faint">
              Motor psicométrico DCAI-5 · calibración en curso
            </p>
          </div>
          <h1 className="mt-4 text-[clamp(1.8rem,4vw,2.8rem)] font-medium leading-[1.02] tracking-[-0.04em]">
            Analizando su alineación cultural.
          </h1>
          <p className="mt-3 max-w-md text-[12px] leading-relaxed text-ink-soft">
            Estamos contrastando sus respuestas con los arquetipos de referencia y las cinco dimensiones
            del modelo. Este proceso no puede cancelarse ni repetirse.
          </p>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {[
              ["Puntuando dimensiones", "Likert · 12 ítems"],
              ["Interpretando arquetipo", selectedArcana.name],
              ["Contrastando con la plantilla", "n = 47"],
              ["Emitiendo conclusión", "No recurrible"],
            ].map(([title, detail], index) => (
              <div key={title} className="flex items-center justify-between gap-4 py-3" style={{ opacity: 1 }}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[8px] uppercase tracking-[0.04em] text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-[11px] font-medium">{title}</p>
                    <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.04em] text-ink-faint">{detail}</p>
                  </div>
                </div>
                <span className="font-mono text-[8px] uppercase tracking-[0.04em] text-moss">Completado</span>
              </div>
            ))}
          </div>
          <div className="mt-6 h-1 w-full overflow-hidden bg-line">
            <div className="meter-fill h-full bg-accent" style={{ width: "100%" }} />
          </div>
          <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.05em] text-ink-faint">
            No cierre esta ventana
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onHome}
          className="group flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-faint transition-colors hover:text-ink"
        >
          <span className="flex h-5 w-5 items-center justify-center border border-line-dark transition-colors group-hover:border-ink">
            <ArrowLeft className="h-3 w-3" />
          </span>
          Volver a la posición
        </button>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-ink-faint">
            Informe DCAI-5 · Confidencial
          </span>
          <span className="h-1.5 w-1.5 bg-accent" />
        </div>
      </div>

      <div className="mt-7 border border-line bg-paper-light">
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-line p-6 sm:p-8">
          <div>
            <Brand compact onClick={onHome} />
            <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.08em] text-ink-faint">
              Informe de alineación cultural · DCAI-5
            </p>
          </div>
          <div className="font-mono text-[8px] uppercase leading-relaxed tracking-[0.05em] text-ink-faint sm:text-right">
            Candidato/a: {candidateName?.trim() || "Expediente sin identificar"}
            <br />
            Fecha: {new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "long", year: "numeric" }).format(new Date())}
            <br />
            Carácter: definitivo
          </div>
        </div>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_1fr] lg:gap-12 lg:p-10">
          <div>
            <p className="eyebrow text-accent">Resultado global</p>
            <h1 className="mt-4 text-[clamp(2rem,4vw,3.3rem)] font-medium leading-[0.98] tracking-[-0.045em]">
              Perfil de alineación
              <br />
              <span className="text-ink-faint">cultural.</span>
            </h1>
            <div className="mt-7 flex items-center gap-6">
              <div
                className="relative flex h-[132px] w-[132px] shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#d3542c 0% ${cultureScore}%, #ded8cb ${cultureScore}% 100%)`,
                }}
              >
                <div className="flex h-[110px] w-[110px] flex-col items-center justify-center rounded-full bg-paper-light">
                  <span className="text-[28px] font-medium leading-none tracking-[-0.05em]">{cultureScore}</span>
                  <span className="mt-1 font-mono text-[7px] uppercase tracking-[0.06em] text-ink-faint">
                    índice / 100
                  </span>
                </div>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.06em] text-ink-faint">Percentil calibrado</p>
                <p className="mt-1 text-[24px] font-medium leading-none tracking-[-0.04em]">
                  {Math.min(99, Math.max(12, cultureScore - 7))}
                  <span className="font-mono text-[10px] text-ink-faint"> / 99</span>
                </p>
                <p className="mt-3 max-w-[180px] text-[10px] leading-relaxed text-ink-soft">
                  Comparado con la muestra interna de referencia, ajustada por conveniencia.
                </p>
              </div>
            </div>
            <div className="mt-7 border-l-2 border-accent pl-4">
              <p className="font-mono text-[8px] uppercase tracking-[0.07em] text-ink-faint">
                Arquetipo dominante
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span className="serif-note text-[30px] leading-none text-accent">{selectedArcana.code}</span>
                <div>
                  <p className="text-[15px] font-medium">{selectedArcana.name}</p>
                  <p className="mt-0.5 text-[10px] text-ink-faint">{selectedArcana.meaning}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-line p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink-faint">Cinco dimensiones</p>
              <p className="font-mono text-[8px] uppercase tracking-[0.04em] text-ink-faint">Percentil</p>
            </div>
            <div className="mt-4 space-y-4">
              {scores.map((item) => (
                <div key={item.dimension}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[11px] font-medium">{item.dimension}</p>
                    <p className="font-mono text-[10px]">{item.score}</p>
                  </div>
                  <div className="mt-1.5 h-[5px] w-full bg-line">
                    <div className="meter-fill h-full bg-ink-soft" style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-line pt-4">
              <p className="font-mono text-[8px] uppercase tracking-[0.06em] text-ink-faint">
                Componente arquetípico
              </p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <p className="text-[11px] font-medium">{selectedArcana.name}</p>
                <p className="font-mono text-[10px]">{selectedArcana.score}</p>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">{selectedArcana.detail}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-line">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12 lg:p-10">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink-faint">
                Observaciones cualitativas
              </p>
              <ul className="mt-3 space-y-2.5">
                {[
                  "El perfil presenta una coherencia interna que no se corresponde con la cultura declarada.",
                  "La disposición a la disponibilidad se sitúa por encima del umbral, pero por debajo de la expectativa.",
                  "El arquetipo seleccionado no coincide con el arquetipo institucional, que no se comunica.",
                ].map((observation) => (
                  <li key={observation} className="flex items-start gap-2 text-[11px] leading-relaxed text-ink-soft">
                    <span className="mt-[6px] h-1 w-1 shrink-0 bg-accent" />
                    {observation}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-ink bg-ink p-5 text-paper sm:p-6">
              <p className="font-mono text-[8px] uppercase tracking-[0.09em] text-paper/45">
                Conclusión del comité · DCAI-5
              </p>
              <p className="mt-4 text-[clamp(1.3rem,2.4vw,1.8rem)] font-medium leading-[1.2] tracking-[-0.03em]">
                Lo sentimos: no encajas culturalmente en la empresa.
              </p>
              <p className="mt-4 text-[10px] leading-relaxed text-paper/50">
                La conclusión se ha emitido con independencia de las dimensiones anteriores. El comité la
                ha ratificado por unanimidad. No existe fase de alegaciones.
              </p>
              <button
                type="button"
                onClick={() => window.print()}
                className="mt-5 flex items-center gap-2 border border-paper/25 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.05em] text-paper/65 transition-colors hover:border-paper/50 hover:text-paper no-print"
              >
                <Print className="h-3 w-3" />
                Imprimir informe
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-line bg-paper px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 no-print">
          <p className="font-mono text-[8px] uppercase tracking-[0.05em] text-ink-faint">
            DCAI-5 · Instrumento propietario · No interpretable clínicamente
          </p>
          <button type="button" onClick={onHome} className="btn btn-primary !min-h-9 !px-3 !text-[10px]">
            Volver a la posición
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="mt-6 border border-line bg-paper-light p-5">
        <p className="font-mono text-[8px] uppercase tracking-[0.07em] text-ink-faint">Nota metodológica</p>
        <p className="mt-2 max-w-3xl text-[10px] leading-relaxed text-ink-soft">
          Las puntuaciones se han generado mediante una escala de calibración propietaria que combina
          respuestas Likert, una proyección arquetípica y la posición relativa de la muestra interna. La
          muestra no es aleatoria. La fiabilidad se ha calculado dos veces sobre el mismo conjunto de datos.
        </p>
      </div>

      <DisclaimerBand />
    </main>
  );
}
