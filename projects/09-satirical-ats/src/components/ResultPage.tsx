import type { ScoreResult } from "../lib/scoring";
import { formatPercent } from "../lib/scoring";
import { ArrowRight, ArrowUpRight, Brand, Check, Lock, Print } from "./ui";
import { DisclaimerBand } from "./Chrome";
import { cn } from "../utils/cn";

export default function ResultPage({
  result,
  reference,
  candidateName,
  onHome,
  onApply,
  onProfiler,
}: {
  result: ScoreResult;
  reference: string;
  candidateName: string;
  onHome: () => void;
  onApply: () => void;
  onProfiler: () => void;
}) {
  const date = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(result.submittedAt));
  const firstName =
    !candidateName || /candidatura|expediente/i.test(candidateName)
      ? "candidato/a"
      : candidateName.trim().split(" ")[0];
  const salutation = result.reference ? "candidato/a de referencia" : firstName;
  const passed = result.passed;

  return (
    <main className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onHome}
          className="group flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-faint transition-colors hover:text-ink"
        >
          <span className="flex h-5 w-5 items-center justify-center border border-line-dark transition-colors group-hover:border-ink">
            <ArrowRight className="h-3 w-3 rotate-180" />
          </span>
          Volver a la posición
        </button>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.07em] text-ink-faint">Ref. {reference}</span>
          <span className={cn("h-1.5 w-1.5", passed ? "bg-moss" : "bg-accent")} aria-hidden="true" />
          <span className={cn("font-mono text-[9px] uppercase tracking-[0.07em]", passed ? "text-moss" : "text-accent-deep")}>
            {passed ? "Supera umbral" : "Candidatura cerrada"}
          </span>
        </div>
      </div>

      {result.reference && (
        <div className="mt-8 border border-line-dark bg-paper-deep/50 px-4 py-2.5">
          <p className="font-mono text-[8px] uppercase tracking-[0.07em] text-ink-soft">
            Expediente de referencia generado desde el comité de evaluación · Datos sintéticos · Sin
            valor contractual
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:gap-10">
        <article className="border border-line bg-paper-light">
          <div className="flex flex-wrap items-start justify-between gap-5 border-b border-line p-6 sm:p-8">
            <div>
              <Brand compact onClick={onHome} />
              <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.08em] text-ink-faint">
                Talent Acquisition · Resolución del comité
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-mono text-[8px] uppercase tracking-[0.07em] text-ink-faint">Referencia</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.03em]">{reference}</p>
              <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.05em] text-ink-faint">{date}</p>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            {passed ? (
              <>
                <p className="eyebrow flex items-center gap-2 text-moss">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-moss text-paper-light">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  Candidatura aplicada con éxito
                </p>
                <h1 className="mt-5 max-w-2xl text-[clamp(2rem,4vw,3.4rem)] font-medium leading-[1.01] tracking-[-0.045em]">
                  Su candidatura ha superado el umbral interno.
                </h1>
                <p className="mt-5 max-w-xl text-[13px] leading-[1.8] text-ink-soft">
                  Estimado/a {salutation}:
                </p>
                <p className="mt-3 max-w-xl text-[13px] leading-[1.8] text-ink-soft">
                  Gracias por la profundidad de su expediente. La evaluación ha concluido con una
                  puntuación interna de{" "}
                  <span className="font-semibold text-ink">{formatPercent(result.overall)}</span>, superior
                  al umbral exigido del 95,0 %. Su perfil ha sido trasladado al comité, que ha activado la
                  siguiente fase del protocolo de alineación.
                </p>

                <div className="mt-8 border border-ink bg-paper">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
                    <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink-faint">
                      Fase obligatoria · DCAI-5
                    </p>
                    <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-accent">
                      11 minutos
                    </span>
                  </div>
                  <div className="p-4 sm:p-5">
                    <h2 className="text-[20px] font-medium leading-tight tracking-[-0.03em]">
                      Instrumento de Alineación Cultural
                    </h2>
                    <p className="mt-2.5 text-[11px] leading-relaxed text-ink-soft">
                      Antes de la siguiente conversación, complete el perfilador psicométrico propietario
                      de cinco dimensiones. El instrumento incorpora un componente arquetípico validado
                      internamente. La finalización es obligatoria para continuar.
                    </p>
                    <button type="button" onClick={onProfiler} className="btn btn-accent mt-4 w-full sm:w-auto">
                      Acceder al instrumento
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                    <p className="mt-3 break-all font-mono text-[8px] leading-relaxed tracking-[0.04em] text-ink-faint">
                      <a
                        href="#dcai-5"
                        onClick={(event) => {
                          event.preventDefault();
                          onProfiler();
                        }}
                        className="underline decoration-line-dark underline-offset-2 transition-colors hover:text-accent"
                      >
                        deskjockey.for.life/talento/dcai-5
                      </a>{" "}
                      · acceso mediante referencia
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-[11px] leading-relaxed text-ink-faint">
                  La superación de esta fase no constituye una oferta de empleo, una promesa de
                  incorporación ni una garantía de continuidad en el proceso.
                </p>
                <Signature date={date} />
              </>
            ) : (
              <>
                <p className="eyebrow flex items-center gap-2 text-accent-deep">
                  <span className="h-1.5 w-1.5 bg-accent" aria-hidden="true" />
                  Actualización de candidatura
                </p>
                <h1 className="mt-5 max-w-2xl text-[clamp(2rem,4vw,3.4rem)] font-medium leading-[1.01] tracking-[-0.045em]">
                  Actualización sobre su candidatura.
                </h1>
                <p className="mt-6 max-w-xl text-[13px] leading-[1.8] text-ink-soft">
                  Estimado/a {salutation}:
                </p>
                <p className="mt-3 max-w-xl text-[13px] leading-[1.8] text-ink-soft">
                  Gracias por el tiempo dedicado a Deskjockey for Life y por la profundidad de sus
                  respuestas. Su expediente se ha revisado conforme a los cinco criterios internos de
                  evaluación y se conserva en nuestra base de talento durante los próximos 36 meses,
                  prorrogables tácitamente.
                </p>
                <blockquote className="my-7 border-l-2 border-accent pl-5">
                  <p className="max-w-xl text-[17px] font-medium leading-[1.5] tracking-[-0.015em] sm:text-[19px]">
                    Después de pensárnoslo mucho, hemos decidido seguir con un candidato que encajaba
                    mejor en la oferta.
                  </p>
                </blockquote>
                <p className="max-w-xl text-[13px] leading-[1.8] text-ink-soft">
                  La decisión es firme. Por limitaciones operativas, no podemos proporcionar feedback
                  individualizado ni mantener correspondencia adicional sobre el proceso. Le deseamos el
                  mayor éxito en su búsqueda de empleo.
                </p>
                <Signature date={date} />
              </>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-line bg-paper px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 no-print">
            <p className="font-mono text-[8px] uppercase tracking-[0.06em] text-ink-faint">
              Documento generado automáticamente · No requiere firma
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => window.print()} className="btn btn-secondary !min-h-9 !px-3 !text-[10px]">
                <Print className="h-3 w-3" />
                Imprimir resolución
              </button>
              <button type="button" onClick={onHome} className="btn btn-primary !min-h-9 !px-3 !text-[10px]">
                Volver a la posición
              </button>
            </div>
          </div>
        </article>

        <aside className="space-y-4">
          <div className="border border-ink bg-ink p-6 text-paper">
            <p className="font-mono text-[8px] uppercase tracking-[0.09em] text-paper/45">
              Puntuación interna
            </p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-[54px] font-medium leading-none tracking-[-0.06em]">
                {result.overall.toFixed(1).replace(".", ",")}
              </span>
              <span className="pb-1 font-mono text-[11px] text-paper/40">/ 100</span>
            </div>
            <div className="mt-4 h-1 w-full bg-paper/15">
              <div
                className={cn("meter-fill h-full", passed ? "bg-[#a9b58d]" : "bg-accent")}
                style={{ width: `${Math.min(100, result.overall)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[8px] uppercase tracking-[0.04em] text-paper/35">
              <span>Resultado</span>
              <span>Umbral 95,0</span>
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-paper/15 pt-4">
              <span className={cn("h-1.5 w-1.5", passed ? "bg-[#a9b58d]" : "bg-accent")} />
              <p className="font-mono text-[8px] uppercase tracking-[0.06em] text-paper/55">
                {passed ? "Alineación suficiente" : "Alineación insuficiente"}
              </p>
            </div>
          </div>

          <div className="border border-line bg-paper-light p-5">
            <div className="flex items-center gap-2">
              <Lock className="h-3 w-3 text-ink-faint" />
              <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink-faint">
                Anexo interno
              </p>
            </div>
            <h2 className="mt-3 text-[17px] font-medium leading-tight tracking-[-0.025em]">
              Cómo se ha calculado.
            </h2>
            <div className="mt-4 space-y-3">
              {result.metrics.map((metric) => (
                <div key={metric.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[10px] font-medium leading-tight text-ink-soft">{metric.shortLabel}</p>
                    <p className="shrink-0 font-mono text-[9px] text-ink">
                      {metric.weighted.toFixed(1).replace(".", ",")}
                      <span className="text-ink-faint"> / {metric.weight}</span>
                    </p>
                  </div>
                  <div className="mt-1.5 h-[3px] w-full bg-line">
                    <div
                      className={cn("meter-fill h-full", passed ? "bg-moss" : "bg-ink-soft")}
                      style={{ width: `${Math.min(100, metric.score)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => document.getElementById("anexo-metodologia")?.scrollIntoView({ behavior: "smooth" })}
              className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 font-mono text-[8px] uppercase tracking-[0.05em] text-ink-soft transition-colors hover:text-accent"
            >
              Ver metodología completa
              <ArrowRight className="h-2.5 w-2.5" />
            </button>
          </div>

          <div className="border border-line p-5">
            <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink-faint">
              Conservación del expediente
            </p>
            <p className="mt-2 text-[10px] leading-relaxed text-ink-soft">
              Puede conservar esta resolución. El expediente no se ha remitido a ningún sistema y no
              será compartido con terceros, incluido el propio comité.
            </p>
          </div>

          <button type="button" onClick={onApply} className="btn btn-secondary w-full !min-h-10 !text-[10px]">
            Abrir de nuevo el expediente
          </button>
        </aside>
      </div>

      <section id="anexo-metodologia" className="mt-10 scroll-mt-24 border border-line bg-paper-light">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-6 sm:p-8">
          <div>
            <p className="eyebrow text-accent">Anexo I · Metodología</p>
            <h2 className="mt-3 text-[24px] font-medium leading-none tracking-[-0.035em]">
              Cinco métricas. Un umbral. Cero ambigüedad.
            </h2>
          </div>
          <div className="border border-line-dark px-3 py-2 text-left sm:text-right">
            <p className="font-mono text-[8px] uppercase tracking-[0.06em] text-ink-faint">Umbral interno</p>
            <p className="mt-1 font-mono text-[12px] font-semibold">95,0 / 100</p>
          </div>
        </div>
        <div className="divide-y divide-line">
          {result.metrics.map((metric, index) => (
            <div key={metric.id} className="grid gap-4 p-5 sm:grid-cols-[200px_1fr_auto] sm:items-start sm:px-8">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.05em] text-ink-faint">
                  M-{String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-1.5 text-[12px] font-semibold leading-snug">{metric.label}</p>
              </div>
              <div>
                <p className="text-[11px] leading-relaxed text-ink-soft">{metric.detail}</p>
                <div className="mt-2.5 h-1 w-full max-w-sm bg-line">
                  <div
                    className={cn("meter-fill h-full", metric.score >= 95 ? "bg-moss" : "bg-accent")}
                    style={{ width: `${Math.min(100, metric.score)}%` }}
                  />
                </div>
              </div>
              <div className="flex items-baseline gap-2 sm:block sm:text-right">
                <span className="text-[20px] font-medium tracking-[-0.03em]">
                  {metric.score.toFixed(1).replace(".", ",")}
                </span>
                <span className="font-mono text-[9px] text-ink-faint">/100 · peso {metric.weight} %</span>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-line bg-paper px-5 py-4 sm:px-8">
          <p className="max-w-3xl text-[10px] leading-relaxed text-ink-faint">
            El resultado se obtiene de la media ponderada de las cinco métricas. El comité no revisa
            manualmente las candidaturas que no superan el umbral. El instrumento psicométrico DCAI-5 se
            activa exclusivamente en candidaturas que lo superan. La metodología no es recurrible.
          </p>
        </div>
      </section>

      <DisclaimerBand />
    </main>
  );
}

function Signature({ date }: { date: string }) {
  return (
    <div className="mt-9 border-t border-line pt-5">
      <p className="text-[12px] font-medium">Equipo de Adquisición de Talento</p>
      <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.06em] text-ink-faint">
        Deskjockey for Life, S.L. · {date}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="border border-line-dark px-2 py-1 font-mono text-[8px] uppercase tracking-[0.05em] text-ink-faint">
          Resolución generada automáticamente
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.05em] text-ink-faint">
          No responder a este mensaje
        </span>
      </div>
    </div>
  );
}
