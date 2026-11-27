import { useEffect, useState } from "react";
import type { Answers, CvMeta } from "./lib/types";
import type { ScoreResult } from "./lib/scoring";
import { makeReferenceResult, referenceNumber } from "./lib/scoring";
import LandingPage from "./components/LandingPage";
import ApplicationFlow from "./components/ApplicationFlow";
import ResultPage from "./components/ResultPage";
import Profiler from "./components/Profiler";
import { CommitteeModal, SiteFooter, SiteHeader } from "./components/Chrome";

type View = "landing" | "application" | "result" | "profiler";

const STORAGE_KEY = "deskjockey.expediente.v1";

function readDraft(): { answers: Answers; cvMeta: CvMeta | null } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { answers: {}, cvMeta: null };
    const parsed = JSON.parse(raw) as { answers?: Answers; cvMeta?: CvMeta | null };
    return {
      answers: parsed.answers && typeof parsed.answers === "object" ? parsed.answers : {},
      cvMeta: parsed.cvMeta ?? null,
    };
  } catch {
    return { answers: {}, cvMeta: null };
  }
}

export default function App() {
  const [initialDraft] = useState(readDraft);
  const [view, setView] = useState<View>("landing");
  const [answers, setAnswers] = useState<Answers>(initialDraft.answers);
  const [cvMeta, setCvMeta] = useState<CvMeta | null>(initialDraft.cvMeta);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [reference, setReference] = useState("");
  const [resultCandidate, setResultCandidate] = useState("Candidatura sin identificar");
  const [profilerCandidate, setProfilerCandidate] = useState<string | undefined>();
  const [internalOpen, setInternalOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const candidateName = [answers.firstName, answers.lastName]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, cvMeta }));
        setSaved(true);
      } catch {
        try {
          const lightweight = cvMeta
            ? { ...cvMeta, text: cvMeta.text.slice(0, 20000) }
            : null;
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, cvMeta: lightweight }));
          setSaved(true);
        } catch {
          setSaved(false);
        }
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [answers, cvMeta]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);

  const goLanding = () => {
    if (view === "landing") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setView("landing");
  };

  const goSection = (id: string) => {
    if (view !== "landing") {
      setView("landing");
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 90);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const startApplication = () => {
    setView("application");
    window.setTimeout(() => {
      document.getElementById("application-top")?.scrollIntoView({ behavior: "auto", block: "start" });
    }, 30);
  };

  const openProfiler = (name?: string) => {
    setProfilerCandidate(name);
    setInternalOpen(false);
    setView("profiler");
  };

  const handleSubmit = (nextResult: ScoreResult, nextReference: string) => {
    setResult(nextResult);
    setReference(nextReference);
    setResultCandidate(candidateName || "Candidatura sin identificar");
    setView("result");
  };

  const openReferenceResult = (kind: "high" | "low") => {
    const nextResult = makeReferenceResult(kind);
    setResult(nextResult);
    setReference(referenceNumber());
    setResultCandidate("Expediente de referencia");
    setInternalOpen(false);
    setView("result");
  };

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader
        mode={view === "landing" ? "landing" : view === "application" ? "application" : view === "profiler" ? "profiler" : "result"}
        onHome={goLanding}
        onApply={startApplication}
        onExit={goLanding}
        onSection={goSection}
        saved={saved}
      />

      {view === "landing" && <LandingPage onApply={startApplication} />}

      {view === "application" && (
        <ApplicationFlow
          answers={answers}
          setAnswers={setAnswers}
          cvMeta={cvMeta}
          setCvMeta={setCvMeta}
          onExit={goLanding}
          onSubmit={handleSubmit}
        />
      )}

      {view === "result" && result && (
        <ResultPage
          result={result}
          reference={reference}
          candidateName={resultCandidate}
          onHome={goLanding}
          onApply={startApplication}
          onProfiler={() => openProfiler(result.reference ? "Expediente de referencia" : resultCandidate)}
        />
      )}

      {view === "profiler" && <Profiler onHome={goLanding} candidateName={profilerCandidate} />}

      <SiteFooter
        onApply={startApplication}
        onHome={goLanding}
        onInternal={() => setInternalOpen(true)}
        onSection={goSection}
      />

      <CommitteeModal
        open={internalOpen}
        onClose={() => setInternalOpen(false)}
        onReference={openReferenceResult}
        onProfiler={() => openProfiler()}
      />
    </div>
  );
}
