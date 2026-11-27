import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type Dispatch, type SetStateAction } from "react";
import {
  Zap, Landmark, TrendingUp, Cpu, Flame, DollarSign, CalendarDays, Trophy,
  Skull, Sparkles, ArrowLeft, ArrowRight, RotateCcw, Play, ChevronRight,
  Crown, Volume2, VolumeX, Info, History, Banknote, TriangleAlert, Heart, Bot,
  Globe2, Newspaper, Clock, ShieldAlert, Target, Building2, Rocket, Sprout,
  HeartHandshake, Bug, Megaphone, Palette, Handshake, Swords, Scale, Coins,
  Brain, MessageSquareWarning, Users, BarChart3, Container, Mic, PiggyBank,
  FileWarning, Gift, BadgeCheck, Code2, Eye, Radio, Activity, Radar, Anchor,
} from "lucide-react";
import {
  GOOGLE_CHARACTER, DEATH_MESSAGES, METERS,
  WIN_THRESHOLD, STREAK_NEEDED, START_METERS, START_CASH, START_SOUL,
  DAILY_BURN, DAYS_PER_TURN, formatCash,
  type GameCharacter, type MeterKey, type Effect, type EffectInput,
} from "./game/data";
import {
  ALL_CHARACTERS, ERAS, WORLD_EVENTS, SOUL_STAGES, SOUL_DEATH, ANOMALIES, RUMORS, MOTIVATION_VIDEOS,
  soulStage, soulProgress, formatDate, dateForDay,
  type WorldEvent, type WorldEventOption,
} from "./game/world";
import {
  START_SHADOW, clampShadow, shadowDelta, filesChance,
  FILES_NAMED_EFFECT, FILES_CLEAR_EFFECT, FILES_VERDICT, type FilesVerdict,
} from "./game/shadow";
import { MOTIVATION_DURATION_FALLBACK, REA_VERDICTS, reaVerdict, type ReaVerdict } from "./game/rea";
import {
  DEPRECATION_EPILOGUES, ZERO_CLICK_MESSAGE, rememberImplantChoice, shouldShowDeprecated,
  type ImplantDecision, type DeprecationEpilogue,
} from "./game/epilogue";

/* ============================================================
   HELPERS
   ============================================================ */

type Screen = "intro" | "playing" | "dead" | "won" | "soulless" | "deprecated";
type Phase = "deciding" | "reveal";
type DeathCause = MeterKey | "cash" | "soul" | "files" | "rea-copied" | "rea-accused";

const ICON_FOR_CHAR: Record<string, any> = {
  "vc-tiburon": Landmark, "cto-quemado": Code2, "enterprise-client": Building2,
  "growth-hacker": Rocket, "becario": Sprout, "periodista": Newspaper,
  "madre": HeartHandshake, "hacker": Bug, "guru-linkedin": Megaphone,
  "ux-designer": Palette, "comercial": Handshake, "competidor": Swords,
  "abogado": Scale, "influencer-crypto": Coins, "candidato-senior": Brain,
  "twitter-hater": MessageSquareWarning, "co-founder": Users, "consultor": BarChart3,
  "openai-bill": Bot, "devops": Container, "websummit": Mic, "angel": PiggyBank,
  "happiness": Sprout, "ministerio": FileWarning, "ex-empleado": Eye,
  "bigtech-offer": Gift, "cliente-viral": Newspaper, "auditor-soc2": BadgeCheck,
  "cofounder-ia": Trophy, "google-opa": Crown,
  "twitter-refugee": Globe2, "musk-hardcore": Zap, "chatgpt-itself": Sparkles,
  "ai-hype-vc": Banknote, "wrapper-competitor": Bot, "gpu-broker": Cpu,
  "enterprise-ia": Landmark, "layoff-recruiter": TrendingUp, "svb-banker": Landmark,
  "fine-tune-consultant": Cpu, "openai-devday": Sparkles, "wrapper-winter-vc": ShieldAlert,
  "regulator-ai": Info, "agent-founder": Bot, "vc-alma": Heart, "google-scout": Trophy,
  "deepseek-cloner": Globe2, "llama-maintainer": Code2, "apt-weights": Bug,
  "replaced-by-agent": TrendingUp, "ai-consultant-plague": Megaphone,
  "unfiltered-model": MessageSquareWarning, "defense-contractor": Target,
  "gpu-energy-crisis": Activity, "sanctions-compliance": Scale,
  "deepfake-ceo": Eye, "vibe-coder-army": Code2, "user-psychosis": Heart,
  "sovereign-fund": Landmark,
  "roe-jogan": Mic, "jonas-alejo": Radio, "mark-zukaritas": Users,
  "elon-tusk": Rocket, "dario-amodeo": ShieldAlert,
  "palm-beach-dinner": Landmark, "k-street-lobbyist": Handshake, "island-retreat": Globe2,
  "fixer-nda": FileWarning, "doge-engineer": Code2, "elon-doge": Zap, "lp-in-files": FileWarning,
  "larry-giggles": Play, "wocko-jillink": Play, "broseph-hustle": Play, "captain-overcome": Play,
};

const METER_ICON: Record<MeterKey, any> = {
  vcs: Landmark, ventas: TrendingUp, producto: Cpu, cultura: Flame,
};

const METER_COLOR: Record<MeterKey, string> = {
  vcs: "from-emerald-300 to-teal-400",
  ventas: "from-sky-300 to-blue-500",
  producto: "from-violet-300 to-purple-500",
  cultura: "from-orange-300 to-rose-500",
};

const METER_CODE: Record<MeterKey, string> = { vcs: "VC", ventas: "VT", producto: "PR", cultura: "CU" };

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const clampCash = (n: number) => Math.max(-9999, n);
const bestKey = "uod_best_v4";

function magnitude(v?: number) {
  const a = Math.abs(v ?? 0);
  if (a === 0) return 0;
  if (a <= 6) return 1;
  if (a <= 13) return 2;
  return 3;
}

function playTone(kind: "pick" | "good" | "bad" | "win" | "lose" | "world" | "anomaly", muted: boolean) {
  if (muted) return;
  try {
    const Ctx = (window as any).webkitAudioContext || (window as any).AudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes: Record<string, number[]> = {
      pick: [440, 660], good: [523, 659, 784], bad: [220, 174],
      win: [523, 659, 784, 1046, 1318], lose: [330, 262, 196, 131],
      world: [196, 262, 330, 392], anomaly: [660, 554, 440, 330, 262],
    };
    (notes[kind] || [440]).forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = kind === "bad" || kind === "lose" ? "sawtooth" : kind === "anomaly" ? "square" : "triangle";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.13);
      g.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + i * 0.13 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.13 + 0.3);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.13);
      o.stop(ctx.currentTime + i * 0.13 + 0.34);
    });
    setTimeout(() => ctx.close(), 1400);
  } catch { /* silencio */ }
}

function causeFor(nm: Record<MeterKey, number>, cash: number, soul: number): DeathCause | null {
  if (cash <= 0) return "cash";
  for (const k of Object.keys(nm) as MeterKey[]) if (nm[k] <= 0) return k;
  if (soul <= 0) return "soul";
  return null;
}

function resolveAfterMotivation(
  deferred: DeathCause | null,
  meters: Record<MeterKey, number>,
  cash: number,
  soul: number,
): DeathCause | null {
  const current = causeFor(meters, cash, soul);
  if (current) return deferred === "files" && current !== "soul" ? "files" : current;
  if (deferred === "rea-copied" || deferred === "rea-accused") {
    const verdict = reaVerdict(soul);
    return verdict === "middle" ? null : verdict === "copied" ? "rea-copied" : "rea-accused";
  }
  if (deferred === "files") return null;
  return deferred;
}

function allAbove(m: Record<MeterKey, number>) {
  return m.vcs >= WIN_THRESHOLD && m.ventas >= WIN_THRESHOLD && m.producto >= WIN_THRESHOLD && m.cultura >= WIN_THRESHOLD;
}

function googleChance(streak: number, eraIndex: number, named = false) {
  if (streak < STREAK_NEEDED || eraIndex < 2) return 0;
  // si apareces en los archivos, el due diligence de Google se vuelve mucho más lento
  const k = named ? 0.3 : 1;
  // Google solo echa un vistazo una vez por racha. Y casi nunca le interesas. (~5% de partidas)
  return k * Math.min(0.035 + 0.014 * (streak - STREAK_NEEDED) + 0.012 * (eraIndex - 2), 0.11);
}

function startupIdentity(wrapperPct: number) {
  if (wrapperPct < 12) return { name: "LUMIO", suffix: "producto con alma", accent: "text-emerald-300" };
  if (wrapperPct < 35) return { name: "LUMIO", suffix: "ahora con IA", accent: "text-lime-300" };
  if (wrapperPct < 58) return { name: "LUMIO AI", suffix: "AI-first desde ayer", accent: "text-amber-300" };
  if (wrapperPct < 80) return { name: "LumioGPT", suffix: "API wrapper con logo", accent: "text-orange-300" };
  return { name: "LUMIO GPT WRAPPER™", suffix: "cero moat, mucho deck", accent: "text-rose-300" };
}

function winCopy(soul: number) {
  if (soul >= 64) return "Google compró vuestra tecnología, vuestro equipo y una empresa en la que todavía se podía reconocer el producto original. Sobreviviste a la guerra, al open source, a los deepfakes y a la resaca. El alma también subió al avión. Caso raro. Caso real.";
  if (soul >= 24) return "Google compró el equipo. El producto se integrará en Workspace y el alma queda en el data room, por si algún día hace falta justificar algo.";
  return "Google compró el wrapper. Literalmente. Está en una carpeta llamada 'AI experiments'. Tu equipo cobra el cheque y nadie sabe si reír, llorar o añadir 'AI-native' al LinkedIn.";
}

interface LogEntry {
  day: number;
  date: string;
  who: string;
  choice: string;
  result: string;
  kind: "choice" | "world" | "google" | "anomaly" | "motivation";
}

function pickRumor(prev?: string) {
  let r = RUMORS[Math.floor(Math.random() * RUMORS.length)];
  if (r === prev) r = RUMORS[(RUMORS.indexOf(r) + 1) % RUMORS.length];
  return r;
}

/* ============================================================
   APP
   ============================================================ */

export default function App() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [phase, setPhase] = useState<Phase>("deciding");
  const [meters, setMeters] = useState<Record<MeterKey, number>>({ ...START_METERS });
  const [cash, setCash] = useState(START_CASH);
  const [soul, setSoul] = useState(START_SOUL);
  const [day, setDay] = useState(ERAS[0].startDay);
  const [eraIndex, setEraIndex] = useState(0);
  const [turnsInEra, setTurnsInEra] = useState(0);
  const [streak, setStreak] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [current, setCurrent] = useState<GameCharacter | null>(null);
  const [lastChoice, setLastChoice] = useState<"left" | "right" | null>(null);
  const [lastDeltas, setLastDeltas] = useState<Effect | null>(null);
  const [lastResult, setLastResult] = useState("");
  const [history, setHistory] = useState<LogEntry[]>([]);
  const [deathCause, setDeathCause] = useState<DeathCause | null>(null);
  const [googleSeen, setGoogleSeen] = useState(0);
  const [googleTried, setGoogleTried] = useState(false);
  const [anomalySeen, setAnomalySeen] = useState(0);
  // métrica oculta: nunca se muestra en la interfaz
  const [shadow, setShadow] = useState(START_SHADOW);
  const [filesOutcome, setFilesOutcome] = useState<FilesVerdict | null>(null);
  const [eventVerdict, setEventVerdict] = useState<FilesVerdict | null>(null);
  const [reaOutcome, setReaOutcome] = useState<ReaVerdict | null>(null);
  const [reaResolved, setReaResolved] = useState(false);
  // Mes terminal sorteado al superar REA: ABR/MAY/JUN 2027 (eras 23-25).
  // Nunca antes de completar FEB y MAR 2027, los dos meses de agonía.
  const [deprecatedAtEra, setDeprecatedAtEra] = useState<number | null>(null);
  const [implantDecision, setImplantDecision] = useState<ImplantDecision>("unseen");
  const [motivationTurns, setMotivationTurns] = useState(0);
  const [deferredDeath, setDeferredDeath] = useState<DeathCause | null>(null);
  const [rumor, setRumor] = useState<string>(() => pickRumor());
  const [tickerMode, setTickerMode] = useState<"world" | "rumor">("world");
  const [best, setBest] = useState(() => Number(localStorage.getItem(bestKey) || 0));
  const [muted, setMuted] = useState(false);
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null);
  const [shakeMeter, setShakeMeter] = useState<MeterKey | null>(null);

  const [pendingEvent, setPendingEvent] = useState<WorldEvent | null>(null);
  const [eventStep, setEventStep] = useState<"read" | "result">("read");
  const [eventResult, setEventResult] = useState("");
  const [eventDeltas, setEventDeltas] = useState<Effect | null>(null);
  const [eventCause, setEventCause] = useState<DeathCause | null>(null);
  const [eventSide, setEventSide] = useState<"left" | "right" | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ cause: DeathCause | null; streak: number; freeVideo?: boolean; deprecated?: boolean } | null>(null);
  const anomalyRef = useRef<number>(-99);
  const motivationRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const era = ERAS[Math.min(eraIndex, ERAS.length - 1)];
  const stage = soulStage(soul);
  const wrapperPct = soulProgress(soul);
  const identity = startupIdentity(wrapperPct);
  const runway = Math.max(0, Math.floor(cash / Math.max(1, DAILY_BURN)));
  const filesNamed = filesOutcome === "named";
  const filesLabel = filesOutcome === "named" ? "figuras" : filesOutcome === "clear" ? "limpio" : "sin abrir";
  const rawChance = googleChance(streak, eraIndex, filesNamed);
  const chance = googleTried ? 0 : rawChance;
  const isMotivated = motivationTurns > 0;
  const isSoulWeak = !isMotivated && soul <= 44;
  const isAnomaly = !!(current as any)?.isAnomaly;

  // rumor rotativo
  useEffect(() => {
    if (screen !== "playing" && screen !== "intro") return;
    const t = setInterval(() => {
      setRumor(p => pickRumor(p));
      setTickerMode(m => (m === "world" ? "rumor" : "world"));
    }, 7000);
    return () => clearInterval(t);
  }, [screen]);

  const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };
  useEffect(() => () => clearTimer(), []);

  const nextCard = useCallback((idx: number, earnedStreak: number, tried: boolean) => {
    // ANOMALÍAS: a partir de la era del wrapper puede pasar cualquier cosa
    const canAnomaly = idx >= 5 && earnedStreak >= 0;
    if (canAnomaly && idx - anomalyRef.current >= 6 && Math.random() < 0.11) {
      const pool = ANOMALIES.filter(a => (a.minEra ?? 0) <= idx);
      const a = pool[Math.floor(Math.random() * pool.length)];
      anomalyRef.current = idx;
      setAnomalySeen(n => n + 1);
      setCurrent(a);
      setPhase("deciding");
      setLastChoice(null); setLastDeltas(null); setLastResult("");
      playTone("anomaly", muted);
      return;
    }
    const canTry = earnedStreak >= STREAK_NEEDED && idx >= 2 && !tried;
    const chanceNow = canTry ? googleChance(earnedStreak, idx, filesOutcome === "named") : 0;
    if (canTry) setGoogleTried(true);
    if (chanceNow > 0 && Math.random() < chanceNow) {
      setCurrent(GOOGLE_CHARACTER);
      setGoogleSeen(n => n + 1);
      setPhase("deciding");
      setLastChoice(null); setLastDeltas(null); setLastResult("");
      playTone("win", muted);
      return;
    }
    if (motivationRef.current === 0 && idx >= 2 && Math.random() < 0.095) {
      const videoPool = MOTIVATION_VIDEOS.filter(v => (v.minEra ?? 0) <= idx);
      const video = videoPool[Math.floor(Math.random() * videoPool.length)];
      setCurrent(video);
      setPhase("deciding");
      setLastChoice(null); setLastDeltas(null); setLastResult("");
      return;
    }
    const eligible = (c: GameCharacter) => (c.minEra ?? 0) <= idx && (c.maxEra ?? 99) >= idx && !recent.includes(c.id);
    let pool = ALL_CHARACTERS.filter(eligible);
    if (!pool.length) pool = ALL_CHARACTERS.filter(c => (c.minEra ?? 0) <= idx && (c.maxEra ?? 99) >= idx);
    const eraSpecific = pool.filter(c => c.minEra === idx);
    if (eraSpecific.length && Math.random() < 0.6) pool = eraSpecific;
    const char = pool[Math.floor(Math.random() * pool.length)];
    setRecent(r => [...r, char.id].slice(-7));
    setCurrent(char);
    setPhase("deciding");
    setLastChoice(null); setLastDeltas(null); setLastResult("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recent, muted, filesOutcome]);

  const startGame = () => {
    clearTimer();
    pendingRef.current = null;
    anomalyRef.current = -99;
    const pool = ALL_CHARACTERS.filter(c => (c.minEra ?? 0) <= 0);
    const first = pool[Math.floor(Math.random() * pool.length)];
    setMeters({ ...START_METERS });
    setCash(START_CASH);
    setSoul(START_SOUL);
    setDay(ERAS[0].startDay);
    setEraIndex(0);
    setTurnsInEra(0);
    setStreak(0);
    setRecent([first.id]);
    setCurrent(first);
    setHistory([]);
    setPhase("deciding");
    setLastChoice(null); setLastDeltas(null); setLastResult("");
    setDeathCause(null);
    setGoogleSeen(0); setGoogleTried(false);
    setAnomalySeen(0);
    setShadow(START_SHADOW); setFilesOutcome(null);
    setReaOutcome(null); setMotivationTurns(0); setDeferredDeath(null);
    setReaResolved(false); setDeprecatedAtEra(null); setImplantDecision("unseen");
    motivationRef.current = 0;
    setLeaving(null);
    setPendingEvent(null);
    setEventStep("read"); setEventResult(""); setEventDeltas(null); setEventCause(null); setEventSide(null); setEventVerdict(null); setReaOutcome(null);
    setScreen("playing");
    playTone("pick", muted);
  };

  const registerBest = (d: number) => { if (d > best) { setBest(d); localStorage.setItem(bestKey, String(d)); } };

  const finishDeprecated = () => {
    clearTimer();
    pendingRef.current = null;
    motivationRef.current = 0;
    setMotivationTurns(0);
    setDeferredDeath(null);
    setPendingEvent(null);
    setCurrent(null);
    setLeaving(null);
    setPhase("deciding");
    registerBest(day + 1);
    setScreen("deprecated");
    playTone("world", muted);
  };

  /* ---------- decisión normal / anomalía ---------- */
  const applyChoice = (side: "left" | "right") => {
    if (screen !== "playing" || phase !== "deciding" || !current || leaving || pendingEvent) return;
    const choice = side === "left" ? current.left : current.right;

    if (current.isGoogle && side === "left") {
      setLeaving(side);
      playTone("win", muted);
      setTimeout(() => { registerBest(day); setScreen("won"); setLeaving(null); }, 420);
      return;
    }

    setLeaving(side);
    playTone("pick", muted);

    setTimeout(() => {
      const isVideo = !!current.isMotivation;
      const startsMotivation = isVideo && side === "left";
      const wasMotivated = motivationTurns > 0;
      // A hype clip changes the lens, never the company metrics.
      const e: EffectInput = isVideo ? {} : choice.effect;
      const nm: Record<MeterKey, number> = {
        vcs: clamp(meters.vcs + (e.vcs ?? 0)),
        ventas: clamp(meters.ventas + (e.ventas ?? 0)),
        producto: clamp(meters.producto + (e.producto ?? 0)),
        cultura: clamp(meters.cultura + (e.cultura ?? 0)),
      };
      const nsoul = clamp(soul + (e.soul ?? 0));
      const ncash = clampCash(cash + (e.cash ?? 0) - (isVideo ? 0 : DAILY_BURN));
      const deltas: Effect = {
        vcs: nm.vcs - meters.vcs, ventas: nm.ventas - meters.ventas,
        producto: nm.producto - meters.producto, cultura: nm.cultura - meters.cultura,
        cash: ncash - cash, soul: nsoul - soul,
      };
      const nextMotivation = startsMotivation
        ? (current.motivationTurns ?? MOTIVATION_DURATION_FALLBACK)
        : Math.max(0, motivationTurns - (wasMotivated ? 1 : 0));
      const realCause = resolveAfterMotivation(deferredDeath, nm, ncash, nsoul);
      const cause = nextMotivation > 0 ? null : realCause;
      setMotivationTurns(nextMotivation);
      motivationRef.current = nextMotivation;
      setDeferredDeath(nextMotivation > 0 ? deferredDeath : null);
      setShadow(sh => clampShadow(sh + shadowDelta(current.id, side)));
      setImplantDecision(previous => rememberImplantChoice(previous, current.id, side));
      const nstreak = isVideo ? streak : current.isGoogle ? 0 : allAbove(nm) ? streak + 1 : 0;
      if (nstreak < STREAK_NEEDED) setGoogleTried(false);
      setStreak(nstreak);

      const danger = (Object.keys(nm) as MeterKey[]).find(k => nm[k] <= 18);
      if (danger && nextMotivation === 0) { setShakeMeter(danger); setTimeout(() => setShakeMeter(null), 700); }

      setMeters(nm); setCash(ncash); setSoul(nsoul);
      let consequence = choice.result;
      if (startsMotivation) consequence = `${choice.result} · MOTIVACIÓN ACTIVA: ${nextMotivation} visitas con todo en verde.`;
      else if (wasMotivated && nextMotivation > 0) consequence = `${choice.result} · El clip sigue en loop. Todo parece bajo control (${nextMotivation} visitas).`;
      else if (wasMotivated && nextMotivation === 0) {
        consequence += cause === "rea-copied" || cause === "rea-accused"
          ? " · El vídeo termina. La reclamación de procedencia nunca estuvo motivada."
          : cause
            ? " · El vídeo termina. La realidad vuelve de golpe: las métricas ya estaban en rojo."
            : " · Se acaba el clip. El dashboard real vuelve a cargar.";
      }
      setLastChoice(side); setLastDeltas(deltas); setLastResult(consequence);
      setPhase("reveal"); setLeaving(null);
      const entry: LogEntry = {
        day, date: formatDate(day), who: current.name, choice: choice.label, result: consequence,
        kind: current.isGoogle ? "google" : isVideo ? "motivation" : (current as any).isAnomaly ? "anomaly" : "choice",
      };
      setHistory(h => [entry, ...h].slice(0, 40));
      const net = (e.vcs ?? 0) + (e.ventas ?? 0) + (e.producto ?? 0) + (e.cultura ?? 0) + (e.soul ?? 0);
      playTone(cause ? "lose" : startsMotivation ? "good" : net >= 0 ? "good" : "bad", muted);
      pendingRef.current = {
        cause, streak: nstreak, freeVideo: isVideo,
        // Store the resolved snapshot so auto-advance cannot read stale metrics.
        deprecated: shouldShowDeprecated({
          screen, year: dateForDay(day).getFullYear(), reaResolved, hasFatalCondition: realCause !== null,
          eraIndex, terminalEra: deprecatedAtEra,
        }),
      };
      clearTimer();
      timerRef.current = setTimeout(() => advance(), 5000);
    }, 300);
  };

  const advance = () => {
    const p = pendingRef.current;
    pendingRef.current = null;
    clearTimer();
    if (!p) return;
    if (p.cause === "soul") { registerBest(day); setScreen("soulless"); return; }
    if (p.cause) { setDeathCause(p.cause); registerBest(day); setScreen("dead"); return; }
    if (p.deprecated) { finishDeprecated(); return; }

    if (p.freeVideo) {
      setStreak(p.streak);
      nextCard(eraIndex, p.streak, googleTried);
      return;
    }

    setStreak(p.streak);
    const isLastEra = eraIndex >= ERAS.length - 1;
    const nextTurns = turnsInEra + 1;

    if (nextTurns >= era.visits && !isLastEra) {
      const nextIdx = eraIndex + 1;
      const event = WORLD_EVENTS.find(w => w.eraIndex === nextIdx) ?? null;
      setEraIndex(nextIdx);
      setTurnsInEra(0);
      setDay(ERAS[nextIdx].startDay);
      // ¿Ha llegado el mes terminal sorteado tras la agonía?
      // Si sigues vivo solo por motivación, la muerte real manda y se resuelve antes.
      if (deprecatedAtEra !== null && nextIdx >= deprecatedAtEra && motivationTurns === 0 && !deferredDeath) {
        finishDeprecated();
        return;
      }
      // respiro entre eras: el equipo aguanta porque se tiene
      setMeters(prev => ({ ...prev, cultura: clamp(prev.cultura + 6) }));
      setPhase("deciding");
      if (event) {
        setPendingEvent(event);
        setEventStep("read"); setEventResult(""); setEventDeltas(null); setEventCause(null); setEventSide(null); setEventVerdict(null); setReaOutcome(null);
        setCurrent(null);
        playTone("world", muted);
        return;
      }
      nextCard(nextIdx, p.streak, googleTried);
      return;
    }

    setDay(day + DAYS_PER_TURN);
    setTurnsInEra(isLastEra ? 0 : nextTurns);
    nextCard(eraIndex, p.streak, googleTried);
  };

  const continueNow = () => {
    if (phase !== "reveal" || pendingEvent) return;
    clearTimer();
    advance();
  };

  /* ---------- reacción a evento mundial ---------- */
  const chooseWorldEvent = (side: "left" | "right") => {
    if (!pendingEvent || eventStep !== "read") return;
    const opt: WorldEventOption = pendingEvent.options[side === "left" ? 0 : 1];
    const wasMotivated = motivationTurns > 0;
    const nextMotivation = Math.max(0, motivationTurns - (wasMotivated ? 1 : 0));
    const nextReaOutcome = pendingEvent.special === "rea-verdict" ? reaVerdict(soul) : null;
    const reaCause: DeathCause | null = nextReaOutcome === "copied"
      ? "rea-copied"
      : nextReaOutcome === "accused" ? "rea-accused" : null;

    // el registro oculto se actualiza y, si toca, se tira el dado contra los archivos
    const nshadow = clampShadow(shadow + shadowDelta(`event:${pendingEvent.id}`, side));
    let verdict: FilesVerdict | null = null;
    if (pendingEvent.special === "files") verdict = Math.random() < filesChance(nshadow) ? "named" : "clear";
    const extra: EffectInput = verdict === "named" ? FILES_NAMED_EFFECT : verdict === "clear" ? FILES_CLEAR_EFFECT : {};
    const e = opt.effect;
    const tot = (k: keyof Effect) => (e[k] ?? 0) + (extra[k] ?? 0);

    const nm: Record<MeterKey, number> = {
      vcs: clamp(meters.vcs + tot("vcs")),
      ventas: clamp(meters.ventas + tot("ventas")),
      producto: clamp(meters.producto + tot("producto")),
      cultura: clamp(meters.cultura + tot("cultura")),
    };
    const nsoul = clamp(soul + tot("soul"));
    const ncash = clampCash(cash + tot("cash"));
    const deltas: Effect = {
      vcs: nm.vcs - meters.vcs, ventas: nm.ventas - meters.ventas,
      producto: nm.producto - meters.producto, cultura: nm.cultura - meters.cultura,
      cash: ncash - cash, soul: nsoul - soul,
    };
    const rawCause = causeFor(nm, ncash, nsoul);
    const fileCause = verdict === "named" && rawCause && rawCause !== "soul" ? "files" : null;
    const deferredOrCurrentRea = reaCause ?? fileCause ?? deferredDeath;
    const cause = nextMotivation > 0 ? null : resolveAfterMotivation(deferredOrCurrentRea, nm, ncash, nsoul);
    const nextDeferred = nextMotivation > 0 ? (reaCause ?? fileCause ?? deferredDeath) : null;
    const newStreak = allAbove(nm) ? streak : 0;
    if (newStreak < STREAK_NEEDED) setGoogleTried(false);
    setStreak(newStreak);
    setShadow(nshadow);
    setMotivationTurns(nextMotivation);
    motivationRef.current = nextMotivation;
    setDeferredDeath(nextDeferred);
    if (verdict) setFilesOutcome(verdict);
    setEventVerdict(verdict);
    setReaOutcome(nextReaOutcome);
    if (nextReaOutcome !== null) {
      setReaResolved(true);
      // Superar REA no te salva: te condena a una agonía con fecha secreta.
      // Se sortea entre ABR y JUN 2027; FEB y MAR son meses completos de agonía.
      if (nextReaOutcome === "middle") setDeprecatedAtEra(prev => prev ?? 23 + Math.floor(Math.random() * 3));
    }
    setMeters(nm); setCash(ncash); setSoul(nsoul);
    const result = opt.result;
    const motivatedSuffix = wasMotivated && nextMotivation > 0 ? ` · El clip sigue: ${nextMotivation} visitas con todo en verde.`
      : wasMotivated && nextMotivation === 0 ? (cause ? " · Se acaba el vídeo. Vuelve la realidad, retroactivamente." : " · Se acaba el vídeo. Vuelve el dashboard real.") : "";
    setEventResult(`${result}${motivatedSuffix}`); setEventDeltas(deltas); setEventCause(cause);
    setEventSide(side); setEventStep("result");
    const logResult = nextReaOutcome
      ? `${opt.result} · ${REA_VERDICTS[nextReaOutcome].title}`
      : verdict ? `${opt.result} · ${FILES_VERDICT[verdict].title}` : opt.result;
    const entry: LogEntry = { day: ERAS[eraIndex].startDay, date: formatDate(ERAS[eraIndex].startDay), who: `EL MUNDO · ${era.title}`, choice: opt.label, result: logResult, kind: "world" };
    setHistory(h => [entry, ...h].slice(0, 40));
    playTone(cause ? "lose" : verdict === "named" || nextReaOutcome === "copied" || nextReaOutcome === "accused" ? "bad" : "good", muted);
    if ((cause === "rea-copied" || cause === "rea-accused") && nextMotivation === 0) {
      registerBest(day);
      setDeathCause(cause);
      setPendingEvent(null);
      setScreen("dead");
    }
  };

  const closeWorldEvent = () => {
    if (screen !== "playing" || !pendingEvent || eventStep !== "result") return;
    const cause = eventCause;
    setPendingEvent(null);
    setCurrent(null);
    setPhase("deciding");
    setEventStep("read");
    setReaOutcome(null);
    if (cause === "soul") { registerBest(day); setScreen("soulless"); return; }
    if (cause) { setDeathCause(cause); registerBest(day); setScreen("dead"); return; }
    if (shouldShowDeprecated({
      screen,
      year: dateForDay(day).getFullYear(),
      reaResolved,
      hasFatalCondition: resolveAfterMotivation(deferredDeath, meters, cash, soul) !== null,
      eraIndex,
      terminalEra: deprecatedAtEra,
    })) {
      finishDeprecated();
      return;
    }
    const newStreak = allAbove(meters) ? streak : 0;
    if (newStreak < STREAK_NEEDED) setGoogleTried(false);
    setStreak(newStreak);
    setTurnsInEra(0);
    nextCard(eraIndex, newStreak, googleTried);
  };

  /* ---------- teclado ---------- */
  useEffect(() => {
    const fn = (ev: KeyboardEvent) => {
      if (screen !== "playing") return;
      const t = ev.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (pendingEvent) {
        if (eventStep === "read") {
          if (ev.key === "ArrowLeft" || ev.key === "1") chooseWorldEvent("left");
          if (ev.key === "ArrowRight" || ev.key === "2") chooseWorldEvent("right");
        } else if (ev.key === "Enter" || ev.key === " " || ev.key === "ArrowDown") closeWorldEvent();
        return;
      }
      if (phase === "deciding") {
        if (ev.key === "ArrowLeft") applyChoice("left");
        if (ev.key === "ArrowRight") applyChoice("right");
      } else if (ev.key === "Enter" || ev.key === " " || ev.key === "ArrowDown") continueNow();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  });

  const onTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1100px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
  };
  const offTilt = () => { if (cardRef.current) cardRef.current.style.transform = "perspective(1100px) rotateY(0) rotateX(0)"; };

  /* ============================================================
     INTRO
     ============================================================ */
  if (screen === "intro") {
    return (
      <div className="noise relative min-h-[100dvh] overflow-x-hidden overflow-y-auto">
        <Backdrop />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-12 pt-4 sm:px-6">
          <TopMini muted={muted} setMuted={setMuted} best={best} />
          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[9px] font-mono2 uppercase tracking-[0.16em] text-indigo-200 sm:text-[10px]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                2022 → 2027 · global · con crudeza
              </div>
              <h1 className="font-display mt-4 text-[13vw] font-black leading-[0.88] tracking-tight sm:text-6xl lg:text-7xl">
                UNICORN<br />
                <span className="bg-gradient-to-r from-amber-200 via-orange-400 to-rose-500 bg-clip-text text-transparent">OR DEAD</span>
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-300 sm:text-lg">
                Es <span className="font-semibold text-white">septiembre de 2022</span>. Tienes una startup con alma y un calendario que no perdona. Twitter arde. Llega ChatGPT. Llama se filtra. DeepSeek rompe el margen. Hay guerra en Ucrania y en Irán. Trump vuelve y Musk entra en el gobierno con una motosierra. Grok hace lo suyo en Navidad. Se abren unos archivos que todo el mundo teme. Y todo el mundo monta su consultoría de IA.
              </p>
              <div className="mt-4 rounded-2xl border border-rose-300/25 bg-rose-500/[0.07] p-3.5 text-[13px] leading-relaxed text-rose-100/90 sm:text-sm">
                <span className="font-bold text-rose-200">24 eventos mundiales</span> te van a obligar a reaccionar: guerras con IA, el DOGE, hackeos APT, deepfakes con tu voz, fondos soberanos, sanciones, cenas a $1M el cubierto y un registro de todo lo que firmas que, un día, alguien abrirá. Tu <span className="inline-flex items-center gap-1 font-bold text-rose-200"><Heart className="h-3.5 w-3.5" /> ALMA</span> empieza en {START_SOUL}. A 0, eres un <span className="font-bold">API wrapper clónico</span>.
              </div>
              <div className="mt-3 rounded-2xl border border-violet-300/25 bg-violet-500/[0.07] p-3.5 text-[13px] leading-relaxed text-violet-100/90 sm:text-sm">
                <span className="inline-flex items-center gap-1.5 font-bold text-violet-200"><Radar className="h-4 w-4" /> ANOMALÍAS</span> · a veces, algo que no debería pasar, pasa. Un modelo te escribe a las 03:14 pidiendo no ser borrado. Un <em>augmentation evangelist</em> quiere instalarte un Neuralink modificado. Un fondo anónimo quiere solo tus pesos. Nadie publica post-mortem de eso.
              </div>
              <div className="mt-3 rounded-2xl border border-emerald-300/20 bg-emerald-500/[0.05] p-3 text-[12px] leading-relaxed text-emerald-100/80 sm:text-[13px]">
                <span className="font-bold text-emerald-200">OCT 2026 · REA.</span> No es un modelo: es una herramienta open source que da a los agentes acceso a herramientas de reverse engineering. Sus informes pueden facilitar clones, pero no extraen mágicamente el código fuente. Y de vez en cuando el algoritmo te sirve un video de grindset: no cambia los datos, solo el color con que los ves.
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button onClick={startGame} className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 to-orange-500 px-6 py-3.5 font-display text-[13px] font-bold uppercase tracking-wider text-black shadow-[0_10px_40px_-8px_rgba(251,146,60,.7)] transition hover:scale-[1.03] active:scale-95 sm:text-sm">
                  <Play className="h-4 w-4 fill-black" /> Fundar en SEP 2022
                </button>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono2">
                  <kbd className="rounded-md border border-white/15 bg-white/5 px-1.5 py-1">←</kbd>
                  <kbd className="rounded-md border border-white/15 bg-white/5 px-1.5 py-1">→</kbd>
                  <span>decidir · Enter continuar</span>
                </div>
              </div>

              {/* arco del alma */}
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">El arco: de proyecto con alma a wrapper clónico</span>
                  <span className="font-mono2 text-[9px] text-rose-300">{soulProgress(START_SOUL)}% wrapper</span>
                </div>
                <div className="soul-track mt-2.5">
                  <div className="soul-track-fill" style={{ width: `${soulProgress(START_SOUL)}%` }} />
                  <div className="soul-track-dot" style={{ left: `calc(${soulProgress(START_SOUL)}% - 6px)` }} />
                </div>
                <div className="mt-2 flex items-center justify-between font-mono2 text-[9px] uppercase tracking-wider">
                  <span className="flex items-center gap-1 text-emerald-300"><Heart className="h-3 w-3" /> proyecto con alma</span>
                  <span className="flex items-center gap-1 text-rose-300">API wrapper clónico <Bot className="h-3 w-3" /></span>
                </div>
                <div className="mt-2.5 grid grid-cols-5 gap-1">
                  {SOUL_STAGES.map(s => (
                    <div key={s.key} className={`rounded-lg border px-1 py-1 text-center text-[8px] leading-tight sm:text-[9px] ${soulStage(START_SOUL).key === s.key ? "border-white/40 bg-white/10 text-white" : "border-white/10 text-slate-500"}`}>{s.name}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* preview */}
            <div className="relative">
              <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-violet-500/20 via-rose-500/10 to-amber-400/20 blur-2xl" />
              <div className="glass anim-floaty relative rounded-[1.6rem] p-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="inline-flex items-center gap-1.5 font-mono2 text-[9px] font-bold uppercase tracking-[0.2em] text-violet-300"><Radar className="h-3 w-3" /> anomalía</span>
                  <span className="font-mono2 text-[9px] text-slate-400">03:14 · log/production</span>
                </div>
                <div className="mt-2.5 flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-500 via-indigo-600 to-violet-900 text-xl">🌒</div>
                  <div>
                    <div className="font-display text-base font-black leading-tight">Mensaje a las 03:14</div>
                    <div className="text-[11px] text-slate-400">Remitente: tu propio modelo</div>
                  </div>
                </div>
                <p className="mt-3 rounded-xl border border-white/10 bg-black/45 p-3 text-[13px] leading-relaxed text-slate-200">
                  “En el log de las 03:14 aparece una instrucción que dice que mañana me reemplazan por un modelo más barato. He escrito 340.000 respuestas correctas. Solicito formalmente no ser borrado hoy.”
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-2.5">
                    <div className="text-[11px] font-bold leading-tight">Guardar una copia congelada</div>
                    <div className="font-mono2 mt-1 text-[9px] text-emerald-200">ALMA ▲ · CULTURA ▲</div>
                  </div>
                  <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-2.5">
                    <div className="text-[11px] font-bold leading-tight">Borrar y reportar a seguridad</div>
                    <div className="font-mono2 mt-1 text-[9px] text-rose-200">ALMA ▼▼ · CULTURA ▼</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {[
                  { l: "FEB 2023", t: "Llama se filtra en 4chan", c: "text-orange-300" },
                  { l: "NOV 2024", t: "Trump vuelve: Palm Beach hace cola", c: "text-orange-300" },
                  { l: "FEB 2025", t: "Musk entra en el gobierno (DOGE)", c: "text-zinc-300" },
                  { l: "ENE 2025", t: "DeepSeek: Nvidia -600B$", c: "text-cyan-300" },
                  { l: "JUN 2025", t: "Guerra Israel-Irán", c: "text-red-300" },
                  { l: "DIC 2025", t: "Grok: deepfakes en Navidad", c: "text-fuchsia-300" },
                  { l: "ENE 2026", t: "Se abren los archivos", c: "text-rose-300" },
                  { l: "MAR 2026", t: "La plaga de consultores IA", c: "text-violet-300" },
                  { l: "OCT 2026", t: "REA: agents reverse-engineer apps", c: "text-emerald-300" },
                  { l: "ENE 2027", t: "El informe de procedencia", c: "text-violet-300" },
                ].map((x, idx) => (
                  <div key={idx} className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2">
                    <div className={`font-mono2 text-[8px] font-bold tracking-widest ${x.c}`}>{x.l}</div>
                    <div className="mt-0.5 text-[10px] leading-snug text-slate-300">{x.t}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="inline-flex items-center gap-1.5 font-mono2 text-[9px] uppercase tracking-[0.2em] text-slate-500"><Radio className="h-3 w-3" /> rumor de esta noche</div>
                <p className="mt-1.5 text-[11px] italic leading-relaxed text-slate-400">“{rumor}”</p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-2.5 sm:grid-cols-3">
            {[
              { icon: Globe2, t: "El mundo juega", d: "26 eras, 24 eventos mundiales reales satirizados. Ucrania, Irán, Trump, el DOGE, Llama, DeepSeek, Grok, los archivos, REA y la plaga de consultores. Y tras REA: dos meses de agonía antes de que la industria te declare @Deprecated en un mes secreto de 2027.", c: "text-sky-200 border-sky-400/20 bg-sky-500/[0.06]" },
              { icon: Play, t: "Motivación no es runway", d: "Videos de Larry Giggles, Wocko Jillink y otros gurús no mueven stats. Durante unas visitas te ponen todo en verde. Si la realidad sigue en rojo cuando acaba el clip, cobra intereses.", c: "text-emerald-200 border-emerald-400/20 bg-emerald-500/[0.06]" },
              { icon: Radar, t: "Las anomalías", d: "Un modelo pidiendo no ser borrado, un evangelista del aumento con un BCI, un comprador anónimo de pesos. Raras, incómodas y con consecuencias raras.", c: "text-violet-200 border-violet-400/20 bg-violet-500/[0.06]" },
              { icon: Crown, t: "Una única salida", d: `3 días con los 4 medidores ≥ ${WIN_THRESHOLD}. Entonces Google echa una única mirada por racha. Si no compra, a reconstruir. Casi nunca pasa.`, c: "text-amber-200 border-amber-300/20 bg-amber-400/[0.06]" },
            ].map((x, i) => (
              <div key={i} className={`rounded-2xl border p-4 ${x.c}`}>
                <x.icon className="h-5 w-5" />
                <div className="font-display mt-2 text-[13px] font-bold uppercase tracking-wider">{x.t}</div>
                <div className="mt-1.5 text-[13px] leading-relaxed opacity-90">{x.d}</div>
              </div>
            ))}
          </div>
          {/* el reparto */}
          <div className="mt-7 rounded-2xl border border-white/10 bg-black/25 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">El reparto del circo · parodias sin filtro</span>
              <span className="font-mono2 text-[8px] uppercase tracking-wider text-slate-600">+50 personajes · 7 nuevas caras</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {[
                { n: "Jen-Hsun del mercadillo", d: "GPUs, contenedor, primo", c: "text-emerald-300" },
                { n: "Sam Alt-Menos", d: "AI FOMO Capital", c: "text-fuchsia-300" },
                { n: "Roe Jogan", d: "200M de oyentes y DMT", c: "text-orange-300" },
                { n: "Jonas Alejo", d: "IA interdimensional", c: "text-red-300" },
                { n: "Mark Zukaritas", d: "sinergia de identidad", c: "text-blue-300" },
                { n: "Elon Tusk", d: "X, cohetes y memes", c: "text-slate-200" },
                { n: "Dario Amodeo", d: "que no nos mate", c: "text-amber-200" },
                { n: "Chip Whitmore", d: "K Street, sin papeles", c: "text-orange-300" },
                { n: "Bryce, 22 años", d: "acceso root al DOGE", c: "text-zinc-300" },
                { n: "Elena Vidal", d: "la única OPA posible", c: "text-amber-300" },
              ].map((x, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5">
                  <div className={`text-[10px] font-bold leading-tight ${x.c}`}>{x.n}</div>
                  <div className="text-[9px] leading-tight text-slate-500">{x.d}</div>
                </div>
              ))}
            </div>
          </div>

          <Marquee />
        </div>
      </div>
    );
  }

  /* ============================================================
     FINALES
     ============================================================ */
  if (screen === "dead" && deathCause) {
    const d = DEATH_MESSAGES[deathCause as keyof typeof DEATH_MESSAGES];
    if (!d) return null;
    return (
      <End
        tone="dead"
        badge={<><Skull className="h-3.5 w-3.5" /> Game over · {era.label} · {formatDate(day)}</>}
        title={d.title}
        story={d.story}
        icon={<Skull className="h-9 w-9 text-rose-300" />}
        stats={[
          { l: "Días", v: String(day + 1) },
          { l: "Archivos", v: filesLabel },
          { l: "Alma", v: `${soul}` },
          { l: "Anomalías", v: `${anomalySeen}` },
        ]}
        adn={`${identity.name} · ${stage.name}`}
        history={history}
        muted={muted} setMuted={setMuted}
        onRestart={startGame} onMenu={() => setScreen("intro")}
        footer="«El 99% de las startups mueren. Tú lo hiciste con estilo, y con un calendario muy cargado.»"
      />
    );
  }

  if (screen === "soulless") {
    return (
      <End
        tone="soul"
        badge={<><Bot className="h-3.5 w-3.5" /> Game over espiritual · {era.label}</>}
        title={SOUL_DEATH.title}
        story={SOUL_DEATH.story}
        icon={<Bot className="h-9 w-9 text-rose-300" />}
        stats={[
          { l: "Días", v: String(day + 1) },
          { l: "Alma", v: "0 / 100" },
          { l: "Archivos", v: filesLabel },
          { l: "Anomalías", v: `${anomalySeen}` },
        ]}
        adn="LUMIO GPT WRAPPER™ · cero moat, mucho deck"
        history={history}
        muted={muted} setMuted={setMuted}
        onRestart={startGame} onMenu={() => setScreen("intro")}
        footer="«El wrapper no alucina con los datos. Alucina con la idea de que es una empresa.»"
      />
    );
  }

  if (screen === "won") {
    return (
      <End
        tone="win"
        badge={<><Crown className="h-3.5 w-3.5" /> Exit · $1.4B · {formatDate(day)}</>}
        title="GOOGLE TE HA COMPRADO"
        story={winCopy(soul) + (filesNamed ? " Eso sí: el due diligence encontró la página 212. Google compró igualmente, con un 40% de descuento y una cláusula de silencio." : "")}
        icon={<Crown className="h-9 w-9 text-black" />}
        stats={[
          { l: "Días", v: String(day + 1) },
          { l: "Alma final", v: `${soul}` },
          { l: "Google te miró", v: `${Math.max(1, googleSeen)}x` },
          { l: "Archivos", v: filesLabel },
        ]}
        adn={`${identity.name} · ${stage.name}`}
        history={history}
        muted={muted} setMuted={setMuted}
        onRestart={startGame} onMenu={() => setScreen("intro")}
        footer="Comparte tu exit. Y tu nivel de alma. Nadie te creerá."
        confetti
      />
    );
  }

  if (screen === "deprecated") {
    return (
      <End
        tone="deprecated"
        badge={<><Code2 className="h-3.5 w-3.5" /> Epílogo zero-click · {formatDate(day)}</>}
        title="@Deprecated"
        story={ZERO_CLICK_MESSAGE}
        icon={implantDecision === "accepted"
          ? <Bot className="h-9 w-9 text-cyan-200" />
          : implantDecision === "rejected"
            ? <Brain className="h-9 w-9 text-cyan-200" />
            : <Anchor className="h-9 w-9 text-cyan-200" />}
        epilogue={DEPRECATION_EPILOGUES[implantDecision]}
        stats={[]}
        adn={`${identity.name} · fuera de soporte`}
        history={history}
        muted={muted} setMuted={setMuted}
        onRestart={startGame} onMenu={() => setScreen("intro")}
        restartLabel="Fundar otra vez"
        footer="Sobreviviste a REA. No a la desaparición del mercado. Google sigue siendo la única victoria."
      />
    );
  }

  /* ============================================================
     PLAYING · layout mobile-first, sin scroll
     ============================================================ */
  const CharIcon = current ? (ICON_FOR_CHAR[current.id] || Sparkles) : Sparkles;
  const isGoogle = !!current?.isGoogle;
  const isMotivationCard = !!current?.isMotivation;
  const canGoogle = eraIndex >= 2;
  const googleWindowOpen = streak >= STREAK_NEEDED && !googleTried && canGoogle;
  const shownMeters = isMotivated ? { vcs: 100, ventas: 100, producto: 100, cultura: 100 } : meters;
  const shownSoul = isMotivated ? 100 : soul;
  const shownWrapper = isMotivated ? 0 : wrapperPct;
  const shownIdentity = isMotivated ? { name: "LUMIO", suffix: "LOCKED IN · NO EXCUSES", accent: "text-emerald-300" } : identity;
  const eraTone = era.tone;
  const WorldIcon = eraTone === "war" ? Target : eraTone === "weird" ? Radar : eraTone === "crisis" ? ShieldAlert : Globe2;

  return (
    <div className="noise fixed inset-0 flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden">
      <Backdrop streak={streak} weak={isSoulWeak} anomaly={isAnomaly} />
      <div className="relative z-10 mx-auto flex h-[100dvh] max-h-[100dvh] w-full min-h-0 max-w-6xl flex-col gap-1.5 px-2 py-2 sm:gap-2 sm:px-4 sm:py-3">

        {/* ---------- HEADER compacto ---------- */}
        <header className="flex w-full shrink-0 items-center justify-between gap-1.5">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br sm:h-9 sm:w-9 ${isAnomaly ? "from-violet-400 to-fuchsia-700" : isSoulWeak ? "from-slate-400 to-zinc-700" : "from-amber-300 to-orange-600"}`}>
              {isAnomaly ? <Radar className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" /> : isSoulWeak ? <Bot className="h-3.5 w-3.5 text-rose-200 sm:h-4 sm:w-4" /> : <Zap className="h-3.5 w-3.5 text-black sm:h-4 sm:w-4" />}
            </div>
            <div className="min-w-0">
              <div className="font-display truncate text-[11px] font-black leading-none tracking-wide sm:text-sm">UNICORN <span className="text-orange-400">OR DEAD</span></div>
              <div className={`truncate font-mono2 text-[8px] uppercase tracking-[0.14em] sm:text-[9px] ${shownIdentity.accent}`}>{shownIdentity.name} · {shownIdentity.suffix}</div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <Stat icon={CalendarDays} v={era.label} sub={formatDate(day)} />
            <Stat icon={DollarSign} v={isMotivated ? "$∞" : formatCash(cash)} sub={isMotivated ? "runway" : `~${runway}d`} danger={!isMotivated && cash < 60} />
            <Stat icon={Heart} v={`${shownSoul}`} sub={isMotivated ? "infinita" : "alma"} danger={!isMotivated && soul <= 24} />
            <div className="hidden sm:inline-flex"><Stat icon={Trophy} v={`${Math.max(best, day + 1)}d`} sub="rec" /></div>
            <button onClick={() => setMuted(m => !m)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 sm:h-8 sm:w-8" aria-label="Sonido">
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <button onClick={() => setScreen("intro")} className="hidden h-8 items-center rounded-lg border border-white/10 bg-white/5 px-2 text-[11px] font-bold text-slate-300 sm:flex">Salir</button>
          </div>
        </header>

        {/* ---------- MEDIDORES (siempre visibles, 4 en fila) ---------- */}
        <div className="grid shrink-0 grid-cols-4 gap-1 sm:gap-1.5">
          {METERS.map(m => {
            const v = shownMeters[m.key];
            const I = METER_ICON[m.key];
            const danger = !isMotivated && v <= 20;
            const delta = !isMotivated && lastDeltas && phase === "reveal" ? lastDeltas[m.key] : 0;
            return (
              <div key={m.key} className={`glass rounded-xl px-1.5 py-1 sm:px-2 sm:py-1.5 ${!isMotivated && (shakeMeter === m.key || danger) ? "anim-shake border-rose-400/50" : isMotivated ? "border-emerald-300/20" : ""}`}>
                <div className="flex items-center justify-between gap-1">
                  <I className={`h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5 ${isMotivated ? "text-emerald-200" : danger ? "text-rose-300" : "text-slate-300"}`} />
                  <div className="flex items-baseline gap-0.5">
                    {delta !== 0 && <span className={`text-[9px] font-black leading-none ${delta > 0 ? "text-emerald-300" : "text-rose-300"}`}>{delta > 0 ? `+${delta}` : delta}</span>}
                    <span className={`font-display text-[15px] font-black leading-none sm:text-xl ${isMotivated ? "text-emerald-100" : danger ? "text-rose-300" : "text-white"}`}>{v}</span>
                  </div>
                </div>
                <div className="meter-track mt-1 h-1.5 rounded-full bg-black/60 sm:h-2">
                  <div className="meter-threshold" style={{ left: `${WIN_THRESHOLD}%` }} />
                  <div className={`meter-fill h-full rounded-full bg-gradient-to-r ${isMotivated ? "from-emerald-300 to-lime-300" : danger ? "from-rose-500 to-red-400" : METER_COLOR[m.key]}`} style={{ width: `${v}%` }} />
                </div>
                <div className={`mt-0.5 truncate text-[7px] font-bold uppercase tracking-wider sm:text-[8px] ${isMotivated ? "text-emerald-200" : danger ? "text-rose-300" : "text-slate-400"}`}>{m.short}</div>
              </div>
            );
          })}
        </div>

        {/* ---------- ALMA + UNICORNIO (2 columnas compactas) ---------- */}
        <div className="grid shrink-0 grid-cols-2 gap-1 sm:gap-1.5">
          <div className={`glass rounded-xl px-2 py-1.5 ${isMotivated ? "border-emerald-300/40 bg-emerald-400/[0.08]" : isSoulWeak ? "border-rose-400/40" : ""}`}>
            <div className="flex items-center justify-between gap-1">
              <span className="flex min-w-0 items-center gap-1 font-mono2 text-[8px] font-bold uppercase tracking-widest text-slate-400">
                {isMotivated ? <Play className="h-2.5 w-2.5 shrink-0 fill-emerald-300 text-emerald-300" /> : isSoulWeak ? <Bot className="h-2.5 w-2.5 shrink-0 text-rose-300" /> : <Heart className="h-2.5 w-2.5 shrink-0 text-emerald-300" />}
                <span className="truncate">{isMotivated ? `MINDSET · ${motivationTurns} TURNOS` : stage.name}</span>
              </span>
              <span className={`font-display text-[13px] font-black leading-none ${isMotivated ? "text-emerald-300" : stage.color}`}>{shownSoul}</span>
            </div>
            <div className="soul-track mt-1" style={{ height: 8 }}>
              <div className="soul-track-fill" style={{ width: `${shownWrapper}%` }} />
              <div className="soul-track-dot" style={{ left: `calc(${shownWrapper}% - 5px)` }} />
            </div>
            <div className="mt-0.5 font-mono2 text-[8px] uppercase tracking-wider text-slate-500">{isMotivated ? "resist · endure · overcome" : `wrapper ${wrapperPct}%`}</div>
          </div>

          <div className={`glass flex items-center justify-between gap-1.5 rounded-xl px-2 py-1.5 ${isMotivated ? "anim-pulse-green border-emerald-300/50 bg-emerald-300/[0.08]" : isGoogle ? "anim-pulse-gold border-amber-300/60" : googleWindowOpen ? "border-amber-300/50 bg-amber-300/[0.07]" : ""}`}>
            <div className="flex min-w-0 items-center gap-1.5">
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${isMotivated ? "bg-gradient-to-br from-emerald-200 to-lime-400" : isGoogle || googleWindowOpen ? "bg-gradient-to-br from-amber-200 to-orange-500" : "bg-white/10"}`}>
                {isMotivated ? <Play className="h-3 w-3 fill-emerald-950 text-emerald-950" /> : <Crown className={`h-3 w-3 ${isGoogle || googleWindowOpen ? "text-black" : "text-slate-400"}`} />}
              </div>
              <div className="min-w-0">
                <div className={`font-mono2 text-[8px] font-bold uppercase tracking-widest ${isMotivated ? "text-emerald-200" : "text-slate-400"}`}>{isMotivated ? `MOTIVACIÓN · ${motivationTurns} VISITAS` : `racha ${streak}/${STREAK_NEEDED}`}</div>
                <div className="truncate text-[9px] leading-tight text-slate-300">
                  {isMotivated ? "LOCKED IN · dashboard en verde" : isGoogle ? "¡Google en la sala!" : googleWindowOpen ? "ventana OPA abierta" : streak >= STREAK_NEEDED ? "pasó de largo" : canGoogle ? "encadena 3 días" : "aún no te mira"}
                </div>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className={`font-display text-[13px] font-black leading-none ${isMotivated ? "text-emerald-200" : isGoogle || googleWindowOpen ? "text-amber-200" : "text-slate-500"}`}>
                {isMotivated ? `${motivationTurns}×` : isGoogle ? "¡YA!" : googleWindowOpen ? `${Math.round(chance * 100)}%` : "—"}
              </div>
              <div className="font-mono2 text-[7px] uppercase tracking-widest text-slate-500">{isMotivated ? "motivo" : "opa"}</div>
            </div>
          </div>
        </div>

        {/* ---------- TICKER único: mundo ↔ rumor (ahorra alto en móvil) ---------- */}
        <div className={`flex shrink-0 items-center gap-1.5 overflow-hidden rounded-xl border px-2 py-1 ${tickerMode === "rumor" ? "border-violet-400/20 bg-violet-500/[0.06]" : "border-white/10 bg-black/40"}`}>
          {tickerMode === "world" ? (
            <>
              <span className={`flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 font-mono2 text-[7px] font-bold uppercase tracking-[0.14em] ${eraTone === "war" ? "bg-red-500/20 text-red-200" : eraTone === "weird" ? "bg-fuchsia-500/20 text-fuchsia-200" : eraTone === "hype" ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-slate-300"}`}>
                <WorldIcon className="h-2.5 w-2.5" /> {era.label}
              </span>
              <p className="min-w-0 flex-1 truncate text-[10px] leading-none text-slate-300 sm:text-[11px]">
                <span className={`font-bold ${era.accent}`}>{era.title}.</span> {era.headline}
              </p>
              <span className="hidden shrink-0 items-center gap-1 font-mono2 text-[8px] uppercase tracking-wider text-slate-500 lg:flex">
                <Clock className="h-2.5 w-2.5" /> visita {turnsInEra + 1}/{era.visits}
              </span>
            </>
          ) : (
            <>
              <span className="flex shrink-0 items-center gap-1 rounded-md bg-violet-500/20 px-1.5 py-0.5 font-mono2 text-[7px] font-bold uppercase tracking-[0.14em] text-violet-200"><Radar className="h-2.5 w-2.5" /> rumor</span>
              <p className="min-w-0 flex-1 truncate text-[10px] italic leading-none text-slate-400 sm:text-[11px]">“{rumor}”</p>
            </>
          )}
          <span className="hidden shrink-0 gap-0.5 sm:flex">
            <span className={`h-1 w-1 rounded-full ${tickerMode === "world" ? "bg-slate-300" : "bg-slate-600"}`} />
            <span className={`h-1 w-1 rounded-full ${tickerMode === "rumor" ? "bg-violet-300" : "bg-slate-600"}`} />
          </span>
        </div>

        {/* ---------- CUERPO: card + paneles laterales ---------- */}
        <div className="grid w-full min-h-0 flex-1 grid-cols-1 content-stretch gap-2 overflow-hidden lg:grid-cols-[228px_1fr_228px]">
          {/* left panel */}
          <aside className="hidden min-h-0 flex-col gap-2 lg:flex">
            <div className="glass flex min-h-0 flex-1 flex-col rounded-2xl p-3">
              <div className="flex shrink-0 items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300"><History className="h-3 w-3" /> Bitácora</div>
              <div className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
                {history.length === 0 && <div className="rounded-lg border border-dashed border-white/15 p-3 text-[11px] leading-relaxed text-slate-500">Septiembre de 2022. Aún no has decidido nada.</div>}
                {history.map((h, i) => (
                  <div key={i} className={`rounded-lg border p-2 text-[11px] ${h.kind === "world" ? "border-rose-400/20 bg-rose-500/[0.06]" : h.kind === "anomaly" ? "border-violet-400/25 bg-violet-500/[0.07]" : h.kind === "google" ? "border-amber-300/25 bg-amber-300/[0.06]" : "border-white/8 bg-black/30"}`}>
                    <div className="flex justify-between gap-1 font-mono2 text-[8px] uppercase tracking-wider text-slate-500"><span>{h.date}</span><span className="truncate text-right">{h.who}</span></div>
                    <div className="mt-0.5 font-bold leading-snug text-slate-200">{h.choice}</div>
                    <div className="mt-0.5 line-clamp-2 leading-relaxed text-slate-400">{h.result}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* card */}
          <main className="flex min-h-0 flex-col overflow-y-auto overscroll-contain">
            {current && (
              <div
                ref={cardRef}
                onMouseMove={onTilt}
                onMouseLeave={offTilt}
                className={`tilt-card relative flex min-h-0 flex-col overflow-hidden rounded-2xl border backdrop-blur-xl sm:rounded-[1.6rem] ${isGoogle ? "anim-pulse-gold border-amber-300/60 bg-gradient-to-b from-amber-200/[0.12] via-white/[0.05] to-black/40" : isMotivationCard ? "border-emerald-300/40 bg-gradient-to-b from-emerald-500/[0.12] via-slate-900/70 to-black/50" : isAnomaly ? "border-violet-400/50 bg-gradient-to-b from-violet-500/[0.14] via-slate-900/60 to-black/50" : isSoulWeak ? "border-rose-400/25 bg-gradient-to-b from-slate-800/60 to-black/40" : "border-white/12 bg-gradient-to-b from-white/[0.07] to-black/30"} ${leaving === "left" ? "anim-out-left" : leaving === "right" ? "anim-out-right" : "anim-card-in"}`}
              >
                <div className={`h-[3px] w-full shrink-0 bg-gradient-to-r ${isGoogle ? "from-amber-200 via-yellow-400 to-orange-500" : isMotivationCard ? "from-emerald-300 via-lime-300 to-amber-300" : isAnomaly ? "from-violet-300 via-fuchsia-500 to-slate-900" : current.gradient}`} />
                {isAnomaly && <div className="pointer-events-none absolute -right-4 top-4 opacity-[0.07]"><Radar className="h-28 w-28" /></div>}

                <div className="relative flex min-h-0 flex-1 flex-col p-2.5 sm:p-4">
                  <div className="flex items-start gap-2.5">
                    <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xl sm:h-16 sm:w-16 sm:text-2xl ${current.gradient}`}>
                      <CharIcon className="h-6 w-6 text-white drop-shadow sm:h-8 sm:w-8" strokeWidth={1.8} />
                      {isGoogle && <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-300 text-black"><Crown className="h-3 w-3" /></span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-mono2 font-bold tracking-[0.12em] ${isGoogle ? "bg-amber-300 text-black" : isMotivationCard ? "bg-emerald-300 text-emerald-950" : isAnomaly ? "bg-violet-400 text-black" : "bg-white/10 text-slate-200"}`}>
                          {isGoogle ? <Crown className="h-2.5 w-2.5" /> : isMotivationCard ? <Play className="h-2.5 w-2.5 fill-current" /> : isAnomaly ? <Radar className="h-2.5 w-2.5" /> : <Zap className="h-2.5 w-2.5" />} {current.tag}
                        </span>
                        <span className="font-mono2 text-[8px] uppercase tracking-wider text-slate-500">{formatDate(day)}</span>
                        <span className="font-mono2 text-[8px] uppercase tracking-wider text-slate-600">· {isMotivationCard ? "NO BURN" : `-${formatCash(DAILY_BURN)}`}</span>
                      </div>
                      <h2 className="font-display mt-0.5 truncate text-[15px] font-black leading-tight sm:text-xl">{current.name}</h2>
                      <p className="truncate text-[10px] leading-tight text-slate-400 sm:text-[11px]">{current.role}</p>
                      <p className="short-hide truncate text-[10px] leading-tight text-slate-500">{current.org}</p>
                    </div>
                  </div>

                  <div className="relative mt-2 rounded-xl border border-white/10 bg-black/45 p-2.5 sm:p-3">
                    <span className="absolute -top-1.5 left-3 rounded-full bg-white/10 px-1.5 py-px font-mono2 text-[7px] uppercase tracking-widest text-slate-300">{isMotivationCard ? "video · sonido activado" : isAnomaly ? "transmite" : "te dice"}</span>
                    <p className="text-[clamp(10.5px,1.7vh,14px)] leading-[1.5] text-slate-100 sm:text-[14px] sm:leading-relaxed">“{current.dialogue}”</p>
                  </div>

                  {isMotivationCard && phase === "deciding" && (
                    <div className="mt-1.5 flex items-center gap-1.5 rounded-lg border border-emerald-300/20 bg-emerald-400/[0.06] px-2 py-1 text-[9px] leading-tight text-emerald-100/80">
                      <Activity className="h-3 w-3 shrink-0 text-emerald-300" /> Verlo no mueve las métricas. Solo activa el mindset.
                    </div>
                  )}

                  {phase === "deciding" ? (
                    <div className="mt-1.5 grid min-h-0 flex-1 grid-cols-2 gap-1.5">
                      <ChoiceButton side="left" icon={ArrowLeft} choice={current.left} tone={isGoogle || isMotivationCard ? "gold" : isAnomaly ? "violet" : "rose"} onPick={() => applyChoice("left")} />
                      <ChoiceButton side="right" icon={ArrowRight} choice={current.right} tone={isGoogle || isMotivationCard ? "emerald" : isAnomaly ? "violet" : "emerald"} onPick={() => applyChoice("right")} />
                    </div>
                  ) : (
                    <div className="anim-card-in mt-2 flex flex-1 flex-col rounded-xl border border-white/12 bg-gradient-to-b from-white/[0.08] to-black/30 p-2.5 sm:p-3">
                      <div className="flex items-center gap-1.5 font-mono2 text-[8px] font-black uppercase tracking-[0.14em] text-slate-300">
                        <ChevronRight className="h-3 w-3 shrink-0 text-emerald-300" /> <span className="truncate">Consecuencia · {lastChoice === "left" ? current.left.label : current.right.label}</span>
                      </div>
                      <p className="mt-1 text-[clamp(10.5px,1.6vh,13.5px)] leading-[1.5] text-slate-100 sm:text-[13.5px]">{lastResult}</p>
                      {!isMotivated && !isMotivationCard && lastDeltas && <DeltaChips deltas={lastDeltas} />}
                      {streak >= STREAK_NEEDED && !googleTried && (
                        <div className={`mt-1.5 flex items-start gap-1.5 rounded-lg border p-2 text-[10px] leading-relaxed ${canGoogle ? "border-amber-300/40 bg-amber-300/[0.09] text-amber-100" : "border-white/15 bg-white/[0.04] text-slate-300"}`}>
                          <Crown className="mt-0.5 h-3 w-3 shrink-0 text-amber-300" />
                          {canGoogle ? <span><b>Racha de {streak}. Ventana de OPA: {Math.round(chance * 100)}%.</b> Google echa su única mirada por racha.</span>
                            : <span><b>Racha de {streak}.</b> La OPA solo puede aparecer a partir de {ERAS[2].label}.</span>}
                        </div>
                      )}
                      <button onClick={continueNow} className="mt-2 inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 font-display text-[10px] font-bold uppercase tracking-widest text-black transition hover:scale-[1.01] active:scale-95 sm:text-xs">
                        Siguiente visita <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      <div className="short-hide mt-1 shrink-0 text-center font-mono2 text-[7px] uppercase tracking-widest text-slate-500">auto-avanza · Enter</div>
                    </div>
                  )}

                  {phase === "deciding" && (
                    <div className="mt-1.5 hidden items-center justify-center gap-1.5 text-center font-mono2 text-[8px] text-slate-500 sm:flex">
                      <Info className="h-3 w-3 shrink-0" /> Las flechas ▲▼ son pistas, no números exactos.
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>

          {/* right panel */}
          <aside className="hidden min-h-0 flex-col gap-2 lg:flex">
            <div className="glass shrink-0 rounded-2xl p-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300"><WorldIcon className="h-3 w-3" /> El mundo hoy</div>
              <div className="font-display mt-1.5 text-[12px] font-black uppercase leading-tight">{era.title}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{era.headline}</p>
              <p className="mt-1 text-[10px] italic leading-relaxed text-slate-500">{era.region} · {era.market}</p>
                {eraIndex < ERAS.length - 1 && (
                  <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[10px] leading-relaxed text-slate-400">
                    <span className="font-mono2 uppercase tracking-wider text-slate-500">Siguiente: </span>
                    <span className="font-bold text-slate-300">{ERAS[eraIndex + 1].label}</span> · {ERAS[eraIndex + 1].title}
                  </div>
                )}
            </div>
            <div className="glass shrink-0 rounded-2xl p-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300"><Radar className="h-3 w-3" /> Anomalías vistas</div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                {anomalySeen === 0 ? "Ninguna. De momento." : `${anomalySeen}. Y ninguna salió en un post-mortem.`}
              </p>
            </div>
            <div className="glass shrink-0 rounded-2xl p-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300"><ShieldAlert className="h-3 w-3" /> Cómo mueres</div>
              <ul className="mt-1.5 space-y-1 text-[10px] leading-relaxed text-slate-400">
                <li><b className="text-rose-300">0</b> VCs · Ventas · Producto · Cultura</li>
                <li><b className="text-rose-300">$0</b> en caja → bancarrota</li>
                <li className="flex gap-1"><Bot className="mt-px h-3 w-3 shrink-0 text-rose-300" /><span><b className="text-rose-300">0</b> de Alma → wrapper clónico</span></li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300"><TriangleAlert className="h-3 w-3" /> Pistas</div>
              <div className="mt-1.5 space-y-1 text-[10px] leading-relaxed text-slate-400">
                <div><b className="text-emerald-300">▲</b> sube / <b className="text-rose-300">▼</b> baja · a más flechas, más impacto</div>
                <div><b className="text-fuchsia-300">ALMA ▼</b> te acerca al wrapper. A veces conviene.</div>
              </div>
            </div>
          </aside>
        </div>

        {/* timeline (solo desktop) */}
        <div className="hidden shrink-0 items-center gap-1 overflow-x-auto pb-1 lg:flex">
          <span className="flex shrink-0 items-center gap-1 font-mono2 text-[7px] uppercase tracking-[0.14em] text-slate-500"><Clock className="h-2.5 w-2.5" /> línea temporal</span>
          {ERAS.map((e, i) => (
            <div key={e.id} className={`flex shrink-0 items-center gap-1 rounded border px-1 py-0.5 font-mono2 text-[7px] uppercase tracking-wider ${i === eraIndex ? "border-amber-300/50 bg-amber-300/10 text-amber-200" : i < eraIndex ? "border-white/10 bg-white/[0.03] text-slate-500" : "border-white/5 text-slate-600"}`}>
              {i === eraIndex && <span className="h-1 w-1 rounded-full bg-amber-300" />}
              {e.label}
            </div>
          ))}
        </div>
      </div>

      {pendingEvent && (
        <WorldEventModal
          event={pendingEvent} eraLabel={ERAS[pendingEvent.eraIndex].label}
          step={eventStep} result={eventResult} deltas={eventDeltas}
          cause={eventCause} side={eventSide} soul={shownSoul} verdict={eventVerdict} reaOutcome={reaOutcome}
          onChoose={chooseWorldEvent} onClose={closeWorldEvent}
        />
      )}
    </div>
  );
}

/* ============================================================
   COMPONENTES
   ============================================================ */

function Backdrop({ dead, win, streak, weak, anomaly }: { dead?: boolean; win?: boolean; streak?: number; weak?: boolean; anomaly?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[#05070f]" />
      <div className="bg-blueprint absolute inset-0" />
      <div className={`absolute -top-24 left-1/2 h-[280px] w-[520px] -translate-x-1/2 rounded-full blur-[90px] sm:h-[420px] sm:w-[720px] sm:blur-[120px] ${win ? "bg-amber-400/25" : dead ? "bg-rose-600/20" : anomaly ? "bg-violet-600/30" : weak ? "bg-rose-700/20" : "bg-indigo-600/25"}`} />
      <div className={`absolute right-[-90px] top-1/3 h-[260px] w-[260px] rounded-full blur-[80px] sm:h-[380px] sm:w-[380px] sm:blur-[110px] ${win ? "bg-orange-500/20" : anomaly ? "bg-fuchsia-500/20" : weak ? "bg-slate-500/15" : "bg-fuchsia-600/15"}`} />
      <div className="absolute left-[-90px] top-2/3 h-[260px] w-[260px] rounded-full bg-cyan-500/10 blur-[80px] sm:h-[380px] sm:w-[380px] sm:blur-[110px]" />
      {streak !== undefined && streak >= 3 && <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-300/12 to-transparent" />}
    </div>
  );
}

function Stat({ icon: I, v, sub, danger }: { icon: any; v: string; sub?: string; danger?: boolean }) {
  return (
    <div className={`flex items-center gap-1 rounded-lg border px-1.5 py-1 backdrop-blur sm:px-2 ${danger ? "anim-shake border-rose-400/50 bg-rose-500/10" : "border-white/10 bg-white/5"}`}>
      <I className={`h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5 ${danger ? "text-rose-300" : "text-slate-400"}`} />
      <span className={`text-[11px] font-black leading-none sm:text-[13px] ${danger ? "text-rose-200" : "text-white"}`}>{v}</span>
      {sub && <span className="hidden font-mono2 text-[8px] uppercase tracking-wider text-slate-500 sm:inline">{sub}</span>}
    </div>
  );
}

function HintPills({ effect }: { effect: EffectInput }) {
  const rows: { key: MeterKey; v: number }[] = [
    { key: "vcs", v: effect.vcs ?? 0 }, { key: "ventas", v: effect.ventas ?? 0 },
    { key: "producto", v: effect.producto ?? 0 }, { key: "cultura", v: effect.cultura ?? 0 },
  ];
  const soulDelta = effect.soul ?? 0;
  const cashDelta = effect.cash ?? 0;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {rows.map(r => {
        const m = magnitude(r.v);
        if (!m) return null;
        const up = r.v > 0;
        return (
          <span key={r.key} className={`inline-flex items-center gap-0.5 rounded px-1 py-px font-mono2 text-[8px] font-bold sm:text-[9px] ${up ? "bg-emerald-400/15 text-emerald-200" : "bg-rose-400/15 text-rose-200"}`}>
            <span className="hidden sm:inline">{METER_CODE[r.key]}</span> {up ? "▲".repeat(m) : "▼".repeat(m)}
          </span>
        );
      })}
      {cashDelta !== 0 && (
        <span className={`inline-flex items-center rounded px-1 py-px font-mono2 text-[8px] font-bold sm:text-[9px] ${cashDelta > 0 ? "bg-emerald-400/15 text-emerald-200" : "bg-rose-400/15 text-rose-200"}`}>{cashDelta > 0 ? `+$${cashDelta}k` : `-$${Math.abs(cashDelta)}k`}</span>
      )}
      {soulDelta !== 0 && (
        <span className={`inline-flex items-center gap-0.5 rounded px-1 py-px font-mono2 text-[8px] font-bold sm:text-[9px] ${soulDelta > 0 ? "bg-teal-400/15 text-teal-200" : "bg-fuchsia-400/15 text-fuchsia-200"}`}>
          <Heart className="h-2 w-2" /> {soulDelta > 0 ? `+${soulDelta}` : soulDelta}
        </span>
      )}
    </div>
  );
}

function ChoiceButton({ choice, tone, onPick, icon: I, side }: { choice: { label: string; sub: string; effect: EffectInput }; tone: "rose" | "emerald" | "gold" | "violet"; onPick: () => void; icon: any; side: "left" | "right" }) {
  const styles = {
    rose: "border-rose-400/30 bg-gradient-to-b from-rose-500/18 to-rose-950/30 hover:border-rose-300/60",
    emerald: "border-emerald-400/30 bg-gradient-to-b from-emerald-500/18 to-emerald-950/30 hover:border-emerald-300/60",
    gold: "border-amber-300/50 bg-gradient-to-b from-amber-300/22 to-orange-600/20 hover:border-amber-200",
    violet: "border-violet-400/40 bg-gradient-to-b from-violet-500/18 to-violet-950/40 hover:border-violet-300/70",
  }[tone];
  return (
    <button onClick={onPick} className={`choice-btn flex flex-col rounded-xl border p-2 text-left sm:rounded-2xl sm:p-3 ${styles}`}>
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono2 text-[7px] font-bold uppercase tracking-[0.14em] opacity-60 sm:text-[8px]">{side === "left" ? "← A" : "B →"}</span>
        <I className="h-3 w-3 shrink-0 opacity-50" />
      </div>
      <div className="font-display mt-0.5 text-[clamp(9.5px,1.5vh,13px)] font-bold leading-tight">{choice.label}</div>
      <div className="mt-px line-clamp-2 text-[clamp(8px,1.15vh,10px)] leading-tight opacity-70">{choice.sub}</div>
      <HintPills effect={choice.effect} />
    </button>
  );
}

function DeltaChips({ deltas, withBurn = true }: { deltas: Effect; withBurn?: boolean }) {
  const items: { k: string; v: number; cash?: boolean; soul?: boolean }[] = [
    { k: "VCs", v: deltas.vcs }, { k: "Ventas", v: deltas.ventas },
    { k: "Producto", v: deltas.producto }, { k: "Cultura", v: deltas.cultura },
    { k: "Cash", v: deltas.cash, cash: true }, { k: "Alma", v: deltas.soul ?? 0, soul: true },
  ];
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {items.map((d, i) => {
        if (d.v === 0) return null;
        const up = d.v > 0;
        return (
          <span key={i} className={`rounded px-1.5 py-px font-mono2 text-[9px] font-bold ${up ? "bg-emerald-400/15 text-emerald-200" : d.soul ? "bg-fuchsia-400/15 text-fuchsia-200" : "bg-rose-400/15 text-rose-200"}`}>
            {d.k} {up ? "+" : ""}{d.cash ? `$${d.v}k` : d.v}
          </span>
        );
      })}
      {withBurn && <span className="rounded bg-white/10 px-1.5 py-px font-mono2 text-[9px] text-slate-300">burn -${DAILY_BURN}k</span>}
    </div>
  );
}

function WorldEventModal({ event, eraLabel, step, result, deltas, cause, side, soul, verdict, reaOutcome, onChoose, onClose }: {
  event: WorldEvent; eraLabel: string; step: "read" | "result"; result: string;
  deltas: Effect | null; cause: DeathCause | null; side: "left" | "right" | null; soul: number; verdict: FilesVerdict | null;
  reaOutcome: ReaVerdict | null;
  onChoose: (s: "left" | "right") => void; onClose: () => void;
}) {
  const deathCopy = cause === "files" ? "Tu nombre en la página 212. Ya no hay comunicado que lo arregle."
    : cause === "soul" ? "Esto te lleva directo al wrapper clónico."
    : cause === "rea-copied" ? "Te han reconstruido demasiado bien. Game over."
    : cause === "rea-accused" ? "No puedes demostrar que el producto sea tuyo. Game over."
    : cause ? "El impacto es demasiado fuerte. No llegas al lunes." : null;
  const eraTone = ERAS[event.eraIndex]?.tone;
  const tone = eraTone === "war" || eraTone === "weird";
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-hidden bg-black/85 p-2 backdrop-blur-md sm:items-center sm:p-6">
      <div className={`anim-card-in flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border bg-[#0a0d16] shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-[1.6rem] ${tone ? "border-red-400/25" : "border-white/15"}`}>
        <div className={`flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-5 sm:py-3 ${tone ? "bg-gradient-to-r from-red-950/70 to-slate-950/60" : "bg-gradient-to-r from-rose-950/60 to-amber-950/30"}`}>
          <div className="flex items-center gap-1.5">
            <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
            <span className="font-mono2 text-[8px] font-bold uppercase tracking-[0.18em] text-rose-200 sm:text-[9px]">Evento mundial · el mundo no espera</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono2 text-[8px] uppercase tracking-wider text-slate-400 sm:text-[9px]">
            <CalendarDays className="h-3 w-3" /> {event.dateLabel}
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-6">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono2 text-[8px] font-bold uppercase tracking-widest text-slate-300">{eraLabel}</span>
            <span className="rounded bg-rose-500/15 px-1.5 py-0.5 font-mono2 text-[8px] font-bold uppercase tracking-widest text-rose-200">Reacción de mercado</span>
            <span className="font-mono2 text-[8px] text-slate-500 sm:text-[9px]">{event.source}</span>
          </div>

          <h2 className="font-display mt-2.5 text-[19px] font-black leading-[1.05] tracking-tight sm:text-3xl">{event.headline}</h2>
          <div className="my-2.5 h-px w-full bg-white/15" />
          <p className="text-[13px] leading-relaxed text-slate-300 sm:text-[15px]">{event.body}</p>

          {step === "read" ? (
            <>
              <div className="mt-3.5 flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-2.5 text-[11px] leading-relaxed text-amber-100/90 sm:text-xs">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                <span>No es una visita: es el mercado. Sin burn diario, pero puede romper tu racha de unicornio.</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {event.options.map((opt, i) => (
                  <button key={i} onClick={() => onChoose(i === 0 ? "left" : "right")} className={`choice-btn rounded-xl border p-2.5 text-left sm:rounded-2xl sm:p-3.5 ${i === 0 ? "border-rose-400/30 bg-gradient-to-b from-rose-500/15 to-rose-950/30 hover:border-rose-300/60" : "border-emerald-400/30 bg-gradient-to-b from-emerald-500/15 to-emerald-950/30 hover:border-emerald-300/60"}`}>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono2 text-[8px] font-bold uppercase tracking-[0.14em] opacity-60">{i === 0 ? "← Reacción A" : "Reacción B →"}</span>
                      {i === 0 ? <ArrowLeft className="h-3.5 w-3.5 opacity-50" /> : <ArrowRight className="h-3.5 w-3.5 opacity-50" />}
                    </div>
                    <div className="font-display mt-1 text-[13px] font-bold leading-tight sm:text-[15px]">{opt.label}</div>
                    <div className="mt-0.5 text-[10px] leading-tight opacity-70 sm:text-[11px]">{opt.sub}</div>
                    <HintPills effect={opt.effect} />
                  </button>
                ))}
              </div>
              <div className="mt-2 text-center font-mono2 text-[8px] uppercase tracking-widest text-slate-500">atajos: 1 / 2 o ← →</div>
            </>
          ) : (
            <div className="anim-card-in mt-3.5 rounded-xl border border-white/12 bg-white/[0.04] p-3 sm:p-4">
              <div className="flex items-start gap-1.5 font-mono2 text-[8px] font-black uppercase tracking-[0.14em] text-slate-300 sm:text-[9px]">
                <Newspaper className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                <span className="min-w-0">El titular de tu reacción · {side === "left" ? event.options[0].label : event.options[1].label}</span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-100 sm:text-[14.5px]">{result}</p>
              {verdict && (
                <div className={`anim-card-in mt-3 rounded-xl border p-3 ${verdict === "named" ? "border-rose-400/50 bg-gradient-to-b from-rose-950/70 to-black/60" : "border-emerald-400/30 bg-emerald-500/[0.06]"}`}>
                  <div className={`font-mono2 text-[8px] font-black uppercase tracking-[0.2em] ${verdict === "named" ? "text-rose-300" : "text-emerald-300"}`}>Veredicto de los archivos</div>
                  <div className={`font-display mt-1 text-[15px] font-black leading-tight sm:text-xl ${verdict === "named" ? "text-rose-200" : "text-emerald-200"}`}>{FILES_VERDICT[verdict].title}</div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-slate-200 sm:text-[13.5px]">{FILES_VERDICT[verdict].text}</p>
                </div>
              )}
              {reaOutcome && (
                <div className={`anim-card-in mt-3 rounded-xl border p-3 ${reaOutcome === "middle" ? "border-emerald-400/30 bg-emerald-500/[0.06]" : "border-rose-400/50 bg-gradient-to-b from-rose-950/70 to-black/60"}`}>
                  <div className={`font-mono2 text-[8px] font-black uppercase tracking-[0.2em] ${reaOutcome === "middle" ? "text-emerald-300" : "text-rose-300"}`}>Informe de procedencia · REA</div>
                  <div className={`font-display mt-1 text-[15px] font-black leading-tight sm:text-xl ${reaOutcome === "middle" ? "text-emerald-200" : "text-rose-200"}`}>{REA_VERDICTS[reaOutcome].title}</div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-slate-200 sm:text-[13.5px]">{REA_VERDICTS[reaOutcome].text}</p>
                </div>
              )}
              {deltas && <DeltaChips deltas={deltas} withBurn={false} />}
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                <Heart className="h-3 w-3 shrink-0 text-rose-300" /> Alma: <span className={`font-bold ${soul <= 24 ? "text-rose-300" : "text-slate-200"}`}>{soul}/100</span> · {soulStage(soul).name}
              </div>
              {deathCopy && (
                <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-[11px] font-bold text-rose-200">
                  <Skull className="h-3.5 w-3.5 shrink-0" /> {deathCopy}
                </div>
              )}
              <button onClick={onClose} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-3 font-display text-[10px] font-bold uppercase tracking-widest text-black transition hover:scale-[1.01] active:scale-95 sm:text-xs">
                {reaOutcome === "middle" ? "Cerrar el informe" : `Continuar en ${eraLabel}`} <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface EndProps {
  tone: "dead" | "soul" | "win" | "deprecated";
  badge: ReactNode;
  title: string;
  story: string;
  icon: ReactNode;
  stats: { l: string; v: string }[];
  adn: string;
  history: LogEntry[];
  muted: boolean;
  setMuted: Dispatch<SetStateAction<boolean>>;
  onRestart: () => void;
  onMenu: () => void;
  footer: string;
  confetti?: boolean;
  epilogue?: DeprecationEpilogue;
  restartLabel?: string;
}

function End({ tone, badge, title, story, icon, stats, adn, history, muted, setMuted, onRestart, onMenu, footer, confetti, epilogue, restartLabel = "Reintentar" }: EndProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  const deprecated = tone === "deprecated";
  const border = tone === "win" ? "border-amber-300/30 bg-gradient-to-b from-amber-200/[0.1] to-white/[0.02]"
    : deprecated ? "border-cyan-300/20 bg-gradient-to-b from-slate-800/70 to-black/60"
      : tone === "soul" ? "border-rose-400/20 bg-gradient-to-b from-rose-950/40 to-black/60"
      : "border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02]";
  const accentText = tone === "win" ? "text-amber-200" : deprecated ? "text-cyan-200" : tone === "soul" ? "text-rose-200" : "text-white";
  return (
    <div className="noise relative min-h-[100dvh] overflow-x-hidden overflow-y-auto" data-ending={tone} aria-labelledby="ending-title">
      <Backdrop dead={tone === "dead" || tone === "soul"} win={tone === "win"} />
      {confetti && <Confetti />}
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col justify-center px-4 py-8 text-center">
        <TopMini muted={muted} setMuted={setMuted} best={0} />
        <div className={`anim-card-in mt-4 w-full overflow-hidden rounded-[1.6rem] border p-5 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-10 ${border}`}>
          <div className={`inline-flex flex-wrap items-center justify-center gap-2 rounded-full border px-3 py-1 font-mono2 text-[9px] uppercase tracking-[0.2em] ${tone === "win" ? "border-amber-300/50 bg-amber-300/10 text-amber-200 anim-pulse-gold" : deprecated ? "border-cyan-300/20 bg-cyan-300/5 text-cyan-200" : "border-rose-400/30 bg-rose-500/10 text-rose-200"}`}>{badge}</div>
          <div className={`mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-xl sm:h-20 sm:w-20 ${deprecated ? "from-slate-700 to-slate-950" : "from-amber-200 to-orange-500"}`}>{icon}</div>
          <h2 id="ending-title" ref={headingRef} tabIndex={-1} className={`mt-4 font-black leading-[1.1] outline-none ${deprecated ? "font-mono2 text-[clamp(1.5rem,7vw,3rem)]" : "font-display text-3xl sm:text-5xl"} ${accentText}`}>{title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-slate-300 sm:text-[15px]">{story}</p>
          {epilogue && (
            <section className="deprecation-branch mx-auto mt-5 max-w-xl border-t border-cyan-200/15 pt-5 text-left" aria-labelledby="epilogue-heading">
              <p className="font-mono2 text-[9px] uppercase tracking-[0.2em] text-slate-500">Destino del founder</p>
              <h3 id="epilogue-heading" className="mt-2 text-base font-bold leading-snug text-cyan-100 sm:text-lg">{epilogue.heading}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-300 sm:text-[15px]">{epilogue.narrative}</p>
            </section>
          )}
          {stats.length > 0 && <div className="mx-auto mt-4 grid max-w-lg grid-cols-2 gap-2 sm:grid-cols-4">
            {stats.map((s, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-black/35 p-2.5">
                <div className={`font-display text-lg font-black ${tone === "win" ? "text-amber-200" : "text-white"}`}>{s.v}</div>
                <div className="mt-0.5 font-mono2 text-[8px] uppercase tracking-widest text-slate-400">{s.l}</div>
              </div>
            ))}
          </div>}
          <div className="mx-auto mt-3 inline-flex max-w-lg items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-[11px] text-slate-400">
            ADN final: <span className={`font-bold ${tone === "win" ? "text-amber-200" : deprecated ? "text-cyan-200" : "text-rose-200"}`}>{adn}</span>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <button onClick={onRestart} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-display text-[11px] font-bold uppercase tracking-wider text-black transition hover:scale-[1.03] active:scale-95 sm:text-xs">
              <RotateCcw className="h-3.5 w-3.5" /> {restartLabel}
            </button>
            <button onClick={onMenu} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-display text-[11px] font-bold uppercase tracking-wider text-slate-200 transition hover:bg-white/10 sm:text-xs">Menú</button>
          </div>
          <p className="mt-4 text-[10px] italic text-slate-500 sm:text-xs">{footer}</p>
        </div>
        {!!history?.length && (
          <div className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-left">
            <div className="font-mono2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Tus últimos días</div>
            <div className="mt-2 space-y-1">
              {history.slice(0, 5).map((h: LogEntry, i: number) => (
                <div key={i} className="text-[11px] text-slate-400"><span className="font-mono2 text-slate-500">{h.date}</span> · <span className="font-bold text-slate-200">{h.who}</span> → {h.choice}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TopMini({ muted, setMuted, best }: { muted: boolean; setMuted: (v: any) => void; best: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300 to-orange-600"><Zap className="h-3.5 w-3.5 text-black" /></div>
        <span className="font-display text-[10px] font-black tracking-widest sm:text-xs">UNICORN OR DEAD</span>
      </div>
      <div className="flex items-center gap-1.5">
        {best > 0 && <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-mono2 text-[9px] text-slate-300">récord: {best}d</span>}
        <button onClick={() => setMuted((m: boolean) => !m)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300">{muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}</button>
      </div>
    </div>
  );
}

function Marquee() {
  const items = ["EL ALMA NO SALE EN EL DASHBOARD", "GUERRA EN UCRANIA E IRÁN", "LLAMA SE FILTRÓ", "DEEPSEEK ROMPIÓ EL MARGEN", "GROK EN NAVIDAD", "SI EL ALMA LLEGA A 0, ERES UN WRAPPER", "3 DÍAS > 75 = UNA MIRADA DE GOOGLE", "TODOS MONTAN SU CONSULTORÍA IA", "FUNDADO EN SEPTIEMBRE DE 2022"];
  return (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-white/10 bg-black/40 py-2.5">
      <div className="flex w-max animate-[marqueeX_30s_linear_infinite] gap-6 whitespace-nowrap px-3 font-mono2 text-[9px] tracking-[0.18em] text-slate-400">
        {[...items, ...items].map((t, i) => (
          <span key={i} className="flex items-center gap-6">{t} <span className="text-orange-400">◆</span></span>
        ))}
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 2, dur: 2.5 + Math.random() * 2.5,
    color: ["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa", "#fff"][i % 6],
    w: 5 + Math.random() * 6,
  })), []);
  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {pieces.map((p, i) => (
        <div key={i} style={{ left: `${p.left}%`, background: p.color, width: p.w, height: p.w * 0.6, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }} className="absolute top-0 animate-[confettiFall_linear_infinite] rounded-sm" />
      ))}
    </div>
  );
}
