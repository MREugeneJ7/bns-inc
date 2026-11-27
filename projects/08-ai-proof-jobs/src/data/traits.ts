export const TRAITS = {
  social: { positive: "el trato con otras personas", negative: "los espacios con poca gente" },
  escena: { positive: "la comodidad ante un público", negative: "trabajar lejos del foco" },
  escucha: { positive: "la escucha y la atención a los demás", negative: "la preferencia por tareas sin tanta conversación" },
  improvisacion: { positive: "la capacidad de adaptarte sobre la marcha", negative: "la preferencia por saber qué esperar" },
  fisico: { positive: "la inclinación por moverte y usar el cuerpo", negative: "un ritmo de trabajo físicamente tranquilo" },
  riesgo: { positive: "tu apertura al riesgo controlado", negative: "la preferencia por la seguridad" },
  manual: { positive: "el gusto por resolver cosas con las manos", negative: "la preferencia por tareas menos manuales" },
  detalle: { positive: "la atención al detalle", negative: "la preferencia por una visión más general" },
  rutina: { positive: "la paciencia con la repetición", negative: "la necesidad de variedad" },
  independencia: { positive: "la autonomía y el tiempo a solas", negative: "la preferencia por trabajar en compañía" },
  exterior: { positive: "la afinidad por los espacios abiertos", negative: "la preferencia por un entorno resguardado" },
  simbolico: { positive: "el interés por las historias y los significados", negative: "la preferencia por lo concreto" },
  tecnologia: { positive: "la curiosidad por la tecnología", negative: "la preferencia por herramientas sencillas" },
  competencia: { positive: "el gusto por los retos y la competición", negative: "la preferencia por un ritmo sin competición" },
  contacto: { positive: "la comodidad con el contacto físico acordado", negative: "la preferencia por mantener la distancia física" },
  observacion: { positive: "la comodidad al hacer tareas bajo observación", negative: "la preferencia por que nadie te observe trabajar" },
  humor: { positive: "el sentido del humor ante el absurdo", negative: "una aproximación más práctica" },
  autoridad: { positive: "la comodidad al tomar decisiones por un grupo", negative: "la preferencia por no dirigir a otros" },
} as const;

export type TraitId = keyof typeof TRAITS;
export type TraitValues = Partial<Record<TraitId, number>>;