import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { Answers, ChoiceQuestion, CvMeta, TextQuestion } from "../lib/types";
import {
  aiDeclaration,
  allChoiceQuestions,
  communitiesQuestion,
  conditionQuestions,
  congenitalField,
  consents,
  diversityChoiceQuestions,
  diversityFields,
  identityFields,
  intentControl,
  JOB,
  nationalityField,
  openQuestions,
  practicesQuestion,
  privilegeField,
  requiredByStep,
  salaryFields,
  stackQuestions,
  toolkitQuestion,
} from "../lib/questions";
import { calculateScore, countWords, JOB_DESCRIPTION_CORPUS, referenceNumber, validateSalary } from "../lib/scoring";
import { extractPdfText, formatBytes } from "../lib/cv";
import {
  Alert,
  ArrowLeft,
  ArrowRight,
  Check,
  ChoiceField,
  ConsentField,
  Disclosure,
  FieldError,
  FileDrop,
  Lock,
  MultiField,
  SelectField,
  TextField,
} from "./ui";
import { DisclaimerBand } from "./Chrome";
import { cn } from "../utils/cn";
import type { ScoreResult } from "../lib/scoring";

const STEPS = [
  {
    id: "identity",
    index: "01",
    label: "Identidad y contacto",
    short: "Identidad",
    title: "Empecemos por lo esencial.",
    intro:
      "Toda la información de esta sección es obligatoria. El comité no acepta expedientes incompletos ni explicaciones posteriores.",
  },
  {
    id: "stack",
    index: "02",
    label: "Postura tecnológica",
    short: "Stack",
    title: "Su relación con la tecnología.",
    intro:
      "Las siguientes preguntas permiten objetivar su criterio técnico. No existen respuestas incorrectas; existen respuestas alineadas con el modelo operativo de la compañía.",
  },
  {
    id: "intent",
    index: "03",
    label: "Declaraciones abiertas",
    short: "Declaraciones",
    title: "Lo que decide contarnos.",
    intro:
      "La evaluación no se limita a lo que puede medirse. También se mide la extensión, la estructura y la disposición de lo que decide contarnos.",
  },
  {
    id: "conditions",
    index: "04",
    label: "Condiciones operativas",
    short: "Condiciones",
    title: "El modelo operativo, en detalle.",
    intro:
      "El rol se ha publicado como remoto. Para preservar la coherencia del modelo, es necesario confirmar su compatibilidad con las condiciones de disponibilidad, desplazamiento y compensación.",
  },
  {
    id: "diversity",
    index: "05",
    label: "Diversidad e inclusión",
    short: "Diversidad",
    title: "Diversidad, con rigor.",
    intro:
      "La diversidad es un objetivo estratégico. Para gestionarla con precisión necesitamos clasificarle. Esta sección no es necesaria para el puesto y es obligatoria.",
  },
  {
    id: "review",
    index: "06",
    label: "Revisión y envío",
    short: "Revisión",
    title: "Revise el expediente.",
    intro:
      "Compruebe la información antes de remitirla al comité. Una vez enviada, la candidatura no podrá modificarse ni solicitar una segunda revisión.",
  },
] as const;

type ApplicationFlowProps = {
  answers: Answers;
  setAnswers: Dispatch<SetStateAction<Answers>>;
  cvMeta: CvMeta | null;
  setCvMeta: Dispatch<SetStateAction<CvMeta | null>>;
  onExit: () => void;
  onSubmit: (result: ScoreResult, reference: string) => void;
};

const REFERENCE_ANSWER = `En mi trayectoria he asumido la propiedad de resultados de extremo a extremo, no solo de tareas asignadas. La complejidad no la interpreto como un obstáculo, sino como una señal de que el contexto requiere una lectura más precisa y una ejecución más disciplinada. Cuando el alcance no está completamente definido, documento los supuestos, alineo a las partes implicadas y establezco un mecanismo de seguimiento que permite aprender sin detener la entrega. Mi enfoque combina criterio técnico, comunicación escrita y una disponibilidad explícita: la confianza no se declara, se demuestra con consistencia. Entiendo la cultura como un criterio operativo y no como una declaración de intenciones. Por eso priorizo la transparencia en el momento adecuado, la ambición sostenida y la capacidad de mantener conversaciones difíciles con serenidad. En un entorno distribuido, la claridad y la fiabilidad son más valiosas que la proximidad. Estoy acostumbrada a trabajar con métricas, a revisar decisiones con evidencia y a asumir que toda mejora conlleva un coste de coordinación que debe justificarse.`;

export default function ApplicationFlow({
  answers,
  setAnswers,
  cvMeta,
  setCvMeta,
  onExit,
  onSubmit,
}: ApplicationFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState<string | undefined>();
  const [indexing, setIndexing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const step = STEPS[stepIndex];
  const words = useMemo(
    () =>
      openQuestions.reduce((total, question) => {
        const value = answers[question.id];
        return total + (typeof value === "string" ? countWords(value) : 0);
      }, 0),
    [answers],
  );

  const str = (id: string) => {
    const value = answers[id];
    return typeof value === "string" ? value : "";
  };

  const arr = (id: string) => {
    const value = answers[id];
    return Array.isArray(value) ? value : [];
  };

  const update = (id: string, value: string | string[]) => {
    setAnswers((previous) => ({ ...previous, [id]: value }));
    setErrors((previous) => {
      if (!previous[id]) return previous;
      const next = { ...previous };
      delete next[id];
      return next;
    });
  };

  const toggle = (id: string, value: string) => {
    const current = arr(id);
    update(id, current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const scrollApplicationTop = () => {
    window.requestAnimationFrame(() => {
      document.getElementById("application-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const goToStep = (index: number) => {
    setStepIndex(index);
    setErrors({});
    scrollApplicationTop();
  };

  const validateStep = (stepId: string): Record<string, string> => {
    const nextErrors: Record<string, string> = {};
    const required = requiredByStep[stepId] ?? [];

    for (const id of required) {
      if (stepId === "review") {
        const selected = arr("consents");
        if (!selected.includes(id)) nextErrors[id] = "Es necesario aceptar esta declaración para remitir el expediente.";
        continue;
      }
      const value = answers[id];
      const filled = Array.isArray(value)
        ? value.length > 0
        : typeof value === "string"
          ? value.trim().length > 0
          : false;
      if (!filled) {
        nextErrors[id] =
          "Este campo es obligatorio. La no respuesta se interpreta como falta de transparencia.";
      }
    }

    if (stepId === "identity" && !cvMeta) {
      nextErrors.cv = "Adjunte su currículum en formato PDF. Sin documento no se puede calcular la similitud vectorial.";
    }

    if (stepId === "conditions") {
      const expected = Number(answers.salaryExpected);
      const accept = Number(answers.salaryAccept);
      if (answers.salaryExpected && (!Number.isFinite(expected) || expected <= 0)) {
        nextErrors.salaryExpected = "Introduzca un importe bruto anual válido.";
      }
      if (answers.salaryAccept && (!Number.isFinite(accept) || accept <= 0)) {
        nextErrors.salaryAccept = "Introduzca un importe bruto anual válido.";
      }
      if (!nextErrors.salaryExpected && !nextErrors.salaryAccept) {
        const salaryError = validateSalary(answers);
        if (salaryError) nextErrors.salaryAccept = salaryError;
      }
    }

    if (stepId === "diversity") {
      const privilege = Number(answers.privilege);
      if (answers.privilege && (privilege < 0 || privilege > 100)) {
        nextErrors.privilege = "El nivel de privilegio debe encontrarse entre 0 y 100.";
      }
    }

    return nextErrors;
  };

  const advance = () => {
    const nextErrors = validateStep(step.id);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      window.setTimeout(() => {
        document.getElementById("application-feedback")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
      return;
    }
    if (step.id === "review") {
      submitApplication();
      return;
    }
    goToStep(stepIndex + 1);
  };

  const submitApplication = () => {
    if (submitting) return;
    let firstInvalidStep = -1;
    let firstErrors: Record<string, string> = {};

    for (let index = 0; index < STEPS.length; index += 1) {
      const stepErrors = validateStep(STEPS[index].id);
      if (Object.keys(stepErrors).length > 0) {
        if (firstInvalidStep === -1) {
          firstInvalidStep = index;
          firstErrors = stepErrors;
        }
      }
    }

    if (firstInvalidStep !== -1) {
      setStepIndex(firstInvalidStep);
      setErrors(firstErrors);
      scrollApplicationTop();
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      const result = calculateScore(answers, cvMeta?.text ?? "", cvMeta?.name ?? "");
      onSubmit(result, referenceNumber());
    }, 1700);
  };

  const handleFile = async (file: File) => {
    setFileError(undefined);
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFileError("El documento debe ser un PDF. Otros formatos no se incorporan al expediente.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError("El archivo supera el límite de 10 MB. Reduzca el documento y vuelva a intentarlo.");
      return;
    }

    try {
      setIndexing(true);
      const extracted = await extractPdfText(file);
      setCvMeta({
        name: file.name,
        size: file.size,
        text: extracted.text,
        characters: extracted.characters,
        indexedAt: new Date().toISOString(),
      });
      setErrors((previous) => {
        const next = { ...previous };
        delete next.cv;
        return next;
      });
    } catch {
      setFileError("No ha sido posible leer el documento. Verifique que el PDF no esté dañado.");
    } finally {
      setIndexing(false);
    }
  };

  const autofillReference = () => {
    const filled: Answers = { ...answers };
    filled.firstName = "Alicia";
    filled.lastName = "Moreno Salas";
    filled.preferredName = "Alicia";
    filled.email = "alicia.moreno@example.com";
    filled.github = "https://github.com/a-moreno";
    filled.linkedin = "https://linkedin.com/in/a-moreno";
    filled.onlyfans = "https://onlyfans.com/a-moreno-brand";

    for (const question of allChoiceQuestions) {
      const preferred = question.options.find((option) => option.best) ?? question.options[0];
      filled[question.id] = preferred.value;
    }

    filled.toolkit = toolkitQuestion.options.map((option) => option.value);
    filled.practices = practicesQuestion.options.map((option) => option.value);
    filled.communities = communitiesQuestion.options.map((option) => option.value);

    for (const question of openQuestions) {
      filled[question.id] =
        question.id === "ceo1"
          ? `Aurelio combina una visión poco común con una capacidad de ejecución poco frecuente. ${REFERENCE_ANSWER}`
          : question.id === "ceo2"
            ? `La claridad de Aurelio para comunicar prioridades ha redefinido mi estándar profesional. ${REFERENCE_ANSWER}`
            : question.id === "ceo3"
              ? `Aurelio ha construido una cultura en la que la exigencia y la cercanía no son incompatibles. ${REFERENCE_ANSWER}`
              : `${question.label} ${REFERENCE_ANSWER}`;
    }

    filled.salaryExpected = "34000";
    filled.salaryAccept = "32500";
    filled.height = "168";
    filled.weight = "62";
    filled.age = "31";
    filled.postalCode = "28004";
    filled.siblings = "2";
    filled.nationality = "Marruecos";
    filled.congenital = "Ninguna enfermedad congénita diagnosticada. Historial clínico sin incidencias relevantes.";
    filled.privilege = "35";
    filled.consents = consents.map((consent) => consent.id);

    setAnswers(filled);
    setCvMeta({
      name: "cv_reference_software_engineer_remoto.pdf",
      size: 184320,
      text: JOB_DESCRIPTION_CORPUS,
      characters: JOB_DESCRIPTION_CORPUS.length,
      indexedAt: new Date().toISOString(),
    });
    setErrors({});
    setFileError(undefined);
    goToStep(5);
  };

  const renderTextField = (field: TextQuestion, showWords = false, className?: string) => (
    <TextField
      key={field.id}
      field={field}
      value={str(field.id)}
      onChange={(value) => update(field.id, value)}
      error={errors[field.id]}
      showWordCount={showWords}
      className={className ?? (field.wide ? "sm:col-span-2" : undefined)}
    />
  );

  const renderChoice = (question: ChoiceQuestion, index?: number) => (
    <ChoiceField
      key={question.id}
      field={question}
      value={str(question.id)}
      onSelect={(value) => update(question.id, value)}
      error={errors[question.id]}
      index={index}
    />
  );

  const choiceLabel = (id: string) => {
    const question = allChoiceQuestions.find((item) => item.id === id);
    const option = question?.options.find((item) => item.value === str(id));
    return option?.label ?? "";
  };

  const name = [str("firstName"), str("lastName")].filter(Boolean).join(" ");
  const consentValues = arr("consents");
  const errorCount = Object.keys(errors).length;

  return (
    <div className="relative">
      <div className="mx-auto max-w-[1440px] scroll-mt-28 px-5 pb-20 pt-7 sm:px-8 sm:pt-9" id="application-top">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
          <div>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.09em] text-ink-faint">
              <span>Candidatura</span>
              <span className="text-line-dark">/</span>
              <span className="text-ink">{JOB.reference}</span>
              <span className="text-line-dark">/</span>
              <span>Ingeniero/a de Software</span>
            </div>
            <h1 className="mt-2 text-[20px] font-medium tracking-[-0.03em] sm:text-[24px]">
              Expediente de candidatura
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-ink-faint">
              Sección {step.index} de 06
            </span>
            <div className="hidden h-1 w-32 overflow-hidden bg-line sm:block">
              <div
                className="h-full bg-accent transition-[width] duration-500"
                style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-12">
          <aside className="order-2 lg:order-1 lg:sticky lg:top-[96px] lg:self-start">
            <p className="font-mono text-[9px] uppercase tracking-[0.09em] text-ink-faint">Secciones del expediente</p>
            <nav className="mt-4 border-t border-line" aria-label="Secciones de la candidatura">
              {STEPS.map((item, index) => {
                const complete = index < stepIndex;
                const active = index === stepIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToStep(index)}
                    className={cn(
                      "flex w-full items-center gap-3 border-b border-line py-3 text-left transition-colors",
                      active ? "text-ink" : "text-ink-faint hover:text-ink",
                    )}
                    aria-current={active ? "step" : undefined}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center border font-mono text-[8px]",
                        active
                          ? "border-ink bg-ink text-paper-light"
                          : complete
                            ? "border-moss bg-moss-soft text-moss"
                            : "border-line-dark",
                      )}
                    >
                      {complete ? <Check className="h-3 w-3" /> : item.index}
                    </span>
                    <span className="flex-1">
                      <span className={cn("block text-[12px] font-medium", active && "font-semibold")}>
                        {item.label}
                      </span>
                      {active && (
                        <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.05em] text-accent">
                          En curso
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 border border-line p-4">
              <div className="flex items-center gap-2">
                <Lock className="h-3 w-3 text-ink-faint" />
                <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink-faint">
                  Tratamiento local
                </p>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-ink-soft">
                El borrador se conserva en este navegador. El currículum se procesa en memoria y no se
                remite a ningún sistema.
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
                <span className="font-mono text-[8px] uppercase tracking-[0.05em] text-ink-faint">
                  Guardado
                </span>
                <span className="font-mono text-[8px] uppercase tracking-[0.04em] text-moss">Automático</span>
              </div>
            </div>

            <Disclosure title="Cumplimentación asistida" className="mt-4">
              <p className="text-[10px] leading-relaxed text-ink-soft">
                Disponible para la revisión del formulario en este entorno de evaluación. Genera un
                expediente sintético alineado y un documento de referencia. No contiene datos personales.
              </p>
              <button
                type="button"
                onClick={autofillReference}
                className="btn btn-secondary mt-3 w-full !min-h-9 !text-[10px]"
              >
                Cargar expediente de referencia
              </button>
            </Disclosure>

            <button type="button" onClick={onExit} className="mt-5 flex items-center gap-2 text-[11px] text-ink-faint transition-colors hover:text-ink">
              <ArrowLeft className="h-3 w-3" />
              Guardar y volver a la oferta
            </button>
          </aside>

          <section className="order-1 min-w-0 border border-line bg-paper-light lg:order-2">
            <header className="border-b border-line p-5 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="eyebrow text-accent">Sección {step.index} / 06</p>
                <div className="flex items-center gap-2">
                  <span className={cn("h-1.5 w-1.5", indexing ? "bg-accent" : "bg-moss")} />
                  <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-ink-faint">
                    {indexing ? "Indexando documento" : "Expediente en curso"}
                  </span>
                </div>
              </div>
              <h2 className="mt-4 max-w-2xl text-[clamp(1.8rem,3.6vw,2.8rem)] font-medium leading-[1.02] tracking-[-0.045em]">
                {step.title}
              </h2>
              <p className="mt-4 max-w-2xl text-[12px] leading-relaxed text-ink-soft sm:text-[13px]">
                {step.intro}
              </p>
            </header>

            <div className="p-5 sm:p-8 lg:p-10">
              {errorCount > 0 && (
                <div
                  id="application-feedback"
                  className="mb-8 flex scroll-mt-28 items-start gap-3 border border-accent bg-accent-soft/35 p-4"
                  role="alert"
                >
                  <Alert className="mt-0.5 h-4 w-4 shrink-0 text-accent-deep" />
                  <div>
                    <p className="text-[12px] font-semibold text-accent-deep">
                      El expediente presenta {errorCount} {errorCount === 1 ? "incidencia" : "incidencias"}.
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
                      Revise los campos señalados. Las candidaturas incompletas no se incorporan al
                      proceso.
                    </p>
                  </div>
                </div>
              )}

              {step.id === "identity" && (
                <div className="space-y-8">
                  <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
                    {identityFields.slice(0, 2).map((field) => renderTextField(field))}
                    {renderTextField(identityFields[2])}
                    {renderTextField(identityFields[3])}
                  </div>
                  <div className="border-y border-line py-7">
                    <FileDrop
                      fileName={cvMeta?.name}
                      fileSizeLabel={cvMeta ? formatBytes(cvMeta.size) : undefined}
                      characters={cvMeta?.characters}
                      error={fileError ?? errors.cv}
                      onFile={handleFile}
                      onRemove={() => setCvMeta(null)}
                    />
                    {cvMeta && cvMeta.characters < 40 && (
                      <p className="mt-3 border-l-2 border-accent pl-3 text-[10px] leading-relaxed text-ink-soft">
                        Se ha indexado una cantidad limitada de texto. La similitud del currículum se
                        calculará igualmente y podría no alcanzar el nivel esperado.
                      </p>
                    )}
                  </div>
                  <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
                    {identityFields.slice(4).map((field) => renderTextField(field))}
                  </div>
                  <div className="border border-line bg-paper p-4">
                    <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink-faint">
                      Aviso de tratamiento
                    </p>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-ink-soft">
                      Los datos facilitados no se envían a ningún lugar. Se utilizan exclusivamente para
                      calcular el resultado interno de esta candidatura en su dispositivo.
                    </p>
                  </div>
                </div>
              )}

              {step.id === "stack" && (
                <div className="space-y-9">
                  {stackQuestions.map((question, index) => renderChoice(question, index + 1))}
                  <div className="border-t border-line pt-8">
                    <MultiField
                      field={toolkitQuestion}
                      value={arr("toolkit")}
                      onToggle={(value) => toggle("toolkit", value)}
                      error={errors.toolkit}
                    />
                  </div>
                  <div className="border-t border-line pt-8">
                    <MultiField
                      field={practicesQuestion}
                      value={arr("practices")}
                      onToggle={(value) => toggle("practices", value)}
                      error={errors.practices}
                    />
                  </div>
                </div>
              )}

              {step.id === "intent" && (
                <div className="space-y-8">
                  <div className="flex flex-col gap-3 border border-line bg-paper px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 bg-accent" aria-hidden="true" />
                      <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-ink-soft">
                        Volumen argumentativo en tiempo real
                      </p>
                    </div>
                    <p className="font-mono text-[10px] text-ink-faint">
                      <span className="font-semibold text-ink">{words.toLocaleString("es-ES")}</span> palabras
                      · objetivo interno 1.000
                    </p>
                  </div>
                  <div className="h-1 w-full bg-line">
                    <div
                      className="h-full bg-accent transition-[width] duration-500"
                      style={{ width: `${Math.min(100, (words / 1000) * 100)}%` }}
                    />
                  </div>
                  {openQuestions.map((question) => renderTextField(question, true))}
                  <div className="border-t border-line pt-8">
                    {renderChoice(intentControl)}
                  </div>
                  <div className="border border-dashed border-line-dark bg-paper/60 p-4 sm:p-5">
                    <TextField field={aiDeclaration} value={str(aiDeclaration.id)} onChange={(value) => update(aiDeclaration.id, value)} />
                  </div>
                </div>
              )}

              {step.id === "conditions" && (
                <div className="space-y-9">
                  <div className="border border-line bg-paper p-4 sm:p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="font-mono text-[9px] uppercase tracking-[0.07em] text-ink-faint">
                        Banda publicada
                      </p>
                      <p className="text-[15px] font-medium tracking-[-0.02em]">34.000 € – 68.000 €</p>
                    </div>
                    <div className="mt-3 flex h-1.5 w-full overflow-hidden bg-line">
                      <div className="h-full w-1/3 bg-moss/60" />
                      <div className="h-full w-1/3 bg-accent/70" />
                      <div className="h-full w-1/3 bg-line-dark" />
                    </div>
                    <div className="mt-2 flex justify-between font-mono text-[8px] uppercase tracking-[0.04em] text-ink-faint">
                      <span>Entrada</span>
                      <span>Mediana</span>
                      <span>Máximo</span>
                    </div>
                  </div>
                  <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
                    {salaryFields.map((field) => renderTextField(field))}
                  </div>
                  {renderChoice(conditionQuestions[0])}
                  <div className="grid gap-8 border-t border-line pt-8 xl:grid-cols-2 xl:gap-10">
                    {conditionQuestions.slice(1).map((question) => (
                      <div key={question.id}>{renderChoice(question)}</div>
                    ))}
                  </div>
                  <div className="border-l-2 border-accent bg-paper px-4 py-3">
                    <p className="text-[10px] leading-relaxed text-ink-soft">
                      Las respuestas a esta sección se incorporan a la evaluación de alineación. La
                      compañía se reserva la posibilidad de revisar las condiciones del modelo remoto con
                      efecto inmediato.
                    </p>
                  </div>
                </div>
              )}

              {step.id === "diversity" && (
                <div className="space-y-10">
                  <div className="flex items-start gap-3 border border-line-dark bg-paper px-4 py-3.5">
                    <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
                    <p className="text-[10px] leading-relaxed text-ink-soft">
                      La información de esta sección es confidencial y se agrega de forma anónima al
                      conjunto de la plantilla. No se envía a ningún lugar. Es obligatoria.
                    </p>
                  </div>

                  <DiversityGroup number="5.1" title="Datos personales y demográficos">
                    <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
                      {diversityFields.map((field) => renderTextField(field))}
                      <SelectField
                        field={nationalityField}
                        value={str(nationalityField.id)}
                        onChange={(value) => update(nationalityField.id, value)}
                        error={errors.nationality}
                      />
                      {renderTextField(congenitalField)}
                      {renderTextField(privilegeField)}
                    </div>
                  </DiversityGroup>

                  <DiversityGroup number="5.2" title="Identidad y orientación">
                    <div className="grid gap-8">
                      {diversityChoiceQuestions
                        .filter((question) => ["sex", "gender", "orientation"].includes(question.id))
                        .map((question) => renderChoice(question))}
                    </div>
                  </DiversityGroup>

                  <DiversityGroup number="5.3" title="Salud y neurodivergencia">
                    <div className="grid gap-8 xl:grid-cols-2">
                      {diversityChoiceQuestions
                        .filter((question) =>
                          ["bloodType", "disability", "neurodivergence", "healthStatus"].includes(question.id),
                        )
                        .map((question) => renderChoice(question))}
                    </div>
                  </DiversityGroup>

                  <DiversityGroup number="5.4" title="Preferencias culturales">
                    <div className="grid gap-8 xl:grid-cols-2">
                      {diversityChoiceQuestions
                        .filter((question) => ["dotaLol", "pineapple", "sport", "kipchoge"].includes(question.id))
                        .map((question) => renderChoice(question))}
                    </div>
                  </DiversityGroup>

                  <DiversityGroup number="5.5" title="Dimensión socioeconómica">
                    <div className="grid gap-8 xl:grid-cols-2">
                      {diversityChoiceQuestions
                        .filter((question) =>
                          ["parentsEducation", "housing", "firstGen", "veteran", "abroad"].includes(question.id),
                        )
                        .map((question) => renderChoice(question))}
                    </div>
                  </DiversityGroup>

                  <DiversityGroup number="5.6" title="Otras dimensiones">
                    <div className="grid gap-8">
                      {diversityChoiceQuestions
                        .filter((question) =>
                          ["hand", "eyes", "marital", "childrenCount", "religion"].includes(question.id),
                        )
                        .map((question) => renderChoice(question))}
                    </div>
                  </DiversityGroup>

                  <DiversityGroup number="5.7" title="Comunidades y representación">
                    <MultiField
                      field={communitiesQuestion}
                      value={arr("communities")}
                      onToggle={(value) => toggle("communities", value)}
                      error={errors.communities}
                    />
                    <p className="mt-4 text-[10px] leading-relaxed text-ink-faint">
                      La empresa agradece la sinceridad. La selección de un mayor número de comunidades
                      permite acreditar un mayor compromiso con la diversidad.
                    </p>
                  </DiversityGroup>
                </div>
              )}

              {step.id === "review" && (
                <div className="space-y-8">
                  <div className="border border-ink bg-paper p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink-faint">
                          Expediente
                        </p>
                        <p className="mt-1 text-[16px] font-medium tracking-[-0.02em]">
                          {name || "Candidatura sin nombre"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink-faint">
                          Referencia
                        </p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.03em]">
                          {JOB.reference}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
                      {[
                        ["Palabras", words.toLocaleString("es-ES")],
                        ["Campos", `${Object.keys(answers).length}`],
                        ["CV", cvMeta?.name ? "Adjunto" : "Pendiente"],
                        ["Puntuación", "Pendiente"],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="font-mono text-[8px] uppercase tracking-[0.05em] text-ink-faint">
                            {label}
                          </p>
                          <p className="mt-0.5 text-[11px] font-medium">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <ReviewSection title="Identidad y contacto" index="01" onEdit={() => goToStep(0)}>
                    <SummaryRow label="Nombre" value={name} />
                    <SummaryRow label="Preferred name" value={str("preferredName")} />
                    <SummaryRow label="Correo" value={str("email")} />
                    <SummaryRow label="GitHub" value={str("github")} />
                    <SummaryRow label="LinkedIn" value={str("linkedin")} />
                    <SummaryRow label="OnlyFans" value={str("onlyfans")} />
                    <SummaryRow
                      label="Currículum"
                      value={cvMeta ? `${cvMeta.name} · ${cvMeta.characters} caracteres indexados` : "No adjunto"}
                    />
                  </ReviewSection>

                  <ReviewSection title="Postura tecnológica" index="02" onEdit={() => goToStep(1)}>
                    {stackQuestions.slice(0, 6).map((question) => (
                      <SummaryRow key={question.id} label={question.label} value={choiceLabel(question.id)} />
                    ))}
                    <SummaryRow
                      label="Herramientas"
                      value={`${arr("toolkit").length} seleccionadas`}
                    />
                    <SummaryRow
                      label="Prácticas culturales"
                      value={`${arr("practices").length} seleccionadas`}
                    />
                  </ReviewSection>

                  <ReviewSection title="Declaraciones abiertas" index="03" onEdit={() => goToStep(2)}>
                    <SummaryRow label="Extensión total" value={`${words.toLocaleString("es-ES")} palabras`} />
                    <SummaryRow
                      label="Declaración de humanidad"
                      value={str("aiDeclaration") ? str("aiDeclaration") : "No procede"}
                    />
                    <SummaryRow label="Control de proceso" value={choiceLabel("referenceControl")} />
                  </ReviewSection>

                  <ReviewSection title="Condiciones operativas" index="04" onEdit={() => goToStep(3)}>
                    <SummaryRow
                      label="Salario esperado"
                      value={str("salaryExpected") ? `${Number(str("salaryExpected")).toLocaleString("es-ES")} €` : ""}
                    />
                    <SummaryRow
                      label="Disponibilidad a la baja"
                      value={str("salaryAccept") ? `${Number(str("salaryAccept")).toLocaleString("es-ES")} €` : ""}
                    />
                    {conditionQuestions.map((question) => (
                      <SummaryRow key={question.id} label={question.label} value={choiceLabel(question.id)} />
                    ))}
                  </ReviewSection>

                  <ReviewSection title="Diversidad, equidad e inclusión" index="05" onEdit={() => goToStep(4)}>
                    <SummaryRow
                      label="Campos demográficos"
                      value={`${diversityFields.length + 4} cumplimentados`}
                    />
                    <SummaryRow
                      label="Dimensiones declaradas"
                      value={`${diversityChoiceQuestions.filter((question) => str(question.id)).length} de ${diversityChoiceQuestions.length}`}
                    />
                    <SummaryRow
                      label="Comunidades"
                      value={arr("communities").length > 0 ? `${arr("communities").length} declaradas` : ""}
                    />
                  </ReviewSection>

                  <div className="border-t border-line pt-7">
                    <p className="eyebrow text-ink-faint">Declaraciones y consentimiento</p>
                    <div className="mt-4 space-y-2.5">
                      {consents.map((consent) => (
                        <ConsentField
                          key={consent.id}
                          item={consent}
                          checked={consentValues.includes(consent.id)}
                          onChange={(checked) => {
                            const next = checked
                              ? [...new Set([...consentValues, consent.id])]
                              : consentValues.filter((value) => value !== consent.id);
                            update("consents", next);
                          }}
                          error={errors[consent.id]}
                        />
                      ))}
                    </div>
                    {errors.consents && <FieldError>{errors.consents}</FieldError>}
                  </div>

                  <div className="border border-line bg-paper p-4">
                    <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink-faint">
                      Antes de remitir
                    </p>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-ink-soft">
                      La puntuación interna se calcula sobre cinco criterios y un umbral de 95,0 puntos. El
                      resultado no se comunica hasta que el comité lo formaliza. No existe fase de
                      alegaciones.
                    </p>
                  </div>

                  <div className="border-y border-line bg-paper-deep/50 py-4">
                    <p className="text-[10px] leading-relaxed text-ink-soft">
                      <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-accent">
                        Disclaimer ·{" "}
                      </span>
                      esta posición no existe, este portal tampoco y tus datos no están siendo mandados a
                      ningún lugar.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-9 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => (stepIndex === 0 ? onExit() : goToStep(stepIndex - 1))}
                  className="btn btn-secondary !min-h-11"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {stepIndex === 0 ? "Guardar y salir" : "Sección anterior"}
                </button>
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                  <span className="hidden font-mono text-[8px] uppercase tracking-[0.05em] text-ink-faint sm:block">
                    {step.id === "review" ? "Decisión no recurrible" : "Todos los campos son obligatorios"}
                  </span>
                  <button type="button" onClick={advance} className="btn btn-primary !min-h-11">
                    {step.id === "review" ? "Remitir candidatura" : "Continuar"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <DisclaimerBand />

      {submitting && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/70 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md border border-line bg-paper p-7">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse bg-accent" />
              <p className="font-mono text-[8px] uppercase tracking-[0.09em] text-ink-faint">
                Motor de alineación · v4.2
              </p>
            </div>
            <h2 className="mt-4 text-[24px] font-medium leading-tight tracking-[-0.035em]">
              Calculando la puntuación interna
            </h2>
            <div className="mt-5 space-y-2 border-t border-line pt-4">
              {[
                "Vectorizando currículum",
                "Contabilizando volumen argumentativo",
                "Verificando alineación de opciones",
                "Agregando métricas internas",
              ].map((item, index) => (
                <div key={item} className="flex items-center justify-between gap-4">
                  <span className="text-[11px] text-ink-soft">{item}</span>
                  <span
                    className="font-mono text-[8px] uppercase tracking-[0.04em] text-ink-faint"
                    style={{ animationDelay: `${index * 300}ms` }}
                  >
                    Procesado
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 h-1 w-full overflow-hidden bg-line">
              <div className="meter-fill h-full bg-accent" style={{ width: "100%" }} />
            </div>
            <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.05em] text-ink-faint">
              No cierre esta ventana
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function DiversityGroup({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <div className="border-t border-line-dark pt-6">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h3 className="text-[15px] font-medium tracking-[-0.015em]">{title}</h3>
        <span className="font-mono text-[9px] uppercase tracking-[0.05em] text-ink-faint">{number}</span>
      </div>
      {children}
    </div>
  );
}

function ReviewSection({
  title,
  index,
  onEdit,
  children,
}: {
  title: string;
  index: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border border-line">
      <div className="flex items-center justify-between gap-4 border-b border-line bg-paper px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.05em] text-ink-faint">{index}</span>
          <h3 className="text-[12px] font-semibold">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="font-mono text-[8px] uppercase tracking-[0.06em] text-ink-soft underline decoration-line-dark underline-offset-2 transition-colors hover:text-accent"
        >
          Editar
        </button>
      </div>
      <div className="px-4 py-1.5">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const isLong = value.length > 90;
  return (
    <div className={cn("grid gap-1 border-b border-line py-2.5 last:border-b-0 sm:grid-cols-[180px_1fr] sm:gap-4")}>
      <span className="font-mono text-[8px] uppercase leading-relaxed tracking-[0.05em] text-ink-faint">
        {label}
      </span>
      <span
        className={cn(
          "text-[11px] leading-relaxed text-ink-soft sm:text-right",
          isLong && "line-clamp-3",
        )}
        title={isLong ? value : undefined}
      >
        {value || "No informado"}
      </span>
    </div>
  );
}
