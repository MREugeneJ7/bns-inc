import { metricKey, parseMetricNum, parsePct } from "./analytics";
import { textFingerprint } from "./provenance";
import type { AnalyticsRow, Metric, Post } from "./types";

/** Filas tal cual salen en el XLS exportado de LinkedIn (la captura del enunciado). */
const ROWS_SCREENSHOT: [string, string, string][] = [
  ["Cargo", "Ingeniero de software", "11 %"],
  ["Cargo", "Programador full stack", "5 %"],
  ["Cargo", "Desarrollador de back-end", "2 %"],
  ["Cargo", "Desarrollador de front-end", "2 %"],
  ["Cargo", "Desarrollador web", "1 %"],
  ["Cargo", "Ingeniero de datos", "1 %"],
  ["Cargo", "Fundador", "< 1 %"],
  ["Cargo", "Desarrollador Java", "< 1 %"],
  ["Cargo", "Analista de datos", "< 1 %"],
  ["Ubicación", "Buenos Aires y alrededores", "10 %"],
  ["Ubicación", "Área metropolitana de Santiago", "8 %"],
  ["Ubicación", "Área metropolitana de Bogotá D.C.", "6 %"],
  ["Ubicación", "Madrid y alrededores", "4 %"],
  ["Ubicación", "Área metropolitana de Ciudad de México", "3 %"],
  ["Ubicación", "Área metropolitana de Lima", "3 %"],
  ["Ubicación", "Área metropolitana de Medellín", "2 %"],
  ["Ubicación", "Córdoba y alrededores, Argentina", "2 %"],
  ["Ubicación", "Montevideo", "2 %"],
  ["Nivel de responsabilidad", "Sin experiencia", "39 %"],
  ["Nivel de responsabilidad", "Con experiencia", "19 %"],
  ["Nivel de responsabilidad", "Gerente", "2 %"],
  ["Nivel de responsabilidad", "Propietario", "1 %"],
  ["Nivel de responsabilidad", "Formación", "1 %"],
  ["Nivel de responsabilidad", "Directivo", "< 1 %"],
  ["Nivel de responsabilidad", "Director", "< 1 %"],
  ["Nivel de responsabilidad", "Vicepresidente", "< 1 %"],
  ["Nivel de responsabilidad", "Socio", "< 1 %"],
  ["Empresa", "Mercado Libre", "1 %"],
  ["Empresa", "Profesional independiente", "< 1 %"],
  ["Empresa", "NTT DATA Europe & Latam", "< 1 %"],
  ["Empresa", "Globant", "< 1 %"],
  ["Empresa", "Indra Group", "< 1 %"],
  ["Empresa", "Profesional independiente", "< 1 %"],
  ["Empresa", "itti", "< 1 %"],
  ["Empresa", "Tata Consultancy Services", "< 1 %"],
  ["Empresa", "Minsait", "< 1 %"],
  ["Sector", "Desarrollo de software", "30 %"],
  ["Sector", "Servicios y consultoría de TI", "15 %"],
  ["Sector", "Tecnología, información e internet", "9 %"],
  ["Sector", "Servicios de gestión estratégica", "4 %"],
  ["Sector", "Desarrollo de software personalizado de sistemas de TI", "2 %"],
  ["Sector", "Educación", "2 %"],
  ["Sector", "Servicios financieros", "2 %"],
  ["Sector", "Banca", "2 %"],
  ["Sector", "Consultoría y servicios a empresas", "1 %"],
  ["Tamaño de la empresa", "Más de 10.001 empleados", "12 %"],
  ["Tamaño de la empresa", "51 - 200 empleados", "9 %"],
  ["Tamaño de la empresa", "1.001 - 5.000 empleados", "8 %"],
  ["Tamaño de la empresa", "11 - 50 empleados", "8 %"],
  ["Tamaño de la empresa", "2 - 10 empleados", "6 %"],
  ["Tamaño de la empresa", "201 - 500 empleados", "6 %"],
  ["Tamaño de la empresa", "501 - 1.000 empleados", "4 %"],
  ["Tamaño de la empresa", "5.001 - 10.000 empleados", "3 %"],
];

const ROWS_B: [string, string, string][] = [
  ["Cargo", "Desarrollador junior", "24 %"],
  ["Cargo", "Ingeniero de software", "18 %"],
  ["Cargo", "Programador full stack", "11 %"],
  ["Cargo", "Tech lead", "7 %"],
  ["Cargo", "Analista de datos", "4 %"],
  ["Ubicación", "Buenos Aires y alrededores", "14 %"],
  ["Ubicación", "Área metropolitana de Santiago", "9 %"],
  ["Ubicación", "Madrid y alrededores", "7 %"],
  ["Ubicación", "Área metropolitana de Bogotá D.C.", "5 %"],
  ["Nivel de responsabilidad", "Sin experiencia", "46 %"],
  ["Nivel de responsabilidad", "Con experiencia", "31 %"],
  ["Nivel de responsabilidad", "Gerente", "5 %"],
  ["Sector", "Desarrollo de software", "41 %"],
  ["Sector", "Educación", "12 %"],
  ["Sector", "Servicios y consultoría de TI", "9 %"],
  ["Tamaño de la empresa", "51 - 200 empleados", "18 %"],
  ["Tamaño de la empresa", "11 - 50 empleados", "15 %"],
  ["Tamaño de la empresa", "2 - 10 empleados", "11 %"],
];

const ROWS_C: [string, string, string][] = [
  ["Cargo", "Ingeniero de software", "14 %"],
  ["Cargo", "Científico de datos", "8 %"],
  ["Cargo", "Programador full stack", "6 %"],
  ["Cargo", "Desarrollador de back-end", "5 %"],
  ["Cargo", "Analista de datos", "4 %"],
  ["Ubicación", "Área metropolitana de Santiago", "12 %"],
  ["Ubicación", "Buenos Aires y alrededores", "11 %"],
  ["Ubicación", "Madrid y alrededores", "6 %"],
  ["Ubicación", "Área metropolitana de Ciudad de México", "4 %"],
  ["Nivel de responsabilidad", "Con experiencia", "42 %"],
  ["Nivel de responsabilidad", "Sin experiencia", "28 %"],
  ["Nivel de responsabilidad", "Gerente", "9 %"],
  ["Sector", "Desarrollo de software", "28 %"],
  ["Sector", "Tecnología, información e internet", "16 %"],
  ["Sector", "Servicios y consultoría de TI", "11 %"],
  ["Sector", "Banca", "6 %"],
  ["Tamaño de la empresa", "Más de 10.001 empleados", "15 %"],
  ["Tamaño de la empresa", "1.001 - 5.000 empleados", "12 %"],
  ["Tamaño de la empresa", "201 - 500 empleados", "8 %"],
];

const toRows = (t: [string, string, string][]): AnalyticsRow[] =>
  t.map(([categoria, valor, p]) => ({
    categoria,
    valor,
    pct: parsePct(p) ?? 0,
  }));

const MET = (label: string, value: string): Metric => ({
  key: metricKey(label),
  label,
  value,
  num: parseMetricNum(value),
});

const METRICS_A: Metric[] = [
  MET(
    "URL de la publicación",
    "https://www.linkedin.com/posts/eugenelez_programaciaejn-recursoshumanos-ingenieradesoftware-share-7506000000000000000-abc",
  ),
  MET("Fecha de publicación", "16/9/2026"),
  MET("Hora de publicación", "16:02"),
  MET("Impresiones", "12623"),
  MET("Miembros alcanzados", "7788"),
  MET("Visualizaciones del perfil desde esta publicación", "39"),
  MET("Seguidores obtenidos a través de esta publicación", "3"),
  MET("Interacciones sociales", "160"),
  MET("Reacciones", "130"),
  MET("Comentarios", "18"),
  MET("Veces compartido", "8"),
  MET("Veces guardado", "4"),
  MET("Enlaces en LinkedIn", "0"),
  MET("Interacciones con el enlace", "0"),
  MET("Interacciones con el botón personalizado Premium", "0"),
];

const METRICS_B: Metric[] = [
  MET(
    "URL de la publicación",
    "https://www.linkedin.com/posts/eugenelez_programaciaejn-junior-senior-crecimiento-share-7506000000000000002-xyz",
  ),
  MET("Fecha de publicación", "13/9/2026"),
  MET("Hora de publicación", "09:41"),
  MET("Impresiones", "8421"),
  MET("Miembros alcanzados", "5110"),
  MET("Visualizaciones del perfil desde esta publicación", "57"),
  MET("Seguidores obtenidos a través de esta publicación", "6"),
  MET("Interacciones sociales", "214"),
  MET("Reacciones", "181"),
  MET("Comentarios", "24"),
  MET("Veces compartido", "9"),
  MET("Veces guardado", "12"),
];

const METRICS_C: Metric[] = [
  MET(
    "URL de la publicación",
    "https://www.linkedin.com/posts/eugenelez_programaciaejn-ia-copiloto-empleo-share-7506000000000000003-xyz",
  ),
  MET("Fecha de publicación", "12/9/2026"),
  MET("Hora de publicación", "08:15"),
  MET("Impresiones", "5294"),
  MET("Miembros alcanzados", "3120"),
  MET("Visualizaciones del perfil desde esta publicación", "22"),
  MET("Seguidores obtenidos a través de esta publicación", "2"),
  MET("Interacciones sociales", "143"),
  MET("Reacciones", "121"),
  MET("Comentarios", "15"),
  MET("Veces compartido", "7"),
  MET("Veces guardado", "5"),
];

const CURL_A = String.raw`curl 'https://www.linkedin.com/voyager/api/feed/updatesV2?includeWebMetadata=true&decoratedUrn=urn%3Ali%3Afsd_update%3A7345000000000000001' \
  -H 'authority: www.linkedin.com' \
  -H 'content-type: application/json' \
  -H 'cookie: li_at=TOKEN_DE_EJEMPLO' \
  --data-raw '{"updateUrns":["urn:li:activity:7345000000000000001"],"commentary":"🚨 Hoy pusimos en producción el copiloto de IA que detecta fraude bancario en tiempo real.\n\nDespués de 6 meses llevando LLMs a producción, estos son los 3 aprendizajes que nadie te cuenta:\n\n1️⃣ La latencia manda: un modelo más chico y rápido vence a uno gigante y lento.\n2️⃣ Embeddings + similitud de coseno hacen el 80 % del trabajo antes de llamar a ningún LLM.\n3️⃣ La observabilidad no es opcional: si no puedes explicar por qué decidió el modelo, no está listo para producción.\n\n¿Tú qué has aprendido llevando IA a producción? 👇","visibility":{"com.linkedin.voyager.feed.Visibility":{"com.linkedin.voyager.feed.MemberNetworkVisibility":"PUBLIC"}}}'`;

const CURL_B = String.raw`curl 'https://www.linkedin.com/voyager/api/feed/updatesV2?includeWebMetadata=true' \
  -H 'authority: www.linkedin.com' \
  -H 'content-type: application/json' \
  -H 'cookie: li_at=TOKEN_DE_EJEMPLO' \
  --data-raw '{"updateUrns":["urn:li:activity:7345000000000000002"],"commentary":"Hace 3 años era desarrollador junior y pensaba que senior significaba saber más código. Error.\n\nSenior no es saber más: es saber qué NO hay que construir, cuánto cuesta una mala decisión y cuándo decir que no.\n\nMi checklist real de junior a senior:\n• Lees código ajeno antes de escribir el tuyo\n• Escribes tests que fallan primero\n• Sabes explicar tu PR en 3 frases\n• Dices 'no sé' en público y luego investigas\n\n¿Cuál agregaría? 👇","visibility":{"com.linkedin.voyager.feed.Visibility":{"com.linkedin.voyager.feed.MemberNetworkVisibility":"PUBLIC"}}}'`;

const CURL_C = String.raw`curl 'https://www.linkedin.com/voyager/api/feed/updatesV2?includeWebMetadata=true' \
  -H 'authority: www.linkedin.com' \
  -H 'content-type: application/json' \
  -H 'cookie: li_at=TOKEN_DE_EJEMPLO' \
  --data-raw '{"updateUrns":["urn:li:activity:7345000000000000003"],"commentary":"¿La inteligencia artificial nos va a quitar el trabajo?\n\nMi respuesta honesta después de 6 meses usando copilotos de IA cada día: no. La IA no viene por tu empleo, viene por tus tareas repetitivas.\n\nQuien no la use, sí quedará fuera. El diferencial ya no es la velocidad, es el criterio: saber qué delegarle al modelo y qué no.\n\nMi regla práctica: si una tarea me lleva más de 10 minutos y se repite, primero intento automatizarla con IA antes de hacerla a mano.\n\n¿Ustedes en qué la están usando de verdad? 👇","visibility":{"com.linkedin.voyager.feed.Visibility":{"com.linkedin.voyager.feed.MemberNetworkVisibility":"PUBLIC"}}}'`;

const BODY_A = `🚨 Hoy pusimos en producción el copiloto de IA que detecta fraude bancario en tiempo real.

Después de 6 meses llevando LLMs a producción, estos son los 3 aprendizajes que nadie te cuenta:

1️⃣ La latencia manda: un modelo más chico y rápido vence a uno gigante y lento.
2️⃣ Embeddings + similitud de coseno hacen el 80 % del trabajo antes de llamar a ningún LLM.
3️⃣ La observabilidad no es opcional: si no puedes explicar por qué decidió el modelo, no está listo para producción.

¿Tú qué has aprendido llevando IA a producción? 👇`;

const BODY_B = `Hace 3 años era desarrollador junior y pensaba que senior significaba saber más código. Error.

Senior no es saber más: es saber qué NO hay que construir, cuánto cuesta una mala decisión y cuándo decir que no.

Mi checklist real de junior a senior:
• Lees código ajeno antes de escribir el tuyo
• Escribes tests que fallan primero
• Sabes explicar tu PR en 3 frases
• Dices "no sé" en público y luego investigas

¿Cuál agregaría? 👇`;

const BODY_C = `¿La inteligencia artificial nos va a quitar el trabajo?

Mi respuesta honesta después de 6 meses usando copilotos de IA cada día: no. La IA no viene por tu empleo, viene por tus tareas repetitivas.

Quien no la use, sí quedará fuera. El diferencial ya no es la velocidad, es el criterio: saber qué delegarle al modelo y qué no.

Mi regla práctica: si una tarea me lleva más de 10 minutos y se repite, primero intento automatizarla con IA antes de hacerla a mano.

¿Ustedes en qué la están usando de verdad? 👇`;

export function buildDemoPosts(): Post[] {
  const now = Date.now();
  const posts: Post[] = [
    {
      id: "demo-a",
      title: "🚨 Copiloto de IA contra el fraude, en producción",
      createdAt: now - 1000 * 60 * 60 * 24 * 6,
      urn: "7345000000000000001",
      url: METRICS_A[0].value,
      body: BODY_A,
      curl: CURL_A,
      rows: toRows(ROWS_SCREENSHOT),
      metrics: METRICS_A,
      fecha: METRICS_A[1].value,
      hora: METRICS_A[2].value,
    },
    {
      id: "demo-b",
      title: "De junior a senior en 3 años (sin quemarte)",
      titleSource: "user",
      textStatus: "ok",
      createdAt: now - 1000 * 60 * 60 * 24 * 3,
      urn: "7345000000000000002",
      url: METRICS_B[0].value,
      body: BODY_B,
      curl: CURL_B,
      rows: toRows(ROWS_B),
      metrics: METRICS_B,
      fecha: METRICS_B[1].value,
      hora: METRICS_B[2].value,
    },
    {
      id: "demo-c",
      title: "¿La IA nos reemplazará? Mi respuesta honesta",
      createdAt: now - 1000 * 60 * 60 * 26,
      urn: "7345000000000000003",
      url: METRICS_C[0].value,
      body: BODY_C,
      curl: CURL_C,
      rows: toRows(ROWS_C),
      metrics: METRICS_C,
      fecha: METRICS_C[1].value,
      hora: METRICS_C[2].value,
    },
  ];
  return posts.map((p) => ({
    ...p,
    provenance: {
      version: 2,
      kind: "demo",
      bodyHash: textFingerprint(p.body),
      recordedAt: now,
    },
  }));
}
