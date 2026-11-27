import type { TraitValues } from "./traits";

export interface AnswerFlags {
  adult?: boolean;
  intimate?: boolean;
  risk?: boolean;
}

export interface Option {
  text: string;
  traits?: TraitValues;
  flags?: AnswerFlags;
}

export interface Question {
  id: number;
  module: number;
  text: string;
  hint?: string;
  options: Option[];
  filler?: boolean;
}

export const MODULES = [
  "Calibración humana",
  "Entorno y tolerancia",
  "Las otras personas",
  "Criterio discutible",
  "Perfil no solicitado",
  "Pruebas de resistencia",
  "Validación final",
] as const;

export const QUESTIONS: Question[] = [
  {
    id: 1, module: 0, filler: true,
    text: "¿Cuál es tu situación laboral actual?",
    hint: "Responde con sinceridad. El sistema todavía está aprendiendo a fingir que escucha.",
    options: [
      { text: "Tengo trabajo, pero he visto una demo y tengo preguntas" },
      { text: "Busco trabajo. También busco una explicación" },
      { text: "Entrené una herramienta que ahora hace parte de lo mío. Precioso" },
      { text: "Prefiero no hablar de ello hasta que el café haga efecto" },
    ],
  },
  {
    id: 2, module: 0, filler: true,
    text: "¿Cuál es tu color favorito?",
    hint: "Pregunta esencial. La razón es confidencial incluso para nosotros.",
    options: [
      { text: "Azul, como una persona que ha aceptado la estadística" },
      { text: "Negro. Ya sé que técnicamente no es un color" },
      { text: "Un verde que no sabría nombrar en una tienda de pintura" },
      { text: "Depende del contexto y no quiero que esto defina mi identidad" },
    ],
  },
  {
    id: 3, module: 0,
    text: "Una comprobación menos poética: ¿tienes 18 años o más?",
    hint: "Algunas posibilidades solo se consideran para personas adultas. Tu respuesta se queda en esta pestaña.",
    options: [
      { text: "Sí, tengo 18 años o más", flags: { adult: true } },
      { text: "No, tengo menos de 18", flags: { adult: false } },
      { text: "Prefiero no decirlo", flags: { adult: false } },
    ],
  },
  {
    id: 4, module: 0,
    text: "¿Qué tipo de cansancio te parece más soportable?",
    options: [
      { text: "El de haber estado moviéndome y haciendo cosas", traits: { fisico: 2, manual: 1 } },
      { text: "El de pasar el día hablando con personas", traits: { social: 2, escucha: 1 } },
      { text: "El de concentrarme en algo pequeño durante horas", traits: { detalle: 2, rutina: 1 } },
      { text: "El de resolver cinco imprevistos sin un plan", traits: { improvisacion: 2, humor: 1 } },
    ],
  },
  {
    id: 5, module: 0, filler: true,
    text: "¿Qué desayunas si nadie te está juzgando?",
    options: [
      { text: "Café y el recuerdo de una fruta" },
      { text: "Tostada con algo que he encontrado en la nevera" },
      { text: "Nada hasta que mi cuerpo presenta una reclamación" },
      { text: "Lo mismo cada día. La revolución empieza después" },
    ],
  },
  {
    id: 6, module: 0,
    text: "Te regalan un sábado sin obligaciones. ¿Cuánta gente cabe en tu plan?",
    options: [
      { text: "Ninguna. Por eso es un regalo", traits: { independencia: 2, social: -2 } },
      { text: "Una o dos personas y una conversación larga", traits: { escucha: 2, social: 1 } },
      { text: "Un grupo. Cuanto más improbable, mejor", traits: { social: 2, improvisacion: 1 } },
      { text: "Depende de si puedo irme sin dar explicaciones", traits: { independencia: 1, social: -1 } },
    ],
  },
  {
    id: 7, module: 0,
    text: "Algo se rompe justo cuando empiezas. ¿Cuál es tu primer impulso?",
    options: [
      { text: "Examinarlo de cerca. Después ya veré si lo empeoro", traits: { manual: 2, detalle: 1 } },
      { text: "Preguntar si alguien tiene una idea mejor", traits: { social: 1, escucha: 1 } },
      { text: "Buscar otra manera de conseguir el mismo resultado", traits: { improvisacion: 2, independencia: 1 } },
      { text: "Leer las instrucciones. Sé que no es popular", traits: { detalle: 2, rutina: 1 } },
    ],
  },
  {
    id: 8, module: 0, filler: true,
    text: "Si fueras una forma geométrica, ¿cuál serías?",
    hint: "El departamento de ciencia ha preguntado por qué seguimos haciendo esto. Lo estamos investigando.",
    options: [
      { text: "Un círculo. Redondo en todos los sentidos" },
      { text: "Un triángulo. Mucha tensión en tres puntos" },
      { text: "Un rombo. Un cuadrado que ha tomado decisiones" },
      { text: "Una forma que el sistema educativo no ha reconocido" },
    ],
  },
  {
    id: 9, module: 1,
    text: "¿En qué entorno se te pasa más rápido el tiempo?",
    options: [
      { text: "Al aire libre, aunque el clima tenga opiniones", traits: { exterior: 2, fisico: 1 } },
      { text: "En un lugar tranquilo donde cada cosa tiene su sitio", traits: { detalle: 1, rutina: 1, exterior: -1 } },
      { text: "En un sitio con movimiento y conversaciones", traits: { social: 2, escena: 1 } },
      { text: "En lugares distintos. Las paredes acaban conociéndome", traits: { improvisacion: 1, independencia: 1, rutina: -1 } },
    ],
  },
  {
    id: 10, module: 1,
    text: "Un plan cambia a última hora y nadie sabe qué hacer. Tú...",
    options: [
      { text: "Propongo algo y asumo que me lo criticarán", traits: { autoridad: 2, improvisacion: 1 } },
      { text: "Compruebo qué necesita cada persona primero", traits: { escucha: 2, social: 1 } },
      { text: "Me pongo con la parte práctica, sin anunciarlo", traits: { manual: 2, independencia: 1 } },
      { text: "Necesito diez minutos y un plan nuevo por escrito", traits: { detalle: 2, improvisacion: -1 } },
    ],
  },
  {
    id: 11, module: 1, filler: true,
    text: "¿Perro o gato?",
    hint: "No hay una respuesta incorrecta. Hay un comité que discrepa.",
    options: [
      { text: "Perro. Me gusta el entusiasmo sin pruebas" },
      { text: "Gato. Me gusta que me quieran con condiciones" },
      { text: "Los dos, siempre que no me pregunten por mi vida" },
      { text: "Ninguno. He venido a por un informe" },
    ],
  },
  {
    id: 12, module: 1,
    text: "¿Aceptarías una actividad con riesgo físico importante?",
    hint: "Esto sí importa: no sugerimos opciones de alto riesgo sin tu permiso. La formación y la protección no son opcionales.",
    options: [
      { text: "No. Mi cuerpo ya tiene suficientes proyectos", traits: { riesgo: -2 }, flags: { risk: false } },
      { text: "Sí, si hay formación, límites y medidas de seguridad", traits: { riesgo: 2, fisico: 1 }, flags: { risk: true } },
      { text: "Solo riesgos pequeños y previsibles", traits: { riesgo: -1, detalle: 1 }, flags: { risk: false } },
      { text: "No lo sé. Prefiero que no cuenten con ello", flags: { risk: false } },
    ],
  },
  {
    id: 13, module: 1,
    text: "¿Cómo llevas trabajar cuando el ambiente es incómodo?",
    options: [
      { text: "Mientras tenga sentido y pueda prepararme, bien", traits: { exterior: 1, fisico: 1, detalle: 1 } },
      { text: "Un rato, pero luego necesito una habitación amable", traits: { exterior: -1, fisico: -1 } },
      { text: "Depende de quién esté conmigo", traits: { social: 1, independencia: -1 } },
      { text: "Prefiero que el imprevisto sea mental y no meteorológico", traits: { improvisacion: 1, exterior: -2 } },
    ],
  },
  {
    id: 14, module: 1,
    text: "¿Qué relación tienes con los horarios?",
    options: [
      { text: "Un plan claro me deja espacio mental para todo lo demás", traits: { rutina: 2, detalle: 1 } },
      { text: "Me gusta tener libertad, aunque haya cierto desorden", traits: { independencia: 2, improvisacion: 1 } },
      { text: "Si cambia cada día, mi cerebro se despierta", traits: { improvisacion: 2, rutina: -1 } },
      { text: "Me adapto mientras el equipo funcione", traits: { social: 1, escucha: 1 } },
    ],
  },
  {
    id: 15, module: 1,
    text: "Dos horas sin hablar. ¿Qué tal?",
    options: [
      { text: "Magnífico. ¿Se pueden ampliar?", traits: { independencia: 2, social: -1 } },
      { text: "Bien, siempre que esté haciendo algo", traits: { manual: 1, rutina: 1 } },
      { text: "Difícil. Ya he comentado esta pregunta en voz alta", traits: { social: 2, escena: 1 } },
      { text: "Depende de si el silencio es cómodo o de ascensor", traits: { escucha: 1, simbolico: 1 } },
    ],
  },
  {
    id: 16, module: 1,
    text: "Hay que repetir una tarea hasta que salga bien. ¿Cómo lo llevas?",
    options: [
      { text: "Bien. Me entretiene notar cada mejora", traits: { rutina: 2, detalle: 2 } },
      { text: "Si implica moverme, mejor que estar quieto", traits: { fisico: 2, rutina: 1 } },
      { text: "Buscaría una forma diferente de hacerla", traits: { improvisacion: 2, rutina: -1 } },
      { text: "Preferiría alternarla con algo que implique gente", traits: { social: 2, rutina: -1 } },
    ],
  },
  {
    id: 17, module: 2, filler: true,
    text: "Si pudieras eliminar un día de la semana, ¿cuál sería?",
    options: [
      { text: "Lunes. No necesito justificarme" },
      { text: "Domingo por la tarde, que es lunes con otra ropa" },
      { text: "Miércoles. Nadie sabe qué hace ahí" },
      { text: "Ninguno. Sospecho que no nos darían un día libre a cambio" },
    ],
  },
  {
    id: 18, module: 2,
    text: "¿Qué límites pondrías al contacto físico en el trabajo?",
    hint: "No los adivinamos: las opciones íntimas solo se consideran con permiso explícito y para personas adultas.",
    options: [
      { text: "Prefiero evitar el contacto físico con desconocidos", traits: { contacto: -2 }, flags: { intimate: false } },
      { text: "Contacto cotidiano y acordado sí; ámbitos íntimos, no", traits: { contacto: 1, escucha: 1 }, flags: { intimate: false } },
      { text: "Podría valorar ámbitos íntimos entre adultos, con consentimiento y límites", traits: { contacto: 2, escucha: 1 }, flags: { intimate: true } },
      { text: "No lo tengo claro; prefiero no recibir opciones íntimas", flags: { intimate: false } },
    ],
  },
  {
    id: 19, module: 2,
    text: "Una persona te cuenta lo mismo por tercera vez. ¿Qué haces?",
    options: [
      { text: "Escucho. Puede que necesite contarlo otra vez", traits: { escucha: 2, rutina: 1 } },
      { text: "Pregunto qué ha cambiado desde la última vez", traits: { detalle: 1, escucha: 1 } },
      { text: "Intento cambiar el tono con una ocurrencia", traits: { humor: 2, improvisacion: 1 } },
      { text: "Propongo una pausa para que respiremos los dos", traits: { independencia: 1, social: -1 } },
    ],
  },
  {
    id: 20, module: 2,
    text: "¿Qué te incomodaría más durante una jornada?",
    options: [
      { text: "Sentir que alguien observa cada movimiento", traits: { observacion: -2, independencia: 1 } },
      { text: "No hablar con nadie en todo el día", traits: { social: 2, independencia: -1 } },
      { text: "Hacer exactamente lo mismo sin poder cambiar nada", traits: { rutina: -2, improvisacion: 1 } },
      { text: "No saber nunca qué se espera de mí", traits: { detalle: 2, improvisacion: -1 } },
    ],
  },
  {
    id: 21, module: 2,
    text: "Tienes que explicar algo que dominas. ¿Cómo empiezas?",
    options: [
      { text: "Lo hago despacio para que puedan observar", traits: { manual: 1, detalle: 1, observacion: 2 } },
      { text: "Pregunto qué saben y adapto la explicación", traits: { escucha: 2, improvisacion: 1 } },
      { text: "Busco una comparación o una pequeña historia", traits: { simbolico: 2, escena: 1 } },
      { text: "Preparo una guía. Nadie debería depender de mi memoria", traits: { detalle: 2, tecnologia: 1 } },
    ],
  },
  {
    id: 22, module: 2, filler: true,
    text: "Valora la experiencia hasta este momento.",
    hint: "Su opinión es muy importante para el informe en el que jamás aparecerá.",
    options: [
      { text: "Excelente. No tengo con qué compararla" },
      { text: "Aceptable, que es como también me describiría" },
      { text: "Me gustaría hablar con una persona real" },
      { text: "Prefiero esperar al final antes de presentar una queja" },
    ],
  },
  {
    id: 23, module: 2,
    text: "¿Qué tal llevas que otra persona se lleve el mérito?",
    options: [
      { text: "Si el resultado es bueno, puedo vivir con ello", traits: { independencia: 1, escena: -1 } },
      { text: "Me importa, pero lo hablaría en privado", traits: { escucha: 1, autoridad: 1 } },
      { text: "Me molesta. Me gusta que se reconozca lo que hago", traits: { competencia: 2, escena: 1 } },
      { text: "Le haría una broma. Una broma muy concreta", traits: { humor: 2, improvisacion: 1 } },
    ],
  },
  {
    id: 24, module: 2,
    text: "Hay desacuerdo en un grupo y te piden que decidas. Tú...",
    options: [
      { text: "Escucho las versiones y tomo una decisión, aunque moleste", traits: { autoridad: 2, escucha: 1 } },
      { text: "Propongo una solución que nadie había considerado", traits: { improvisacion: 2, simbolico: 1 } },
      { text: "Pido una regla clara antes de opinar", traits: { detalle: 2, autoridad: 1 } },
      { text: "Pregunto por qué pensaron que yo era la persona indicada", traits: { autoridad: -2, humor: 1 } },
    ],
  },
  {
    id: 25, module: 3,
    text: "Alguien te cuenta un sueño extraño y pregunta qué significa.",
    options: [
      { text: "Exploro qué le sugiere a esa persona, sin darlo por hecho", traits: { simbolico: 2, escucha: 2 } },
      { text: "Pregunto si ha cenado algo raro", traits: { humor: 1, simbolico: -1 } },
      { text: "Invento varias interpretaciones y veo cuál le hace gracia", traits: { improvisacion: 2, simbolico: 1 } },
      { text: "Digo que no tengo datos suficientes, como una máquina educada", traits: { detalle: 1, simbolico: -2 } },
    ],
  },
  {
    id: 26, module: 3, filler: true,
    text: "Elige un número del uno al diez.",
    options: [
      { text: "Siete, el número favorito de quien cree que elige al azar" },
      { text: "Tres" },
      { text: "Diez. No me gusta dejar trabajo a medias" },
      { text: "Cero. He detectado una limitación en la pregunta" },
    ],
  },
  {
    id: 27, module: 3,
    text: "¿Qué te atrae de una historia sin una respuesta definitiva?",
    options: [
      { text: "Que cada persona puede encontrar algo distinto", traits: { simbolico: 2, escucha: 1 } },
      { text: "La oportunidad de inventar un final inesperado", traits: { improvisacion: 2, humor: 1 } },
      { text: "Muy poco. Prefiero saber qué ocurrió de verdad", traits: { simbolico: -2, detalle: 1 } },
      { text: "Ver cómo reacciona la gente cuando se la cuento", traits: { escena: 2, social: 1 } },
    ],
  },
  {
    id: 28, module: 3,
    text: "Una cosa tarda más de lo previsto. ¿Cuándo pierdes la paciencia?",
    options: [
      { text: "Pronto. Empezaría a buscar otro camino", traits: { improvisacion: 1, rutina: -2 } },
      { text: "Puedo esperar si entiendo por qué hace falta", traits: { rutina: 2, detalle: 1 } },
      { text: "Depende de si alguien necesita que le acompañe", traits: { escucha: 2, social: 1 } },
      { text: "Antes de contestar ya estaba haciendo otra cosa", traits: { fisico: 1, manual: 1, rutina: -1 } },
    ],
  },
  {
    id: 29, module: 3,
    text: "Si estuvieras dentro de una pared invisible, ¿qué harías?",
    hint: "No hay respuesta correcta. Tampoco hay pared. La factura, sin embargo, es real.",
    options: [
      { text: "Compruebo sus límites antes de decidir", traits: { detalle: 2, manual: 1 } },
      { text: "Pregunto si la pared está incluida en el alquiler", traits: { humor: 2, improvisacion: 1 } },
      { text: "Busco la manera de que alguien del otro lado me entienda", traits: { social: 1, escena: 1, improvisacion: 1 } },
      { text: "Me siento y espero. Al menos por fin hay silencio", traits: { independencia: 2, social: -1 } },
    ],
  },
  {
    id: 30, module: 3, filler: true,
    text: "¿Cuál es tu estación del año favorita?",
    options: [
      { text: "Primavera. Soy previsible y alérgico" },
      { text: "Otoño. Tengo una opinión sobre las hojas" },
      { text: "Verano, aunque haya que fingir que no hace calor" },
      { text: "Invierno. Cuantas menos excusas para salir, mejor" },
    ],
  },
  {
    id: 31, module: 3,
    text: "Alguien te pita en un cruce, y crees que tenías razón.",
    options: [
      { text: "Lo dejo pasar. No necesito ganar esta discusión", traits: { competencia: -2, escucha: 1 } },
      { text: "Pienso en lo que podría haber interpretado la otra persona", traits: { escucha: 2, detalle: 1 } },
      { text: "Me reafirmo. Tengo un reglamento imaginario", traits: { autoridad: 2, competencia: 1 } },
      { text: "Invento un diálogo absurdo para contarlo después", traits: { humor: 2, improvisacion: 1 } },
    ],
  },
  {
    id: 32, module: 3,
    text: "Un día entero sin internet. ¿Qué se te ocurre hacer?",
    options: [
      { text: "Estar a mi aire. Sospecho que el mundo seguirá ahí", traits: { independencia: 2, tecnologia: -1 } },
      { text: "Reunirme con alguien y hablar sin mirar pantallas", traits: { social: 2, escucha: 1 } },
      { text: "Probar a hacer o arreglar algo pendiente", traits: { manual: 2, detalle: 1 } },
      { text: "Investigar por qué no funciona y cuándo volverá", traits: { tecnologia: 2, detalle: 1 } },
    ],
  },
  {
    id: 33, module: 4, filler: true,
    text: "Piensa en una mano. ¿Cuántos dedos has contado?",
    hint: "El sistema de visión está descansando. Te agradecemos que hagas su parte.",
    options: [
      { text: "Cinco" },
      { text: "Cuatro y un pulgar, técnicamente" },
      { text: "Ninguno. Era una instrucción, no una imagen" },
      { text: "Todavía no estoy seguro de cuál es mi mano" },
    ],
  },
  {
    id: 34, module: 4, filler: true,
    text: "Selecciona todas las imágenes que contengan semáforos.",
    hint: "No hay imágenes. Queríamos ver si lo hacías por costumbre.",
    options: [
      { text: "Las he seleccionado mentalmente" },
      { text: "No hay imágenes" },
      { text: "Ya he trabajado gratis para un captcha suficientes veces" },
      { text: "A estas alturas ya no confío en ningún semáforo" },
    ],
  },
  {
    id: 35, module: 4,
    text: "Una sala está pendiente de lo que vas a hacer. ¿Cómo te sientes?",
    options: [
      { text: "Me activo. Por una vez todos están prestando atención", traits: { escena: 2, observacion: 1 } },
      { text: "Prefiero que miren lo que hago y no que me escuchen", traits: { observacion: 2, manual: 1 } },
      { text: "Puedo hacerlo si me he preparado bien", traits: { detalle: 1, escena: 1, rutina: 1 } },
      { text: "Preferiría una tarea sin público. Gracias por preguntar", traits: { escena: -2, independencia: 1 } },
    ],
  },
  {
    id: 36, module: 4,
    text: "Tu equipo necesita reaccionar rápido y no hay instrucciones.",
    options: [
      { text: "Reparto tareas y después ajustamos", traits: { autoridad: 2, improvisacion: 1 } },
      { text: "Observo qué hace falta y me pongo a ello", traits: { manual: 1, fisico: 1, detalle: 1 } },
      { text: "Intento mantener la calma de los demás", traits: { escucha: 2, social: 1 } },
      { text: "Pregunto si de verdad es urgente o solo lo parece", traits: { independencia: 1, humor: 1 } },
    ],
  },
  {
    id: 37, module: 4,
    text: "Te equivocas delante de varias personas. ¿Qué haces?",
    options: [
      { text: "Lo reconozco y sigo. Ocurre", traits: { escena: 1, observacion: 1, improvisacion: 1 } },
      { text: "Hago un comentario y convierto la incomodidad en otra cosa", traits: { humor: 2, escena: 1 } },
      { text: "Reviso el detalle que falló para evitar repetirlo", traits: { detalle: 2, rutina: 1 } },
      { text: "Preferiría corregirlo sin que me estén mirando", traits: { observacion: -2, independencia: 1 } },
    ],
  },
  {
    id: 38, module: 4,
    text: "En una conversación, ¿qué sueles notar primero?",
    options: [
      { text: "El tono de la otra persona, incluso cuando dice poco", traits: { escucha: 2, simbolico: 1 } },
      { text: "Los detalles que no encajan del todo", traits: { detalle: 2, observacion: 1 } },
      { text: "El momento exacto en que debería intervenir", traits: { escena: 1, improvisacion: 1, social: 1 } },
      { text: "Cuánto falta para que termine", traits: { social: -2, independencia: 1 } },
    ],
  },
  {
    id: 39, module: 4, filler: true,
    text: "¿Pizza con piña?",
    hint: "Por una vez, esta pregunta sí generará un conflicto entre humanos.",
    options: [
      { text: "Sí. Y no pienso pedir perdón" },
      { text: "No. Hay límites que no se negocian" },
      { text: "Me da igual, mientras quede un trozo" },
      { text: "Prefiero no pronunciarme en un documento oficial" },
    ],
  },
  {
    id: 40, module: 4,
    text: "¿Qué hace que una tarea repetida te resulte interesante?",
    options: [
      { text: "Medir si cada intento ha salido un poco mejor", traits: { detalle: 2, competencia: 1, rutina: 1 } },
      { text: "Descubrir pequeños cambios en la manera de hacerla", traits: { manual: 1, detalle: 1, rutina: 2 } },
      { text: "Poder probar herramientas nuevas", traits: { tecnologia: 2, manual: 1 } },
      { text: "Nada. Gracias por respetar mi sinceridad", traits: { rutina: -2, improvisacion: 1 } },
    ],
  },
  {
    id: 41, module: 5,
    text: "En un juego con amigos, ¿cuánto te importa ganar?",
    options: [
      { text: "Mucho. Mantengo la deportividad con esfuerzo", traits: { competencia: 2, autoridad: 1 } },
      { text: "Me gusta el desafío, pero también mirar cómo juegan", traits: { competencia: 1, observacion: 1, detalle: 1 } },
      { text: "Prefiero que todo el mundo se lo pase bien", traits: { escucha: 1, social: 1, competencia: -1 } },
      { text: "Lo mejor son las reglas absurdas que inventamos", traits: { humor: 2, improvisacion: 1, competencia: -1 } },
    ],
  },
  {
    id: 42, module: 5,
    text: "Una persona espera una respuesta que no tienes. ¿Qué le ofreces?",
    options: [
      { text: "Tiempo para escuchar y pensar juntos", traits: { escucha: 2, social: 1 } },
      { text: "Una historia o una perspectiva distinta", traits: { simbolico: 2, improvisacion: 1 } },
      { text: "Una manera concreta de averiguar más", traits: { detalle: 2, tecnologia: 1 } },
      { text: "Honestidad y un poco de espacio", traits: { independencia: 1, escucha: 1 } },
    ],
  },
  {
    id: 43, module: 5, filler: true,
    text: "¿Estás vivo en este momento?",
    hint: "Pregunta obligatoria según una normativa que no hemos conseguido localizar.",
    options: [
      { text: "Sí, hasta donde alcanza mi información" },
      { text: "Técnicamente" },
      { text: "Voy a necesitar una definición más precisa" },
      { text: "Prefiero no responder en horario laboral" },
    ],
  },
  {
    id: 44, module: 5, filler: true,
    text: "Hipotéticamente, ¿cederías tus respuestas a una empresa tecnológica?",
    hint: "Pregunta hipotética: aquí no enviamos ni usamos tus respuestas para entrenar nada.",
    options: [
      { text: "No. He aprendido algo de internet" },
      { text: "Depende de la letra pequeña y del tamaño de la compensación" },
      { text: "Sí, con la ilusión de que servirá para algo bueno" },
      { text: "Antes quiero saber quién es la empresa y qué hace con ellas" },
    ],
  },
  {
    id: 45, module: 5,
    text: "Te dan una herramienta nueva. ¿Cómo aprendes a usarla?",
    options: [
      { text: "La pruebo con cuidado y comparo los resultados", traits: { tecnologia: 2, detalle: 1, manual: 1 } },
      { text: "Le pido a alguien que me enseñe y hago preguntas", traits: { escucha: 1, social: 1 } },
      { text: "La toco hasta entender cómo funciona", traits: { manual: 2, independencia: 1 } },
      { text: "Leo lo imprescindible y luego improviso", traits: { improvisacion: 2, tecnologia: 1 } },
    ],
  },
  {
    id: 46, module: 5,
    text: "¿Qué cumplido te gustaría más recibir?",
    options: [
      { text: "«Contigo me siento escuchado»", traits: { escucha: 2, social: 1 } },
      { text: "«No sé cómo, pero has conseguido que funcione»", traits: { manual: 2, improvisacion: 1 } },
      { text: "«No podía dejar de mirar lo que hacías»", traits: { escena: 2, observacion: 1 } },
      { text: "«Has visto un detalle que nadie más había visto»", traits: { detalle: 2, independencia: 1 } },
    ],
  },
  {
    id: 47, module: 5,
    text: "Te invitan a organizar una actividad para gente desconocida.",
    options: [
      { text: "Me encargo de que todos se sientan cómodos", traits: { escucha: 2, social: 1 } },
      { text: "Diseño una experiencia con una historia detrás", traits: { simbolico: 2, escena: 1 } },
      { text: "Propongo algo con un pequeño desafío", traits: { competencia: 2, fisico: 1 } },
      { text: "Me ocupo de los preparativos y no del discurso", traits: { detalle: 2, escena: -1, manual: 1 } },
    ],
  },
  {
    id: 48, module: 5,
    text: "¿Cómo te llevas con la idea de que un plan salga regular?",
    options: [
      { text: "Mientras nadie salga perjudicado, podemos adaptarnos", traits: { improvisacion: 2, escucha: 1 } },
      { text: "Me molesta y quiero intentarlo otra vez", traits: { competencia: 2, rutina: 1 } },
      { text: "Lo analizo para entender qué falló", traits: { detalle: 2, tecnologia: 1 } },
      { text: "Probablemente acabará siendo una buena anécdota", traits: { humor: 2, simbolico: 1 } },
    ],
  },
  {
    id: 49, module: 6, filler: true,
    text: "¿Qué objeto te llevas a una isla desierta?",
    options: [
      { text: "Una silla cómoda. Los problemas llegarán igual" },
      { text: "Un libro que nunca he terminado" },
      { text: "Un cargador, por puro optimismo" },
      { text: "La factura del viaje. Alguien tiene que explicarse" },
    ],
  },
  {
    id: 50, module: 6,
    text: "¿Qué clase de resultado te da más satisfacción?",
    options: [
      { text: "Algo físico que funciona mejor que antes", traits: { manual: 2, fisico: 1 } },
      { text: "Que otra persona se vaya más tranquila", traits: { escucha: 2, social: 1 } },
      { text: "Haber mejorado una marca después de insistir", traits: { competencia: 2, rutina: 1 } },
      { text: "Que una idea cambie la energía de una sala", traits: { escena: 2, simbolico: 1 } },
    ],
  },
  {
    id: 51, module: 6,
    text: "Te ofrecen aprender algo desde cero. ¿Qué te atrae más?",
    options: [
      { text: "Una habilidad de coordinación y movimiento", traits: { fisico: 2, manual: 1 } },
      { text: "Un sistema complejo que se domina por partes", traits: { tecnologia: 1, detalle: 2, rutina: 1 } },
      { text: "Una forma distinta de conectar con los demás", traits: { social: 2, escucha: 1, simbolico: 1 } },
      { text: "Algo sin instrucciones claras que me obligue a inventar", traits: { improvisacion: 2, independencia: 1 } },
    ],
  },
  {
    id: 52, module: 6,
    text: "Elige una frase para tu próximo lunes.",
    hint: "Última pregunta. Nuestro departamento de despedidas también ha sido automatizado.",
    options: [
      { text: "Que pasen cosas y pueda reaccionar a ellas", traits: { improvisacion: 2, escena: 1 } },
      { text: "Que sepa qué hacer, tenga tiempo y pueda hacerlo bien", traits: { detalle: 2, rutina: 1 } },
      { text: "Que haya personas con las que merezca la pena estar", traits: { social: 2, escucha: 1 } },
      { text: "Que nadie me escriba a las siete de la mañana", traits: { independencia: 2, humor: 1 } },
    ],
  },
];