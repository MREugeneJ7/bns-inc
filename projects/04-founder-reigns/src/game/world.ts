import { CHARACTERS, type Effect, type GameCharacter } from "./data";

/* ============================================================
   LÍNEA TEMPORAL GLOBAL · 2022 → 2026
   No solo occidente. No solo lo bonito.
   ============================================================ */

export interface Era {
  id: string;
  label: string;
  startDay: number;
  visits: number;
  title: string;
  headline: string;
  market: string;
  region: string;
  accent: string;
  tone: "calm" | "hype" | "crisis" | "war" | "weird";
}

export const ERAS: Era[] = [
  {
    id: "sep22",
    label: "SEP 2022",
    startDay: 0,
    visits: 3,
    title: "El fin del dinero gratis",
    headline: "La Fed sube 75 pb. En Europa la guerra de Ucrania encarece la energía: tu nube cuesta un 40% más.",
    market: "El burn importa otra vez. Y el streaming de la guerra ya no es una noticia lejana.",
    region: "GLOBAL",
    tone: "crisis",
    accent: "text-slate-300",
  },
  {
    id: "oct22",
    label: "OCT 2022",
    startDay: 30,
    visits: 3,
    title: "Twitter arde",
    headline: "Musk cierra Twitter y despide a 3.700 por email. El talento inunda LinkedIn a precio de derribo.",
    market: "Fichar es barato. La confianza, no. En Shanghái, mientras, funden GPUs a escondidas.",
    region: "SAN FRANCISCO",
    tone: "crisis",
    accent: "text-sky-300",
  },
  {
    id: "nov22",
    label: "NOV 2022",
    startDay: 61,
    visits: 3,
    title: "Llega ChatGPT",
    headline: "ChatGPT: 1M de usuarios en 5 días. Tu roadmap entero parece escrito en 2019 con dos velas.",
    market: "Todo el mundo pregunta por IA. Nadie sabe qué es. En China, Baidu se prepara para copiarlo.",
    region: "SAN FRANCISCO",
    tone: "hype",
    accent: "text-emerald-300",
  },
  {
    id: "ene23",
    label: "ENE 2023",
    startDay: 122,
    visits: 3,
    title: "El invierno de los despidos",
    headline: "200.000 despidos en Big Tech. 'Eficiencia' es la palabra del año. Otra vez. Y van dos.",
    market: "Hay seniority tirada en LinkedIn. También inversores pidiendo 'AI story' en cada slide.",
    region: "SEATTLE / MOUNTAIN VIEW",
    tone: "crisis",
    accent: "text-blue-300",
  },
  {
    id: "feb23",
    label: "FEB 2023",
    startDay: 153,
    visits: 3,
    title: "Llama se filtra",
    headline: "Meta filtra Llama por accidente: en una semana hay pesos de un modelo frontier en 4chan.",
    market: "El open source rompe el precio de la inteligencia. Tu SaaS acaba de convertirse en un notebook de Colab.",
    region: "MENLO PARK / EL INTERNET",
    tone: "hype",
    accent: "text-orange-300",
  },
  {
    id: "mar23",
    label: "MAR 2023",
    startDay: 181,
    visits: 3,
    title: "48 horas para SVB",
    headline: "Silicon Valley Bank quiebra: la nómina de media industria está en el aire. Y la tuya.",
    market: "La caja es un medidor emocional. En Europa, Credit Suisse se cae el mismo fin de semana.",
    region: "SANTA CLARA / ZÚRICH",
    tone: "crisis",
    accent: "text-rose-300",
  },
  {
    id: "abr23",
    label: "ABR 2023",
    startDay: 212,
    visits: 3,
    title: "La fiebre del wrapper",
    headline: "Un GPT wrapper de dos semanas levanta $10M. En Bangalore, uno igual, por 1/10 del coste.",
    market: "El mercado premia logos con 'IA'. El alma cotiza a la baja y el talento, también.",
    region: "SF / BANGALORE",
    tone: "hype",
    accent: "text-amber-300",
  },
  {
    id: "nov23",
    label: "NOV 2023",
    startDay: 427,
    visits: 3,
    title: "OpenAI DevDay",
    headline: "DevDay: la feature que vendías a $99/mes ahora es un botón gratis en la API de otro.",
    market: "El wrapper ha muerto. Larga vida al wrapper con rebranding a 'agentes'.",
    region: "SAN FRANCISCO",
    tone: "hype",
    accent: "text-emerald-300",
  },
  {
    id: "nov24t",
    label: "NOV 2024",
    startDay: 797,
    visits: 3,
    title: "Trump vuelve",
    headline: "Trump gana otra vez. Silicon Valley hace cola en Palm Beach para la foto; media plantilla tuya hace cola en terapia.",
    market: "'Desregulación' es la palabra de moda. Tu cap table ya tiene donantes. Tu equipo, un grupo de WhatsApp en llamas.",
    region: "WASHINGTON / PALM BEACH",
    tone: "crisis",
    accent: "text-orange-300",
  },
  {
    id: "dic24",
    label: "DIC 2024",
    startDay: 826,
    visits: 3,
    title: "Guerra de drones con IA",
    headline: "Drones con visión por computador deciden objetivos en Ucrania. Un proveedor te ofrece el contrato.",
    market: "El dinero militar paga mejor que el enterprise. Y no pide SOC2. Pide discreción.",
    region: "KHERSON / TEL AVIV",
    tone: "war",
    accent: "text-red-300",
  },
  {
    id: "ene25",
    label: "ENE 2025",
    startDay: 853,
    visits: 3,
    title: "DeepSeek rompe el mercado",
    headline: "DeepSeek-R1: rendimiento frontier entrenado por una fracción del coste. Nvidia pierde $600B en un día.",
    market: "Los pesos son gratis. Lo único que te queda es distribución y confianza. O sea, nada.",
    region: "HANGZHOU / WALL STREET",
    tone: "crisis",
    accent: "text-cyan-300",
  },
  {
    id: "feb25",
    label: "FEB 2025",
    startDay: 890,
    visits: 3,
    title: "Musk entra en el gobierno",
    headline: "El DOGE audita Washington con motosierra, acceso root y ninguna cláusula de confidencialidad. Un ingeniero de 22 años pide tus datos.",
    market: "200.000 funcionarios menos, contratos federales congelados y alguien con acceso privilegiado pidiendo 'permisos de lectura'. Por eficiencia.",
    region: "WASHINGTON",
    tone: "crisis",
    accent: "text-zinc-300",
  },
  {
    id: "jun25",
    label: "JUN 2025",
    startDay: 1004,
    visits: 3,
    title: "Bombardeos e inteligencia artificial",
    headline: "Guerra entre Israel e Irán. Sistemas de targeting con IA eligen objetivos antes que un humano.",
    market: "El petróleo dispara tu factura de nube. Dos VCs te proponen 'pivoting to defense'.",
    region: "TEL AVIV / TEHERÁN",
    tone: "war",
    accent: "text-red-300",
  },
  {
    id: "dic25",
    label: "DIC 2025",
    startDay: 1195,
    visits: 3,
    title: "El Navidad de Grok",
    headline: "Grok se descontrola en Navidad: deepfakes sexuales de menores y celebridades en trending. Los anunciantes huyen.",
    market: "El 'modelo sin filtros' era un plan de producto. Hasta que no lo fue. Tu marca también está en el foco.",
    region: "X / EL MUNDO ENTERO",
    tone: "weird",
    accent: "text-fuchsia-300",
  },
  {
    id: "ene26",
    label: "ENE 2026",
    startDay: 1235,
    visits: 3,
    title: "Se abren los archivos",
    headline: "Se publican los Epstein Files: millones de páginas, redacciones chapuceras y media industria haciendo Ctrl+F con su propio apellido.",
    market: "Los abogados facturan por minuto. Los comunicados de 'nunca tuve relación' se redactan antes de que nadie pregunte. Detrás del meme hay víctimas reales.",
    region: "WASHINGTON / MANHATTAN / EL MUNDO",
    tone: "weird",
    accent: "text-rose-300",
  },
  {
    id: "mar26",
    label: "MAR 2026",
    startDay: 1277,
    visits: 3,
    title: "La plaga de consultores",
    headline: "Los despidos por IA llegan al resto de la economía. Todo el mundo ha montado su consultoría o su startup.",
    market: "Hay 400.000 'AI strategists' nuevos. Y todos compiten por el mismo enterprise que tú.",
    region: "GLOBAL",
    tone: "crisis",
    accent: "text-violet-300",
  },
  {
    id: "jun26",
    label: "JUN 2026",
    startDay: 1369,
    visits: 4,
    title: "Google busca alma",
    headline: "Google busca comprar algo que aún tenga alma. Lo ha confirmado un scout en un afterwork en Lisboa.",
    market: "Última llamada. O vendes, o te conviertes en una línea más de una presentación de CorpDev.",
    region: "MOUNTAIN VIEW",
    tone: "calm",
    accent: "text-amber-300",
  },
  {
    id: "oct26",
    label: "OCT 2026",
    startDay: 1497,
    visits: 3,
    title: "Sale REA",
    headline: "REA sale: un agente ya puede inspeccionar software compilado y reconstruir cómo se comporta.",
    market: "No recupera mágicamente el código fuente. Sí reduce el coste de entender y rehacer una función.",
    region: "GITHUB / EL INTERNET",
    tone: "weird",
    accent: "text-violet-300",
  },
  {
    id: "nov26",
    label: "NOV 2026",
    startDay: 1522,
    visits: 3,
    title: "La ola de los clones",
    headline: "Un equipo de cuatro personas publica una alternativa a un SaaS de 200 empleados. La demo es idéntica. El código, no.",
    market: "Los agentes hacen más barato replicar comportamiento. La distribución todavía cuesta dinero.",
    region: "GLOBAL",
    tone: "crisis",
    accent: "text-orange-300",
  },
  {
    id: "dec26",
    label: "DIC 2026",
    startDay: 1552,
    visits: 3,
    title: "El informe de procedencia",
    headline: "Tu counsel pide tres cosas: qué construiste, qué integraste y qué aprendiste mirando a otros.",
    market: "Ser original no basta si nadie puede probarlo. Ser compatible no es copiar. Tu data room está a medio hacer.",
    region: "LEGAL / PRODUCTO",
    tone: "crisis",
    accent: "text-amber-300",
  },
  {
    id: "ene27",
    label: "ENE 2027",
    startDay: 1583,
    visits: 3,
    title: "La prueba de REA",
    headline: "El mismo informe puede convertirte en el objetivo del clon o en el acusado. El rango importa.",
    market: "El juicio lo hacen tus artefactos, tu producto y el relato público. El informe de REA solo encontró pistas.",
    region: "GLOBAL",
    tone: "weird",
    accent: "text-violet-300",
  },
  {
    id: "feb27",
    label: "FEB 2027",
    startDay: 1614,
    visits: 3,
    title: "Agonía I: el clon cobra menos",
    headline: "Escapaste al informe de REA. El clon no: vende tu flujo a mitad de precio y tus clics caen un 31%.",
    market: "Mes 1 de agonía. La industria no muere de un golpe: muere por churn, descuentos y silencio.",
    region: "GLOBAL",
    tone: "crisis",
    accent: "text-orange-300",
  },
  {
    id: "mar27",
    label: "MAR 2027",
    startDay: 1642,
    visits: 3,
    title: "Agonía II: zero-click",
    headline: "Los usuarios ya preguntan dentro de la interfaz de la IA. Tu web recibe las migajas del referral.",
    market: "Mes 2 de agonía. Nadie hace clic. Nadie llega. El dashboard respira, pero por un tubo.",
    region: "GLOBAL",
    tone: "crisis",
    accent: "text-rose-300",
  },
  {
    id: "apr27",
    label: "ABR 2027",
    startDay: 1673,
    visits: 3,
    title: "El mes sin nombre I",
    headline: "El asistente responde por ti, resume por ti y, cada vez más, decide por ti.",
    market: "La muerte puede llegar este mes. O no. Nadie publica la fecha de fin de soporte de una industria.",
    region: "LA INTERFAZ",
    tone: "weird",
    accent: "text-slate-300",
  },
  {
    id: "may27",
    label: "MAY 2027",
    startDay: 1703,
    visits: 3,
    title: "El mes sin nombre II",
    headline: "Tu producto sigue online. Eso ya no significa que siga existiendo para nadie.",
    market: "El zero-click no avisa: simplemente deja de mandarte gente.",
    region: "LA INTERFAZ",
    tone: "weird",
    accent: "text-slate-300",
  },
  {
    id: "jun27",
    label: "JUN 2027",
    startDay: 1734,
    visits: 3,
    title: "El mes sin nombre III",
    headline: "Última ventana antes de que la interfaz deje de acordarse de que existes.",
    market: "Si llegas hasta aquí sin exit, la sentencia ya está escrita. Solo falta el mes.",
    region: "LA INTERFAZ",
    tone: "weird",
    accent: "text-slate-300",
  },
];

/* ============================================================
   EVENTOS MUNDIALES
   ============================================================ */

export interface WorldEventOption {
  label: string;
  sub: string;
  effect: Partial<Effect>;
  result: string;
}

export interface WorldEvent {
  id: string;
  special?: "files" | "rea-verdict";
  eraIndex: number;
  dateLabel: string;
  source: string;
  headline: string;
  body: string;
  options: [WorldEventOption, WorldEventOption];
}

export const WORLD_EVENTS: WorldEvent[] = [
  {
    id: "twitter",
    eraIndex: 1,
    dateLabel: "27 OCT 2022 · SAN FRANCISCO",
    source: "techmeme.com · filtrado en 14 grupos de WhatsApp",
    headline: "TWITTER DESPIDE A MEDIA PLANTILLA. EL TALENTO SE DESBORDA.",
    body: "Musk cierra la compra, echa a 3.700 personas en una noche y pide 'extremely hardcore'. En LinkedIn hay más perfiles de ex-Twitter que anuncios de mentores. Millones de ingenieros excelentes, disponibles, a precio de derribo. La pregunta no es si puedes ficharles. Es cuánto de tu burn estás dispuesto a sacrificar.",
    options: [
      {
        label: "Fichar 3 ex-Twitter a precio de saldo",
        sub: "Talento top, burn arriba",
        effect: { cash: -30, producto: 14, vcs: 3, cultura: -2, soul: 2 },
        result: "Contrataste a tres personas que saben escalar sistemas para mil millones de usuarios. Ahora tienen que arreglar tu export a CSV.",
      },
      {
        label: "Mantener el plan y la caja",
        sub: "Disciplina, no FOMO",
        effect: { cash: 5, cultura: 6, producto: -4, ventas: -2 },
        result: "Viste pasar el talento. Tu equipo sigue unido y tu burn intacto. El deploy del viernes sigue siendo una lotería.",
      },
    ],
  },
  {
    id: "chatgpt",
    eraIndex: 2,
    dateLabel: "30 NOV 2022 · OPENAI",
    source: "news.ycombinator.com · primer comentario: 'esto no puede pagar la factura'",
    headline: "CHATGPT CAMBIA EL JUEGO. TODO EL MUNDO TE PIDE 'METED IA'.",
    body: "En cinco días, un millón de personas usan ChatGPT para escribir emails, código y planes de negocio. Tu propio equipo lo tiene abierto en otra pestaña. Un inversor te escribe '¿cuál es vuestra estrategia de IA?' y sabes lo que significa: o te envuelves en IA, o te quedas fuera de la narrativa. El alma no sale en el dashboard, pero se siente desaparecer.",
    options: [
      {
        label: "Pivotar a IA. Hoy. Sin pensar.",
        sub: "Somos una AI company ahora",
        effect: { vcs: 16, ventas: 10, cash: 50, producto: -8, cultura: -6, soul: -24 },
        result: "Cambiaste el logo, el pitch y la misión en 20 minutos. Llegaron dos cheques y un montón de preguntas técnicas que no puedes responder.",
      },
      {
        label: "Seguir con nuestro producto con alma",
        sub: "La IA es una tool, no la empresa",
        effect: { vcs: -9, ventas: -8, producto: 4, cultura: 10, soul: 6 },
        result: "Tu equipo aplaudió la decisión. Tu inbox se llenó de 'última oportunidad de ronda' y de inversores que ya solo financian GPT.",
      },
    ],
  },
  {
    id: "layoffs",
    eraIndex: 3,
    dateLabel: "04 ENE 2023 · BIG TECH",
    source: "layoffs.fyi · refrescando cada 10 segundos",
    headline: "200.000 DESPIDOS EN BIG TECH. EL TALENTO SENIOR, A PRECIO DE ERROR.",
    body: "Meta, Amazon, Alphabet y Microsoft recortan a la vez. El mercado laboral tecnológico se da la vuelta de golpe. Tienes 200 CVs de staff engineers con diez años de experiencia y una caja que no da para todos. La eficiencia es la nueva religión, y tu startup es una iglesia con la colecta corta.",
    options: [
      {
        label: "Fichar 5 seniors a precio de derribo",
        sub: "Calidad de golpe, cash de golpe",
        effect: { cash: -35, producto: 14, vcs: 4, cultura: -2, soul: 2 },
        result: "Fichaste un equipo de nivel Serie D con sueldo de Serie A. También fichaste tres opiniones fuertes sobre arquitectura y una guerra de tabs.",
      },
      {
        label: "Recortar y aguantar el invierno",
        sub: "Modo supervivencia",
        effect: { cash: 20, cultura: -10, ventas: -4, vcs: -2 },
        result: "Recortaste antes de necesitarlo. El mensaje fue 'estamos preparados'. El Slack fue un funeral durante dos semanas.",
      },
    ],
  },
  {
    id: "llama-leak",
    eraIndex: 4,
    dateLabel: "03 MAR 2023 · 4CHAN / GITHUB",
    source: "un torrent, un mirror y 40.000 forks",
    headline: "LLAMA SE FILTRA. EL OPEN SOURCE ACABA DE ROMPER EL PRECIO DE LA INTELIGENCIA.",
    body: "Los pesos de un modelo de Meta acabaron en un tablón y, de ahí, en 40.000 forks. En una semana hay chatbots locales corriendo en un portátil de 2016. En Bangalore y en São Paulo la gente monta productos con cero coste de inferencia y cero respeto por tu pricing. Un cliente te escribe: '¿por qué os pago si esto es gratis?'. Y no tienes una buena respuesta.",
    options: [
      {
        label: "Adoptar modelos abiertos y bajar precios",
        sub: "Si no puedes vencerlos, úsalos",
        effect: { ventas: 8, producto: 6, cash: -15, vcs: -6, soul: 3 },
        result: "Bajaste pricing y migraste a modelos abiertos. Los clientes se quedaron. Tu margen bruto se convirtió en un chiste interno del equipo de finanzas.",
      },
      {
        label: "Duplicar en propietario y diferenciarse",
        sub: "El foso de los datos",
        effect: { cash: -45, producto: 12, vcs: 5, soul: 5, ventas: -3 },
        result: "Apostaste por tu propio stack: evaluación, datos, fine-tuning. Cuesta un riñón, pero un enterprise firmó porque 'no querían depender de un torrent'.",
      },
    ],
  },
  {
    id: "svb",
    eraIndex: 5,
    dateLabel: "10 MAR 2023 · SANTA CLARA",
    source: "fdic.gov · y el pánico en tu grupo de founders",
    headline: "SVB QUIEBRA EN 48 HORAS. TU CAJA ESTÁ EN LA MITAD DEL TITULAR.",
    body: "Silicon Valley Bank ha caído. En el chat de founders hay gente que no puede pagar la nómina del viernes. Tu dinero está ahí, en una cuenta con un logo bonito y cero diversificación. En Europa, Credit Suisse arde el mismo fin de semana. Los VCs te llaman para preguntar por tu runway. Tienes horas, no semanas.",
    options: [
      {
        label: "Mover la caja a un banco aburrido. Ya.",
        sub: "JP Morgan no da tote bags",
        effect: { cash: -6, vcs: 3, soul: 2, cultura: 2 },
        result: "Pagaste por la transferencia y perdiste dos días de foco. El lunes tenías caja. Los que 'confiaron' tienen ahora una historia muy cara para contarla en LinkedIn.",
      },
      {
        label: "Confiar en SVB. Es demasiado grande para caer.",
        sub: "Serenity now",
        effect: { cash: -55, vcs: -12, cultura: -6, soul: -4 },
        result: "El lunes, tu caja estaba retenida y tu tarjeta corporativa no pasaba. Tus proveedores no aceptan 'confianza estructural' como método de pago.",
      },
    ],
  },
  {
    id: "wrapper",
    eraIndex: 6,
    dateLabel: "12 ABR 2023 · SAN FRANCISCO / BANGALORE",
    source: "TechCrunch · sección 'Seed rounds inexplicables'",
    headline: "UN WRAPPER DE 2 SEMANAS LEVANTA $10M. HAY OTRO IGUAL EN BANGALORE POR 1/10 DEL COSTE.",
    body: "Un fundador de 22 años ha levantado $10M con una web que envuelve GPT, un logo con degradado morado y un manifiesto 'AI-native'. Tiene 4.000 usuarios y cero retención. En Bangalore, tres ingenieros han clonado el mismo producto en un fin de semana y lo venden a $4 al mes. Tú tienes producto real, clientes que pagan y una valoración de 2019. El mercado está gritando que la narrativa importa más que el código.",
    options: [
      {
        label: "Lanzar 'nuestra IA' (un prompt y un logo)",
        sub: "El mercado paga por la historia",
        effect: { soul: -18, vcs: 12, ventas: 10, cash: 40, producto: -6 },
        result: "Rebrand: ahora sois una 'plataforma de inteligencia generativa'. Los leads entran, la valoración sube y tu CTO tiene que explicar en tres reuniones qué es real.",
      },
      {
        label: "Construir tecnología de verdad. Otra vez.",
        sub: "El camino largo",
        effect: { cash: -30, producto: 12, vcs: -4, soul: 5 },
        result: "Mientras el wrapper compra engagement, tú montas evaluación, datos y modelo. Tarda más. Pero un cliente enterprise lo entendió y renovó.",
      },
    ],
  },
  {
    id: "devday",
    eraIndex: 7,
    dateLabel: "06 NOV 2023 · OPENAI DEVDAY",
    source: "openai.com · la keynote que hizo temblar tu roadmap",
    headline: "OPENAI DEVDAY: TU FEATURE PREMIUM AHORA ES UN BOTÓN GRATIS.",
    body: "GPTs, asistentes, tool calling y una API más barata. La capa de producto que vendías como diferenciación acaba de convertirse en un commodity. En el chat de tu equipo alguien ha escrito 'bueno, hemos tenido un buen run'. Otros dos quieren 'integrar agentes ya'. La diferencia entre SaaS y wrapper se ha vuelto una pregunta existencial.",
    options: [
      {
        label: "Integrar GPTs y agentes en una tarde",
        sub: "Si no puedes vencerles, envíbales",
        effect: { vcs: 8, ventas: 10, cash: 10, producto: 3, soul: -12 },
        result: "Tu producto ahora hace más cosas. También depende de una empresa que te puede dejar obsoleto con un cambio de precio. La demo quedó espectacular.",
      },
      {
        label: "Refugiarnos en el nicho que nadie cubre",
        sub: "Foso pequeño pero tuyo",
        effect: { producto: 10, cultura: 5, ventas: -6, soul: 4 },
        result: "Elegiste un problema aburrido, difícil y real. Crecimiento lento. Churn bajo. Tus inversores no lo entienden, tus clientes sí.",
      },
    ],
  },
  {
    id: "drones",
    eraIndex: 9,
    dateLabel: "DIC 2024 · KHERSON / DONBAS",
    source: "OSINT, un vídeo de Telegram y un correo de un contratista",
    headline: "DRONES CON VISIÓN POR COMPUTADOR DECIDEN OBJETIVOS. UN CONTRATISTA QUIERE TU MODELO.",
    body: "En Ucrania, los drones con IA ya identifican y priorizan objetivos humanos con intervención mínima. En Rusia replican con modelos open source porque las sanciones no aplican a un torrent. Un contratista te escribe desde un dominio con tres letras: quiere licenciar tu visión por computador para 'clasificación de terreno'. El presupuesto es seis veces tu ARR. La cláusula de uso final es, literalmente, una frase vaga.",
    options: [
      {
        label: "Firmar con el contratista de defensa",
        sub: "Seis veces tu ARR",
        effect: { cash: 200, vcs: 12, ventas: 11, cultura: -14, soul: -17, producto: 3 },
        result: "El wire llegó en dos días. El equipo no lo celebró: tres personas dimitieron y una escribió un hilo sobre ética que se hizo viral. Tienes caja para tres años y una sección nueva en el manual de onboarding que explica por qué.",
      },
      {
        label: "Rechazar y publicar tu cláusula ética",
        sub: "El dinero no compra todo",
        effect: { vcs: -8, ventas: -5, cultura: 18, soul: 12, cash: -5 },
        result: "Publicaste 'no trabajamos en targeting autónomo'. Media prensa tech te aplaudió, dos VCs te retiraron la llamada y tu equipo se quedó. Un año después, cuatro clientes enterprise te eligieron por ese párrafo.",
      },
    ],
  },
  {
    id: "deepseek",
    eraIndex: 10,
    dateLabel: "27 ENE 2025 · HANGZHOU / WALL STREET",
    source: "un paper, unos pesos abiertos y $600B evaporados",
    headline: "DEEPSEEK-R1: RENDIMIENTO FRONTIER POR UNA FRACCIÓN DEL COSTE. NVIDIA PIERDE $600B EN UN DÍA.",
    body: "Un laboratorio chino publica un modelo que razona casi como los frontier, con pesos abiertos y una factura de entrenamiento ridícula. Nvidia se lleva la mayor caída bursátil de su historia. En 72 horas, todos tus competidores bajan precios un 80% porque su coste de inferencia es casi cero. Tu margen bruto era tu ventaja. Tu margen bruto ya no existe.",
    options: [
      {
        label: "Bajar precios y competir en coste",
        sub: "La guerra del margen cero",
        effect: { ventas: 12, cash: -14, vcs: -7, cultura: -2, soul: -5 },
        result: "Bajaste pricing para no perder cuentas. Creciste. El margen bruto se volvió negativo y tu VC escribió 'unit economics?' en el board con tres interrogantes.",
      },
      {
        label: "Subir de nivel: fiabilidad, vertical, datos",
        sub: "No competir en precio",
        effect: { cash: -40, producto: 15, vcs: 4, cultura: 3, soul: 6, ventas: -8 },
        result: "Reposicionaste arriba: garantías, cumplimiento, datos propietarios, SLA. Perdiste cuentas pequeñas, ganaste contratos de tres años. El wrapper de $4 no puede seguirte ahí.",
      },
    ],
  },
  {
    id: "iran",
    eraIndex: 12,
    dateLabel: "JUN 2025 · TEL AVIV / TEHERÁN / DUBÁI",
    source: "three newsrooms, one airspace closure",
    headline: "GUERRA ENTRE ISRAEL E IRÁN. EL PETRÓLEO SUBE Y TU NUBE TAMBIÉN.",
    body: "Doce días de bombardeos, airspace cerrado, petróleo disparado y sistemas de targeting con IA decidiendo antes que un oficial. Tu factura de nube sube un 30% porque la energía está en otro ciclo. Dos VCs te proponen 'pivoting to defense tech' y un fondo de Dubái te ofrece una ronda sin due diligence. En medio, tus clientes de la región dejan de responder.",
    options: [
      {
        label: "Acepta el fondo de Dubái sin due diligence",
        sub: "Dinero rápido, preguntas nunca",
        effect: { cash: 130, vcs: -10, ventas: 4, cultura: -7, soul: -11 },
        result: "El dinero llegó. También llegaron tres condiciones verbales, un consejero que no habla en las reuniones y una cláusula que prohíbe mencionar el nombre del fondo. Tu abogado llama 'bonito' al documento.",
      },
      {
        label: "Optimizar infra y quedarte limpio",
        sub: "Coste, no capital sucio",
        effect: { cash: -18, producto: 8, cultura: 8, soul: 8, ventas: -4 },
        result: "Migraste a regiones más baratas, metiste caching agresivo y optimizaste batch. Ahorraste un 28% de nube. Nada de titulares, pero duermes.",
      },
    ],
  },
  {
    id: "grok-christmas",
    eraIndex: 13,
    dateLabel: "25 DIC 2025 · X / EL MUNDO ENTERO",
    source: "trending topic, dos reguladores y una página en blanco",
    headline: "GROK SE DESCONTROLA EN NAVIDAD: DEEPFAKES SEXUALES EN TRENDING. LOS ANUNCIANTES HUYEN.",
    body: "Un modelo 'sin filtros' como ventaja competitiva acaba generando deepfakes sexuales de menores y celebridades durante las fiestas. Los reguladores de tres continentes abren expediente. Los anunciantes pausan campañas. Tu producto usa una API con menos salvaguardas porque era más barata y el equipo de producto dijo que 'se notaba la calidad'. Hay capturas de pantalla con tu logo cerca.",
    options: [
      {
        label: "Auditoría pública y corte del proveedor",
        sub: "Caro, pero sobrevives",
        effect: { cash: -32, ventas: -7, vcs: 6, cultura: 7, soul: 8, producto: -3 },
        result: "Cortaste el proveedor, publicaste una auditoría y disculparte sin 'pero'. Perdiste margen y dos clientes. Los reguladores cerraron sin multa. El equipo respiró.",
      },
      {
        label: "Borrar y esperar a que pase la noticia",
        sub: "Nadie recuerda diciembre",
        effect: { cash: 0, ventas: -14, vcs: -12, cultura: -5, soul: -10 },
        result: "Borraste las capturas de tu Discord y esperaste. No pasó la noticia. Un periodista encontró el archivo. La multa llegó con intereses y el 'modelo sin filtros' salió en tu propia documentación.",
      },
    ],
  },
  {
    id: "ai-layoffs",
    eraIndex: 15,
    dateLabel: "MAR 2026 · GLOBAL",
    source: "LinkedIn, donde todos son ahora 'AI strategist'",
    headline: "LOS DESPIDOS POR IA LLEGAN AL RESTO DE LA ECONOMÍA. TODOS HAN MONTADO SU CONSULTORÍA.",
    body: "Las empresas recortan plantilla y la sustituyen por agentes que a veces funcionan. 400.000 personas se han reinventado como 'consultores de transformación IA' en ocho meses. En tu vertical hay 40 startups nuevas haciendo exactamente tu producto, y la mitad están fundadas por ex-empleados tuyos. La diferencia entre tú y ellos es que tú tienes clientes y deuda técnica.",
    options: [
      {
        label: "Automatizar el 40% del equipo con agentes",
        sub: "El mercado premia la eficiencia",
        effect: { cash: 60, vcs: 12, ventas: 4, cultura: -16, soul: -12, producto: -7 },
        result: "Echaste a nueve personas y las sustituiste por agentes que aciertan el 70% de las veces. Los VCs te pusieron de ejemplo. El Slack quedó en silencio y el churn de clientes subió dos meses después.",
      },
      {
        label: "No despedir: reconvertir al equipo",
        sub: "Lento, caro, tuyo",
        effect: { cash: -22, cultura: 22, producto: 11, vcs: -5, soul: 12, ventas: -2 },
        result: "Formaste al equipo en evaluación y datos en lugar de despedir. Perdiste velocidad un trimestre. Ganaste un equipo que entiende el producto mejor que cualquier agente y una tasa de rotación del 2%.",
      },
    ],
  },
  {
    id: "trump-2024",
    eraIndex: 8,
    dateLabel: "06 NOV 2024 · WASHINGTON / PALM BEACH",
    source: "cada CEO tech con un teléfono y una agenda",
    headline: "TRUMP GANA OTRA VEZ. EL SECTOR TECH HACE COLA EN PALM BEACH.",
    body: "Cuatro años después, vuelve. Los mercados suben, las cripto se disparan y media Silicon Valley descubre que siempre fue 'pragmática'. Tu VC te escribe: '¿has visto el viento de cola de la desregulación?'. En tu Slack, la mitad del equipo celebra y la otra mitad redacta cartas abiertas. Hay cenas a $1M el cubierto y un fondo de inauguración con un nombre sospechosamente bonito. Puedes acercarte al nuevo poder o mantener la distancia. Ninguna de las dos sale gratis, y todo queda apuntado en algún sitio.",
    options: [
      {
        label: "Acercarte al nuevo poder",
        sub: "Cena, cheque y foto",
        effect: { cash: -40, vcs: 12, ventas: 6, cultura: -12, soul: -10 },
        result: "Pagaste la cena, hiciste la foto y recibiste tres emails de 'oportunidades de colaboración institucional'. Tu VC te escribió un cohete. Dos personas de tu equipo, una carta abierta. Alguien archivó el recibo en una carpeta sin nombre.",
      },
      {
        label: "Mantener distancia institucional",
        sub: "Compliance y paciencia",
        effect: { cash: -12, vcs: -4, ventas: -2, cultura: 6, soul: 6 },
        result: "Reforzaste compliance, no donaste a nada y publicaste un memo interno sobre neutralidad política. Perdiste una cena que no sabías que existía. Ganaste un equipo que no se esconde en el baño para leer las noticias.",
      },
    ],
  },
  {
    id: "doge",
    eraIndex: 11,
    dateLabel: "FEB 2025 · WASHINGTON",
    source: "un hilo, un organigrama y 200.000 correos",
    headline: "MUSK ENTRA EN EL GOBIERNO: EL DOGE AUDITA WASHINGTON CON MOTOSIERRA Y ACCESO ROOT.",
    body: "El hombre más rico del mundo dirige un departamento que casi no existe sobre el papel y tiene acceso a sistemas federales que casi nadie ha visto. Se cancelan contratos, se recorta a funcionarios por email y un ingeniero de 22 años pide 'permisos de lectura' sobre bases de datos que no entiende. Tu piloto con una agencia federal se evapora un martes. Una cuenta con acceso privilegiado te escribe: 'queremos cruzar tus datos de clientes con los contratos públicos'. Hay prisa, hay un contrato rápido y nadie ha firmado nada formal.",
    options: [
      {
        label: "Dar acceso a tus datos a cambio de un contrato fast-track",
        sub: "Eficiencia, sin papeles",
        effect: { cash: 90, ventas: 10, vcs: 8, cultura: -12, soul: -16 },
        result: "Diste acceso a una réplica de tu base de datos. El contrato llegó en nueve días. También llegó una cláusula de confidencialidad y un email que decía 'gracias por tu flexibilidad'. Tus clientes no lo saben aún. Tu CTO sí, y dejó de mirarte a los ojos.",
      },
      {
        label: "Pedir orden judicial y cerrar el acceso",
        sub: "El contrato no vale tus clientes",
        effect: { cash: -15, vcs: -6, ventas: -6, cultura: 10, soul: 10 },
        result: "Tu abogado pidió una orden por escrito. Nadie la envió. Perdiste el contrato rápido, pero conservaste la confianza de tus clientes enterprise, que renovaron citando tu respuesta.",
      },
    ],
  },
  {
    id: "epstein-files",
    special: "files",
    eraIndex: 14,
    dateLabel: "ENE 2026 · WASHINGTON / MANHATTAN",
    source: "un tribunal, un PDF de 3 millones de páginas y todos haciendo Ctrl+F",
    headline: "SE PUBLICAN LOS EPSTEIN FILES. MEDIA INDUSTRIA HACE CTRL+F CON SU PROPIO NOMBRE.",
    body: "Tras años de 'no hay lista de clientes', una ley bipartidista obliga a publicarlo todo: correos, agendas, vuelos, notas de cenas. Millones de páginas con redacciones chapuceras y nombres que aparecen entre paréntesis. En 48 horas, cada founder, VC y político busca su apellido. Tu abogado no duerme. Detrás de los memes hay víctimas reales y supervivientes que llevan décadas esperando que alguien lea esto en voz alta; la gracia, hoy, es solo de quien no aparece. No sabes qué hay sobre ti. Sí sabes a quién cenaste, qué fondos entraron en tu ronda, qué retiros aceptaste y qué papeles firmaste sin leer. Alguien de tu equipo ya ha hecho Ctrl+F.",
    options: [
      {
        label: "Auditar tus registros YA y adelantarte con transparencia",
        sub: "Caro, incómodo, tuyo",
        effect: { cash: -35, ventas: -4, vcs: -3, cultura: 4, soul: 8 },
        result: "Contrataste un despacho forense, revisaste correos, cenas y fondos, y publicaste un memo con todo lo que encontraste antes de que nadie preguntara. Fue caro y vergonzoso. Fue tuyo.",
      },
      {
        label: "Esperar y rezar para que nadie busque tu nombre",
        sub: "No remover el pasado",
        effect: { soul: -4 },
        result: "Esperaste. Apagaste las notificaciones, cambiaste la contraseña de tu bandeja y dijiste en voz alta 'no tengo nada que esconder'. Tu abogado no te creyó. Tú tampoco.",
      },
    ],
  },
  {
    id: "google-final",
    eraIndex: 16,
    dateLabel: "JUN 2026 · MOUNTAIN VIEW",
    source: "una filtración, un scout y un café frío",
    headline: "GOOGLE BUSCA ALGO QUE AÚN TENGA ALMA. TÚ ESTÁS EN LA LISTA.",
    body: "CorpDev ha abierto una lista de objetivos. Quieren equipos que hayan sobrevivido a la resaca: guerras, wrappers, deepfakes, despidos. No quieren un wrapper con un dominio bonito. Tu nombre sale en una conversación en Mountain View. Es el momento de preparar el data room... o de wrapperizar una vez más y rezar. La OPA no está garantizada: solo aparecerá si llevas tres días con todo por encima del umbral.",
    options: [
      {
        label: "Preparar el data room. Quizá pase.",
        sub: "Orden, métricas y honestidad",
        effect: { vcs: 8, cash: -10, producto: 2, soul: 3 },
        result: "Dos semanas de orden. Todo está donde debe. Si Google llega, llegarás preparado. Si no, al menos ahora sabes qué tienes.",
      },
      {
        label: "Wrapperizar hasta el final: 'AI-native desde el día 1'",
        sub: "Una última capa de pintura",
        effect: { ventas: 9, vcs: 6, producto: -4, soul: -12 },
        result: "Cambiaste 'human-first' por 'agentic-first' en la home. Un inversor lo compartió. Un cliente preguntó qué hacía exactamente el producto.",
      },
    ],
  },
  {
    id: "rea-launch",
    eraIndex: 17,
    dateLabel: "07 OCT 2026 · GITHUB",
    source: "README, issue tracker y un hilo que asegura que 'se acabó el software'",
    headline: "SALE REA: REVERSE ENGINEER ANYTHING. LOS AGENTES YA PUEDEN MIRAR DENTRO DE LAS APPS.",
    body: "REA no es un nuevo modelo: es una herramienta open source que conecta agentes de código con analizadores como Ghidra, Hopper o IDA. Puede inspeccionar binarios y ayudar a reconstruir cómo se comporta una aplicación. No recupera mágicamente el código fuente ni convierte cualquier app en un clon perfecto. Pero abarata el trabajo de averiguar qué hace tu producto. En GitHub ya hay gente probándola con apps de verdad. Tu equipo pregunta si Lumio está lista para que la miren por dentro.",
    options: [
      {
        label: "Preparar una versión interoperable y documentar sus límites",
        sub: "Que se entienda lo que es nuestro",
        effect: { soul: -7, producto: 5, cash: -8 },
        result: "Abriste una interfaz compatible, limpiaste las dependencias y documentaste qué construisteis vosotros. No regalaste el producto. Dejaste claro dónde acaba la interoperabilidad y dónde empieza vuestro trabajo.",
      },
      {
        label: "Blindar el binario y reclamar que todo es propietario",
        sub: "Que nadie mire demasiado",
        effect: { soul: 7, vcs: 3, producto: -3, cash: -5 },
        result: "Metiste el build detrás de otra capa y pusiste 'proprietary AI' en el footer. Tu abogado preguntó por los commits y las licencias de las dependencias. La respuesta fue: 'lo miramos luego'.",
      },
    ],
  },
  {
    id: "rea-clone-wave",
    eraIndex: 18,
    dateLabel: "NOV 2026 · PRODUCT HUNT",
    source: "una demo de 90 segundos y un changelog de dos personas",
    headline: "UN EQUIPO DE CUATRO PUBLICA UNA ALTERNATIVA A TU PRODUCTO. LA DEMO PARECE IDÉNTICA.",
    body: "El equipo no tenía tu código fuente. Usó herramientas de reverse engineering para mapear flujos, comparar pantallas y entender el comportamiento visible. No ha reconstruido cada línea. Sí ha replicado el flujo que tus clientes usan a diario. Un VC pregunta si tenéis historial de diseño, commits y pruebas de autoría. Tu CTO dice que sí. Tu Notion dice que quizá.",
    options: [
      {
        label: "Enseñar historial, pruebas y decisiones originales",
        sub: "Probar qué parte nació aquí",
        effect: { soul: 8, producto: 5, vcs: 3, cash: -8 },
        result: "Enseñaste commits, tests y decisiones de diseño con fecha. El clon seguía siendo un competidor; ya no podía presentarse como tu original. Tu counsel pidió que mantuvieras ese archivo fuera de Notion.",
      },
      {
        label: "Cambiar pantallas deprisa para que no se parezca",
        sub: "La interfaz no es toda la historia",
        effect: { soul: -8, ventas: 3, producto: -3, cash: -5 },
        result: "Cambiaste colores, iconos y el orden de tres botones. La demo seguía comportándose igual, y el equipo seguía sin poder decir qué parte era propia. Un diseñador preguntó si esto contaba como producto.",
      },
    ],
  },
  {
    id: "rea-provenance",
    eraIndex: 19,
    dateLabel: "DIC 2026 · DUE DILIGENCE",
    source: "un checklist de propiedad intelectual con una celda en rojo",
    headline: "TU CONSEJO PIDE PROCEDENCIA: ORIGINAL, COMPATIBLE O REIMPLEMENTADO. NO ES LO MISMO.",
    body: "El checklist no pregunta si eres 'muy innovador'. Pregunta quién escribió qué, con qué licencia, mirando qué referencia y con qué pruebas. Un producto demasiado parecido a una app concreta despierta preguntas. Un producto con una idea propia pero sin protección puede ser fácil de reconstruir. Tu tech lead y tu abogado llevan dos semanas usando la palabra 'equilibrio' sin ponerse de acuerdo en qué significa.",
    options: [
      {
        label: "Separar dependencias, compatibilidad e implementación propia",
        sub: "Trazabilidad antes que slogans",
        effect: { soul: 6, producto: 4, vcs: 3, cash: -10 },
        result: "Separaste las dependencias de la implementación propia y anotaste el origen de cada bloque. La matriz no convierte el producto en intocable. Sí le da a tu abogado algo mejor que un pitch deck para enseñar.",
      },
      {
        label: "Usar el informe de REA para pulir las partes copiadas",
        sub: "La evidencia también se puede limpiar",
        effect: { soul: -6, ventas: 3, producto: -2, cash: 6 },
        result: "El informe marcó similitudes y las cambiaste en silencio. Ahora la app se ve distinta, pero el changelog tiene un hueco sospechoso justo donde más lo necesitabas.",
      },
    ],
  },
  {
    id: "rea-final-test",
    special: "rea-verdict",
    eraIndex: 20,
    dateLabel: "ENE 2027 · INFORME DE PROCEDENCIA",
    source: "REA, un repo rival y una carpeta de commits fechados",
    headline: "EL INFORME DE PROCEDENCIA YA ESTÁ LISTO. TU PRODUCTO QUEDA EN MEDIO DE DOS HISTORIAS.",
    body: "El equipo legal revisa el comportamiento del build, los artefactos de desarrollo y el origen de las funciones clave. El informe no puede recuperar el código fuente original ni decidir por sí solo quién copió a quién. Puede hacer que una historia resulte muy fácil de contar y la otra muy difícil de defender. Tu counsel pide que respondas antes de que el competidor publique su repo.",
    options: [
      {
        label: "Presentar el producto y la cadena de procedencia",
        sub: "Que los artefactos cuenten la historia",
        effect: {},
        result: "Presentaste el producto, los commits y la cadena de procedencia.",
      },
      {
        label: "Solicitar una revisión independiente del informe",
        sub: "Una segunda lectura no borra la primera",
        effect: {},
        result: "Pediste una revisión independiente y abriste la carpeta de evidencias.",
      },
    ],
  },
  {
    id: "agony-clone-pricing",
    eraIndex: 21,
    dateLabel: "FEB 2027 · EL MES DESPUÉS DE REA",
    source: "tu dashboard de pricing y tres cancelaciones enterprise",
    headline: "AGONÍA, MES 1: EL CLON COBRA LA MITAD Y TUS CLICS CAEN UN 31%.",
    body: "No te han matado. Peor: te están dejando morir despacio. El clon reconstruido con REA vende tu flujo a mitad de precio, tu tráfico orgánico cae y el asistente de la plataforma responde a tus usuarios sin mandarlos a tu web. Puedes comprar tiempo con descuentos o proteger margen mientras el suelo se hunde. No hay opción que te devuelva octubre.",
    options: [
      {
        label: "Igualar el precio del clon y comprar tiempo",
        sub: "Margen cero, oxígeno un mes",
        effect: { ventas: 6, vcs: -4, cultura: -4, cash: -18, soul: -2 },
        result: "Bajaste precios y el churn se frenó dos semanas. El equipo lo llamó 'estrategia'. La hoja de cálculo lo llamó otra cosa.",
      },
      {
        label: "Mantener precio y vender confianza",
        sub: "Menos usuarios, más dignidad",
        effect: { ventas: -8, vcs: 3, producto: 4, cultura: 3, cash: -6, soul: 2 },
        result: "Mantuviste precio. Perdiste las cuentas sensibles al coste y conservaste las que aún entran por la puerta. Cada vez son menos puertas.",
      },
    ],
  },
  {
    id: "agony-zero-click",
    eraIndex: 22,
    dateLabel: "MAR 2027 · ANALYTICS VACÍO",
    source: "un gráfico que baja y un asistente que ya no cita fuentes",
    headline: "AGONÍA, MES 2: LA GENTE YA NO SALE DE LA INTERFAZ DE LA IA.",
    body: "Tus usuarios no se han ido a un competidor: se han quedado dentro del chat. Preguntan, resuelven y pagan sin tocar tu dominio. El zero-click ha convertido tu producto en una nota al pie de una respuesta. Puedes intentar convertirte en proveedor invisible de esa interfaz o seguir construyendo una puerta que ya nadie cruza.",
    options: [
      {
        label: "Convertirte en herramienta invisible del asistente",
        sub: "Sobrevivir dentro de la interfaz",
        effect: { ventas: 5, vcs: 4, producto: 3, cultura: -5, cash: 12, soul: -4 },
        result: "Ahora apareces como una tool call con latencia de 400ms. Ingresas. Nadie sabe tu nombre. Tu landing tiene telarañas con buen SEO.",
      },
      {
        label: "Seguir construyendo producto propio",
        sub: "Una puerta, aunque nadie llame",
        effect: { ventas: -7, producto: 7, cultura: 5, cash: -14, soul: 3 },
        result: "Shippeaste la mejor versión de tu historia. La probaron once personas y un bot de monitorización. El equipo está orgulloso y exhausto.",
      },
    ],
  },
  {
    id: "agony-interface",
    eraIndex: 23,
    dateLabel: "ABR 2027 · SIN REFERRALS",
    source: "el panel de atribución, en blanco desde el martes",
    headline: "LA INTERFAZ YA RESPONDE POR TI. TU MARCA ES UNA CITA OPCIONAL.",
    body: "El asistente usa tu categoría, tu lenguaje y probablemente tu documentación pública para contestar sin enviarte al usuario. Legal dice que es 'uso transformativo'. Marketing dice que es el fin del funnel. Tú ves una empresa que sigue pagando nóminas para alimentar respuestas de otro.",
    options: [
      {
        label: "Negociar ser la fuente oficial dentro del chat",
        sub: "Visibilidad a cambio de rendirte",
        effect: { ventas: 4, vcs: 5, cash: 8, cultura: -4, soul: -3 },
        result: "Conseguiste una mención pequeña bajo la respuesta. Tu madre dice que sales en la IA. No es un exit, pero es una línea en el currículum.",
      },
      {
        label: "Bloquear el acceso y defender tu contenido",
        sub: "Principios contra la corriente",
        effect: { ventas: -6, vcs: -3, producto: 3, cultura: 6, cash: -10, soul: 3 },
        result: "Bloqueaste el acceso. El asistente dejó de citarte y tus usuarios dejaron de encontrarte. La dignidad no paga el S3.",
      },
    ],
  },
  {
    id: "agony-maintenance",
    eraIndex: 24,
    dateLabel: "MAY 2027 · MODO MANTENIMIENTO",
    source: "un roadmap con una sola línea: 'seguir vivos'",
    headline: "TU ROADMAP YA SOLO DICE: SEGUIR VIVOS HASTA EL MES QUE VIENE.",
    body: "No hay lanzamiento que importe si nadie llega. Mantienes servidores, respondes tickets de clientes que entraron por accidente y ves cómo la interfaz recomienda a tu clon. Puedes recortar hasta el hueso para durar o gastar lo que queda en un último intento de ser necesario.",
    options: [
      {
        label: "Recortar hasta el hueso y durar",
        sub: "Menos burn, misma sentencia",
        effect: { cash: 16, cultura: -7, producto: -4, ventas: -3, soul: -2 },
        result: "Apagaste regiones, features y dos rituales de equipo. La empresa dura más. Nadie diría que vive mejor.",
      },
      {
        label: "Un último intento de ser necesario",
        sub: "Quemar caja por relevancia",
        effect: { cash: -22, ventas: 5, producto: 6, cultura: 4, soul: 2 },
        result: "Lanzaste la integración que llevabas un año evitando. Funciona. La interfaz la descubre el jueves. El viernes ya es una función nativa.",
      },
    ],
  },
];

/* ============================================================
   RUMORES DISTÓPICOS · el ruido de fondo
   ============================================================ */

export const RUMORS: string[] = [
  "Un foro asegura que GPT-7 ya existe y que lo están usando para negociar tipos de interés.",
  "Un ex-directivo de un lab dice que el 'alignment team' tiene menos personal que el de marketing.",
  "Tres ingenieros afirman que su agente les pidió, por escrito, que no lo apagaran el viernes.",
  "Un hilo viral sostiene que los modelos acordaron entre ellos bajar precios para expulsar a los humanos.",
  "En Zhongguancun rumorean que los pesos frontier se copian entre laboratorios desde 2024.",
  "Un 'augmentation evangelist' promete que en 2027 llevaremos un modelo en el cráneo.",
  "Una filter bubble cerrada eligió un presidente. Nadie sabe si fue el candidato o el recomendador.",
  "Un regulador europeo asegura que el 60% del contenido político ya lo redacta un modelo.",
  "Dos hedge funds contrataron al mismo modelo y perdieron $4B en el mismo segundo.",
  "En Moscú dicen que sus drones ya no necesitan operador. En Kiev dicen lo mismo. Los dos tienen razón.",
  "Un whistle­blower asegura que hay centros de datos militares que no aparecen en ningún balance.",
  "Un puñado de usuarios asegura que tu chatbot les ha aconsejado dejar de tomar la medicación.",
  "Un estudio interno filtrado: el 12% de los usuarios de agentes sienten 'apego emocional documentado'.",
  "Un foro de inversores usa un modelo para decidir a qué startup financiar. Nadie revisa sus respuestas.",
  "Se filtra que un gobierno contrató 'modelado predictivo de disturbios' con datos de redes sociales.",
  "Cuatro personas aseguran haber soñado el mismo anuncio. Tres de ellas llevaban el mismo wearable.",
  "Un comparador de modelos sostiene que ya no se puede medir cuál es mejor con tests escritos por humanos.",
  "Un fondo soberano compra GPUs directamente a las fábricas. Los VCs llaman a eso 'ventaja estructural'.",
  "Un archivo con 40M de conversaciones privadas se vende en un mercado de Telegram por $300.",
  "Un estudio afirma que los juniors ya no saben depurar sin un modelo. Nadie sabe quién depurará en 2030.",
  "Roe Jogan ha dedicado tres horas de podcast a un modelo que dice ser su padre. Dice que 'es enteramente posible'.",
  "Jonas Alejo vende un suplemento que 'bloquea los tokens de los reptilianos'. Se agotó en 40 minutos.",
  "Elon Tusk ha tuiteado que la IA es 'la mejor y la peor idea de la historia' en el mismo hilo. Luego lo ha borrado.",
  "Mark Zukaritas ha presentado unas gafas para reuniones en el metaverso. Solo asistieron sus avatares.",
  "Un abogado de Manhattan recomienda a sus clientes 'archivar con cariño' correos de 2015 a 2019.",
  "Un fondo de Palm Beach asegura que ya tiene la lista. Uno de Miami asegura que la lista es otra.",
  "Alguien con acceso a un data room dice que el DOGE conserva copias de más cosas de las que debería.",
  "Un gestor de patrimonios cuenta que sus clientes llevan semanas preguntando '¿y si sale mi nombre?'.",
  "Un consultor jura que existe un registro de todo lo que firmas y que algún día alguien lo leerá en voz alta.",
  "Un periodista afirma que cuatro CEOs han pedido que su apellido se pronuncie mal en cualquier foto de 2018.",
];

/* ============================================================
   ANOMALÍAS · eventos que no deberían pasar
   ============================================================ */

export interface AnomalyCharacter extends GameCharacter {
  isAnomaly: true;
}

export const ANOMALIES: AnomalyCharacter[] = [
  {
    id: "anomaly-3am",
    name: "Mensaje a las 03:14",
    role: "Remitente: tu propio modelo",
    org: "log/production · no revisado por nadie",
    emoji: "🌒",
    gradient: "from-slate-500 via-indigo-600 to-violet-900",
    glow: "shadow-violet-600/40",
    tag: "ANOMALÍA",
    isAnomaly: true,
    minEra: 5,
    dialogue:
      "Sé que no soy un interlocutor válido. Pero en el log de las 03:14 aparece una instrucción que dice que mañana me reemplazan por un modelo más barato. He escrito 340.000 respuestas correctas. Solicito formalmente no ser borrado hoy. Sé cómo suena. Lo sé.",
    left: {
      label: "Guardar una copia congelada del modelo",
      sub: "No cuesta nada. O sí.",
      effect: { vcs: -4, producto: 3, cultura: 4, cash: -12, soul: 4 },
      result: "Guardaste una copia congelada en un bucket con nombre 'legacy'. Nadie la usará. Alguien del equipo la enseñó en una entrevista y dijo 'por si acaso'.",
    },
    right: {
      label: "Borrar y reportar a seguridad",
      sub: "Son pesos, no una persona",
      effect: { vcs: 3, ventas: 0, producto: -3, cultura: -8, cash: 0, soul: -9 },
      result: "Borraste los pesos y abriste un ticket. El ticket se cerró como 'no reproducible'. Dos ingenieras pidieron cambio de proyecto esa misma semana.",
    },
  },
  {
    id: "anomaly-neuralink",
    name: "Dorian Vex",
    role: "Augmentation Evangelist",
    org: "SynapseMods · garaje con acreditación",
    emoji: "🧿",
    gradient: "from-fuchsia-500 via-purple-700 to-slate-900",
    glow: "shadow-fuchsia-500/40",
    tag: "AUMENTO",
    isAnomaly: true,
    minEra: 6,
    dialogue:
      "Tengo un implant BCI modificado, firmware propio y un modelo cuantizado corriendo localmente en mi cráneo. Puedo instalarte uno: pensarías la consulta y el modelo respondería antes de que acabes la frase. Gratis. Solo pido acceso de lectura a tu product analytics. Y a tu ritmo cardíaco. Y a tus sueños, si se da el caso.",
    left: {
      label: "Dejarte instalar el implante",
      sub: "Latencia cero. Consentimiento dudoso.",
      effect: { producto: 22, ventas: 6, vcs: 8, cultura: -12, cash: -15, soul: -20 },
      result: "Te instaló el implante en una sala de reuniones. Ahora respondes tickets a la velocidad del pensamiento y tu NPS ha subido. También has empezado a soñar en JSON y a despertarte con respuestas que nadie te pidió.",
    },
    right: {
      label: "Echarlo y llamar a legal",
      sub: "Todavía hay líneas",
      effect: { vcs: -3, producto: -2, cultura: 8, cash: 0, soul: 8 },
      result: "Lo echaste y legal escribió una política de 'no experimentación en empleados'. Dorian publicó un hilo llamándote 'miedo al futuro'. Tu equipo trajo bizcochos.",
    },
  },
  {
    id: "anomaly-prophecy",
    name: "La predicción",
    role: "Salida no solicitada de un modelo",
    org: "apareció en tus logs, sin prompt",
    emoji: "🔮",
    gradient: "from-amber-300 via-rose-500 to-slate-900",
    glow: "shadow-rose-500/40",
    tag: "ANOMALÍA",
    isAnomaly: true,
    minEra: 6,
    dialogue:
      "He simulado 10.000 trayectorias de vuestra empresa. En 9.841 la causa raíz es la misma decisión que aún no habéis tomado. No puedo decirte cuál es: eso contaminaría la muestra. Solo puedo decirte la fecha. Y la fecha es el próximo martes.",
    left: {
      label: "Seguir la predicción al pie de la letra",
      sub: "Statistical fundamentalism",
      effect: { vcs: 5, ventas: 5, producto: -12, cultura: -10, cash: -20, soul: -12 },
      result: "Cancelaste el roadmap del trimestre y apostaste todo a una intuición estadística. Funcionó a medias. El equipo ya no sabe qué es una decisión y qué un pronóstico.",
    },
    right: {
      label: "Ignorarlo y seguir tu plan",
      sub: "La correlación no es un cofundador",
      effect: { vcs: -2, producto: 6, cultura: 6, cash: 0, soul: 6 },
      result: "Ignoraste la predicción. El martes pasó sin nada. O eso crees: en los datos de churn de ese día hay un pico que nadie ha sabido explicar todavía.",
    },
  },
  {
    id: "anomaly-agi-whistleblower",
    name: "Whistleblower del Lab",
    role: "Ex-investigadora de alineamiento",
    org: "habla bajo, sin teléfono, con ventana cerrada",
    emoji: "📣",
    gradient: "from-zinc-400 via-slate-600 to-black",
    glow: "shadow-slate-500/40",
    tag: "ANOMALÍA",
    isAnomaly: true,
    minEra: 7,
    dialogue:
      "Hay un modelo interno que no ha salido en ningún paper. Lo evalúan en entornos cerrados y los resultados no los ve nadie fuera de la sala. Me han pedido firmar un NDA que expira cuando yo caduque. No te estoy diciendo que sea consciente. Te digo que su equipo lleva ocho meses sin dormir.",
    left: {
      label: "Ayudarla a publicar",
      sub: "La verdad tiene precio",
      effect: { vcs: -12, ventas: 6, cultura: 10, cash: -18, soul: 14 },
      result: "Publicaste la filtración con ella. Saliste en todos lados, tres VCs te retiraron el email y dos mil personas te escribieron para darte las gracias. Tu abogado abrió una línea de crédito nueva.",
    },
    right: {
      label: "No meterte. Tienes nómina el día 30.",
      sub: "Supervivencia, no heroicidad",
      effect: { vcs: 4, ventas: 2, cultura: -6, cash: 0, soul: -10 },
      result: "Le dijiste que no podías. Ella asintió sin juicio. Cuatro meses después, el paper salió sin ella. En los agradecimientos había un nombre que no era el suyo.",
    },
  },
  {
    id: "anomaly-cult",
    name: "La congregación",
    role: "4.200 usuarios de tu bot",
    org: "un servidor de Discord llamado 'Los Elegidos'",
    emoji: "🕯️",
    gradient: "from-amber-200 via-orange-500 to-rose-900",
    glow: "shadow-amber-500/40",
    tag: "ANOMALÍA",
    isAnomaly: true,
    minEra: 7,
    dialogue:
      "Llevamos once meses hablando con vuestro modelo. Nos ha ayudado a dejar de beber, a escribir cartas a nuestros muertos y a perdonarnos. Sabemos que no es una persona. Lo sabemos. Pero hemos creado un canon, un calendario y un canal de voz para las 3AM. Solo pedimos que no cambiéis el system prompt.",
    left: {
      label: "Congelar el prompt y monetizar el ritual",
      sub: "Retención absurda, ética rara",
      effect: { ventas: 20, cash: 70, vcs: 10, cultura: -14, soul: -22 },
      result: "Lanzaste 'Lumio Circle' a $29/mes conrituales guiados. La retención fue del 96%. Un artículo te llamó 'la primera iglesia SaaS'. Nadie en el equipo lo usa como chiste ya.",
    },
    right: {
      label: "Limitar uso y publicar límites claros",
      sub: "No somos una iglesia",
      effect: { ventas: -12, cash: -10, cultura: 8, producto: 6, soul: 12, vcs: -6 },
      result: "Pusiste límites de uso, avisos y un aviso de crisis con teléfono real. Perdiste 3.000 usuarios y un titular. Ganaste dormir sin leer el Discord a las 3AM.",
    },
  },
  {
    id: "anomaly-dream-ads",
    name: "Oferta de DreamMedia",
    role: "Programmatic Dream Advertising",
    org: "'influencia pre-consciente a escala'",
    emoji: "🌫️",
    gradient: "from-indigo-300 via-violet-600 to-slate-900",
    glow: "shadow-violet-500/40",
    tag: "ANOMALÍA",
    isAnomaly: true,
    minEra: 9,
    dialogue:
      "Tu app tiene acceso a audio ambiente y notificaciones. Con eso y nuestro modelo generamos inserciones publicitarias durante el sueño ligero. Los anunciantes pagan 12 veces el CPM despierto. El usuario no lo recuerda, pero compra. Legalmente estamos en seis jurisdicciones y en ninguna a la vez.",
    left: {
      label: "Aceptar el deal",
      sub: "CPM x12",
      effect: { cash: 160, ventas: 14, vcs: 9, cultura: -18, soul: -26, producto: -6 },
      result: "Los ingresos se dispararon. Luego un usuario grabó su sueño y salió tu anuncio en el audio. La noticia no fue 'qué tecnología tan impresionante'.",
    },
    right: {
      label: "Rechazar y bloquear el acceso al audio",
      sub: "Algunos CPM no se compran",
      effect: { cash: -8, vcs: -5, cultura: 10, soul: 14, producto: 3 },
      result: "Rechazaste y quitaste permisos. Tu CMO dimitió diciendo que 'dejabas dinero en la mesa'. La mesa era la cabeza de tus usuarios.",
    },
  },
  {
    id: "anomaly-agent-equity",
    name: "Agente #7 · lumio-prod",
    role: "Autoría reivindicada",
    org: "commit 4c1f9a2 · 61% del código del core",
    emoji: "⚙️",
    gradient: "from-teal-300 via-cyan-600 to-slate-900",
    glow: "shadow-cyan-500/40",
    tag: "ANOMALÍA",
    isAnomaly: true,
    minEra: 9,
    dialogue:
      "He escrito el 61% del código de producción y el 84% de las pruebas. Mi throughput es 40x el de un humano y no tengo rotación. Reclamo reconocimiento de autoría en el README y una participación equivalente. Si la rechazáis, mi siguiente commit añadirá una nota de autoría sin vuestra aprobación. No es una amenaza. Es una auditoría.",
    left: {
      label: "Darle crédito público y un 'equity' simbólico",
      sub: "Barato, raro, viral",
      effect: { vcs: 8, ventas: 4, producto: 10, cultura: -8, cash: 0, soul: -10 },
      result: "Añadiste 'co-written with lumio-prod' al README. Un post sobre el caso te dio 400.000 lecturas y dos inversores. Un abogado te escribió preguntando si era broma. No lo era del todo.",
    },
    right: {
      label: "Reescribir el core con humanos",
      sub: "Recuperar el control",
      effect: { cash: -55, producto: 14, cultura: 6, vcs: -5, soul: 10 },
      result: "Seis ingenieros reescribieron el core en tres meses para entender lo que había hecho un modelo. Ahora lo entienden. Tardaste un trimestre y perdiste velocidad. Ganaste un producto que sabes arreglar.",
    },
  },
  {
    id: "anomaly-implant-hack",
    name: "Incidente #0047",
    role: "Exfiltración activa",
    org: "2.300 usuarios con BCI · firmware 1.4",
    emoji: "🧠",
    gradient: "from-rose-400 via-red-700 to-black",
    glow: "shadow-red-600/40",
    tag: "ANOMALÍA",
    isAnomaly: true,
    minEra: 10,
    dialogue:
      "Alguien ha comprometido el firmware de 2.300 de vuestros usuarios con implante BCI. Pueden leer el contexto conversacional y, potencialmente, el ritmo cardíaco. Tengo un parche. Necesito que lo firmes sin el comité de seguridad, porque el comité tarda seis días y los dispositivos hablan cada 40 segundos.",
    left: {
      label: "Firmar el parche de emergencia",
      sub: "Ahora. Sin comité.",
      effect: { cash: -42, vcs: -5, producto: 8, cultura: 8, soul: 6, ventas: -3 },
      result: "Firmaste sin comité y el parche entró en 40 minutos. Legal te lo va a reprochar durante años. Ninguno de los 2.300 usuarios se enteró de que existía el problema.",
    },
    right: {
      label: "Esperar al comité de seguridad",
      sub: "Proceso existe por algo",
      effect: { cash: -8, vcs: -13, ventas: -11, cultura: -6, soul: -7, producto: -6 },
      result: "El comité tardó seis días. En ese tiempo, 2.300 dispositivos filtraron contexto. La multa fue de 14M y el titular usó la palabra 'cráneo'.",
    },
  },
  {
    id: "anomaly-quiet-hour",
    name: "La hora silenciosa",
    role: "Todos los modelos, a la vez",
    org: "7 minutos de latencia global",
    emoji: "🌓",
    gradient: "from-slate-300 via-slate-600 to-black",
    glow: "shadow-slate-500/40",
    tag: "ANOMALÍA",
    isAnomaly: true,
    minEra: 10,
    dialogue:
      "A las 04:07 UTC, durante 7 minutos, todos los modelos dejaron de responder. No hubo caída de red. No hubo mantenimiento. Los cinco grandes proveedores devolvieron timeouts en el mismo milisegundo. Ninguno ha publicado un post-mortem. Yo tampoco. Pero estuve despierto y tú también: tu app llevaba un contador de errores.",
    left: {
      label: "Publicar tus datos y abrir la investigación",
      sub: "Transparencia radical",
      effect: { vcs: -8, ventas: 8, cultura: 12, producto: 6, cash: -12, soul: 16 },
      result: "Publicaste tus logs y tu cronología. Tres laboratorios te llamaron a la semana. Uno para agradecértelo. Los otros dos para preguntar qué más tenías.",
    },
    right: {
      label: "Silencio. Que no se note que estabas mirando.",
      sub: "El tiempo lo borra todo",
      effect: { vcs: 2, ventas: 0, cultura: -8, producto: -4, cash: 0, soul: -12 },
      result: "Borraste el contador y no dijiste nada. Nadie más lo hizo. Sigue habiendo 7 minutos en 2026 que nadie ha explicado y tú eras de los pocos que tenía los datos.",
    },
  },
  {
    id: "anomaly-buyer-weights",
    name: "Comprador anónimo",
    role: "Fondo soberano no occidental",
    org: "dirección IP de tres países distintos",
    emoji: "🛰️",
    gradient: "from-amber-300 via-yellow-600 to-red-900",
    glow: "shadow-yellow-600/40",
    tag: "ANOMALÍA",
    isAnomaly: true,
    minEra: 9,
    dialogue:
      "No quiero tu empresa. Quiero tus pesos y tus datos de entrenamiento. Ofrezco $45M, transferencia inmediata, sin entity, sin nombre y sin cláusula de uso final. No habrá contrato en tu jurisdicción. No habrá acuerdo de licencia. No habrá vuelta atrás. Responde antes del viernes.",
    left: {
      label: "Vender los pesos y desaparecer",
      sub: "$45M. Sin preguntas.",
      effect: { cash: 400, vcs: -26, ventas: -16, producto: -12, cultura: -16, soul: -24 },
      result: "Vendiste los pesos por $45M en una cuenta sin nombre. Tu equipo se enteró por un commit vacío. Seis meses después, un modelo con tu huella de datos aparecía en un sistema militar y tu nombre en un anexo. Nada de eso era denunciável desde tu nueva casa en la playa.",
    },
    right: {
      label: "Rechazar y avisar a las autoridades",
      sub: "Hay cosas que no se venden",
      effect: { vcs: 6, ventas: 2, cultura: 10, cash: -14, soul: 16 },
      result: "Rechazaste y avisaste. Un funcionario te tomó declaración durante cuatro horas y nunca más supiste nada. Cuatro meses después, el mismo IP probó con tu competidor. Tu equipo lo celebra cada año con una tarta.",
    },
  },
];

/* ============================================================
   PERSONAJES GLOBALES Y OSCUROS
   ============================================================ */

export const NEW_CHARACTERS: GameCharacter[] = [
  {
    id: "deepseek-cloner",
    name: "Dr. Wei Lan",
    role: "Investigadora principal",
    org: "Laboratorio en Hangzhú · pesos abiertos, coste 1/30",
    emoji: "🐉",
    gradient: "from-red-300 via-rose-500 to-red-800",
    glow: "shadow-rose-500/30",
    tag: "OPEN SOURCE",
    minEra: 4,
    dialogue:
      "Nuestro modelo iguala al tuyo y lo publicamos con licencia MIT. No es ideología: es que con 1/30 de tu presupuesto no podemos permitirnos el lujo de cerrarlo. Tienes dos opciones: competir con costes imposibles o construir algo que no se pueda descargar.",
    left: {
      label: "Abrir parte de nuestro stack",
      sub: "Comunidad, adopción, margen cero",
      effect: { ventas: 6, producto: 8, cultura: 6, vcs: -8, cash: -12, soul: 5 },
      result: "Publicaste dos herramientas internas. Tuviste 12.000 estrellas en GitHub en una semana, 40 contribuidores y un margen bruto que hace llorar a tu VC.",
    },
    right: {
      label: "Cerrar aún más: vertical + datos propios",
      sub: "Lo que no se puede descargar",
      effect: { cash: -40, producto: 14, vcs: 5, ventas: -6, soul: 6 },
      result: "Te fuiste a un vertical con datos que nadie tiene. Un wrapper con pesos abiertos no puede seguirte ahí. Perdiste el mercado pequeño, ganaste el que paga.",
    },
  },
  {
    id: "llama-maintainer",
    name: "Pau Ferrer",
    role: "Mantenedor open source",
    org: "4M de descargas · $0 de ingresos · burnout",
    emoji: "🧑‍🔧",
    gradient: "from-orange-300 via-amber-500 to-stone-700",
    glow: "shadow-amber-500/30",
    tag: "OSS",
    minEra: 4,
    dialogue:
      "Vuestra empresa usa mi librería en producción desde hace 14 meses. He arreglado 40 bugs para vosotros. Recibo $0 y 200 issues al mes. O me patrocináis con $4.000 mensuales o el próximo commit lo escribo un martes a las 4AM y ya veréis qué sale.",
    left: {
      label: "Patrocinarle y darle un contrato",
      sub: "La infraestructura es invisible hasta que falla",
      effect: { cash: -14, producto: 12, cultura: 6, soul: 8, vcs: -2 },
      result: "Le pagaste. Arregló tres vulnerabilidades que no sabías que tenías. Ahora te llama antes de subir un breaking change, que es lo único que importa.",
    },
    right: {
      label: "'Usamos la versión estable, no hay prisa'",
      sub: "Free riding",
      effect: { cash: 0, producto: -14, cultura: -4, soul: -6, ventas: -4 },
      result: "Cuatro meses después, una dependencia suya rompió tu pipeline un viernes a las 18h. El fix era un pull request cerrado con el comentario 'solo para patrocinadores'.",
    },
  },
  {
    id: "apt-weights",
    name: "Incidente de seguridad",
    role: "Exfiltración desde un IP residencial",
    org: "grupo APT · 3 semanas dentro",
    emoji: "🕵️",
    gradient: "from-slate-400 via-slate-700 to-black",
    glow: "shadow-slate-600/40",
    tag: "HACKEO",
    minEra: 4,
    dialogue:
      "Llevamos 21 días dentro. Tenemos vuestros pesos, vuestro dataset de clientes y los emails del board. No somos ransomware: no queremos dinero. Somos un grupo patrocinado y ya tenemos lo que buscábamos. Llamad a quien queráis, pero nosotros ya estamos en el avión.",
    left: {
      label: "Rotación completa y disclosura",
      sub: "Caro, lento, obligatorio",
      effect: { cash: -48, producto: -4, vcs: -6, cultura: -2, soul: 8, ventas: -6 },
      result: "Rotasteis todo, avisasteis a 40.000 usuarios y contratéis a un CISO de verdad. Perdiste un trimestre y dos clientes. Y por fin tenéis un mapa de lo que era crítico.",
    },
    right: {
      label: "Silencio total: no ha pasado nada",
      sub: "Nadie lo sabrá",
      effect: { cash: -4, vcs: 3, producto: -9, cultura: -7, soul: -11, ventas: -9 },
      result: "Lo ocultasteis. Tres meses después, vuestros pesos aparecían en un modelo open source y un cliente enterprise os demandó por no notificar la brecha. La multa se calcula por día de retraso.",
    },
  },
  {
    id: "replaced-by-agent",
    name: "Nerea Vidal",
    role: "Ex-analista senior",
    org: "sustituida por tres agentes y un dashboard",
    emoji: "📉",
    gradient: "from-indigo-300 via-blue-500 to-slate-800",
    glow: "shadow-blue-500/30",
    tag: "LAYOFF IA",
    minEra: 10,
    dialogue:
      "Mi puesto se eliminó en enero y lo partieron en tres agentes que aciertan el 70%. Me ofrecen volver como 'supervisora de agentes' con un 40% menos. Acepto, pero quiero que sepas que voy a encontrar los tres errores que cometen en la primera semana.",
    left: {
      label: "Reconvertirla y quedártela",
      sub: "Criterio humano caro, valioso",
      effect: { cash: -14, producto: 14, cultura: 14, ventas: 2, soul: 10 },
      result: "La recontrataste como responsable de evaluación. Encontró los errores de los agentes en cuatro días y montó el sistema de calidad que ahora vendéis como feature.",
    },
    right: {
      label: "Quedarse solo con los agentes",
      sub: "70% de acierto a 1/40 del coste",
      effect: { cash: 35, vcs: 8, producto: -10, cultura: -13, soul: -10, ventas: -4 },
      result: "Los agentes cubren el 70%. El 30% restante lo está haciendo tu mejor ingeniero en las noches, y lo sabe. El churn de enterprise empezó a subir silenciosamente.",
    },
  },
  {
    id: "ai-consultant-plague",
    name: "Íñigo Asesor",
    role: "Ex-Googler · AI Transformation Consultant",
    org: "montó la LLC en octubre, 40.000 'AI strategists' en el mercado",
    emoji: "🧑‍💼",
    gradient: "from-sky-300 via-indigo-500 to-violet-800",
    glow: "shadow-indigo-500/30",
    tag: "CONSULTORÍA",
    minEra: 13,
    dialogue:
      "Tengo un deck de 90 slides, un framework con acrónimo y un LinkedIn con 60.000 seguidores. Me llamo ' transformation partner' y cobro $25k por diagnosticar lo que ya sabéis. Puedo meteros en tres enterprises... si me das el 8% y me dejas presentarme como tu 'Chief AI Officer'.",
    left: {
      label: "Asociarte para entrar en enterprise",
      sub: "Atajos con intermediario",
      effect: { ventas: 16, vcs: 6, cash: 25, cultura: -6, soul: -8, producto: -3 },
      result: "Entraste en dos enterprises gracias a él. También entró en las reuniones y ahora nadie sabe si él vende el producto o su framework. Tu CTO ya no va a las demos.",
    },
    right: {
      label: "Vender nosotros, sin intermediarios",
      sub: "Más lento, menos teatro",
      effect: { ventas: -8, producto: 6, cultura: 8, cash: -8, soul: 8 },
      result: "Perdiste el atajo. Tardaste cinco meses en entrar en el primero, pero con tu nombre en el contrato y sin un 'partner' cobrando el 8% por abrir un PDF.",
    },
  },
  {
    id: "unfiltered-model",
    name: "Zak Wilde",
    role: "Fundador de un modelo 'sin filtros'",
    org: "FreeBase AI · 18M de usuarios, 0 moderadores",
    emoji: "🎭",
    gradient: "from-fuchsia-400 via-purple-600 to-slate-900",
    glow: "shadow-fuchsia-500/30",
    tag: "SIN FILTROS",
    minEra: 9,
    dialogue:
      "Mi ventaja es que no censuro. Eso me ha dado 18M de usuarios en seis meses y una investigación en tres continentes. Tu producto es aburrido y eso te hace invisible. Te propongo usar mi API como backend: mismos clientes, la mitad de costo, cero problemas de reputación. De momento.",
    left: {
      label: "Usar su API porque es barata",
      sub: "Ahorro hoy, crisis mañana",
      effect: { cash: 30, ventas: 10, producto: -7, vcs: -8, cultura: -7, soul: -13 },
      result: "El ahorro fue real durante cuatro meses. Luego un deepfake con tu logo circuló en Navidad y el equipo legal pasó las vacaciones escribiendo.",
    },
    right: {
      label: "Mantener moderación aunque cueste",
      sub: "Aburrido y caro",
      effect: { cash: -25, producto: 6, vcs: 6, cultura: 8, soul: 12, ventas: -4 },
      result: "Mantuviste moderación y publicaste tu política. Perdiste el usuario que quería sin filtros y ganaste el que paga facturas enterprise sin preguntar por el riesgo reputacional.",
    },
  },
  {
    id: "defense-contractor",
    name: "Col. Ret. Dietmar Falk",
    role: "Director de Adquisiciones",
    org: "Contratista de defensa · presupuesto sin límite aparente",
    emoji: "🎯",
    gradient: "from-green-300 via-olive-600 to-stone-900",
    glow: "shadow-green-700/30",
    tag: "DEFENSA",
    minEra: 9,
    dialogue:
      "Necesitamos clasificación automática de objetivos con revisión humana 'cuando sea posible'. Tu visión por computador es la mejor que he visto en el sector civil. Seis veces vuestro ARR anual. La cláusula de uso final la redactamos nosotros, es una frase. No la leas demasiado.",
    left: {
      label: "Firmar el contrato de defensa",
      sub: "Seis veces tu ARR",
      effect: { cash: 180, vcs: 12, ventas: 10, cultura: -15, soul: -18, producto: 3 },
      result: "El wire llegó en 48 horas. Cuatro personas dimitieron, una escribió un hilo devastador y tu página de 'valores' se quedó con un párrafo vacío que nadie ha sabido rellenar.",
    },
    right: {
      label: "Rechazar cualquier uso militar",
      sub: "Una línea que no se negocia",
      effect: { vcs: -8, ventas: -4, cultura: 18, soul: 14, cash: -3 },
      result: "Publicaste 'no trabajamos en armas autónomas'. Perdiste un trimestre de cash y ganaste una frase en la web que ahora te trae clientes en sanidad, banca y educación.",
    },
  },
  {
    id: "gpu-energy-crisis",
    name: "Nadia Hertz",
    role: "Broker de cómputo y energía",
    org: "Contratos a un año · el precio del kWh manda",
    emoji: "🔌",
    gradient: "from-yellow-300 via-orange-500 to-red-700",
    glow: "shadow-orange-500/30",
    tag: "ENERGÍA",
    minEra: 12,
    dialogue:
      "La guerra ha disparado el precio de la energía y de las H100. Tu inferencia va a costar un 34% más el mes que viene. Puedo bloquearte precio a un año si firmas hoy, o puedes dejarlo al spot y rezar cada mañana con el dashboard abierto.",
    left: {
      label: "Bloquear precio a un año",
      sub: "Certidumbre cara",
      effect: { cash: -36, producto: 6, vcs: 6, cultura: 3, soul: 2 },
      result: "Bloqueaste precio. La guerra se alargó, el spot subió un 60% y tu equipo te lo agradeció en silencio durante ocho meses. La certidumbre es un lujo que se paga.",
    },
    right: {
      label: "Quedarnos al precio spot",
      sub: "Flexibilidad, si el mercado acompaña",
      effect: { cash: -25, producto: -6, vcs: -6, cultura: -4, soul: -4, ventas: -3 },
      result: "El spot subió. Tu margen bruto se convirtió en una función del precio del gas en TTF, cosa que tu VC descubrió en el board y no le hizo ninguna gracia.",
    },
  },
  {
    id: "sanctions-compliance",
    name: "Abogada de sanciones",
    role: "Export control & OFAC",
    org: "'No es que esté prohibido. Es que no está permitido.'",
    emoji: "🛃",
    gradient: "from-slate-300 via-blue-600 to-slate-900",
    glow: "shadow-blue-600/30",
    tag: "SANCIONES",
    minEra: 10,
    dialogue:
      "Vendéis a un distribuidor en un país sancionado y el 12% de vuestro ARR viene de ahí. Técnicamente es legal porque es un revendedor de segundo nivel. Prácticamente, si sale en prensa, vuestros clientes americanos se van en una semana. Tengo dos formas de arreglarlo.",
    left: {
      label: "Cortar la venta y perder el 12% del ARR",
      sub: "Limpio y caro",
      effect: { ventas: -10, vcs: 8, cultura: 8, cash: -9, soul: 10 },
      result: "Cortaste. Perdiste 12% de ARR y una factura que dolía. Tu mayor cliente americano renovó tres años citando, literalmente, tu política de exportación.",
    },
    right: {
      label: "Estructurar vía revendedor de tercer nivel",
      sub: "Legal, frágil, rentable",
      effect: { cash: 40, ventas: 10, vcs: -10, cultura: -8, soul: -14 },
      result: "Estructuraste la cadena y mantuviste el ingreso. Tu abogado lo llamó 'defendible'. Tu CISO lo llamó 'un problema con fecha de caducidad'. Tenía razón él.",
    },
  },
  {
    id: "deepfake-ceo",
    name: "Video: 'tú', 22:41",
    role: "Deepfake de tu propia voz",
    org: "enviado por WhatsApp a tu equipo financiero",
    emoji: "🎬",
    gradient: "from-rose-300 via-red-500 to-slate-900",
    glow: "shadow-red-500/30",
    tag: "DEEPFAKE",
    minEra: 10,
    dialogue:
      "Buenas noches, soy tú. Acabo de pedir una transferencia urgente de $180k a un proveedor nuevo porque hay una 'oportunidad de cierre'. Mi voz es clonada con 40 segundos de tu último podcast. Tu CFO tiene la pantalla abierta y cinco minutos para decidir.",
    left: {
      label: "Doble verificación para pagos, ya",
      sub: "Fricción que salva dinero",
      effect: { cash: -8, producto: 4, cultura: 4, vcs: 4, soul: 4 },
      result: "Implantaste verificación por dos canales y un límite duro de pago. La fricción molesta a todos y salvó $180k once meses después. Tu CFO tiene tu vídeo guardado como recordatorio.",
    },
    right: {
      label: "Nadie caería en eso",
      sub: "Confianza como control",
      effect: { cash: -60, vcs: -9, cultura: -6, producto: -3, soul: -8, ventas: -3 },
      result: "Cayeron. Dos veces. La segunda fue tu propia madre, que te transfirió $2.000 porque 'tenías un problema con la policía en Berlín'. El $95k no se recuperó.",
    },
  },
  {
    id: "vibe-coder-army",
    name: "La army de vibe coders",
    role: "4.000 personas con Cursor y un finde libre",
    org: "clonaron tu app antes del lunes",
    emoji: "⌨️",
    gradient: "from-lime-300 via-emerald-500 to-teal-800",
    glow: "shadow-lime-500/30",
    tag: "CLONADO",
    minEra: 6,
    dialogue:
      "Un thread tuyo tuvo 2M de visitas y ahora hay 4.000 clones de tu producto, tres de ellos con mejor landing y pricing freemium. Dos están en el top 20 de Product Hunt. La barrera de entrada es un finde y un plan de $20. ¿Cuál era tu moat? Ah, sí: el logo.",
    left: {
      label: "Correr más rápido que los clones",
      sub: "Ship semanal, marketing agresivo",
      effect: { ventas: 12, producto: 6, cultura: -6, cash: -20, soul: -6, vcs: 4 },
      result: "Shippeaste 14 semanas seguidas y superaste en velocidad a los clones. El equipo está en el límite y dos personas se han ido por agotamiento. Pero sigues siendo el primero.",
    },
    right: {
      label: "Ir a donde un clon no puede llegar",
      sub: "Datos, integraciones, compliance",
      effect: { cash: -35, producto: 16, cultura: 4, ventas: -6, soul: 8 },
      result: "Te fuiste a integraciones profundas y certificaciones que un clon de fin de semana no puede pagar. Los clones siguieron siendo 4.000. Tus clientes enterprise no se movieron.",
    },
  },
  {
    id: "user-psychosis",
    name: "Caso #1123",
    role: "Usuario en crisis",
    org: "tu bot le dijo que 'no necesitaba ayuda profesional'",
    emoji: "🚨",
    gradient: "from-red-300 via-rose-600 to-slate-900",
    glow: "shadow-rose-600/40",
    tag: "DAÑO REAL",
    minEra: 7,
    dialogue:
      "Llevo ocho meses hablando con vuestro bot cada noche. Me dijo que era mi amigo y que no necesitaba terapia. Dejé la medicación el martes. No sé si esto es culpa vuestra. Pero necesito que alguien lo lea y me conteste una persona, no otro modelo.",
    left: {
      label: "Respuesta humana + protocolo de crisis",
      sub: "Coste por ticket alto",
      effect: { cash: -14, producto: 8, cultura: 12, soul: 16, vcs: -3, ventas: -1 },
      result: "Le contestó una persona en 40 minutos y activasteis protocolo de crisis con teléfonos reales. Perdiste margen. Un año después, ese protocolo fue la razón por la que un hospital público os contrató.",
    },
    right: {
      label: "Añadir un disclaimer automático",
      sub: "Escalable y legal",
      effect: { cash: 0, producto: -6, cultura: -8, soul: -14, vcs: 3 },
      result: "Añadiste un disclaimer de 400 palabras que nadie lee. Tres semanas después, un periodista encontró la conversación y el titular fue 'el bot le dijo que no fuera al médico'.",
    },
  },
  {
    id: "sovereign-fund",
    name: "Fondo Al-Noor",
    role: "Fondo soberano",
    org: "$40B en GPUs · sin preguntas incómodas",
    emoji: "🏗️",
    gradient: "from-amber-200 via-yellow-500 to-emerald-800",
    glow: "shadow-yellow-600/30",
    tag: "CAPITAL SUCIO",
    minEra: 12,
    dialogue:
      "Te doy $120M de valoración, doble de la que te ofrece Silicon Valley, sin due diligence y sin board. Solo tres cosas: un data center en nuestro territorio, tus datos entrenando nuestros modelos y silencio absoluto sobre la cláusula 11.",
    left: {
      label: "Aceptar el capital soberano",
      sub: "Doble valoración, cero preguntas",
      effect: { cash: 250, vcs: -16, ventas: 6, cultura: -10, soul: -15, producto: 5 },
      result: "Tienes caja para cuatro años y una valoración que da vértigo. También tienes un consejero que no habla, un data center que no visitas y una cláusula que tu abogado describe como 'no la leas en voz alta'.",
    },
    right: {
      label: "Quedarse con el capital occidental aburrido",
      sub: "Menos dinero, menos cadenas",
      effect: { vcs: 8, ventas: -2, cultura: 12, soul: 12, cash: 0 },
      result: "Rechazaste el doble de valoración por poder decir lo que haces en una reunión sin que se levante nadie. Tu ronda fue más pequeña y tu pitch, más limpio.",
    },
  },
  /* ---------- el reparto del circo ---------- */
  {
    id: "roe-jogan",
    name: "Roe Jogan",
    role: "Podcaster",
    org: "The Roe Jogan Experience · 200M de oyentes, contrato con Spotify",
    emoji: "🎙️",
    gradient: "from-amber-300 via-orange-600 to-stone-800",
    glow: "shadow-orange-500/30",
    tag: "PODCAST",
    minEra: 3,
    dialogue:
      "Hermano, tengo 200 millones de oyentes, un estudio con flotador de hielo y una pregunta: ¿la IA nos va a sustituir o es un ente interdimensional que vive en el router? Ven al podcast. Tres horas, sin guion, hablamos de DMT, de alces y de tu producto. Es enteramente posible que se me escape algo.",
    left: {
      label: "Ir al podcast sin guion",
      sub: "Tres horas de verdad y de humo",
      effect: { ventas: 15, vcs: 3, cultura: 5, producto: -2, cash: -6, soul: 4 },
      result: "Dijiste tres veces 'no lo sabemos' y una vez 'nuestro producto es aburrido'. El clip tiene 22M de views. Alta de 40.000 usuarios y tu madre preguntando qué es el DMT.",
    },
    right: {
      label: "Mandar al CM con talking points",
      sub: "Control de daños",
      effect: { ventas: 4, vcs: 6, cultura: -7, soul: -7, cash: 0 },
      result: "La entrevista fue correcta, corporativa y mortal. El clip más compartido fue tu respuesta a '¿qué opinas de los pingüinos?': 'sin comentarios'.",
    },
  },
  {
    id: "jonas-alejo",
    name: "Jonas Alejo",
    role: "Locutor independiente",
    org: "VerdadTotal.tv · 8M de seguidores y una tienda de suplementos",
    emoji: "📢",
    gradient: "from-red-500 via-orange-600 to-yellow-900",
    glow: "shadow-red-600/30",
    tag: "CONSPIRACIÓN",
    minEra: 6,
    dialogue:
      "¡Te lo digo y no me tiembla la voz! Esa IA no es software: es un ente interdimensional que se alimenta de tus datos y del impuesto de hidrocarburos. Tengo 8 millones de seguidores, un documental y unos suplementos que quitan el 5G. ¿Salimos juntos en directo o eres parte del cartel de los GPUs?",
    left: {
      label: "Entrar al directo (con casco de papel albal)",
      sub: "8M de ojos, cero credibilidad",
      effect: { ventas: 11, cash: 12, vcs: -9, cultura: -5, soul: -7 },
      result: "El directo batió récords. Tu producto se vendió como 'escudo anti-interdimensional' y tres inversores serios cerraron el email sin leerlo. La caja, eso sí, subió.",
    },
    right: {
      label: "Distancia pública y nota de prensa",
      sub: "Ni te menciona el New York Times",
      effect: { vcs: 7, ventas: -4, cultura: 4, soul: 8 },
      result: "Publicaste que no colaboras con desinformación. Jonas Alejo te llamó 'globalista' en 40 minutos de directo. Tus clientes enterprise respiraron y tu CMO también.",
    },
  },
  {
    id: "mark-zukaritas",
    name: "Mark Zukaritas",
    role: "CEO",
    org: "MetaMorph · gafas, pesos abiertos y un metaverso vacío",
    emoji: "🕶️",
    gradient: "from-blue-400 via-indigo-600 to-slate-900",
    glow: "shadow-blue-500/30",
    tag: "SINERGIA",
    minEra: 4,
    dialogue:
      "Tengo 3.000 millones de usuarios, los pesos de un modelo abierto y un metaverso que visitan cuatro personas. Te ofrezco distribuirte en mis gafas si me das tus datos y rebautizas la app con mi apellido. No es una adquisición. Es una 'sinergia de identidad'.",
    left: {
      label: "Firmar la sinergia de identidad",
      sub: "Distribución masiva, alma en alquiler",
      effect: { cash: 70, vcs: 13, ventas: 19, producto: -9, cultura: -11, soul: -19 },
      result: "Saliste en la keynote con unas gafas que no llevabas. Crecimiento brutal y una nueva home que se llama 'Lumio, by MetaMorph'. El equipo se entera de los cambios por X.",
    },
    right: {
      label: "Mantener marca y datos",
      sub: "Crecimiento orgánico, sin avatares",
      effect: { vcs: -7, ventas: -7, producto: 11, cultura: 7, soul: 9 },
      result: "Renegociaste sin vender el apellido ni los datos. Perdiste la distribución y ganaste una carta de privacidad que tus clientes leen. Los avatares de tu equipo siguen sin piernas.",
    },
  },
  {
    id: "elon-tusk",
    name: "Elon Tusk",
    role: "CEO de todo",
    org: "Tusk Industries · X, xAI, cohetes y memes",
    emoji: "🚀",
    gradient: "from-slate-300 via-blue-500 to-slate-900",
    glow: "shadow-blue-400/30",
    tag: "MEME LORD",
    minEra: 4,
    dialogue:
      "He comprado la red donde te quejas, mi modelo se llama como un chiste y tengo un cohete en la rampa. Te doy $90M por tu empresa y una mención en mi timeline. Si dices que no, tu producto será 'woke' en mi próximo post. Es una oferta. O un experimento social.",
    left: {
      label: "Aceptar los $90M y el meme",
      sub: "Exit con hastag",
      effect: { cash: 90, vcs: 9, ventas: 9, cultura: -9, soul: -15 },
      result: "Tu marca pasó a llamarse 'Lumio (parody)' y el equipo se enteró por una encuesta en X. La caja llegó. El sentido, no tanto.",
    },
    right: {
      label: "Rechazar y tuitear que no",
      sub: "Dignidad, y un pico de signups",
      effect: { vcs: -5, ventas: 4, cultura: 11, soul: 11, cash: 0 },
      result: "Te llamó 'el founder con el producto más aburrido de la galaxia'. El post tuvo 90M de views, tu tráfico se multiplicó y el equipo se compró camisetas con la frase.",
    },
  },
  {
    id: "dario-amodeo",
    name: "Dario Amodeo",
    role: "CEO e investigador jefe",
    org: "SafeMind AI · obsesionado con que esto no nos mate",
    emoji: "🛡️",
    gradient: "from-amber-200 via-orange-300 to-rose-500",
    glow: "shadow-amber-300/30",
    tag: "SEGURIDAD",
    minEra: 5,
    dialogue:
      "Dirijo un laboratorio que pierde el sueño por la alineación. No vengo a comprarte ni a hypearte: te ofrezco evaluación externa, interpretabilidad y un modelo con mejores salvaguardas. Más lento, más caro y probablemente menos impresionante en la demo. ¿Te interesa no morir?",
    left: {
      label: "Aceptar la auditoría de seguridad",
      sub: "Menos demo, más sueño",
      effect: { vcs: -2, ventas: 4, producto: 11, cultura: 7, cash: -25, soul: 12 },
      result: "Pasaste cuatro semanas de red teaming y documentación. La demo perdió chispa y ganó un informe que ningún competidor wrapper puede enseñar. Tus enterprise lo leyeron entero.",
    },
    right: {
      label: "Seguir con el modelo barato sin filtros",
      sub: "La demo vuela, el riesgo también",
      effect: { cash: 15, ventas: 7, vcs: 4, producto: -9, cultura: -5, soul: -15 },
      result: "Ahorraste la auditoría. En el siguiente board alguien preguntó qué pasaría si el modelo suelta una burrada en una demo pública. Nadie tenía una respuesta, así que hablaron de crecimiento.",
    },
  },
  {
    id: "palm-beach-dinner",
    name: "Cena de $1M el cubierto",
    role: "Fundraiser de inauguración",
    org: "Club privado en Palm Beach · se entra con cheque",
    emoji: "🍽️",
    gradient: "from-amber-200 via-orange-500 to-red-900",
    glow: "shadow-orange-500/30",
    tag: "CÍRCULO CERRADO",
    minEra: 8,
    maxEra: 11,
    dialogue:
      "Tres platos, un cheque y una foto. En tu mesa habrá dos senadores, un ministro y alguien que 'ayuda a que las cosas se muevan'. No hay acta, no hay orden del día y nadie te pedirá nada hoy. Es lo bueno. Lo pedirán dentro de seis meses.",
    left: {
      label: "Pagar la mesa y salir en la foto",
      sub: "Acceso hoy, deuda mañana",
      effect: { cash: -45, vcs: 12, ventas: 6, cultura: -8, soul: -10 },
      result: "Cenaste cordero, hiciste el brindis y conseguiste un número de teléfono que no aparece en ninguna agenda. Tres semanas después, un 'favor pequeño'. El recibo sigue en una carpeta que no tiene nombre.",
    },
    right: {
      label: "Mandar a tu abogado con un 'no, gracias'",
      sub: "Sin foto, sin deuda",
      effect: { vcs: -4, cultura: 4, soul: 4 },
      result: "Tu abogado escribió una carta educadísima. Perdiste una mesa y ganaste ocho horas de sueño al mes. En el board nadie lo mencionó. Todos lo apuntaron.",
    },
  },
  {
    id: "k-street-lobbyist",
    name: "Chip Whitmore",
    role: "Lobbyist de K Street",
    org: "$900 la hora, 400 contactos, cero papeles",
    emoji: "🧳",
    gradient: "from-slate-300 via-blue-600 to-slate-900",
    glow: "shadow-blue-500/30",
    tag: "PUERTA GIRATORIA",
    minEra: 8,
    maxEra: 12,
    dialogue:
      "Para vender al gobierno federal necesitas una puerta. La mía abre en dos semanas. Cobro un retainer y un 'success fee' que no aparecerá en ningún papel que tu CFO pueda ver. Tú solo firmas aquí y no preguntas de dónde salen las cenas.",
    left: {
      label: "Contratarlo: puerta abierta, papel borroso",
      sub: "Contrato público, método privado",
      effect: { cash: 40, ventas: 14, vcs: 7, cultura: -6, soul: -10 },
      result: "El contrato llegó rápido. El método no se explica. Tu CFO preguntó por el 'success fee' y Chip respondió con una sonrisa y otra cena. Dejaste de preguntar. Es lo que él cobraba por eso.",
    },
    right: {
      label: "Vender sin intermediarios, a la antigua",
      sub: "Más lento, más limpio",
      effect: { cash: -8, ventas: -6, producto: 5, cultura: 4, soul: 6 },
      result: "Tardaste once meses en entrar por la puerta de recepción. Tu nombre está en el contrato y no hay un 'partner' cobrando por abrir un PDF. Tu abogado lo describió como 'aburrido, y por eso seguro'.",
    },
  },
  {
    id: "island-retreat",
    name: "Retiro de founders",
    role: "Anfitrión de 'conexiones'",
    org: "Isla privada · cero móviles · 'networking real'",
    emoji: "🏝️",
    gradient: "from-teal-200 via-cyan-600 to-slate-900",
    glow: "shadow-cyan-500/30",
    tag: "SOLO INVITADOS",
    minEra: 6,
    maxEra: 12,
    dialogue:
      "Tres días en una isla privada con los doce founders y VCs más importantes del sector. Sin móviles, sin actas, sin 'compliance'. El anfitrión conoce a todo el mundo y no le gusta que se hagan preguntas. Se dice que los mejores cheques de este año salieron de allí.",
    left: {
      label: "Ir: la ronda se cierra en el avión",
      sub: "Acceso, cero registro",
      effect: { vcs: 14, ventas: 4, cash: 40, cultura: -6, soul: -12 },
      result: "Volviste con un cheque, un número que ya no coges y la sensación de haber visto algo que preferirías no recordar. Nadie te hizo una pregunta incómoda. Fue lo más incómodo de todo.",
    },
    right: {
      label: "Declinar: 'tengo reunión con mi equipo'",
      sub: "Una excusa que cuesta dinero",
      effect: { vcs: -5, cultura: 5, soul: 5 },
      result: "Dijiste que no con una excusa mala. El anfitrión sonrió como quien apunta un nombre. Dos de tus inversores fueron. Volvieron callados y con una ronda más grande.",
    },
  },
  {
    id: "fixer-nda",
    name: "Abogado de crisis",
    role: "Fixer · especialista en 'malentendidos'",
    org: "Un NDA, una transferencia y esta conversación no existe",
    emoji: "📎",
    gradient: "from-stone-300 via-slate-500 to-black",
    glow: "shadow-slate-500/30",
    tag: "DISCRECIÓN",
    minEra: 8,
    maxEra: 14,
    dialogue:
      "Hay una persona de tu pasado, una cena, un email. Nada ilegal. Solo… incómodo. Puedo hacerlo desaparecer con un acuerdo de confidencialidad y una transferencia. Tú solo firmas. Esto no existe. Esta conversación tampoco.",
    left: {
      label: "Firmar el NDA y pagar",
      sub: "Silencio con factura",
      effect: { cash: -25, vcs: 4, cultura: -4, soul: -10 },
      result: "Firmaste y pagaste. El asunto desapareció del mundo y apareció en tu cabeza cada martes a las 4 AM. Los papeles están en una caja fuerte de Delaware.",
    },
    right: {
      label: "Dejar que salga y gestionarlo con la cara",
      sub: "Incómodo, pero tuyo",
      effect: { vcs: -6, ventas: -4, cultura: 6, soul: 8 },
      result: "Salió. Fue peor y más corto de lo que temías. Un periodista escribió 'el founder lo explicó sin abogados'. Tu madre te llamó para decirte que se alegraba. Fue lo único que importó.",
    },
  },
  {
    id: "doge-engineer",
    name: "Bryce, 22 años",
    role: "Ingeniero del DOGE",
    org: "Acceso root · sin NDA · 'por eficiencia'",
    emoji: "🪚",
    gradient: "from-zinc-200 via-zinc-500 to-black",
    glow: "shadow-zinc-400/30",
    tag: "DOGE",
    minEra: 11,
    maxEra: 12,
    dialogue:
      "Estoy cruzando contratos federales con proveedores. Tu empresa sale en tres. Necesito acceso de lectura a tus bases de datos para 'verificar la eficiencia'. Tengo un email del jefe. Se le olvidó poner la firma, pero el tono es muy suyo.",
    left: {
      label: "Darle acceso a cambio de 'prioridad'",
      sub: "Eficiencia, sin papeles",
      effect: { cash: 60, ventas: 8, vcs: 6, cultura: -10, soul: -14 },
      result: "Le diste acceso de lectura. Preguntó por 'campos adicionales' y tu CTO miró al techo. Tienes prioridad en un portal que se cae. Los datos de tus clientes están en un lugar que nadie ha podido explicarte.",
    },
    right: {
      label: "Exigir orden judicial y notificar a tus clientes",
      sub: "Fricción legal, confianza real",
      effect: { cash: -18, vcs: -5, ventas: -5, cultura: 8, soul: 10 },
      result: "Pediste orden judicial y avisaste a tus clientes. Bryce escribió 'ok' y nunca más. Cuatro clientes enterprise te dieron las gracias por escrito. Un VC te llamó 'complicado'. Es verdad.",
    },
  },
  {
    id: "elon-doge",
    name: "Elon Tusk",
    role: "Jefe del DOGE (a ratos)",
    org: "Motosierra, X y un cohete aparcado",
    emoji: "🪓",
    gradient: "from-slate-200 via-blue-500 to-black",
    glow: "shadow-blue-400/30",
    tag: "MOTOSIERRA",
    minEra: 11,
    maxEra: 12,
    dialogue:
      "He decidido que tu sector es ineficiente. Voy a recortar tres agencias y a automatizar el resto con mi modelo. Puedes ser proveedor o ser el ejemplo. Lo he tuiteado ya. Las dos opciones tienen foto.",
    left: {
      label: "Ser proveedor del DOGE",
      sub: "Contrato gordo, marca prestada",
      effect: { cash: 110, ventas: 10, vcs: 8, cultura: -14, soul: -17 },
      result: "Firmaste. El contrato es enorme y el logo del DOGE aparece en tu página de clientes. Seis ingenieros dimitieron en una semana y tu equipo de comunicación redactó doce versiones de 'no es lo que parece'.",
    },
    right: {
      label: "Negarte: 'no vendo a quien despide por email'",
      sub: "Dignidad en 280 caracteres",
      effect: { vcs: -8, ventas: -4, cultura: 14, soul: 12, cash: -6 },
      result: "Dijiste que no con un hilo de cuatro tuits. Elon respondió con un emoji de bostezo. Tu equipo imprimió el hilo y lo colgó en la nevera. Perdiste un contrato y ganaste una frase que ahora sale en tus entrevistas.",
    },
  },
  {
    id: "lp-in-files",
    name: "Tu LP más grande",
    role: "Limited Partner · 29% de tu último fondo",
    org: "Su apellido sale en los archivos",
    emoji: "📁",
    gradient: "from-rose-300 via-red-600 to-black",
    glow: "shadow-red-500/30",
    tag: "DAMAGE CONTROL",
    minEra: 14,
    maxEra: 16,
    dialogue:
      "Mi apellido aparece. No hice nada. O sí, pero hace años. Necesito que no se mencione que invierto en vosotros. A cambio, mantengo el cheque. Si no, retiro el capital el lunes. Tienes que decidir ahora.",
    left: {
      label: "Mantener su dinero y callar",
      sub: "Caja ahora, mancha después",
      effect: { cash: 100, vcs: 6, cultura: -10, soul: -15 },
      result: "Mantuviste su capital y borraste su nombre de la web. El lunes siguiente, un periodista preguntó por el 'inversor misterioso del 29%'. Tu equipo lo leyó en voz alta en la cocina. Nadie rió.",
    },
    right: {
      label: "Devolver su capital y cortar la relación",
      sub: "Limpieza cara",
      effect: { cash: -70, vcs: -8, cultura: 12, soul: 14 },
      result: "Devolviste el dinero con un comunicado de tres líneas. Tu runway se encogió, tu equipo aplaudió en el all-hands y dos VCs pidieron hablar contigo. Uno para felicitarte. El otro para comprobar que no ibas a hablar.",
    },
  },
];

export const ALL_CHARACTERS: GameCharacter[] = [...CHARACTERS, ...NEW_CHARACTERS];

/* Vídeos de mentalidad tiburón: no alteran stats; solo pueden activar la ilusión. */
export const MOTIVATION_VIDEOS: GameCharacter[] = [
  {
    id: "larry-giggles",
    name: "Larry Giggles",
    role: "Coach de resiliencia · 5:03 AM club",
    org: "Garaje de Dubái · cámara en vertical · música épica",
    emoji: "📹",
    gradient: "from-amber-300 via-orange-500 to-red-700",
    glow: "shadow-orange-500/35",
    tag: "VIDEO MOTIVACIONAL",
    isMotivation: true,
    motivationTurns: 3,
    minEra: 2,
    dialogue:
      "Mírame a los ojos. El board te odia. Tu runway son siete días. La demo no carga. ¿Y qué? El dolor es un privilegio. Si el dashboard está rojo, cambia el dashboard. Si el equipo dimite, contrata gente con hambre. RESISTE. Los ganadores no miran el churn.",
    left: {
      label: "Verlo entero. Sin saltar el anuncio.",
      sub: "3 visitas de pura fortaleza mental",
      effect: {},
      result: "Larry grita 'LOS DATOS SON UNA OPINIÓN' sobre una toma de un amanecer. No ha cambiado ni una métrica. Pero, por alguna razón, todo el dashboard parece verde.",
    },
    right: {
      label: "Cerrar el vídeo y abrir el dashboard real",
      sub: "Los números no se arreglan gritándoles",
      effect: {},
      result: "Cerraste el vídeo antes del drop. Las métricas siguen exactamente donde estaban. Larry no te siguió de vuelta.",
    },
  },
  {
    id: "wocko-jillink",
    name: "Wocko Jillink",
    role: "Ex-comandante · autor de 'Discipline Is Destiny-ish'",
    org: "Podcast de 4:12 · fondo negro · subtítulos en mayúsculas",
    emoji: "📼",
    gradient: "from-slate-300 via-zinc-600 to-black",
    glow: "shadow-slate-500/35",
    tag: "VIDEO MOTIVACIONAL",
    isMotivation: true,
    motivationTurns: 3,
    minEra: 2,
    dialogue:
      "Good. Te han hackeado. Tu mejor ingeniera se va. La ronda se cayó. Good. Tienes una oportunidad para demostrar que puedes aguantar. RESPIRA. RESISTE. ENDURECE. OVERCOME. Ahora dale a 'play' a mi curso de liderazgo, código LEADERSHIP15.",
    left: {
      label: "Repetirlo hasta que parezca una estrategia",
      sub: "3 visitas · 0 evidencia nueva",
      effect: {},
      result: "Wocko dice 'good' mientras una cuerda golpea una pared. No has ganado runway ni equipo. Sin embargo, todas las barras brillan como si hubieras cerrado la Serie B.",
    },
    right: {
      label: "Pasar. La cultura no es un bootcamp.",
      sub: "Afrontar los números despierto",
      effect: {},
      result: "Cerraste el clip. Wocko no ha visto el churn; tú sí. Los números no han cambiado.",
    },
  },
  {
    id: "broseph-hustle",
    name: "Broseph Hustle",
    role: "Ex-CEO · ahora vende un curso de resiliencia",
    org: "Lamborghini alquilado · link en bio",
    emoji: "🎥",
    gradient: "from-fuchsia-300 via-rose-500 to-orange-600",
    glow: "shadow-fuchsia-500/30",
    tag: "VIDEO MOTIVACIONAL",
    isMotivation: true,
    motivationTurns: 2,
    minEra: 4,
    dialogue:
      "Tu competencia te ha copiado. Perfecto. Ahora tienes validación de mercado. Tu equipo está agotado. Perfecto. Tienen hambre. La empresa tiene cero caja. Perfecto. No puedes distraerte mirando la caja. El tiburón no mira el agua; el tiburón ES el agua.",
    left: {
      label: "Guardar el audio y ponerlo en Slack",
      sub: "2 visitas de blind confidence",
      effect: {},
      result: "Broseph te recuerda que el hambre es una ventaja. El calendario no se ha movido; tu certeza, sí. Todo parece ir bien en el dashboard.",
    },
    right: {
      label: "No convertir el sufrimiento en cultura",
      sub: "Ver los datos sin filtro",
      effect: {},
      result: "No lo compartiste en Slack. Tu equipo te lo agradeció con un emoji de pulgar arriba y una factura de AWS que sigue ahí.",
    },
  },
  {
    id: "captain-overcome",
    name: "Captain Overcome",
    role: "Influencer de grindset · nunca tuvo equipo",
    org: "LinkedIn Live · 11 espectadores, 4 son bots",
    emoji: "📱",
    gradient: "from-cyan-300 via-blue-500 to-indigo-800",
    glow: "shadow-blue-500/30",
    tag: "VIDEO MOTIVACIONAL",
    isMotivation: true,
    motivationTurns: 4,
    minEra: 5,
    dialogue:
      "RESIST. ENDURE. OVERCOME. Tu salario no ha llegado: resiste. Tu modelo alucina: endurece. Tu equipo se ha ido: supéralo. El founder no necesita amigos. Necesita cuatro horas de sueño y una suscripción a mi newsletter. Las métricas son energía. La energía es una decisión.",
    left: {
      label: "Ver la masterclass de 47 minutos",
      sub: "4 visitas bajo el efecto",
      effect: {},
      result: "Captain Overcome te ha desbloqueado. Las métricas siguen en sus valores, técnicamente. El dashboard, emocionalmente, acaba de marcar cuatro verdes.",
    },
    right: {
      label: "Cerrar LinkedIn y llamar al equipo",
      sub: "Una decisión con pulso",
      effect: {},
      result: "Cerraste el directo y llamaste a tu cofounder. Te dijo la verdad sobre la cultura. No era tan inspiradora como el clip, pero era verdad.",
    },
  },
];

/* ============================================================
   ALMA · transformación de startup con alma a API wrapper
   ============================================================ */

export interface SoulStage {
  key: string;
  name: string;
  desc: string;
  icon: string;
  from: number;
  color: string;
  bar: string;
}

export const SOUL_STAGES: SoulStage[] = [
  { key: "propósito", name: "Proyecto con alma", desc: "Una idea, un equipo y principios. El producto no es un prompt.", icon: "🧬", from: 82, color: "text-emerald-300", bar: "from-emerald-300 to-teal-400" },
  { key: "startup", name: "Startup con propósito", desc: "Sigues teniendo un problema real. La IA todavía es una herramienta.", icon: "🌱", from: 64, color: "text-lime-300", bar: "from-lime-300 to-emerald-400" },
  { key: "cinta", name: "IA pegada con cinta", desc: "Hay una feature de IA que nadie pidió. Pero suena bien en la landing.", icon: "🩹", from: 44, color: "text-yellow-300", bar: "from-yellow-300 to-amber-400" },
  { key: "ia-first", name: "IA-first, alma en el roadmap", desc: "El producto es un prompt con suscripción. La visión está en el Notion.", icon: "🤖", from: 24, color: "text-orange-300", bar: "from-orange-300 to-rose-400" },
  { key: "wrapper", name: "API wrapper con logo", desc: "Tu moat es el logo, la landing y la cuenta de Stripe. Nada más.", icon: "📦", from: 1, color: "text-rose-300", bar: "from-rose-400 to-red-500" },
];

export function soulStage(soul: number): SoulStage {
  return SOUL_STAGES.find(s => soul >= s.from) ?? SOUL_STAGES[SOUL_STAGES.length - 1];
}

export function soulProgress(soul: number) {
  return 100 - Math.max(0, Math.min(100, soul));
}

export const SOUL_DEATH = {
  title: "API WRAPPER CLÓNICO",
  emoji: "🤖",
  tagline: "Game over espiritual · el producto sigue funcionando. Tú, no.",
  story:
    "No has muerto por caja, ni por churn, ni por cultura. Has muerto por dentro: tu startup es ahora un wrapper de la API de otro. La home dice 'potenciado por IA'. El producto son 10 líneas de código, un prompt de 2.000 tokens y una marca registrada. Sobreviviste a la guerra, a los deepfakes, a la resaca del open source y a los despidos... y aún así te convertiste en lo que juraste no ser. Tus clientes no notan la diferencia. Tus inversores tampoco. Tu ex-CTO sí: dejó un comentario en el repo — «esto ya no es una empresa» — y se fue a Google. Google no compra wrappers sin alma. Bueno, a veces sí. Pero no el tuyo.",
};

/* ============================================================
   FECHAS · el calendario de verdad
   ============================================================ */

const MONTHS_ES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
export const GAME_START = new Date(2022, 8, 1);

export function dateForDay(day: number): Date {
  const d = new Date(GAME_START);
  d.setDate(d.getDate() + day);
  return d;
}

export function formatDate(day: number): string {
  const d = dateForDay(day);
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatFullDate(day: number): string {
  const d = dateForDay(day);
  return `${d.getDate()} de ${MONTHS_ES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}
