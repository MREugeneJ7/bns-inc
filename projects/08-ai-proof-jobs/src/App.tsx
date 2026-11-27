import { useEffect, useMemo, useState } from "react";
import { JOBS, RISK_LABELS, type JobId } from "./data/jobs";
import { MODULES, QUESTIONS } from "./data/questions";
import { scoreAnswers, type Answers, type RankedJob } from "./data/scoring";

type Screen = "intro" | "quiz" | "processing" | "result";

interface Session {
  screen: Exclude<Screen, "processing">;
  current: number;
  answers: Answers;
}

const STORAGE_KEY = "oraculo9-expediente-v2";
const PROCESSING_LINES = [
  "Cruzando respuestas aparentemente inconexas",
  "Separando el criterio del color favorito",
  "Revisando los límites que has indicado",
  "Consultando el departamento de posibilidades improbables",
  "Descartando una confianza científicamente injustificable",
  "Redactando un futuro con aspecto de informe",
];

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<Session>;
    if (!saved.answers || typeof saved.answers !== "object") return null;

    const answers: Answers = {};
    for (const question of QUESTIONS) {
      const value = saved.answers[question.id];
      if (Number.isInteger(value) && value >= 0 && value < question.options.length) answers[question.id] = value;
    }
    if (!Object.keys(answers).length) return null;

    const complete = QUESTIONS.every((question) => answers[question.id] !== undefined);
    const screen = saved.screen === "result" && complete ? "result" : saved.screen === "intro" ? "intro" : "quiz";
    const current = Number.isInteger(saved.current) ? Math.max(0, Math.min(QUESTIONS.length - 1, saved.current as number)) : 0;
    return { screen, current, answers };
  } catch {
    return null;
  }
}

function scrollToTop(smooth = false) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: smooth && !reducedMotion ? "smooth" : "auto" });
}

export default function App() {
  const [saved] = useState(readSession);
  const [screen, setScreen] = useState<Screen>(saved?.screen ?? "intro");
  const [answers, setAnswers] = useState<Answers>(saved?.answers ?? {});
  const [current, setCurrent] = useState(saved?.current ?? 0);

  useEffect(() => {
    try {
      if (!Object.keys(answers).length) {
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        const session: Session = { screen: screen === "processing" ? "result" : screen, current, answers };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      }
    } catch {
      // The assessment still works in memory when browser storage is unavailable.
    }
  }, [answers, current, screen]);

  const complete = QUESTIONS.every((question) => answers[question.id] !== undefined);
  const hasAnswers = Object.keys(answers).length > 0;

  function restart() {
    setAnswers({});
    setCurrent(0);
    setScreen("intro");
    scrollToTop();
  }

  function next() {
    if (answers[QUESTIONS[current].id] === undefined) return;
    if (current === QUESTIONS.length - 1) {
      const firstMissing = QUESTIONS.findIndex((question) => answers[question.id] === undefined);
      if (firstMissing !== -1) {
        setCurrent(firstMissing);
      } else {
        setScreen("processing");
      }
    } else {
      setCurrent((value) => value + 1);
    }
    scrollToTop();
  }

  function jumpTo(index: number) {
    setCurrent(index);
    scrollToTop();
  }

  function triggerRandomResult() {
    const randomAnswers: Answers = {};
    QUESTIONS.forEach((q) => {
      randomAnswers[q.id] = Math.floor(Math.random() * q.options.length);
    });
    // Habilitar consentimiento para que los 18 oficios entren al ranking
    randomAnswers[3] = 0;  // >=18 años
    randomAnswers[12] = 1; // acepta riesgo físico
    randomAnswers[18] = 2; // acepta opciones íntimas

    setAnswers(randomAnswers);
    setCurrent(QUESTIONS.length - 1);
    setScreen("result");
    scrollToTop();
  }

  return (
    <div className={`app ${screen === "intro" ? "app-intro" : ""}`}>
      <Header onHome={() => { setScreen("intro"); scrollToTop(); }} />
      <main id="main-content">
        {screen === "intro" && (
          <Intro
            hasAnswers={hasAnswers}
            complete={complete}
            onStart={() => { setScreen("quiz"); scrollToTop(); }}
            onResult={() => { setScreen("result"); scrollToTop(); }}
            onRestart={restart}
          />
        )}
        {screen === "quiz" && (
          <Quiz
            current={current}
            answers={answers}
            complete={complete}
            onAnswer={(questionId, optionIndex) => setAnswers((previous) => ({ ...previous, [questionId]: optionIndex }))}
            onNext={next}
            onPrevious={() => jumpTo(Math.max(0, current - 1))}
            onJump={jumpTo}
            onResult={() => { setScreen("result"); scrollToTop(); }}
          />
        )}
        {screen === "processing" && <Processing onDone={() => { setScreen("result"); scrollToTop(); }} />}
        {screen === "result" && (
          <Result
            answers={answers}
            onRestart={restart}
            onEdit={() => { setCurrent(0); setScreen("quiz"); scrollToTop(); }}
          />
        )}
      </main>
      <Footer onDevSkip={triggerRandomResult} />
      <button
        type="button"
        onClick={triggerRandomResult}
        className="dev-cheat-pixel fixed-pixel"
        title="Atajo: saltar a resultado aleatorio puntuando los 20"
        aria-label="Atajo: saltar a resultado aleatorio puntuando los 20"
      />
    </div>
  );
}

function Mark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="12.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 0v8M16 24v8M0 16h8M24 16h8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg className="arrow-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {diagonal ? <path d="M4 16 16 4M6 4h10v10" /> : <path d="M3 10h13M11 5l5 5-5 5" />}
    </svg>
  );
}

function Header({ onHome }: { onHome: () => void }) {
  return (
    <header className="topbar">
      <button className="brand" onClick={onHome} aria-label="ORÁCULO-9, volver al inicio">
        <Mark />
        <span>ORÁCULO<span className="brand-dash">-9</span><sup>TM</sup></span>
      </button>
      <div className="topbar-center">DEPARTAMENTO DE FUTUROS POSIBLES</div>
      <div className="topbar-status"><span className="status-dot" /> SISTEMA EN LÍNEA</div>
    </header>
  );
}

function Intro({ hasAnswers, complete, onStart, onResult, onRestart }: {
  hasAnswers: boolean;
  complete: boolean;
  onStart: () => void;
  onResult: () => void;
  onRestart: () => void;
}) {
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <p className="hero-kicker"><span className="kicker-line" /> INTELIGENCIA LABORAL DE ÚLTIMA GENERACIÓN</p>
          <h1 className="hero-brand">ORÁCULO<span>-9</span><sup>TM</sup></h1>
          <h2>Te quita el trabajo.<br /><em>Ahora te busca otro.</em></h2>
          <p className="hero-description">
            El futuro laboral es incierto. Por suerte, hemos construido un sistema que habla de él con una seguridad absolutamente injustificada.
          </p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={complete ? onResult : onStart}>
              {complete ? "VER MI INFORME" : hasAnswers ? "CONTINUAR EVALUACIÓN" : "INICIAR EVALUACIÓN"}
              <Arrow diagonal />
            </button>
            {hasAnswers && <button className="text-button hero-reset" onClick={onRestart}>Empezar de cero</button>}
          </div>
        </div>
      </section>
      <section className="intro-note">
        <p className="eyebrow">EL PROCEDIMIENTO</p>
        <div>
          <h2>Nosotros preguntamos.<br />Tú sospechas.</h2>
          <p>{QUESTIONS.length} preguntas, unas cuantas inútiles y un sistema de reglas que intenta encontrar un trabajo para el que seguir siendo humano importe. Algunas opciones ya conviven con la IA. Sorpresa.</p>
          <p className="privacy-note">Esto es sátira, no orientación profesional. Tus respuestas se quedan en esta pestaña; no se envían para entrenar ningún modelo.</p>
        </div>
      </section>
    </>
  );
}

function Quiz({ current, answers, complete, onAnswer, onNext, onPrevious, onJump, onResult }: {
  current: number;
  answers: Answers;
  complete: boolean;
  onAnswer: (questionId: number, optionIndex: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onJump: (index: number) => void;
  onResult: () => void;
}) {
  const question = QUESTIONS[current];
  const selected = answers[question.id];
  const answeredCount = QUESTIONS.filter((item) => answers[item.id] !== undefined).length;
  const progress = Math.round((answeredCount / QUESTIONS.length) * 100);

  return (
    <div className="workspace">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow"><span className="tiny-cross">+</span> EVALUACIÓN DE HUMANIDAD ÚTIL</p>
          <p className="workspace-subtitle">Expediente personal <span>/</span> en curso</p>
        </div>
        <div className="progress-number"><strong>{String(answeredCount).padStart(2, "0")}</strong><span> / {QUESTIONS.length}</span></div>
      </div>
      <div className="progress-track" role="progressbar" aria-label="Preguntas respondidas" aria-valuemin={0} aria-valuemax={QUESTIONS.length} aria-valuenow={answeredCount}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="progress-caption"><span>PROGRESO DEL EXPEDIENTE</span><span>{progress}% COMPLETADO</span></div>

      <div className="quiz-layout">
        <aside className="quiz-sidebar" aria-label="Módulos del test">
          <p className="sidebar-title">ÍNDICE DEL EXPEDIENTE</p>
          <nav className="module-list" aria-label="Ir a un módulo ya disponible">
            {MODULES.map((module, index) => {
              const start = QUESTIONS.findIndex((item) => item.module === index);
              const available = QUESTIONS.slice(0, start).every((item) => answers[item.id] !== undefined);
              const done = QUESTIONS.filter((item) => item.module === index).every((item) => answers[item.id] !== undefined);
              return (
                <button
                  key={module}
                  className={`module-item ${question.module === index ? "active" : ""} ${done ? "done" : ""}`}
                  disabled={!available}
                  onClick={() => onJump(start)}
                  aria-current={question.module === index ? "step" : undefined}
                >
                  <span className="module-index">{String(index + 1).padStart(2, "0")}</span>
                  <span>{module}</span>
                  {done && <span className="module-done" aria-label="Completado">✓</span>}
                </button>
              );
            })}
          </nav>
          <p className="sidebar-note">Tus respuestas se guardan solo en esta pestaña. El sistema no sabe guardar secretos de otra forma.</p>
        </aside>

        <section className="question-area" aria-labelledby="question-title">
          <div key={question.id} className="question-content">
            <p className="question-meta">MÓDULO {String(question.module + 1).padStart(2, "0")} <span>/</span> PREGUNTA {String(current + 1).padStart(2, "0")}</p>
            <h1 id="question-title">{question.text}</h1>
            <p className="question-hint">{question.hint ?? "Selecciona la opción que más se acerque. No buscamos la perfección; tampoco sabríamos reconocerla."}</p>
            <fieldset className="options" aria-labelledby="question-title">
              <legend className="sr-only">Elige una respuesta</legend>
              {question.options.map((option, index) => (
                <label key={index} className={`option ${selected === index ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={index}
                    checked={selected === index}
                    onChange={() => onAnswer(question.id, index)}
                  />
                  <span className="option-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option.text}</span>
                  <span className="option-radio" aria-hidden="true"><span /></span>
                </label>
              ))}
            </fieldset>
          </div>
          <p className="sr-only" aria-live="polite">Pregunta {current + 1} de {QUESTIONS.length}: {question.text}</p>
          <div className="quiz-controls">
            <button className="previous-button" onClick={onPrevious} disabled={current === 0}><span aria-hidden="true">←</span> ANTERIOR</button>
            <button className="button button-primary next-button" onClick={onNext} disabled={selected === undefined}>
              {current === QUESTIONS.length - 1 ? "OBTENER MI INFORME" : "SIGUIENTE PREGUNTA"}<Arrow />
            </button>
          </div>
          {complete && <button className="text-button return-report" onClick={onResult}>Volver al informe sin repetir todo el test <span aria-hidden="true">↗</span></button>}
          <p className="question-footnote"><span>NOTA DEL SISTEMA</span> Una respuesta honesta es mejor que una estratégicamente interesante. O eso creemos.</p>
        </section>
      </div>
    </div>
  );
}

function Processing({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (step >= PROCESSING_LINES.length) onDone();
      else setStep((value) => value + 1);
    }, step >= PROCESSING_LINES.length ? 450 : 420);
    return () => window.clearTimeout(timer);
  }, [step, onDone]);

  return (
    <section className="processing workspace" aria-live="polite">
      <p className="eyebrow"><span className="tiny-cross">+</span> ANÁLISIS EN CURSO</p>
      <div className="processing-mark"><Mark /></div>
      <h1>Procesando<br /><em>tu humanidad.</em></h1>
      <p className="processing-description">Por favor, no apagues el optimismo. El sistema está haciendo lo que puede.</p>
      <div className="processing-track"><span style={{ width: `${Math.round((step / PROCESSING_LINES.length) * 100)}%` }} /></div>
      <div className="processing-log">
        {PROCESSING_LINES.slice(0, step).map((line) => <p key={line}><span>OK</span> {line}</p>)}
        {step < PROCESSING_LINES.length && <p className="processing-current"><span>...</span> {PROCESSING_LINES[step]}</p>}
      </div>
      <button className="text-button processing-skip" onClick={onDone}>Omitir simulación y ver informe <span aria-hidden="true">↗</span></button>
    </section>
  );
}

function joinReasons(reasons: string[]) {
  if (reasons.length === 1) return reasons[0];
  return `${reasons.slice(0, -1).join(", ")} y ${reasons[reasons.length - 1]}`;
}

function Result({ answers, onRestart, onEdit }: { answers: Answers; onRestart: () => void; onEdit: () => void }) {
  const { ranking } = useMemo(() => scoreAnswers(answers), [answers]);
  const [selectedId, setSelectedId] = useState<JobId>(ranking[0].id);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");
  const selectedRank = ranking.findIndex((item) => item.id === selectedId);
  const selected = ranking[selectedRank] ?? ranking[0];
  const job = JOBS[selected.id];
  const shareText = `ORÁCULO-9 ha decidido que mi futuro laboral podría ser: ${job.title}. ${job.tagline} (Test satírico, no asesoramiento profesional.)`;

  async function copyResult() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(shareText);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2500);
    } catch {
      setCopyState("manual");
    }
  }

  function selectJob(id: JobId) {
    setSelectedId(id);
    setCopyState("idle");
    scrollToTop(true);
  }

  return (
    <div className="report workspace">
      <div className="report-topline">
        <p className="eyebrow"><span className="tiny-cross">+</span> EXPEDIENTE COMPLETADO</p>
        <span>INFORME PERSONAL / {String(QUESTIONS.length).padStart(2, "0")} RESPUESTAS</span>
      </div>
      <div className="report-head">
        <p className="report-label">{selectedRank === 0 ? "TU RESULTADO PRINCIPAL" : `ALTERNATIVA ${String(selectedRank + 1).padStart(2, "0")}`} <span>/</span> EXPEDIENTE {job.code}</p>
        <h1>{job.title}<span className="report-period">.</span></h1>
        <p className="report-tagline">{job.tagline}</p>
        {selectedRank !== 0 && (
          <button className="button button-secondary return-primary" onClick={() => selectJob(ranking[0].id)}>
            ← VOLVER A MI INFORME PRINCIPAL
          </button>
        )}
      </div>

      <div className="report-body">
        <aside className="report-aside" aria-hidden="true">
          <p>ORÁCULO-9<br />DEPARTAMENTO DE<br />FUTUROS POSIBLES</p>
          <span>{job.code}</span>
          <div className="report-aside-line" />
          <p>CLASIFICACIÓN<br />NO VINCULANTE</p>
        </aside>
        <article className="report-article">
          {job.joke && <p className="joke-disclaimer">ESTO ES UN CHISTE. NO ES UN EMPLEO NI UN PLAN REAL.</p>}
          <p className="section-kicker">01 / EL DIAGNÓSTICO</p>
          <h2>La lógica detrás<br />de la decisión.</h2>
          <p className="report-paragraph">{job.justification}</p>
          <div className="signals">
            <p className="section-kicker">SEÑALES QUE HAN PESADO</p>
            <p>{selected.reasons.length ? `Esta opción conecta con ${joinReasons(selected.reasons)}.` : "No hay una señal dominante para esta alternativa; sigue disponible para que la explores."}</p>
          </div>
          <div className="report-facts">
            <div><p className="section-kicker">RELACIÓN CON LA IA</p><p>{job.aiReality}</p></div>
            <div><p className="section-kicker">REMUNERACIÓN</p><p>{job.salary}</p></div>
          </div>
          <div className="report-benefits">
            <p className="section-kicker">VENTAJAS QUE HEMOS DECIDIDO DESTACAR</p>
            <ul>{job.perks.map((perk) => <li key={perk}><span>↗</span> {perk}</li>)}</ul>
          </div>
          <div className="collateral">
            <div className="collateral-head">
              <p className="section-kicker">02 / RIESGO DE SEGUNDO ORDEN</p>
              <span className="collateral-level">{RISK_LABELS[job.collateral.level]} · {job.collateral.level}/4</span>
            </div>
            <div className="collateral-meter" role="img" aria-label={`Riesgo de segundo orden: ${RISK_LABELS[job.collateral.level]}, ${job.collateral.level} de 4`}>
              {[1, 2, 3, 4].map((step) => <span key={step} className={step <= job.collateral.level ? "on" : undefined} />)}
            </div>
            <p className="collateral-sub">Que la IA no te sustituya no significa que no destruya tu sector.</p>
            <p className="collateral-text">{job.collateral.text}</p>
          </div>
          <div className="report-warning"><span>!</span><p><strong>LA LETRA PEQUEÑA</strong><br />{job.warning}</p></div>
          {job.source && <a className="source-link" href={job.source.url} target="_blank" rel="noreferrer">{job.source.label} <span aria-hidden="true">↗</span></a>}
        </article>
      </div>

      <section className="alternatives">
        <p className="section-kicker">03 / TODOS LOS FUTUROS DISPONIBLES</p>
        <div className="alternatives-heading">
          <h2>Si el destino<br /><em>no te convence.</em></h2>
          <p>
            Puedes abrir los {ranking.length} expedientes sin repetir el cuestionario, una muestra de generosidad algorítmica.
            {selectedRank !== 0 && " Tu informe principal sigue siendo el primero de la lista y siempre puedes volver a él."}
          </p>
        </div>
        <div className="result-list">
          {ranking.slice(0, 3).map((item, index) => (
            <ResultRow key={item.id} item={item} position={index + 1} isPrimary={index === 0} active={item.id === selected.id} onSelect={selectJob} />
          ))}
        </div>
        {ranking.length > 3 && (
          <details className="more-results">
            <summary>EXPLORAR LOS OTROS {ranking.length - 3} RESULTADOS <span>+</span></summary>
            <div className="result-list">
              {ranking.slice(3).map((item, index) => (
                <ResultRow key={item.id} item={item} position={index + 4} active={item.id === selected.id} onSelect={selectJob} />
              ))}
            </div>
          </details>
        )}
        <p className="ranking-note">
          Se muestran las opciones compatibles con los límites que marcaste. El orden compara preferencias mediante reglas; no es una predicción científica ni una garantía de empleo. El punto de color indica el riesgo de segundo orden de cada sector.
        </p>
      </section>

      <div className="report-actions">
        <button className="button button-primary" onClick={copyResult}>{copyState === "copied" ? "COPIADO" : "COPIAR ESTE VEREDICTO"}<Arrow diagonal /></button>
        <button className="button button-secondary" onClick={onEdit}>REVISAR MIS RESPUESTAS <Arrow /></button>
        <button className="text-button restart-button" onClick={onRestart}>Empezar de cero</button>
      </div>
      {copyState === "manual" && <div className="manual-copy"><label htmlFor="share-text">No hemos podido acceder al portapapeles. Copia el texto manualmente:</label><textarea id="share-text" readOnly value={shareText} onFocus={(event) => event.currentTarget.select()} /></div>}
    </div>
  );
}

function ResultRow({ item, position, isPrimary = false, active, onSelect }: {
  item: RankedJob;
  position: number;
  isPrimary?: boolean;
  active: boolean;
  onSelect: (id: JobId) => void;
}) {
  const job = JOBS[item.id];
  const level = job.collateral.level;
  return (
    <button className={`result-row ${active ? "active" : ""} ${isPrimary ? "primary" : ""}`} onClick={() => onSelect(item.id)}>
      <span className="result-row-number">{String(position).padStart(2, "0")}</span>
      <span className="result-row-title">
        {isPrimary && <span className="result-row-tag">TU RESULTADO PRINCIPAL</span>}
        {job.title}
        <span className={`risk-dot r${level}`} title={`Riesgo de segundo orden: ${RISK_LABELS[level]} (${level}/4)`} aria-hidden="true" />
        <span className="sr-only">Riesgo de segundo orden {RISK_LABELS[level]}, {level} de 4.</span>
      </span>
      <span className="result-row-action">{active ? "VIENDO" : "VER INFORME"} <Arrow diagonal /></span>
    </button>
  );
}

function Footer({ onDevSkip }: { onDevSkip: () => void }) {
  return (
    <footer className="footer">
      <span>ORÁCULO-9 <span className="footer-separator">/</span> INTELIGENCIA LABORAL CUESTIONABLE</span>
      <span>
        UNA SÁTIRA. NO ES ORIENTACIÓN PROFESIONAL.
        <button
          type="button"
          onClick={onDevSkip}
          className="dev-cheat-pixel"
          title="Atajo: saltar a resultado aleatorio puntuando los 20"
          aria-label="Atajo: saltar a resultado aleatorio puntuando los 20"
        />
      </span>
    </footer>
  );
}