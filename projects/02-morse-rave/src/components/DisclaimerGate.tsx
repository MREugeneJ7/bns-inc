import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type UIEvent,
} from "react";
import {
  BOXES,
  BOXES_PER_PAGE,
  CLAUSES,
  EYE_LINES,
  HONOR_SECONDS,
  READ_SECONDS,
  ROUNDS,
  VERIFY_MS,
  VETERAN_PHRASE,
  WRONG_NOTES,
  matchesVeteranPhrase,
  writeSigned,
} from "../lib/disclaimer";
import { cn } from "../utils/cn";
import { Icon } from "./Icon";

type Stage = "read" | "boxes" | "eyes" | "confirm" | "done";
const STAGES: { id: Stage; label: string }[] = [
  { id: "read", label: "Read" },
  { id: "boxes", label: "Tick" },
  { id: "eyes", label: "Stare" },
  { id: "confirm", label: "Confirm" },
];

/** Counts down in real time, but only while the tab is actually visible. */
function useCountdown(seconds: number, running: boolean) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      if (document.visibilityState === "visible")
        setLeft((value) => Math.max(0, value - dt / 1000));
    }, 200);
    return () => window.clearInterval(id);
  }, [running]);
  return left;
}

function Btn({
  tone,
  children,
  ...props
}: {
  tone: "loud" | "muted" | "danger" | "primary";
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn("gate-btn", `tone-${tone}`, props.className)}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ read */

function ReadStage({ onNext }: { onNext: () => void }) {
  const left = useCountdown(READ_SECONDS, true);
  const [progress, setProgress] = useState(0);
  const [bottom, setBottom] = useState(false);

  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const p = Math.min(1, (el.scrollTop + el.clientHeight) / el.scrollHeight);
    setProgress(p);
    if (p > 0.985) setBottom(true);
  };

  const ready = bottom && left <= 0;
  return (
    <div className="gate-stage">
      <p className="gate-lede">
        Step 1: read the following. All of it. Slowly. We are timing you, in a
        way that cannot be verified.
      </p>
      <div
        className="gate-scroll"
        tabIndex={0}
        role="region"
        aria-label="Terms of Trip. Scroll to read."
        onScroll={onScroll}
        data-testid="terms-scroll"
      >
        {CLAUSES.map((clause, index) => (
          <article key={clause.title} className="gate-clause">
            <h3>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {clause.title}
            </h3>
            <p>{clause.body}</p>
          </article>
        ))}
        <p className="gate-end">- End of terms. Or is it? (It is.) -</p>
      </div>
      <div className="gate-meter" role="status">
        <span>Scrolled {Math.round(progress * 100)}%</span>
        <span>Reading verification: {Math.ceil(left)}s</span>
      </div>
      <div className="gate-actions">
        <Btn tone="primary" disabled={!ready} onClick={onNext}>
          {ready
            ? "I have read it (allegedly)"
            : !bottom
              ? "Scroll to the very bottom"
              : `Verifying that you read... ${Math.ceil(left)}s`}
        </Btn>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- boxes */

function BoxesStage({ onNext }: { onNext: () => void }) {
  const pages = Math.ceil(BOXES.length / BOXES_PER_PAGE);
  const [checks, setChecks] = useState(() => BOXES.map((b) => b.initial));
  const [page, setPage] = useState(0);
  const [fails, setFails] = useState<Record<number, number>>({});
  const [error, setError] = useState("");
  const slice = BOXES.slice(page * BOXES_PER_PAGE, (page + 1) * BOXES_PER_PAGE);

  const toggle = (id: number) =>
    setChecks((prev) => prev.map((value, i) => (i === id ? !value : value)));

  const selectAll = () =>
    setChecks((prev) =>
      prev.map((value, i) => (slice.some((b) => b.id === i) ? true : value)),
    );

  const next = () => {
    const bad = slice.find((b) => checks[b.id] !== b.required);
    if (bad) {
      const count = (fails[page] ?? 0) + 1;
      setFails({ ...fails, [page]: count });
      setError(
        count >= 3
          ? `Box ${bad.id + 1} should be ${bad.required ? "ticked" : "unticked"}. We are tired of watching you suffer.`
          : `Box ${bad.id + 1} is not right. We will not say how.`,
      );
      return;
    }
    setError("");
    if (page === pages - 1) onNext();
    else setPage(page + 1);
  };

  const back = () => {
    setError("");
    setPage(Math.max(0, page - 1));
  };

  const backIsLoud = page % 2 === 1;
  return (
    <div className="gate-stage">
      <p className="gate-lede">
        Step 2: {BOXES.length} checkboxes. Each one must be in the correct
        state. Read the labels; some of them are lying to you.
      </p>
      <div className="gate-meter">
        <span>
          Page {page + 1} of {pages}*
        </span>
        <span>*estimate subject to our mood</span>
      </div>
      <label className="gate-selectall">
        <input type="checkbox" checked={false} onChange={selectAll} />
        Select all on this page (a time saver, we promise)
      </label>
      <ul className="gate-boxes">
        {slice.map((box) => (
          <li key={box.id}>
            <label className="gate-box">
              <input
                type="checkbox"
                checked={checks[box.id]}
                onChange={() => toggle(box.id)}
              />
              <span className="gate-box-text">
                <b>{box.id + 1}.</b> {box.text}
                {box.kind === "untick" && (
                  <em className="gate-tag">untick to accept</em>
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p className="gate-error" role="alert">
        {error}
      </p>
      <div className={cn("gate-actions", page % 2 === 0 && "is-flipped")}>
        <Btn tone={backIsLoud ? "loud" : "muted"} onClick={back} disabled={page === 0}>
          Back
        </Btn>
        <Btn tone={backIsLoud ? "muted" : "primary"} onClick={next}>
          {page === pages - 1 ? "Submit all of it" : "Next"}
        </Btn>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ eyes */

type EyePhase = "ask" | "working" | "calibrate" | "verify" | "honor" | "passed";
const DOTS = [
  [12, 22],
  [82, 14],
  [48, 54],
  [16, 80],
  [86, 78],
];

function EyesStage({ onNext }: { onNext: () => void }) {
  const [phase, setPhase] = useState<EyePhase>("ask");
  const [note, setNote] = useState("");
  const [dot, setDot] = useState(0);
  const [percent, setPercent] = useState(0);
  const mounted = useRef(true);
  const honorLeft = useCountdown(HONOR_SECONDS, phase === "honor");

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const allow = async () => {
    setPhase("working");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      // Nothing is ever read from the stream: switch everything off at once.
      stream.getTracks().forEach((track) => track.stop());
      if (mounted.current) setPhase("calibrate");
    } catch {
      if (mounted.current) {
        setNote(
          "No camera or microphone, then. We will simply assume you did not read anything.",
        );
        setPhase("honor");
      }
    }
  };

  const decline = () => {
    setNote("Bold. We now assume you did not read it. Please sit with that.");
    setPhase("honor");
  };

  useEffect(() => {
    if (phase !== "verify") return;
    const start = performance.now();
    const id = window.setInterval(() => {
      const p = Math.min(100, ((performance.now() - start) / VERIFY_MS) * 100);
      setPercent(p);
      if (p >= 100) {
        window.clearInterval(id);
        setPhase("passed");
      }
    }, 60);
    return () => window.clearInterval(id);
  }, [phase]);

  return (
    <div className="gate-stage">
      <p className="gate-lede">
        Step 3: to verify that you read it, we need to watch your eyes move.
        Camera and microphone, please.
      </p>

      {phase === "ask" && (
        <>
          <div className="gate-actions is-flipped">
            <Btn tone="muted" onClick={() => void allow()}>
              Allow camera and microphone
            </Btn>
            <Btn tone="loud" onClick={decline}>
              No thanks, I enjoy being suspected
            </Btn>
          </div>
          <p className="gate-fine">
            Fine print: we do not read, record, store or send a single frame or
            sound. Tracks are switched off the moment the browser grants them.
            The source is right there.
          </p>
        </>
      )}

      {phase === "working" && (
        <p className="gate-status" role="status">
          Waiting for your browser to ask you politely...
        </p>
      )}

      {phase === "calibrate" && (
        <>
          <p className="gate-status" role="status">
            Calibration: look at each dot and click it. ({dot}/{DOTS.length})
          </p>
          <div className="gate-calibrate">
            <button
              type="button"
              className="gate-dot"
              aria-label={`Calibration dot ${dot + 1} of ${DOTS.length}`}
              style={{ left: `${DOTS[dot][0]}%`, top: `${DOTS[dot][1]}%` }}
              onClick={() => {
                if (dot + 1 >= DOTS.length) {
                  setDot(DOTS.length);
                  setPhase("verify");
                } else setDot(dot + 1);
              }}
            />
          </div>
        </>
      )}

      {phase === "verify" && (
        <div role="status" className="gate-verify">
          <div className="gate-bar">
            <i style={{ width: `${percent}%` }} />
          </div>
          <p>{EYE_LINES[Math.min(EYE_LINES.length - 1, Math.floor(percent / 20))]}</p>
        </div>
      )}

      {phase === "honor" && (
        <div role="status" className="gate-verify">
          <p>{note}</p>
          <p>
            Please stare at nothing, quietly, for{" "}
            <strong>{Math.ceil(honorLeft)}s</strong>.
          </p>
          <div className="gate-actions">
            <Btn tone="primary" disabled={honorLeft > 0} onClick={onNext}>
              {honorLeft > 0 ? "Staring..." : "I have stared"}
            </Btn>
          </div>
        </div>
      )}

      {phase === "passed" && (
        <div role="status" className="gate-verify">
          <p>Eye contact established. You read it. Probably.</p>
          <div className="gate-actions">
            <Btn tone="primary" onClick={onNext}>
              Continue
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- confirm */

function ConfirmStage({ onNext }: { onNext: () => void }) {
  const [round, setRound] = useState(0);
  const [note, setNote] = useState("");
  const [shake, setShake] = useState(0);
  const current = ROUNDS[round];

  const agree = () => {
    setNote("");
    if (round + 1 >= ROUNDS.length) onNext();
    else setRound(round + 1);
  };
  const disagree = () => {
    setNote(WRONG_NOTES[(round + shake) % WRONG_NOTES.length]);
    setShake(shake + 1);
    setRound(Math.max(0, round - 1));
  };

  const agreeBtn = (
    <Btn key="agree" tone={current.agreeTone} onClick={agree}>
      {current.agree}
    </Btn>
  );
  const disagreeBtn = (
    <Btn key="disagree" tone="loud" onClick={disagree}>
      {current.disagree}
    </Btn>
  );

  return (
    <div className="gate-stage">
      <p className="gate-lede">
        Step 4: confirmations {round + 1} of {ROUNDS.length}. The buttons will
        not behave. That is the point.
      </p>
      <div className={cn("gate-confirm", shake > 0 && "is-shaking")} key={shake}>
        <h3 data-testid="confirm-question">{current.question}</h3>
        <div className="gate-actions">
          {current.agreeFirst
            ? [agreeBtn, disagreeBtn]
            : [disagreeBtn, agreeBtn]}
        </div>
        <p className="gate-error" role="alert">
          {note}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ done */

function DoneStage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="gate-stage">
      <h3 className="gate-done-title">You may proceed.</h3>
      <p className="gate-lede">
        Plot twist: nothing was tracked. If you let us near your camera or
        microphone, we switched them off in the same instant and never read a
        single frame or sound. Nobody looked at your eyes. The checkbox count
        was chosen purely out of spite.
      </p>
      <p className="gate-lede">
        The warnings about seizures and substances, however, were completely
        sincere. Start the volume low, and keep Soft glow in mind.
      </p>
      <div className="gate-actions">
        <Btn tone="primary" onClick={onEnter}>
          Enter, at my own risk
        </Btn>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- veteran lane */

type RecognitionResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  abort(): void;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): (new () => Recognition) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function VeteranLane({ onPass }: { onPass: () => void }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"en-US" | "es-ES">("en-US");
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");
  const [typed, setTyped] = useState("");
  const [welcome, setWelcome] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);
  const timerRef = useRef<number | null>(null);
  const supported = typeof window !== "undefined" && !!getRecognition();

  const succeed = useCallback(() => {
    recognitionRef.current?.abort();
    setListening(false);
    setWelcome(true);
    timerRef.current = window.setTimeout(onPass, 900);
  }, [onPass]);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const listen = () => {
    const Ctor = getRecognition();
    if (!Ctor) return;
    recognitionRef.current?.abort();
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 3;
    recognition.onresult = (event) => {
      const heard: string[] = [];
      for (let i = 0; i < event.results.length; i++)
        for (let j = 0; j < event.results[i].length; j++)
          heard.push(event.results[i][j].transcript);
      if (heard.some(matchesVeteranPhrase)) succeed();
      else setMessage(`We heard: "${heard[0] ?? ""}". That is not it. Say it with feeling.`);
    };
    recognition.onerror = (event) => {
      setListening(false);
      setMessage(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Microphone blocked. Type it instead, coward."
          : event.error === "no-speech"
            ? "We heard nothing. Impressive, in a way."
            : `Speech recognition failed (${event.error}). Type it instead.`,
      );
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setMessage("");
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
      setMessage("Could not start listening. Type it instead.");
    }
  };

  const submitTyped = () => {
    if (matchesVeteranPhrase(typed)) succeed();
    else setMessage("Nope. Say, or type, exactly what you are, and mean it.");
  };

  return (
    <div className="gate-veteran">
      <button
        type="button"
        className="gate-veteran-toggle"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Already know the drill? Veterans' lane
        <Icon name="chevron" size={12} className={open ? "rotate-180" : ""} />
      </button>
      {open && (
        <div className="gate-veteran-panel">
          {welcome ? (
            <p role="status" className="gate-status">
              Welcome back, veteran. Skipping all of it...
            </p>
          ) : (
            <>
              <p>
                Say it out loud, with confidence: <q>{VETERAN_PHRASE}</q>
              </p>
              <div className="gate-veteran-row">
                {supported && (
                  <Btn tone="primary" onClick={listen} disabled={listening}>
                    <Icon name="volume" size={14} />
                    {listening ? "Listening..." : "Say it"}
                  </Btn>
                )}
                {supported && (
                  <button
                    type="button"
                    className="gate-lang"
                    aria-label="Switch recognition language"
                    onClick={() => setLang(lang === "en-US" ? "es-ES" : "en-US")}
                  >
                    {lang === "en-US" ? "EN" : "ES"}
                  </button>
                )}
                <label className="gate-type">
                  <span>{supported ? "or type it, coward" : "type it"}</span>
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitTyped();
                    }}
                    placeholder={VETERAN_PHRASE}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </label>
                <Btn tone="muted" onClick={submitTyped}>
                  Go
                </Btn>
              </div>
              <p className="gate-fine" role="status">
                {message ||
                  "Nothing you say or type is recorded or stored by us. Heads up: some browsers (Chrome) send voice audio to their own speech service to transcribe it."}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ gate */

export function DisclaimerGate({ onSigned }: { onSigned: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const finishedRef = useRef(false);
  const [stage, setStage] = useState<Stage>("read");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const finish = useCallback(() => {
    finishedRef.current = true;
    writeSigned();
    onSigned();
  }, [onSigned]);

  const index = STAGES.findIndex((s) => s.id === stage);
  return (
    <dialog
      ref={dialogRef}
      className="terms-gate"
      aria-labelledby="gate-title"
      // There is no way to Escape out of this. Some browsers close a modal on
      // a repeated Esc anyway, so quietly put it back.
      onCancel={(event) => event.preventDefault()}
      onClose={() => {
        const dialog = dialogRef.current;
        if (!finishedRef.current && dialog && !dialog.open) dialog.showModal();
      }}
    >
      <header className="gate-header">
        <div className="gate-kicker">MANDATORY / NON-NEGOTIABLE / SADLY</div>
        <h2 id="gate-title">
          Terms of Trip<span aria-hidden="true">*</span>
        </h2>
        <ol className="gate-steps" aria-label="Progress, approximately">
          {STAGES.map((s, i) => (
            <li
              key={s.id}
              className={cn(i < index && "is-done", i === index && "is-now")}
              aria-current={i === index ? "step" : undefined}
            >
              {s.label}
            </li>
          ))}
        </ol>
      </header>
      <div className="gate-body">
        {stage === "read" && <ReadStage onNext={() => setStage("boxes")} />}
        {stage === "boxes" && <BoxesStage onNext={() => setStage("eyes")} />}
        {stage === "eyes" && <EyesStage onNext={() => setStage("confirm")} />}
        {stage === "confirm" && <ConfirmStage onNext={() => setStage("done")} />}
        {stage === "done" && <DoneStage onEnter={finish} />}
      </div>
      <footer className="gate-footer">
        <VeteranLane onPass={finish} />
      </footer>
    </dialog>
  );
}
