export type MeterKey = "vcs" | "ventas" | "producto" | "cultura";

export interface Effect {
  vcs: number;
  ventas: number;
  producto: number;
  cultura: number;
  cash: number; // en miles de $ (k). Ej: +50 = +$50k
  soul?: number; // alma: no es un medidor de supervivencia clásico... pero se paga
}

/** Efecto parcial: lo que no se declara es 0 */
export type EffectInput = Partial<Effect>;

export interface GameChoice {
  label: string;
  sub: string;
  effect: EffectInput;
  result: string; // texto consecuente estilo diario del founder
}

export interface GameCharacter {
  id: string;
  name: string;
  role: string;
  org: string;
  emoji: string;
  gradient: string; // tailwind gradient classes
  glow: string;
  tag: string;
  dialogue: string;
  left: GameChoice;
  right: GameChoice;
  isGoogle?: boolean;
  isMotivation?: boolean;
  motivationTurns?: number;
  minEra?: number;
  maxEra?: number;
}

export const WIN_THRESHOLD = 75;
export const STREAK_NEEDED = 3;
export const START_CASH = 430; // $430k
export const DAILY_BURN = 5; // $5k al día
export const START_SOUL = 92;
export const DAYS_PER_TURN = 5;
export const START_METERS: Record<MeterKey, number> = {
  vcs: 62,
  ventas: 58,
  producto: 64,
  cultura: 60,
};

export const METERS: { key: MeterKey; label: string; short: string; icon: string; desc: string }[] = [
  { key: "vcs", label: "Confianza VCs", short: "VCs", icon: "💸", desc: "Si llega a 0 te destituyen en un board." },
  { key: "ventas", label: "Ventas / Traction", short: "Ventas", icon: "📈", desc: "Sin revenue no hay historia que contar." },
  { key: "producto", label: "Product Quality", short: "Producto", icon: "⚙️", desc: "Si el producto muere, el churn te entierra." },
  { key: "cultura", label: "Company Culture", short: "Cultura", icon: "🔥", desc: "El termómetro interno. A 0 hay éxodo total." },
];

export const CHARACTERS: GameCharacter[] = [
  {
    id: "vc-tiburon",
    name: "Víctor Kohl",
    role: "Partner",
    org: "Sequoia de Hacendado Capital",
    emoji: "🦈",
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
    glow: "shadow-emerald-500/30",
    tag: "TERM SHEET",
    dialogue:
      "He visto vuestro MRR. Es mono. Os ofrezco $180k por el 25%, pero despedís a la mitad del equipo y prometéis crecer 20x. El hustle lo es todo. ¿Firmamos?",
    left: {
      label: "Firmar el cheque",
      sub: "Cash ahora, alma después",
      effect: { vcs: 16, ventas: 4, producto: -8, cultura: -14, cash: 180, soul: -5 },
      result: "Firmaste. El wire llegó en 20 min. El equipo te mira como si hubieras vendido al perro.",
    },
    right: {
      label: "Rechazar con dignidad",
      sub: "Somos visionarios, no baratos",
      effect: { vcs: -12, ventas: -3, producto: 4, cultura: 10, cash: 0 },
      result: "Dijiste 'no estamos raising'. Víctor sonrió: 'Volverás llorando en la Serie A'. Cultura +10.",
    },
  },
  {
    id: "cto-quemado",
    name: "Javi Stack",
    role: "CTO & Co-founder",
    org: "Tu startup (de momento)",
    emoji: "🧑‍💻",
    gradient: "from-indigo-400 via-violet-500 to-purple-600",
    glow: "shadow-violet-500/30",
    tag: "TECH DEBT",
    dialogue:
      "Llevo 3 semanas durmiendo 4h. O contratamos 2 devs senior YA, o el monolito explota y reescribo todo en Rust por despecho. Tú decides, 'CEO'.",
    left: {
      label: "Contratar refuerzos",
      sub: "-$60k pero salvas el producto",
      effect: { vcs: -4, ventas: 0, producto: 16, cultura: 10, cash: -60 },
      result: "Contrataste a dos seniors. El deploy del viernes no tumbó prod. Javi lloró de felicidad.",
    },
    right: {
      label: "'Aguanta un sprint más'",
      sub: "Pizza y promesas gratis",
      effect: { vcs: 2, ventas: 3, producto: -14, cultura: -12, cash: 0 },
      result: "Javi actualizó LinkedIn a 'Open to work'. El bug en pagos costó 400 clientes. Bien jugado.",
    },
  },
  {
    id: "enterprise-client",
    name: "Margarita Solís",
    role: "CIO",
    org: "Banco Enorme S.A.",
    emoji: "🏦",
    gradient: "from-sky-400 via-blue-500 to-indigo-600",
    glow: "shadow-blue-500/30",
    tag: "ENTERPRISE",
    dialogue:
      "Nos encanta vuestra demo. Firmamos $120k anuales... si hacéis SSO, SOC2, on-premise, fax y una feature que solo usamos nosotros. Para ayer, porfa.",
    left: {
      label: "Decir SÍ a todo",
      sub: "El cliente siempre manda",
      effect: { vcs: 6, ventas: 18, producto: -12, cultura: -8, cash: 120, soul: -3 },
      result: "Firmaste. Ventas se dispara. Producto ahora es un Frankenstein con soporte para fax.",
    },
    right: {
      label: "Mantener el roadmap",
      sub: "Focus, focus, focus",
      effect: { vcs: -4, ventas: -10, producto: 12, cultura: 6, cash: 0 },
      result: "Margarita se fue a Oracle. Tu roadmap sigue puro. Tu cuenta, vacía de enterprise.",
    },
  },
  {
    id: "growth-hacker",
    name: "Luna Viral",
    role: "Head of Growth",
    org: "Ex-TikTok, 400k seguidores",
    emoji: "🚀",
    gradient: "from-pink-400 via-fuchsia-500 to-purple-600",
    glow: "shadow-pink-500/30",
    tag: "GROWTH",
    dialogue:
      "Tengo el plan: sorteamos un Tesla entre usuarios, spam en LinkedIn y un pop-up que no se puede cerrar. Growth 300% garantizado*. (*no garantizado). ¿Lo lanzo?",
    left: {
      label: "Lanzar el growth hack",
      sub: "Números go brrr",
      effect: { vcs: 8, ventas: 14, producto: -6, cultura: -6, cash: -25 },
      result: "10k signups en 48h. El 98% eran cazateslas. Tu NPS ahora es un número negativo imaginario.",
    },
    right: {
      label: "Growth sostenible",
      sub: "Aburrido pero sano",
      effect: { vcs: -3, ventas: -4, producto: 8, cultura: 6, cash: 0 },
      result: "Luna te llamó 'boomer del SaaS'. El producto respira. El dashboard no impresiona a nadie.",
    },
  },
  {
    id: "becario",
    name: "Dani, 19 años",
    role: "Becario con más energía que sueldo",
    org: "Universidad / Discord",
    emoji: "🧃",
    gradient: "from-amber-300 via-orange-400 to-rose-500",
    glow: "shadow-orange-500/30",
    tag: "BUEN ROLLO",
    dialogue:
      "¡He montado un bot de Discord, un hackathon interno y he traído croissants! ¿Puedo organizar el offsite en Benidorm? ¡Será ÉPICO! ¡¿Sí?!",
    left: {
      label: "Dejarle liderar el offsite",
      sub: "Cultura > todo",
      effect: { vcs: -5, ventas: -2, producto: -4, cultura: 18, cash: -12 },
      result: "El offsite fue legendario. Hay un mural de Dani en la oficina. Alguien se tatuó el logo.",
    },
    right: {
      label: "'Céntrate en los tickets'",
      sub: "Productividad ante todo",
      effect: { vcs: 2, ventas: 2, producto: 8, cultura: -12, cash: 0 },
      result: "Dani cerró 40 tickets llorando por dentro. El Slack #random lleva muerto 6 días.",
    },
  },
  {
    id: "periodista",
    name: "Sara Press",
    role: "Periodista",
    org: "TechCrunch de Albacete",
    emoji: "📰",
    gradient: "from-slate-300 via-slate-400 to-slate-600",
    glow: "shadow-slate-400/30",
    tag: "PRENSA",
    dialogue:
      "Estoy escribiendo '30 startups que van a morir en 2026'. Puedo poneros en la lista de 'las que lo petan'... si me das una exclusiva jugosa y acceso a métricas. Guiño guiño.",
    left: {
      label: "Filtrar métricas",
      sub: "Prensa a cualquier precio",
      effect: { vcs: 12, ventas: 10, producto: -2, cultura: -4, cash: 0 },
      result: "Portada: 'La startup que crece 40% MoM'. Los VCs te spamean. Tu abogado hiperventila.",
    },
    right: {
      label: "'No comment'",
      sub: "Stealth mode activado",
      effect: { vcs: -8, ventas: -6, producto: 2, cultura: 2, cash: 0 },
      result: "Saliste en la lista de 'las que van a morir'. Tu madre te llamó preocupada.",
    },
  },
  {
    id: "madre",
    name: "Tu Madre",
    role: "Consejera delegada de la culpa",
    org: "El grupo de WhatsApp familiar",
    emoji: "👩‍🍳",
    gradient: "from-rose-300 via-rose-400 to-red-500",
    glow: "shadow-rose-400/30",
    tag: "VIDA REAL",
    dialogue:
      "Hijo, tu primo ya es funcionario. ¿Cuándo vas a tener un trabajo de verdad con paga extra? ¿Eso de 'ronda' es que pedís dinero por la calle?",
    left: {
      label: "Ir a comer el domingo",
      sub: "Recargar el alma",
      effect: { vcs: 0, ventas: -2, producto: -2, cultura: 12, cash: -2 },
      result: "Croquetas caseras + siesta. Volviste humano. El equipo notó que sonreías.",
    },
    right: {
      label: "'Estoy en un sprint, mamá'",
      sub: "Grindset total",
      effect: { vcs: 3, ventas: 5, producto: 5, cultura: -10, cash: 0, soul: -2 },
      result: "Te perdiste el cocido. Cerraste 2 deals llorando un poco. El hustle tiene un precio.",
    },
  },
  {
    id: "hacker",
    name: "0x_Ghost",
    role: "Bug bounty hunter",
    org: "Algún sótano, probablemente",
    emoji: "🎭",
    gradient: "from-lime-300 via-green-500 to-emerald-700",
    glow: "shadow-green-500/30",
    tag: "SECURITY",
    dialogue:
      "Hola. Vuestra API expone los datos de 40k usuarios en texto plano. Puedo publicarlo en X... o me pagáis $30k en ETH y os explico cómo lo hice. Tenéis 24h. :) ",
    left: {
      label: "Pagar el bounty",
      sub: "-$30k, dormir tranquilo",
      effect: { vcs: -2, ventas: -2, producto: 14, cultura: 4, cash: -30 },
      result: "Pagaste. Parche en 6h. 0x_Ghost ahora es vuestro advisor de seguridad. Plot twist.",
    },
    right: {
      label: "Ignorarlo: 'será un farol'",
      sub: "YOLO security",
      effect: { vcs: -14, ventas: -14, producto: -16, cultura: -6, cash: 0, soul: -3 },
      result: "No era un farol. Trending topic por motivos horribles. El DPO dimitió por email.",
    },
  },
  {
    id: "guru-linkedin",
    name: "Álex Hustle",
    role: "Top Voice LinkedIn",
    org: "Personal Branding S.L.",
    emoji: "💼",
    gradient: "from-cyan-300 via-sky-400 to-blue-600",
    glow: "shadow-sky-400/30",
    tag: "CRINGE",
    dialogue:
      "Hermano, me levanté a las 4AM, ducha fría, y facturé mientras dormías. Si posteas cada día 'cómo pasé de 0 a $1M' te consigo 200 leads. Solo tienes que fingir que madrugas.",
    left: {
      label: "Hacerte LinkedIn bro",
      sub: "Personal branding mode",
      effect: { vcs: 7, ventas: 9, producto: -4, cultura: -8, cash: 0, soul: -3 },
      result: "Tu post 'Despedí a mi yo pobre' tiene 12k likes. Cerraste 3 demos. Tu equipo te hace bullying con cariño.",
    },
    right: {
      label: "Bloquear y seguir picando",
      sub: "Menos teatro, más producto",
      effect: { vcs: -4, ventas: -3, producto: 9, cultura: 5, cash: 0 },
      result: "Bloqueado. Shippeaste 2 features en silencio. Nadie lo vio, pero el churn bajó.",
    },
  },
  {
    id: "ux-designer",
    name: "Nora Píxel",
    role: "Product Designer",
    org: "Figma es mi casa",
    emoji: "🎨",
    gradient: "from-violet-300 via-purple-400 to-fuchsia-600",
    glow: "shadow-purple-400/30",
    tag: "REDISEÑO",
    dialogue:
      "Nuestra app parece un Excel del 2009. Propongo congelar features 2 semanas y rediseñar TODO con glassmorphism, dark mode y micro-interacciones que llorarás al ver.",
    left: {
      label: "Aprobar el rediseño",
      sub: "Belleza ante todo",
      effect: { vcs: 4, ventas: 6, producto: 12, cultura: 6, cash: -18 },
      result: "El nuevo diseño es PORNO visual. Conversión +22%. Los devs te odian un 15% menos.",
    },
    right: {
      label: "'El diseño actual funciona'",
      sub: "Si compila, no lo toques",
      effect: { vcs: -2, ventas: -5, producto: -10, cultura: -6, cash: 0 },
      result: "Nora llora en Figma. Un usuario dijo que vuestra UI 'le genera ansiedad'. Tiene razón.",
    },
  },
  {
    id: "comercial",
    name: "Rober Cierres",
    role: "VP Sales",
    org: "Siempre cerrando (ABC)",
    emoji: "🤝",
    gradient: "from-yellow-300 via-amber-400 to-orange-600",
    glow: "shadow-amber-400/30",
    tag: "CUOTA",
    dialogue:
      "Jefe, puedo cerrar el deal con Glovo-clon por $90k... si les prometo una integración custom, soporte 24/7 y que el logo salga más grande. ¿Me das munición?",
    left: {
      label: "Prometerles la luna",
      sub: "Cerrar a toda costa",
      effect: { vcs: 5, ventas: 17, producto: -10, cultura: -5, cash: 90, soul: -4 },
      result: "¡CERRADO! Rober hizo el baile del cierre. Producto tiene 3 meses de custom hell por delante.",
    },
    right: {
      label: "Vender solo lo que existe",
      sub: "Honestidad radical",
      effect: { vcs: -3, ventas: -8, producto: 8, cultura: 4, cash: 0 },
      result: "El cliente dijo 'volveremos cuando exista'. Rober actualizó su CV. El producto sigue íntegro.",
    },
  },
  {
    id: "competidor",
    name: "Y Combinator Clone",
    role: "Competidor con $20M",
    org: "CopyCat AI Inc.",
    emoji: "🦹",
    gradient: "from-red-400 via-rose-500 to-pink-600",
    glow: "shadow-red-500/30",
    tag: "AMENAZA",
    dialogue:
      "Hola vecinitos. Hemos clonado vuestra feature estrella, la regalamos gratis y hemos fichado a vuestro ex-diseñador. Podéis rendiros ahora y os contratamos como interns.",
    left: {
      label: "Guerra de precios",
      sub: "Gratis hasta sangrar",
      effect: { vcs: -6, ventas: 8, producto: -4, cultura: 6, cash: -40 },
      result: "Bajaste precios y aguantaste. El equipo se unió contra el enemigo común. Nada une como el odio.",
    },
    right: {
      label: "Innovar y diferenciarse",
      sub: "Que copien esto 😎",
      effect: { vcs: 6, ventas: -4, producto: 14, cultura: 2, cash: -20 },
      result: "Shippeaste lo incopiable en 3 semanas. Los VCs aman el 'defensibility'. El clon se quedó obsoleto.",
    },
  },
  {
    id: "abogado",
    name: "Lic. Garrigues Jr.",
    role: "Abogado ($600/hora)",
    org: "Bufete & Asociados & $$$",
    emoji: "⚖️",
    gradient: "from-stone-300 via-stone-400 to-stone-600",
    glow: "shadow-stone-400/30",
    tag: "LEGAL",
    dialogue:
      "Malas noticias: os demandan por la marca, el RGPD os mira raro y vuestros contratos de freelancers son servilletas. Puedo blindaros por $35k. Barato, créeme.",
    left: {
      label: "Pagar el blindaje legal",
      sub: "-$35k de tranquilidad",
      effect: { vcs: 8, ventas: 0, producto: 2, cultura: 0, cash: -35 },
      result: "Blindados. Los VCs duermen tranquilos cuando hay papeles. Qué triste y qué cierto.",
    },
    right: {
      label: "'Ya lo miraremos más tarde'",
      sub: "Legal? Nunca oí hablar",
      effect: { vcs: -12, ventas: -4, producto: 0, cultura: -2, cash: 0 },
      result: "Ahorraste $35k. La demanda sigue ahí, creciendo como un Tamagotchi del infierno.",
    },
  },
  {
    id: "influencer-crypto",
    name: "Cripto Dani",
    role: "Visionario Web3",
    org: "MoonCoin (en caída libre)",
    emoji: "🪙",
    gradient: "from-orange-300 via-yellow-400 to-amber-600",
    glow: "shadow-yellow-400/30",
    tag: "WEB3",
    maxEra: 2,
    dialogue:
      "Bro, si sacáis un token $FOUNDER y prometéis 'utilidad futura', levantáis $500k de mi comunidad en un finde. Whitepaper lo hace mi primo. ¿WAGMI?",
    left: {
      label: "Lanzar el $FOUNDER token",
      sub: "Dinero rápido, problemas lentos",
      effect: { vcs: -14, ventas: 6, producto: -8, cultura: -10, cash: 150, soul: -5 },
      result: "Pump brutal y dump brutal. Tienes cash pero la CNMV te ha empezado a seguir en Instagram.",
    },
    right: {
      label: "'Somos una empresa seria'",
      sub: "Pasar del humo",
      effect: { vcs: 8, ventas: -2, producto: 4, cultura: 4, cash: 0 },
      result: "Los VCs serios aplauden. Cripto Dani te llamó 'ngmi' y te bloqueó. Victoria moral.",
    },
  },
  {
    id: "candidato-senior",
    name: "Elena 10x",
    role: "Staff Engineer ex-Google",
    org: "Buscando su próxima aventura",
    emoji: "🧠",
    gradient: "from-teal-300 via-emerald-400 to-green-600",
    glow: "shadow-emerald-400/30",
    tag: "HIRING",
    dialogue:
      "Me encanta vuestra misión. Pido $170k + 1% + remoto total + no meetings los viernes + que mi perro venga a la ofi. Soy cara, pero soy 10x. ¿Me ficháis?",
    left: {
      label: "Ficharla cueste lo que cueste",
      sub: "Talento 10x",
      effect: { vcs: 6, ventas: 2, producto: 15, cultura: 5, cash: -55 },
      result: "Elena refactorizó el core en un finde. El sistema va 4x más rápido. Vale cada euro.",
    },
    right: {
      label: "No nos la podemos permitir",
      sub: "Austeridad",
      effect: { vcs: -3, ventas: 0, producto: -8, cultura: -4, cash: 0 },
      result: "Se fue a la competencia. Ayer shippeó lo que vosotros lleváis 6 meses discutiendo.",
    },
  },
  {
    id: "twitter-hater",
    name: "@startup_hater_88",
    role: "Cliente enfadado con 50k followers",
    org: "X (antes Twitter)",
    emoji: "🔥",
    gradient: "from-red-500 via-orange-500 to-amber-500",
    glow: "shadow-orange-500/30",
    tag: "CRISIS PR",
    dialogue:
      "VUESTRA APP ME HA COBRADO 3 VECES Y EL SOPORTE ME HA DEJADO EN VISTO. Hilo 🧵 1/47 sobre por qué sois una ESTAFA. Tienes 2h antes de que sea viral.",
    left: {
      label: "Responder en público + refund",
      sub: "Humildad pública",
      effect: { vcs: -2, ventas: 6, producto: 3, cultura: 6, cash: -8 },
      result: "Respondiste con humor y refund + 1 año gratis. El hilo acabó en 'vale, son majos'. Crisis capeada.",
    },
    right: {
      label: "Borrar y bloquear",
      sub: "Estrategia avestruz",
      effect: { vcs: -8, ventas: -12, producto: -4, cultura: -4, cash: 0 },
      result: "El screenshot del bloqueo tiene 2M de views. Tu CM ha pedido la baja por ansiedad.",
    },
  },
  {
    id: "co-founder",
    name: "Marta, tu Co-founder",
    role: "La que hace que todo funcione",
    org: "Tu startup",
    emoji: "🧬",
    gradient: "from-fuchsia-300 via-pink-400 to-rose-500",
    glow: "shadow-pink-400/30",
    tag: "SOCIOS",
    dialogue:
      "Oye, tenemos que hablar. Estoy al 150% y mi equity no refleja mi curro. O reequilibramos el cap table o me voy a montar 'lo mismo pero sin ti'. Con amor, ¿eh?",
    left: {
      label: "Darle más equity",
      sub: "Lo justo es lo justo",
      effect: { vcs: -6, ventas: 2, producto: 6, cultura: 16, cash: 0 },
      result: "Le diste 8% más. Llorasteis y os abrazasteis. El equipo lo celebró como una boda.",
    },
    right: {
      label: "'El equity ya está hablado'",
      sub: "Mano dura",
      effect: { vcs: 4, ventas: -4, producto: -12, cultura: -16, cash: 0, soul: -5 },
      result: "Marta no dijo nada. Solo actualizó su LinkedIn. El silencio en la ofi se puede cortar.",
    },
  },
  {
    id: "consultor",
    name: "Gonzalo Deck",
    role: "Ex-McKinsey",
    org: "Slides & Synergies",
    emoji: "📊",
    gradient: "from-blue-300 via-indigo-400 to-violet-600",
    glow: "shadow-indigo-400/30",
    tag: "STRATEGY",
    dialogue:
      "He analizado vuestra startup en un deck de 120 slides. Conclusión: necesitáis 'sinergizar el flywheel paradigmático'. Son $40k. El deck es precioso, eso sí.",
    left: {
      label: "Contratar al consultor",
      sub: "Slides que impresionan VCs",
      effect: { vcs: 10, ventas: -2, producto: -4, cultura: -8, cash: -40, soul: -2 },
      result: "Los VCs amaron el deck. El equipo lo usa como meme. 'Sinergizar' ya es verbo interno.",
    },
    right: {
      label: "Echarle con cajas destempladas",
      sub: "Hacemos, no slideamos",
      effect: { vcs: -5, ventas: 2, producto: 5, cultura: 8, cash: 0 },
      result: "Gonzalo se fue ofendidísimo. El equipo aplaudió. Shippeasteis en lo que él tardaba en alinear un texto.",
    },
  },
  {
    id: "openai-bill",
    name: "Factura de OpenAI",
    role: "Tu mayor gasto después de nóminas",
    org: "AI API Billing",
    emoji: "🤖",
    gradient: "from-green-300 via-teal-400 to-cyan-600",
    glow: "shadow-teal-400/30",
    tag: "COSTES",
    minEra: 2,
    dialogue:
      "Hola, soy vuestra factura de IA: $28k este mes porque alguien puso GPT-4 para resumir emojis. Podéis optimizar con caching... o seguir quemando cash como si fuerais OpenAI.",
    left: {
      label: "Optimizar y cachear",
      sub: "Ingeniería de costes",
      effect: { vcs: 3, ventas: 0, producto: 8, cultura: -2, cash: 15 },
      result: "Optimizaste prompts y cache. Ahorro real. El CTO te debe una caña.",
    },
    right: {
      label: "'La calidad no se recorta'",
      sub: "GPT-4 para todo",
      effect: { vcs: -2, ventas: 3, producto: 6, cultura: 2, cash: -28 },
      result: "La demo vuela. La factura también. Tu CFO (tú) llora en posición fetal.",
    },
  },
  {
    id: "devops",
    name: "Kuberto Iglesias",
    role: "DevOps / SRE",
    org: "El que sabe dónde está prod",
    emoji: "☸️",
    gradient: "from-cyan-300 via-blue-400 to-indigo-600",
    glow: "shadow-blue-400/30",
    tag: "INFRA",
    dialogue:
      "Propongo migrar TODO a Kubernetes multi-región con service mesh e Istio. Tardamos 3 semanas sin features. Pero podremos escalar a... eh... millones. ¿Algún día?",
    left: {
      label: "Aprobar la migración",
      sub: "Escalabilidad infinita",
      effect: { vcs: 5, ventas: -6, producto: 10, cultura: -4, cash: -22 },
      result: "3 semanas de infierno YAML. Ahora escaláis a millones. Tenéis 4.000 usuarios. Pero listos.",
    },
    right: {
      label: "'Heroku aguanta, ¿no?'",
      sub: "Keep it simple",
      effect: { vcs: -3, ventas: 3, producto: -6, cultura: 3, cash: 0 },
      result: "Seguís en el monolito feliz. Kuberto murmura 'deuda técnica' cada vez que pasas.",
    },
  },
  {
    id: "websummit",
    name: "Paddy Speaker",
    role: "Organizador de eventos",
    org: "Web Summit Clon Lisboa",
    emoji: "🎤",
    gradient: "from-purple-300 via-violet-400 to-indigo-600",
    glow: "shadow-violet-400/30",
    tag: "HYPE",
    dialogue:
      "¡Os queremos en el escenario principal! Solo $15k por el stand + vuestro CTO en un panel a las 8AM + repartir 2.000 tote bags. Exposure brutal, lo juro.",
    left: {
      label: "Ir a por el hype",
      sub: "Fotos con grúa y tote bags",
      effect: { vcs: 9, ventas: 8, producto: -3, cultura: 4, cash: -15 },
      result: "Foto con 3 unicornios y 40 leads. LinkedIn ardiendo. Valió cada tote bag.",
    },
    right: {
      label: "Quedarse picando código",
      sub: "Anti-hype",
      effect: { vcs: -6, ventas: -4, producto: 9, cultura: -2, cash: 0 },
      result: "Mientras otros hacían networking, shippeaste. Nadie lo sabe. Pero el producto lo nota.",
    },
  },
  {
    id: "angel",
    name: "Don Emilio",
    role: "Business Angel excéntrico",
    org: "Hizo fortuna con parking en Marbella",
    emoji: "🕶️",
    gradient: "from-amber-200 via-yellow-300 to-orange-500",
    glow: "shadow-yellow-300/30",
    tag: "ANGEL",
    dialogue:
      "Mira, chaval, no entiendo qué hacéis, pero mi nieto dice que la 'IA esa' es el futuro. Te pongo $100k si me prometes que no es como el Forex y me invitas al palco.",
    left: {
      label: "Aceptar sus $100k",
      sub: "Dinero sin preguntas raras",
      effect: { vcs: -4, ventas: 2, producto: 2, cultura: 6, cash: 100 },
      result: "Wire recibido con concepto 'para los ordenadores'. Don Emilio ahora va a todos los afterworks. Es un crack.",
    },
    right: {
      label: "Rechazar por 'fit estratégico'",
      sub: "Solo smart money",
      effect: { vcs: 6, ventas: -2, producto: 0, cultura: -4, cash: 0 },
      result: "Quedaste de snob. Los VCs pijos aplauden. Tu cuenta llora.",
    },
  },
  {
    id: "happiness",
    name: "Zoe Zen",
    role: "Chief Happiness Officer",
    org: "People & Vibes",
    emoji: "🧘",
    gradient: "from-emerald-200 via-green-300 to-teal-500",
    glow: "shadow-green-300/30",
    tag: "PEOPLE",
    dialogue:
      "El eNPS ha caído a 12. La gente está quemada. Propongo semana de 4 días durante un mes + presupuesto de terapia + prohibir Slack después de las 19h. ¿Cuidamos a la tribu?",
    left: {
      label: "Cuidar a la tribu",
      sub: "People first",
      effect: { vcs: -5, ventas: -3, producto: 4, cultura: 17, cash: -14 },
      result: "eNPS a 68 en un mes. La gente vuelve a reír en standup. Hasta Javi sonríe.",
    },
    right: {
      label: "'Estamos en guerra, no en un spa'",
      sub: "Modo espartano",
      effect: { vcs: 4, ventas: 5, producto: -6, cultura: -15, cash: 0 },
      result: "Zoe dimitió con una carta preciosa y devastadora. 3 devs la siguen en LinkedIn. Mal rollo.",
    },
  },
  {
    id: "ministerio",
    name: "Funcionario García",
    role: "Ventanilla 4, Ministerio",
    org: "Administración Pública",
    emoji: "🏛️",
    gradient: "from-gray-300 via-slate-400 to-gray-600",
    glow: "shadow-gray-400/30",
    tag: "BUROCRACIA",
    dialogue:
      "Para la subvención ENISA de $80k necesitan el modelo 036, el 037, certificado digital, vida laboral, y este formulario... en papel. Por triplicado. Y volved el martes. O el jueves.",
    left: {
      label: "Pelear el papeleo",
      sub: "Dinero público, dolor privado",
      effect: { vcs: 2, ventas: 0, producto: -5, cultura: -5, cash: 80 },
      result: "Tras 11 visitas, ¡conseguido! $80k que saben a gloria y a tinta de tampón.",
    },
    right: {
      label: "'No tenemos tiempo para esto'",
      sub: "Pasar de subvenciones",
      effect: { vcs: -2, ventas: 2, producto: 6, cultura: 3, cash: 0 },
      result: "Recuperaste 3 semanas de vida. Perdiste $80k. El funcionario selló algo con satisfacción.",
    },
  },
  {
    id: "ex-empleado",
    name: "Ex-empleado resentido",
    role: "Glassdoor Reviewer Pro",
    org: "Ahora en la competencia",
    emoji: "😤",
    gradient: "from-stone-400 via-neutral-500 to-zinc-700",
    glow: "shadow-zinc-500/30",
    tag: "DRAMA",
    dialogue:
      "Voy a publicar en Glassdoor que aquí se trabaja 60h, el CEO grita y la máquina de café echa humo. A menos que... me des una buena referencia y $5k de 'finiquito emocional'.",
    left: {
      label: "Pagar y callar",
      sub: "-$5k de paz",
      effect: { vcs: 0, ventas: 0, producto: 0, cultura: 8, cash: -5 },
      result: "Pagaste. La review fue de 4 estrellas: 'intenso pero aprendí mucho'. Barato.",
    },
    right: {
      label: "Llamar a su farol",
      sub: "No negociamos con chantajes",
      effect: { vcs: -7, ventas: -6, producto: 0, cultura: -10, cash: 0 },
      result: "Publicó la review de 1 estrella. 47 comentarios. Hiring congelado 2 semanas. Ay.",
    },
  },
  {
    id: "bigtech-offer",
    name: "Recruiter de Meta",
    role: "Talent Hunter",
    org: "Big Tech con campus y helados gratis",
    emoji: "🍦",
    gradient: "from-blue-400 via-cyan-400 to-teal-500",
    glow: "shadow-cyan-400/30",
    tag: "TENTACIÓN",
    dialogue:
      "Hola crack, te ofrecemos $280k + bonus + helado gratis para que dejes tu 'proyectito' y vengas a optimizar el botón de 'me gusta'. Tu equipo ni se enterará... al principio.",
    left: {
      label: "Quedarte y liderar",
      sub: "Founder hasta la muerte",
      effect: { vcs: 5, ventas: 2, producto: 5, cultura: 12, cash: 0, soul: 2 },
      result: "Contaste la oferta en el all-hands. 'Me quedo con vosotros'. Ovación. Alguien lloró.",
    },
    right: {
      label: "Tentar la oferta (un poco)",
      sub: "Entrevistarte en secreto",
      effect: { vcs: -6, ventas: -3, producto: -8, cultura: -12, cash: 0, soul: -3 },
      result: "El equipo se enteró por un leak. La confianza tardará en volver. El helado no valía tanto.",
    },
  },
  {
    id: "cliente-viral",
    name: "Ibai (no, otro Ibai)",
    role: "Streamer, 2M followers",
    org: "Twitch / TikTok",
    emoji: "🎮",
    gradient: "from-violet-400 via-purple-500 to-indigo-600",
    glow: "shadow-purple-500/30",
    tag: "VIRAL",
    dialogue:
      "¡Gente! Vuestra app es GOD. La uso en directo mañana si me dais premium de por vida y un código 'IBAICITO10' con el que me llevo el 30%. ¿Deal o sois NPCs?",
    left: {
      label: "Firmar con el streamer",
      sub: "A por lo viral",
      effect: { vcs: 7, ventas: 16, producto: -3, cultura: 3, cash: -10 },
      result: "50k visitas en una noche. Servidores temblando. Ventas en vertical. GG.",
    },
    right: {
      label: "Mantener pricing serio",
      sub: "No somos un casino",
      effect: { vcs: -2, ventas: -7, producto: 4, cultura: 0, cash: 0 },
      result: "Se fue a promocionar a tu competidor. Su raid de 80k viewers... duele verlo.",
    },
  },
  {
    id: "auditor-soc2",
    name: "Auditora SOC2",
    role: "La pesadilla enterprise",
    org: "Compliance & Doom",
    emoji: "🔍",
    gradient: "from-slate-400 via-gray-500 to-zinc-600",
    glow: "shadow-gray-500/30",
    tag: "COMPLIANCE",
    dialogue:
      "Para cerrar con enterprises necesitáis SOC2 Tipo II: 4 meses de evidencias, políticas y logs de todo. Sin esto, ni un banco os mira. ¿Empezamos el infierno?",
    left: {
      label: "Empezar la certificación",
      sub: "Dolor enterprise necesario",
      effect: { vcs: 9, ventas: 8, producto: -6, cultura: -6, cash: -30 },
      result: "Infierno de screenshots y políticas. Pero ahora puedes decir 'somos SOC2' y los CISOs sonríen.",
    },
    right: {
      label: "Pasar por ahora",
      sub: "Mover rápido",
      effect: { vcs: -7, ventas: -7, producto: 5, cultura: 3, cash: 0 },
      result: "Ahorraste meses. Perdiste 2 deals enterprise que pedían el papelito. La vida es tradeoff.",
    },
  },
  {
    id: "cofounder-ia",
    name: "Tu propio Product Hunt",
    role: "Lanzamiento del día",
    org: "Product Hunt #1?",
    emoji: "🏆",
    gradient: "from-yellow-300 via-orange-400 to-red-500",
    glow: "shadow-orange-400/30",
    tag: "LAUNCH",
    dialogue:
      "Sois #3 en Product Hunt. Si spameáis a toda vuestra red las próximas 6h podéis ser #1 y salir en todos los newsletters. Pero quemaréis a todo el equipo hoy.",
    left: {
      label: "Push total por el #1",
      sub: "Todo al lanzamiento",
      effect: { vcs: 10, ventas: 12, producto: -5, cultura: -9, cash: 5 },
      result: "#1 DEL DÍA. Badge naranja eterno. 8k visitas. El equipo duerme desde entonces.",
    },
    right: {
      label: "Celebrar el #3 con calma",
      sub: "Sano y sostenible",
      effect: { vcs: -2, ventas: 2, producto: 5, cultura: 7, cash: 0 },
      result: "#3 con dignidad. Menos hype, más sueño. El producto lo agradeció.",
    },
  },
];

export const GOOGLE_CHARACTER: GameCharacter = {
  id: "google-opa",
  name: "Elena Vidal",
  role: "VP CorpDev",
  org: "Google — Mountain View",
  emoji: "🔍",
  gradient: "from-blue-400 via-red-400 to-yellow-300",
  glow: "shadow-yellow-300/50",
  tag: "OPA GOOGLE",
  dialogue:
    "Hola, founder. Llevamos meses mirándoos. Tres días seguidos por encima del umbral, tracción, producto, cultura... Larry lo ha visto. Queremos compraros por $1.400 millones. Firma aquí y entras en la historia.",
  left: {
    label: "VENDER A GOOGLE",
    sub: "Exit de $1.400 millones. Leyenda.",
    effect: { vcs: 0, ventas: 0, producto: 0, cultura: 0, cash: 0 },
    result: "FIRMADO. $1.400M. Portada de todos lados. Eres leyenda del ecosistema.",
  },
  right: {
    label: "Rechazar: seremos el próximo Google",
    sub: "Delirio de grandeza (o visión)",
    effect: { vcs: -18, ventas: 8, producto: 6, cultura: 12, cash: 40, soul: -3 },
    result: "Dijiste NO a Google. La sala quedó en silencio. Elena sonrió: 'Nos vemos en 5 años... o en tu funeral'.",
  },
  isGoogle: true,
};

export const DEATH_MESSAGES: Record<MeterKey | "cash" | "files" | "rea-copied" | "rea-accused", { title: string; story: string; emoji: string }> = {
  "rea-copied": {
    title: "TE COPIARON CON REA",
    story: "Un competidor usó REA para estudiar el comportamiento del producto compilado y reconstruir sus funciones clave. No recuperó tu código fuente, pero consiguió algo que el mercado considera suficiente: una alternativa casi indistinguible, seis semanas después y a mitad de precio. Tu equipo original sigue teniendo la autoría. El mercado ha elegido el clon.",
    emoji: "🪞",
  },
  "rea-accused": {
    title: "ACUSACIÓN DE COPIA",
    story: "El informe de REA encuentra demasiados rastros de una aplicación ajena en la tuya. No prueba por sí solo quién copió a quién, pero el hilo viral ya tiene capturas, hashes y una cronología que nadie de tu equipo puede explicar. El original publica su repo; tu abogado pide tiempo. El mercado no espera.",
    emoji: "⚖️",
  },
  files: {
    title: "TU NOMBRE EN LA PÁGINA 212",
    story:
      "No fue un delito. Fue un nombre en un correo, en un archivo, en una cena. Los VCs dejaron de coger el teléfono, los clientes enterprise 'revisaron su relación' y tu equipo publicó una carta abierta. Hay cosas que no se arreglan con un comunicado. Tampoco con un NDA.",
    emoji: "📎",
  },
  vcs: {
    title: "DESTITUIDO POR EL BOARD",
    story:
      "Los VCs perdieron la fe. Te convocaron a un 'board extraordinario' un viernes a las 18h. Saliste sin email corporativo, sin MacBook y sin dignidad. Tu silla ya la ocupa un ex-McKinsey que dice 'sinergias'.",
    emoji: "🦈",
  },
  ventas: {
    title: "SIN TRACCIÓN, SIN EMPRESA",
    story:
      "El dashboard plano durante semanas. Los VCs dejaron de responder tus updates. El último cliente canceló con un 'suerte con todo'. Apagaste el servidor un martes. Nadie lo notó hasta el jueves.",
    emoji: "📉",
  },
  producto: {
    title: "EL PRODUCTO MURIÓ",
    story:
      "El churn llegó al 30%. La app caía más que funcionaba. Las reviews de 1 estrella eran poemas de odio. Tuviste que poner una página de 'estamos en mantenimiento' que nunca volvió.",
    emoji: "💥",
  },
  cultura: {
    title: "LA GRAN DIMISIÓN",
    story:
      "Primero fue Javi. Luego tres devs. Luego todo #general era un velatorio. El último apagó Slack con un 'fue bonito mientras duró'. Te quedaste solo con el Notion y dos plantas muertas.",
    emoji: "🪦",
  },
  cash: {
    title: "BANCARROTA TOTAL",
    story:
      "La cuenta llegó a $0 un martes. Nóminas impagadas, AWS cortado, la oficina precintada. Vendiste las sillas Herman Miller en Wallapop para pagar al abogado. Game over financiero.",
    emoji: "💸",
  },
};

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function formatCash(k: number): string {
  if (k >= 1000) return `$${(k / 1000).toFixed(2)}M`;
  if (k < 0) return `-$${Math.abs(k)}k`;
  return `$${k}k`;
}
