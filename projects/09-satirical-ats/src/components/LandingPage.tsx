import { useState, type ReactNode } from "react";
import { JOB } from "../lib/questions";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Eyebrow } from "./ui";
import { DisclaimerBand } from "./Chrome";

const processSteps = [
  {
    code: "01",
    title: "Triaje de alineación",
    duration: "3 min · automático",
    body:
      "Su currículum se vectoriza y se compara con esta página. El resultado se registra en el expediente interno y no se comunica.",
  },
  {
    code: "02",
    title: "Entrevista de valores",
    duration: "45 min · videollamada",
    body:
      "Conversación estructurada sobre ownership, transparencia y disponibilidad. Se recomienda preparar ejemplos con métricas.",
  },
  {
    code: "03",
    title: "Caso técnico",
    duration: "18–22 h · no remunerado",
    body:
      "Diseño de un sistema que debe escalar, ser gobernable y sostener una fecha de entrega comunicada antes del alcance.",
  },
  {
    code: "04",
    title: "Comité de liderazgo",
    duration: "60 min · presencial*",
    body:
      "Conversación final con el CEO. El comité evalúa el encaje cultural y la disposición a redefinir el encaje si fuera necesario.",
  },
  {
    code: "05",
    title: "Instrumento DCAI-5",
    duration: "11 min · si procede",
    body:
      "Perfilación psicométrica de cinco dimensiones con componente arquetípico. Se activa únicamente en candidaturas alineadas.",
  },
];

const benefits = [
  {
    code: "B-01",
    title: "Remoto de verdad*",
    body:
      "Trabajo distribuido con cuatro desplazamientos de cuatro semanas al año. La definición de «verdad» se revisa trimestralmente.",
  },
  {
    code: "B-02",
    title: "Compensación competitiva",
    body:
      "Banda de 34.000 € a 68.000 €. La revisión anual está condicionada al cumplimiento del plan y a la disponibilidad presupuestaria.",
  },
  {
    code: "B-03",
    title: "Participación en el proyecto",
    body:
      "Plan de equity con un periodo de consolidación que se comunica en la fase final del proceso. Sin compromiso de liquidez.",
  },
  {
    code: "B-04",
    title: "Cobertura médica",
    body:
      "Seguro de salud a partir del día 366 de antigüedad. El periodo de espera forma parte de nuestra cultura de sostenibilidad.",
  },
  {
    code: "B-05",
    title: "Presupuesto de formación",
    body:
      "120 € anuales no acumulables, sujetos a aprobación del comité y a la existencia de una necesidad documentada antes del gasto.",
  },
  {
    code: "B-06",
    title: "Programa de bienestar",
    body:
      "Acceso al Employee Assistance Program: un documento compartido con recursos que se revisa siempre que se solicita su revisión.",
  },
];

const values = [
  {
    title: "Transparencia",
    body:
      "Compartimos toda la información que puede compartirse sin comprometer la posición de la compañía.",
  },
  {
    title: "Ownership",
    body:
      "Respondemos por resultados sobre los que no siempre tenemos control directo. La responsabilidad no se delega.",
  },
  {
    title: "Excelencia",
    body:
      "El estándar es alto y se eleva cuando se alcanza. La mediocridad no forma parte de nuestro modelo operativo.",
  },
  {
    title: "Cercanía",
    body:
      "Estamos disponibles para el equipo. La respuesta fuera de horario refuerza la confianza y la continuidad.",
  },
];

const faqs = [
  {
    q: "¿La posición es realmente remota?",
    a: "Sí. El modelo remoto se acompaña de hasta cuatro desplazamientos de cuatro semanas al año, un posible esquema híbrido de cinco días presenciales y, si el negocio lo requiere, recolocación. Recomendamos leer la sección de condiciones antes de iniciar la candidatura.",
  },
  {
    q: "¿Cuál es el rango salarial?",
    a: "La banda publicada es de 34.000 € a 68.000 €. En la solicitud pedimos dos cifras: su expectativa y el importe por el que entraría si se le ofreciera la posición. La segunda debe ser inferior a la primera.",
  },
  {
    q: "¿Debo completar todas las preguntas?",
    a: "Sí. La sección de diversidad, equidad e inclusión es obligatoria. La no respuesta se interpreta como falta de transparencia y limita la evaluación interna del expediente.",
  },
  {
    q: "¿Es necesario disponer de una cuenta de OnlyFans?",
    a: "Es necesario indicar la URL de un canal profesional con su marca personal. La ausencia de un canal público se documenta como una carencia en visibilidad, aunque no invalida automáticamente la solicitud.",
  },
  {
    q: "¿Cómo se tratan mis datos?",
    a: "El currículum se procesa localmente en su navegador y no se remite a ningún servidor. No existe una base de datos de candidaturas. Puede consultar el disclaimer al pie de esta página.",
  },
  {
    q: "¿Puedo solicitar una adaptación durante el proceso?",
    a: "Todas las solicitudes se estudian. La disponibilidad de alternativas depende de las necesidades del negocio y no está garantizada. Las adaptaciones no modifican los criterios de alineación cultural.",
  },
  {
    q: "¿Qué ocurre si supero el umbral interno?",
    a: "Accederá al Instrumento de Alineación Cultural DCAI-5, un perfilador propietario de cinco dimensiones. El informe se incorpora al expediente y la decisión final del comité es definitiva.",
  },
];

export default function LandingPage({ onApply }: { onApply: () => void }) {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-[1440px] px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 xl:gap-24">
            <div className="rise">
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.09em] text-ink-faint">
                <span>Carreras</span>
                <span className="text-line-dark">/</span>
                <span>Ingeniería</span>
                <span className="text-line-dark">/</span>
                <span className="text-ink">SYN-001</span>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Eyebrow dot className="!text-ink">
                  Requisición única · 2026
                </Eyebrow>
                <span className="h-3 w-px bg-line-dark" aria-hidden="true" />
                <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-ink-faint">
                  1 plaza · Abierta
                </span>
              </div>

              <h1 className="display mt-5 text-[clamp(3.2rem,7vw,6.5rem)]">
                Ingeniero<span className="text-accent">/a</span>
                <br />
                <span className="serif-note font-normal">de Software</span>
              </h1>

              <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-line py-3 text-[11px] font-medium text-ink-soft">
                <span>Remoto*</span>
                <span className="h-3 w-px bg-line-dark" aria-hidden="true" />
                <span>Jornada completa</span>
                <span className="h-3 w-px bg-line-dark" aria-hidden="true" />
                <span>Plataforma y Gobernanza</span>
                <span className="h-3 w-px bg-line-dark" aria-hidden="true" />
                <span>Nivel indiferente</span>
              </div>

              <p className="mt-7 max-w-xl text-[16px] leading-[1.65] text-ink-soft sm:text-[17px]">
                Buscamos una persona capaz de asumir la propiedad técnica de extremo a extremo y de
                alinear cada decisión de ingeniería con los objetivos del negocio, incluso cuando
                dichos objetivos cambien durante el proceso de selección.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={onApply} className="btn btn-primary !min-h-[50px] !px-6">
                  Iniciar candidatura
                  <ArrowRight />
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById("posicion")?.scrollIntoView({ behavior: "smooth" })}
                  className="btn btn-secondary !min-h-[50px] !px-6"
                >
                  Descripción del puesto
                </button>
              </div>

              <p className="mt-4 font-mono text-[9px] uppercase leading-relaxed tracking-[0.04em] text-ink-faint">
                Duración estimada: 42–58 minutos · Cinco secciones · Sin guardado en servidor
              </p>
            </div>

            <div className="fade">
              <div className="border border-line bg-paper-light">
                <div className="relative aspect-[5/4] overflow-hidden bg-paper-deep sm:aspect-[16/10] lg:aspect-[5/4]">
                  <img
                    src="/images/office.jpg"
                    alt="Oficina de Deskjockey for Life, luminosa y sin personal"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
                  <div className="absolute left-4 top-4 flex items-center gap-2 border border-paper-light/35 bg-ink/65 px-2.5 py-1.5 backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 bg-accent" aria-hidden="true" />
                    <span className="font-mono text-[8px] uppercase tracking-[0.11em] text-paper-light">
                      Ficha de la posición
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-paper-light/65">
                        Ubicación operativa
                      </p>
                      <p className="mt-1 text-[14px] font-medium text-paper-light">Remoto* · Madrid</p>
                    </div>
                    <span className="border border-paper-light/40 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.08em] text-paper-light">
                      Ref. {JOB.reference}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 border-b border-line">
                  <Fact label="Equipo" value="Plataforma" />
                  <Fact label="Contrato" value="Jornada completa" />
                  <Fact label="Nivel" value="Indiferente" />
                  <Fact label="Publicada" value={JOB.published} />
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-ink-faint">
                        Banda salarial publicada
                      </p>
                      <p className="mt-1.5 text-[21px] font-medium tracking-[-0.03em]">
                        34.000 € <span className="font-normal text-ink-faint">–</span> 68.000 €
                      </p>
                    </div>
                    <span className="shrink-0 border border-line-dark px-2 py-1 font-mono text-[8px] uppercase tracking-[0.06em] text-ink-soft">
                      Bruto / año
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onApply}
                    className="mt-5 flex w-full items-center justify-between border-t border-line pt-4 text-left group"
                  >
                    <span>
                      <span className="block text-[13px] font-semibold">Solicitar esta posición</span>
                      <span className="mt-0.5 block text-[11px] text-ink-faint">
                        Requiere expediente completo
                      </span>
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center border border-ink transition-colors group-hover:bg-ink group-hover:text-paper-light">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2 border border-line px-3.5 py-2.5">
                <span className="mt-[5px] h-1 w-1 shrink-0 bg-accent" aria-hidden="true" />
                <p className="text-[10px] leading-relaxed text-ink-faint">
                  *La modalidad remota está sujeta a condiciones de desplazamiento, presencialidad y
                  recolocación descritas en la solicitud.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-y border-line bg-paper-deep/45">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-px bg-line/80 sm:grid-cols-4">
            {[
              ["47", "personas en plantilla"],
              ["3", "husos horarios activos"],
              ["16", "semanas de viaje al año"],
              ["1", "oferta publicada (esta)"],
            ].map(([number, label]) => (
              <div key={label} className="bg-paper px-5 py-5 sm:px-8 sm:py-6">
                <p className="text-[25px] font-medium tracking-[-0.04em]">{number}</p>
                <p className="mt-1 font-mono text-[8px] uppercase leading-relaxed tracking-[0.06em] text-ink-faint">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role */}
      <section id="posicion" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
        <SectionHead
          index="01"
          label="La posición"
          title={
            <>
              Una requisición.
              <br />
              <span className="text-ink-faint">Todo el contexto.</span>
            </>
          }
          aside="Esta página contiene toda la información disponible sobre la posición. No disponemos de una versión más detallada."
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[4fr_8fr] lg:gap-16">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border-l-2 border-accent pl-5">
              <p className="text-[20px] font-medium leading-snug tracking-[-0.025em]">
                La persona seleccionada existirá, si existe, para que el sistema funcione incluso cuando
                nadie esté mirando.
              </p>
            </div>
            <p className="mt-6 max-w-sm text-[13px] leading-relaxed text-ink-soft">
              Reportará al Director de Plataforma y mantendrá una relación de colaboración transversal
              con Producto, Diseño, Seguridad y Cumplimiento.
            </p>
            <dl className="mt-8 border-t border-line">
              {[
                ["Reporta a", "Director de Plataforma"],
                ["Equipo", "Plataforma y Gobernanza"],
                ["Alcance", "Global"],
                ["Disponibilidad", "Inmediata"],
                ["Cierre", JOB.closing],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5">
                  <dt className="font-mono text-[9px] uppercase tracking-[0.06em] text-ink-faint">{label}</dt>
                  <dd className="text-right text-[11px] font-medium text-ink-soft">{value}</dd>
                </div>
              ))}
            </dl>
            <button type="button" onClick={onApply} className="btn btn-primary mt-7 w-full sm:w-auto">
              Iniciar candidatura
              <ArrowRight />
            </button>
          </aside>

          <div className="min-w-0">
            <RoleBlock title="Contexto" number="01.1">
              <p>
                Deskjockey for Life desarrolla la capa operativa que permite a organizaciones
                distribuidas convertir decisiones ambiguas en resultados auditables. Nuestro software no
                sustituye el criterio: lo formaliza, lo documenta y lo somete a seguimiento.
              </p>
              <p>
                La posición existe porque la compañía ha alcanzado un punto de complejidad en el que la
                coordinación informal ya no es suficiente. Buscamos a alguien que se sienta cómodo
                operando en esa transición, sin necesidad de que el alcance esté completamente definido.
              </p>
            </RoleBlock>

            <RoleBlock title="Responsabilidades" number="01.2">
              <ol className="divide-y divide-line border-y border-line">
                {[
                  "Diseñar, construir y operar servicios distribuidos con una disponibilidad objetivo del 99,999 % y una tolerancia contractual del 99,9 %.",
                  "Traducir requisitos ambiguos en arquitecturas defendibles y, posteriormente, en explicaciones aptas para auditoría.",
                  "Participar en las guardias 24/7 de un modo compatible con la conciliación, según el calendario fiscal.",
                  "Elevar el estándar de revisión de código y mantener conversaciones difíciles en un entorno psicológicamente seguro.",
                  "Colaborar con Producto, Diseño y Cumplimiento en ciclos de tres semanas que, ocasionalmente, duran seis.",
                  "Documentar todo lo que aún no está documentado y mantener la documentación de lo que ya lo está.",
                ].map((item, index) => (
                  <li key={item} className="grid grid-cols-[28px_1fr] gap-3 py-4">
                    <span className="pt-[2px] font-mono text-[9px] uppercase tracking-[0.04em] text-accent">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[13px] leading-relaxed text-ink-soft">{item}</span>
                  </li>
                ))}
              </ol>
            </RoleBlock>

            <RoleBlock title="Requisitos imprescindibles" number="01.3">
              <ul className="grid gap-x-8 sm:grid-cols-2">
                {[
                  "Experiencia demostrable construyendo software en producción.",
                  "Dominio de TypeScript, Node.js y PostgreSQL.",
                  "Experiencia con Kubernetes y entornos cloud.",
                  "Capacidad para justificar decisiones con datos y, si no hay datos, con convicción.",
                  "Inglés profesional escrito y hablado.",
                  "Disponibilidad para viajar hasta 16 semanas al año.",
                  "Historial de ownership sobre resultados, no solo sobre tareas.",
                  "Mentalidad de crecimiento documentada con al menos tres ejemplos.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 border-b border-line py-3">
                    <Check className="mt-1 h-3 w-3 shrink-0 text-accent" />
                    <span className="text-[12px] leading-relaxed text-ink-soft">{item}</span>
                  </li>
                ))}
              </ul>
            </RoleBlock>

            <RoleBlock title="Valorable" number="01.4">
              <div className="flex flex-wrap gap-2">
                {[
                  "Rust en producción",
                  "Experiencia en auditorías",
                  "Docencia técnica",
                  "On-call en solitario",
                  "Diseño de sistemas de gobernanza",
                  "Inglés C2",
                  "Marca personal activa",
                  "Tolerancia demostrada a la ambigüedad",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="border border-line-dark px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.04em] text-ink-soft"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </RoleBlock>
          </div>
        </div>
      </section>

      {/* Culture */}
      <section id="cultura" className="scroll-mt-24 bg-ink text-paper">
        <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="flex flex-col gap-4 border-b border-paper/15 pb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow dot className="!text-paper/45">
                Cultura y liderazgo
              </Eyebrow>
              <h2 className="mt-4 text-[clamp(2rem,4.4vw,3.8rem)] font-medium leading-[0.98] tracking-[-0.045em]">
                La cultura no es un póster.
                <br />
                <span className="text-paper/40">Es un criterio de evaluación.</span>
              </h2>
            </div>
            <p className="max-w-[230px] font-mono text-[9px] uppercase leading-relaxed tracking-[0.05em] text-paper/35">
              Documento fundacional · versión 14.2
              <br />
              Aprobado por el comité de cultura
            </p>
          </div>

          <div className="grid gap-10 pt-12 lg:grid-cols-[5fr_7fr] lg:gap-16">
            <div>
              <div className="relative aspect-[4/5] overflow-hidden bg-paper/10 sm:aspect-[5/4] lg:aspect-[4/5]">
                <img
                  src="/images/ceo.jpg"
                  alt="Aurelio Benavente, fundador y consejero delegado de Deskjockey for Life"
                  className="h-full w-full object-cover grayscale-[18%]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/60 to-transparent p-5 pt-16">
                  <p className="text-[15px] font-medium">Aurelio Benavente</p>
                  <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.09em] text-paper/55">
                    Founder & CEO · 14 años redefiniendo la categoría
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4 border border-paper/15 px-3.5 py-2.5 font-mono text-[8px] uppercase tracking-[0.07em] text-paper/40">
                <span>Liderazgo accesible</span>
                <span>Agenda abierta 15 min/mes</span>
              </div>
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <span className="serif-note block text-[60px] leading-[0.4] text-accent" aria-hidden="true">
                  “
                </span>
                <blockquote className="serif-note mt-3 text-[clamp(1.8rem,3.5vw,3.15rem)] leading-[1.12] text-paper/90">
                  No construimos software. Construimos las condiciones para que el software pueda seguir
                  construyéndose.
                </blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <span className="h-px w-8 bg-accent" aria-hidden="true" />
                  <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-paper/40">
                    Aurelio Benavente · Carta al equipo, Q1 2026
                  </p>
                </div>
              </div>

              <div className="mt-12 grid gap-px border border-paper/15 bg-paper/15 sm:grid-cols-2">
                {values.map((value, index) => (
                  <div key={value.title} className="bg-ink p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-[14px] font-medium">{value.title}</h3>
                      <span className="font-mono text-[8px] text-paper/25">V-0{index + 1}</span>
                    </div>
                    <p className="mt-2.5 text-[11px] leading-relaxed text-paper/50">{value.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-24">
        <SectionHead
          index="02"
          label="Condiciones"
          title={
            <>
              Lo que ofrecemos,
              <br />
              <span className="text-ink-faint">literalmente.</span>
            </>
          }
          aside="Las condiciones descritas son orientativas, no contractuales y pueden actualizarse sin necesidad de una nueva publicación."
        />

        <div className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <article key={benefit.code} className="flex flex-col bg-paper-light p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-accent">
                  {benefit.code}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-ink-faint" />
              </div>
              <h3 className="mt-8 text-[18px] font-medium tracking-[-0.025em]">{benefit.title}</h3>
              <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">{benefit.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-[10px] leading-relaxed text-ink-faint">
          *La modalidad remota implica un mínimo de cuatro desplazamientos anuales de cuatro semanas,
          posibilidad de presencialidad total y recolocación según las necesidades de la compañía.
        </p>
      </section>

      {/* Process */}
      <section id="proceso" className="scroll-mt-24 border-y border-line bg-paper-deep/40">
        <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[7fr_4fr] lg:gap-20">
            <div>
              <Eyebrow dot>03 · Proceso</Eyebrow>
              <h2 className="mt-4 text-[clamp(2rem,4.4vw,3.8rem)] font-medium leading-[0.98] tracking-[-0.045em]">
                Cinco fases.
                <br />
                <span className="text-ink-faint">Cero atajos.</span>
              </h2>
              <div className="mt-10 border-t border-line-dark">
                {processSteps.map((step) => (
                  <div key={step.code} className="grid grid-cols-[34px_1fr] gap-4 border-b border-line py-5 sm:grid-cols-[42px_1fr_150px]">
                    <span className="pt-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-accent">
                      {step.code}
                    </span>
                    <div>
                      <h3 className="text-[15px] font-medium tracking-[-0.01em]">{step.title}</h3>
                      <p className="mt-1.5 max-w-lg text-[12px] leading-relaxed text-ink-soft">{step.body}</p>
                    </div>
                    <span className="col-start-2 pt-1 font-mono text-[8px] uppercase tracking-[0.06em] text-ink-faint sm:col-start-3 sm:text-right">
                      {step.duration}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <aside className="self-start border border-line-dark bg-paper-light p-6 lg:sticky lg:top-28">
              <div className="flex items-center justify-between gap-4">
                <p className="eyebrow text-ink-faint">Modelo de evaluación</p>
                <span className="font-mono text-[8px] uppercase tracking-[0.05em] text-accent">
                  Confidencial
                </span>
              </div>
              <h3 className="mt-4 text-[22px] font-medium leading-tight tracking-[-0.03em]">
                Cinco criterios.
                <br />
                Un umbral interno.
              </h3>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
                La candidatura se puntúa sobre 100. El umbral de alineación se fija en 95,0 puntos. La
                metodología se detalla en el anexo que acompaña a la decisión.
              </p>
              <div className="mt-5 border-t border-line">
                {[
                  ["CV ↔ oferta", "Coseno vectorial", "20 %"],
                  ["Respuestas abiertas", "Volumen", "20 %"],
                  ["Selección única", "Alineación", "25 %"],
                  ["Compensación", "Banda baja", "15 %"],
                  ["Diversidad", "Opciones minoritarias", "20 %"],
                ].map(([label, method, weight]) => (
                  <div key={label} className="grid grid-cols-[1fr_auto] gap-2 border-b border-line py-2.5">
                    <div>
                      <p className="text-[11px] font-medium">{label}</p>
                      <p className="font-mono text-[8px] uppercase tracking-[0.04em] text-ink-faint">
                        {method}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-ink-soft">{weight}</span>
                  </div>
                ))}
              </div>
              <button type="button" onClick={onApply} className="btn btn-primary mt-5 w-full">
                Abrir expediente
                <ArrowRight />
              </button>
            </aside>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="preguntas" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
        <SectionHead
          index="04"
          label="Preguntas frecuentes"
          title={
            <>
              Lo que suele
              <br />
              <span className="text-ink-faint">preguntarse.</span>
            </>
          }
          aside="Si su pregunta no aparece, no es necesario formularla: se responderá durante el proceso o no se responderá."
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-[4fr_8fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[13px] leading-relaxed text-ink-soft">
              Hemos consolidado las respuestas oficiales en un único documento para reducir la
              variabilidad de la información.
            </p>
            <button type="button" onClick={onApply} className="btn btn-secondary mt-5">
              Continuar con la candidatura
              <ArrowRight />
            </button>
          </div>
          <div className="border-t border-line-dark">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="relative overflow-hidden border border-ink bg-ink px-6 py-12 text-paper sm:px-10 sm:py-16">
          <div className="paper-grid pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <Eyebrow dot className="!text-paper/45">
                Siguiente paso
              </Eyebrow>
              <h2 className="mt-4 max-w-2xl text-[clamp(2rem,4.6vw,4rem)] font-medium leading-[0.98] tracking-[-0.045em]">
                El siguiente paso es una candidatura.<br />
                <span className="text-paper/40">El resto depende del comité.</span>
              </h2>
              <p className="mt-5 max-w-md text-[12px] leading-relaxed text-paper/50">
                Seis secciones. Más de sesenta campos. Una sección de diversidad obligatoria. Un
                resultado que no admite recurso.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button type="button" onClick={onApply} className="btn btn-accent !min-h-[50px] !px-6">
                Iniciar candidatura
                <ArrowRight />
              </button>
              <span className="flex items-center justify-center gap-2 border border-paper/20 px-4 py-3 font-mono text-[8px] uppercase tracking-[0.07em] text-paper/45 sm:justify-start">
                <span className="h-1.5 w-1.5 bg-accent" aria-hidden="true" />
                Requisición SYN-001 · Abierta
              </span>
            </div>
          </div>
        </div>
      </section>

      <DisclaimerBand />
    </main>
  );
}

function SectionHead({
  index,
  label,
  title,
  aside,
}: {
  index: string;
  label: string;
  title: ReactNode;
  aside: string;
}) {
  return (
    <div className="border-t border-line-dark pt-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_8fr_3fr] lg:gap-10">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{index}</p>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.06em] text-ink-faint">{label}</p>
        </div>
        <h2 className="text-[clamp(2rem,4.4vw,3.8rem)] font-medium leading-[0.99] tracking-[-0.045em]">
          {title}
        </h2>
        <p className="max-w-[260px] text-[11px] leading-relaxed text-ink-faint lg:justify-self-end lg:text-right">
          {aside}
        </p>
      </div>
    </div>
  );
}

function RoleBlock({
  title,
  number,
  children,
}: {
  title: string;
  number: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-10 border-t border-line-dark pt-5 last:mb-0">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h3 className="text-[18px] font-medium tracking-[-0.025em]">{title}</h3>
        <span className="font-mono text-[9px] uppercase tracking-[0.05em] text-ink-faint">{number}</span>
      </div>
      <div className="space-y-4 text-[13px] leading-[1.75] text-ink-soft">{children}</div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-r border-line p-4 last:border-r-0 [&:nth-child(2n)]:border-r-0">
      <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink-faint">{label}</p>
      <p className="mt-1 text-[12px] font-medium text-ink">{value}</p>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-6 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-[14px] font-medium leading-snug tracking-[-0.01em]">{question}</span>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-line-dark">
          <ChevronDown className={open ? "h-3 w-3 rotate-180 transition-transform" : "h-3 w-3 transition-transform"} />
        </span>
      </button>
      {open && <p className="max-w-2xl pb-5 pr-10 text-[12px] leading-relaxed text-ink-soft">{answer}</p>}
    </div>
  );
}
