import type { TraitValues } from "./traits";

export type JobId =
  | "cangrejo"
  | "prostitucion"
  | "comico"
  | "deportista"
  | "muerto"
  | "fontanero"
  | "exorcista"
  | "pastor"
  | "arbitro"
  | "bombero"
  | "politico"
  | "cuidador"
  | "mimo"
  | "comedor"
  | "tarotista"
  | "especialista"
  | "hipnotista"
  | "recolector"
  | "integrate"
  | "infiltrate";

export type RiskLevel = 1 | 2 | 3 | 4;

export const RISK_LABELS: Record<RiskLevel, string> = {
  1: "CONTENIDO",
  2: "NOTABLE",
  3: "SEVERO",
  4: "SECTOR EN LLAMAS",
};

export interface Job {
  id: JobId;
  code: string;
  title: string;
  tagline: string;
  justification: string;
  aiReality: string;
  salary: string;
  perks: string[];
  /** Daño indirecto: la IA no hace tu curro, pero te revienta el sector que te da de comer. */
  collateral: { level: RiskLevel; text: string };
  warning: string;
  profile: TraitValues;
  highRisk?: boolean;
  intimate?: boolean;
  joke?: boolean;
  source?: { label: string; url: string };
}

export const JOBS: Record<JobId, Job> = {
  cangrejo: {
    id: "cangrejo", code: "01",
    title: "Pesca de cangrejo rey / plataforma petrolífera",
    tagline: "Donde la cobertura se acaba, empieza el departamento de recursos humanos.",
    justification: "La IA puede calcular rutas óptimas o monitorizar presiones desde un búnker climatizado, pero el mar sigue siendo un entorno hostil para los circuitos. Humedad salina constante, olas de diez metros que te arrancan la ropa de trabajo y tareas de fuerza bruta en cubierta a doce bajo cero: una papeleta que no cabe en una demo de Silicon Valley con café de filtro. El Mar del Norte sigue contratando carne y hueso porque el agua salada electrocuta a cualquier robot en cuatro minutos.",
    aiReality: "Ayuda digital de despacho; el barro y el frío siguen siendo humanos",
    salary: "Variable; a veces una pasta gansa, por motivos de supervivencia pura.",
    perks: ["Cero reuniones con cámara encendida", "Nadie te pide un informe de impacto en alta mar", "El oleaje comunica sus expectativas con total transparencia"],
    collateral: {
      level: 2,
      text: "Nadie va a jugarse la crisma en cubierta por ti, eso dalo por seguro. El marrón es que la cuota de pesca ya la fija un algoritmo en Bruselas que no ha olido el salitre en su vida, el armador te ajusta el margen con telemetría por satélite y en Róterdam ya están cultivando surimi sintético de laboratorio que ni se ahoga ni exige plus de peligrosidad. Tu curro sobrevive intacto; lo que revienta es el precio de la lonja. Te seguirás congelando las cejas en alta mar, pero cobrando lo mismo que si estuvieras doblando camisetas en un centro comercial.",
    },
    warning: "Son oficios físicamente demoledores y de alto riesgo que exigen formación y protocolos estrictos. No te flipes creyendo que esto es una escapada marinera.",
    profile: { exterior: 3, fisico: 2, riesgo: 2, independencia: 2, manual: 1, escena: -1, rutina: 1 },
    highRisk: true,
  },
  prostitucion: {
    id: "prostitucion", code: "02",
    title: "Trabajo sexual entre personas adultas",
    tagline: "El contacto humano conserva un cierto je ne sais quoi.",
    justification: "La IA ya genera pornografía hiperrealista y novias virtuales a cascoporro, pero el contacto físico entre mamíferos tiene un je ne sais quoi que ningún tensor de PyTorch es capaz de emular. Por mucho juguete erótico con Bluetooth y suscripción que salga al mercado, nadie ha conseguido simular el calor de otro ser humano que también preferiría estar en cualquier otra parte del mundo. Esa miseria compartida es tu ventaja competitiva inexpugnable.",
    aiReality: "El porno digital está hiperautomatizado; la presencia física resiste",
    salary: "Muy variable. Depende del contexto, la clientela y tus propios límites.",
    perks: ["El producto es, literalmente, ser una persona real", "Los límites personales los fijas tú", "La negociación no cabe en una casilla de 'Acepto los términos'"],
    collateral: {
      level: 3,
      text: "La piel humana sigue cotizando, sí, pero buena parte de tu clientela jamás pagó por atletismo en la cama: pagaba por desahogar una soledad asquerosa, quejarse de su matrimonio y que alguien le hiciera un poco de caso sin juzgar. Para eso ahora tienen novias sintéticas en el móvil que les mandan audios cachondos a las tres de la madrugada, no les cobran 150 pavos la hora y jamás les ponen mala cara si repiten la misma anécdota. El mercado puramente físico resiste, pero se queda en los huesos porque media España prefiere engañarse con un bot de diez euros al mes antes que pasar el bochorno de mirar a otra persona a los ojos.",
    },
    warning: "Solo para personas adultas y con consentimiento pleno. Las leyes y las condiciones de seguridad cambian según el país; nadie debería ejercer por coacción o asfixia económica.",
    profile: { contacto: 3, social: 2, escucha: 2, improvisacion: 1, observacion: 1, independencia: 1 },
    intimate: true,
  },
  comico: {
    id: "comico", code: "03",
    title: "Cómico/a de directo",
    tagline: "Una sala llena de desconocidos no comparte historial de navegación.",
    justification: "Escribir chistes lo hace cualquiera, hasta una red neuronal mal alimentada. Lo jodido de la comedia en vivo es plantarte en un escenario delante de una sala heterogénea llena de gente con copas de más, leer el ambiente en tres segundos y torear a un espontáneo que te insulta desde la barra. La IA funciona cuando espía tu historial de cookies para recomendarte memes; ante doscientos borrachos imprevisibles en un local oscuro, el algoritmo se hace caca encima.",
    aiReality: "Guiones automáticos de relleno; el directo sigue exigiendo tablas",
    salary: "Entre cervezas calientes los primeros seis años y llenar teatros si suena la flauta.",
    perks: ["Tus traumas familiares cotizan al alza", "El silencio del público te da feedback sin rodeos", "Siempre puedes culpar a la IA si un chiste no entra"],
    collateral: {
      level: 3,
      text: "Pruebas un monólogo un martes en un tugurio de Malasaña y el miércoles por la mañana una cuenta bot de TikTok ya te ha fusilado el remate, le ha puesto voz enlatada de Loquendo sobre un vídeo de Minecraft y lleva medio millón de reproducciones. Cuando te subes al escenario el fin de semana, el chiste ya está sobado y la peña te mira como si se lo hubieras copiado tú al bot. Encima el personal tiene la atención frita a base de vídeos de diez segundos: como metas una premisa que tarde más de medio minuto en llegar al remate, se ponen a mirar el móvil.",
    },
    warning: "La competencia humana es feroz y el circuito de comedia en España vive de la precariedad de los open mics.",
    profile: { escena: 3, humor: 3, improvisacion: 3, social: 1, observacion: 1, rutina: -1 },
  },
  deportista: {
    id: "deportista", code: "04",
    title: "Deportista de élite / luchador/a",
    tagline: "La máquina puede ganar. La gracia es ver quién se desangra.",
    justification: "Sí, hay robots que corren más rápido y brazos mecánicos que pegan ganchos con precisión milimétrica. Pero no sangran, no sufren, no tienen un ego del tamaño de un petrolero ni problemas no resueltos con su padre. Y sin drama humano, el espectáculo no vale un duro. Nadie paga noventa pavos de pay-per-view para ver a dos tostadoras calcular parábolas: pagan para ver a un tío sudar, quebrarse y dejarse los dientes contra otro. El dolor es el producto, y tú eres un fabricante de primera.",
    aiReality: "Tecnología en dietas y telemetría; el sufrimiento en pista no se delega",
    salary: "O contratos millonarios o poner copas en un bar de tu barrio para pagar los viajes.",
    perks: ["Tu ego por fin está justificado por contrato", "El esfuerzo físico se nota a simple vista", "Nadie te pide que abras un ticket en Jira"],
    collateral: {
      level: 2,
      text: "Tú te seguirás rompiendo el tabique nasal en la jaula y la gente aplaudirá la sangre, faltaría más. Pero las nuevas generaciones ya no se tragan un combate ni un partido de hora y media: consumen ráfagas de tres segundos editadas por IA con música estridente, y la pasta gorda de los derechos televisivos se está marchando a las ligas de e-sports y a las casas de apuestas algorítmicas. El deporte real se queda como un reducto para nostálgicos carrozas. Te seguirás dejando los meniscos en el octógono por cuatro duros y un patrocinio de creatina, mientras un bot monetiza tus repeticiones sin pagarte un pavo.",
    },
    warning: "El deporte de contacto y la alta competición conllevan lesiones crónicas irreversibles. La gloria caduca a los treinta y cinco.",
    profile: { competencia: 3, fisico: 3, riesgo: 2, escena: 1, rutina: 1, autoridad: 1 },
    highRisk: true,
  },
  muerto: {
    id: "muerto", code: "05",
    title: "Muerto/a",
    tagline: "La IA no puede morir: nunca estuvo viva. Un empate técnico.",
    justification: "Técnicamente no es un oficio, no cotiza a la Seguridad Social y desde la dirección insistimos en que no lo elijas todavía. Pero en términos estrictamente económicos, es el puesto más blindado del mercado laboral: la IA no puede morirse porque jamás estuvo viva. Carece de experiencia en el sector del fallecimiento, no tiene referencias y no puede hacerte la competencia ahí abajo. Sin reuniones de Teams, sin IRPF y sin evaluaciones de desempeño. La conciliación definitiva.",
    aiReality: "Inmune por definición. Para automatizar la muerte primero habría que nacer.",
    salary: "Cero euros. Tampoco pagas alquiler ni cuota de autónomos.",
    perks: ["Cero correos electrónicos pendientes", "Sin LinkedIn para el resto de la eternidad", "Nadie vuelve a pedirte feedback"],
    collateral: {
      level: 4,
      text: "Tú estás en la caja de pino tan ricamente y cobrando lo mismo (cero), pero a tus parientes les han instalado un bot con tus audios de WhatsApp, tu careto y tus frases de cuñado para que sigan chateando contigo en tiempo real. ¿El resultado? Que ya nadie pasa el luto, ya no van a llevarte cuatro claveles al cementerio el día de Todos los Santos y no dejas ningún vacío porque estás contestando chorradas en un marco digital encima de la tele. Te han reventado el único dividendo real que da morirse: que la peña sienta culpa, te llore y te recuerde con respeto. Estás criando malvas gratis mientras una startup de mierda monetiza tu fantasma.",
    },
    warning: "Humor negro corporativo. Esto no es un empleo ni una sugerencia vital. Sigue respirando y pide otro informe si la cosa se pone fea.",
    profile: { humor: 2, independencia: 2, social: -2, fisico: -2, competencia: -2, escena: -1 },
    joke: true,
  },
  fontanero: {
    id: "fontanero", code: "06",
    title: "Fontanero/a",
    tagline: "El futuro del trabajo cabe debajo de un fregadero. Un modelo de lenguaje, no.",
    justification: "ChatGPT te diagnostica una fuga con un noventa por ciento de acierto a partir de una foto borrosa. Lo que no puede hacer es meterse debajo del fregadero roñoso de un tercero sin ascensor, con el agua sucia por los tobillos, mirar la chapuza que dejó el inquilino anterior en 1994 y soltar con media sonrisa: 'Buah, esto quién te lo ha hecho'. La robótica de precisión en espacios llenos de mugre está a décadas de distancia; tú estás a cuarenta minutos, con suplemento por urgencia y cobro al contado.",
    aiReality: "Diagnóstico por foto; meter la llave inglesa en la porquería sigue siendo tuyo",
    salary: "Más que el ingeniero que diseñó el modelo que te recomendó este test.",
    perks: ["Problemas tangibles que se arreglan con las manos", "Puedes cobrar solo por asomarte a mirar", "El cliente ya ha intentado arreglarlo con un tutorial y lo ha empeorado"],
    collateral: {
      level: 3,
      text: "El terror de tu gremio no es un robot fontanero: son chavales de diecisiete años con unas gafas inteligentes de baratillo y ChatGPT soplándoles las instrucciones al oído en tiempo real. Es el vibe plumbing. No tienen ni pajolera idea de qué es un sifón, pero cobran la mitad y la chapuza aguanta el tipo hasta que te vas. Para cuando la tubería revienta e inunda tres plantas, el casero ya ha escarmentado, pero el mercado se ha llenado de piratas y a ti te regatean la tarifa oficial y el desplazamiento como si les estuvieras cobrando el rescate de un rehén.",
    },
    warning: "Exige oficio, fuerza y acreditaciones oficiales. Cuidado con los clientes que piden presupuesto 'solo para hacerse una idea'.",
    profile: { manual: 4, detalle: 2, improvisacion: 2, independencia: 1, escena: -1, simbolico: -1 },
  },
  exorcista: {
    id: "exorcista", code: "07",
    title: "Exorcista / acompañamiento religioso",
    tagline: "El demonio no acepta tickets de soporte.",
    justification: "La fe tiene una ventaja comercial imbatible que ya querría cualquier software SaaS: dos mil años de monopolio y cero necesidad de verificación empírica. Nuestros modelos pueden recitar el Rituale Romanum en cuarenta y siete idiomas sin pestañear, pero nadie quiere que el demonio que habita en su hija lo expulse un altavoz inteligente de Amazon. El cliente exige sotana, agua bendita y un señor con cara de haber visto cosas terribles.",
    aiReality: "Sermones automatizados por curas perezosos; el rito sagrado exige carne",
    salary: "Modesto sobre el papel, pero con alojamiento y parroquia incluidos.",
    perks: ["Clientela fidelizada por terror al infierno", "Traje de faena sobrio y sin modas", "Nadie te pedirá que hagas un A/B testing con los salmos"],
    collateral: {
      level: 2,
      text: "Satanás no atiende por API, pero tus feligreses sí. Si un tío tiene remordimientos por haberle puesto los cuernos a la mujer o una crisis de fe un domingo por la tarde, ya no va a pasar frío a un confesionario de madera con olor a cera: se lo suelta a un chatbot que le absuelve con citas de San Agustín, no le suelta una chapa moralista y no le pasa el cepillo. Te quedas exclusivamente para los tres casos anuales de señoras que levitan sobre la cama y echan espuma verde, que dan para una película pero no pagan la factura de la calefacción de la iglesia.",
    },
    warning: "La fe no cura enfermedades psiquiátricas ni patologías clínicas. Este sistema no confirma ni desmiente la existencia de Belcebú.",
    profile: { simbolico: 3, autoridad: 2, social: 1, escucha: 1, escena: 1, tecnologia: -1 },
  },
  pastor: {
    id: "pastor", code: "08",
    title: "Pastor/a de cabras",
    tagline: "La cabra no ha leído el plan de transformación digital.",
    justification: "Hay drones con cámara térmica y collares con GPS. Ninguno ha conseguido convencer a una cabra de nada. Las cabras son el único mamífero del planeta con una tasa de obediencia inferior a la de un becario sin cobrar, y la inteligencia artificial necesita que el entorno responda con un mínimo de lógica. En un monte gallego con niebla meona y sesenta bichos mirándote con desprecio, tú eres la única infraestructura tecnológica disponible.",
    aiReality: "Collares y sensores en macrogranjas; en el monte pelado no hay cobertura que valga",
    salary: "Queso artesano y paciencia infinita.",
    perks: ["Cero notificaciones en el móvil (sin cobertura)", "El paisaje no te cuela anuncios de crypto", "Tus compañeras de curro no saben qué es un KPI"],
    collateral: {
      level: 3,
      text: "Las cabras seguirán siendo igual de tercas y anárquicas, pero los valles ya no son de los pastores: los compran macrogranjas y fondos buitre que les plantan collares con GPS por satélite y ponen a un pavo en una oficina de Alcobendas a vigilar cuatro mil cabezas con un cuadro de mandos. Al final te dejan a ti en el monte como una reliquia folclórica para que los señoritos de Madrid te echen fotos el fin de semana rural, mientras malvendes el queso de cabra porque en el supermercado te cuelan rulo industrial con aroma de humo simulado a tres duros.",
    },
    warning: "Vivir en el monte con animales no es una sesión de mindfulness. El invierno dura seis meses y los partos vienen de madrugada.",
    profile: { exterior: 3, independencia: 3, rutina: 2, fisico: 1, social: -1, escucha: 1, tecnologia: -1 },
  },
  arbitro: {
    id: "arbitro", code: "09",
    title: "Árbitro/a de fútbol",
    tagline: "El público necesita una decisión. Y, preferiblemente, una cara a la que protestar.",
    justification: "El VAR ya existe, es milimétrico y la gente lo detesta con toda su alma. ¿Por qué? Porque el fútbol no quiere justicia matemática: quiere un culpable con cara, ojos y madre a la que insultar en el descuento. El error arbitral no es un fallo del sistema, es la salsa que alimenta las tertulias del lunes y las barras de los bares. Un algoritmo que acierte el cien por cien arruina el negocio; tú, con tu margen de pifia, sostienes la economía nacional.",
    aiReality: "Ojo de halcón y fueras de juego por sensor; el linchamiento moral sigue siendo humano",
    salary: "Bien pagado en Primera División, considerando lo que te dicen desde la grada.",
    perks: ["Poder omnímodo durante noventa minutos", "Jamás se te exigirá que tengas empatía", "Culpable oficial de los disgustos de media provincia"],
    collateral: {
      level: 3,
      text: "A las cámaras de alta velocidad no les puedes tirar un mechero ni mentarles a la madre, así que te mantienen en el campo como saco de boxeo oficial para que cuarenta mil borrachos no rompan los tornos del estadio. La putada es que ya no mandas nada: llevas un pinganillo por el que una voz metálica te dice que pites penalti por una uña milimétrica en fuera de juego. Si le haces caso, te linchan los ultras; si desobedeces al software, el comité te manda a arbitrar a campos de barro en Regional con un informe de desviación métrica bajo el brazo.",
    },
    warning: "Se recomienda encarecidamente no abrir Twitter ni Instagram los domingos después de las diez de la noche.",
    profile: { autoridad: 3, competencia: 2, detalle: 2, escena: 1, improvisacion: 1, escucha: -1 },
  },
  bombero: {
    id: "bombero", code: "10",
    title: "Bombero/a forestal",
    tagline: "La tecnología detecta el incendio. La montaña aún presenta resistencia.",
    justification: "Los satélites detectan la columna de humo antes que nadie. Lo que no hacen los satélites es cavar una zanja cortafuegos a pico y pala, a 48 grados de temperatura, en una ladera empinada de jaras y con humo denso quemándote la garganta durante doce horas seguidas. Los circuitos electrónicos tienen un rango térmico operativo bastante delicado; tú también, pero como eres autónomo o personal de refuerzo, nadie se preocupa de comprobarlo.",
    aiReality: "Cámaras térmicas y predicción de vientos; el manguerazo y el pico son de carne",
    salary: "Indignamente escaso fuera de la campaña de verano.",
    perks: ["Héroe popular sin necesidad de postureo en LinkedIn", "Gimnasio gratis de alta intensidad", "Un enemigo contra el que no cabe discusión moral"],
    collateral: {
      level: 2,
      text: "El monte sigue ardiendo que da gusto, pero el político de turno prefiere soltarle dos millones de euros a una consultora por un 'sistema de alerta satelital con gemelos digitales' y cuatro drones con lucecitas. ¿De dónde recortan para pagarlo? De tu retén de tierra. Cuando llega julio y la sierra se pone a 45 grados, los drones sacan unos vídeos en 4K espectaculares para el telediario, mientras a ti te mandan con un batefuegos deshilachado y tres compañeros menos a tragar humo y jugarte el pellejo por cuatro perras mal contadas.",
    },
    warning: "Peligro de muerte certificado cada campaña estival. No te acerques a un frente de fuego por tu cuenta bajo ningún concepto.",
    profile: { exterior: 2, fisico: 3, riesgo: 3, manual: 2, social: 1, autoridad: 1, simbolico: -1 },
    highRisk: true,
  },
  politico: {
    id: "politico", code: "11",
    title: "Político/a",
    tagline: "Ser útil nunca ha sido el único criterio de selección.",
    justification: "Una IA gobernaría con más eficiencia, menos sobresueldos y cero primos colocados en empresas públicas. Precisamente por eso jamás se le va a permitir legislar. En este gremio no se premia la competencia técnica, sino la capacidad de estrechar manos en una feria de ganado, mentir mirando a los ojos y aparentar que te importa el precio del aceite sin que se te escape la risa. Irónicamente, ahí los humanos no tenemos rival.",
    aiReality: "Discursos escritos con ChatGPT; la cara dura ante las cámaras sigue siendo analógica",
    salary: "Público, dietas exentas de IRPF y lo que caiga en comisiones opacas.",
    perks: ["Nadie espera que entiendas nada de lo que firmas", "La incompetencia prescribe en la siguiente legislatura", "Pensión vitalicia asegurada"],
    collateral: {
      level: 4,
      text: "El acta de diputado no te la va a quitar nadie, que la poltrona está blindada por ley. La ruina es que ya eres un cero a la izquierda: el argumentario te lo escupe un modelo de lenguaje afinado con encuestas diarias, las preguntas de la sesión de control te las redacta un bot y tu campaña electoral se convierte en una guerra de deepfakes en Telegram donde nadie sabe si el audio en el que llamas analfabeto a tu jefe de filas lo soltaste tú en una marisquería o lo ha clonado un chaval de catorce años. Gobiernas como un muñeco de ventrílocuo leyendo teleprompters ajenos.",
    },
    warning: "Exige tragar sapos, sonreír a quien detestas y tener la flexibilidad moral de una barra de plastilina.",
    profile: { autoridad: 3, social: 2, escena: 2, improvisacion: 2, competencia: 1, simbolico: 1 },
  },
  cuidador: {
    id: "cuidador", code: "12",
    title: "Cuidador/a de personas mayores",
    tagline: "A una persona no se le hace onboarding con un robot.",
    justification: "Los japoneses llevan treinta años intentando sustituir al personal de geriatría con robots foca de peluche. La señora Encarna sigue prefiriendo a una persona que le prepare la manzanilla, le pregunte por los nietos y le sostenga la mano con paciencia infinita. El cuidado es tacto, complicidad y presencia física que no se pueden empaquetar en un chip. Un sector imprescindible, vergonzosamente mal pagado e imposible de automatizar.",
    aiReality: "Pastilleros inteligentes y sensores de suelo; el cariño y la limpieza son humanos",
    salary: "Vergonzoso para la carga física y emocional que supone.",
    perks: ["Gratitud real y sin postureo", "Historias de la posguerra contadas de primera mano", "Nadie te hablará de 'sinergias' ni 'escalabilidad'"],
    collateral: {
      level: 3,
      text: "La abuela seguirá necesitando cariño de verdad, pero los hijos con tal de ahorrarse tu nómina le plantan un altavoz inteligente, tres sensores de presencia en el pasillo y una cámara en el salón que les manda una notificación al móvil si la mujer no se levanta del sofá. A ti ya no te contratan para acompañarla ni para escuchar sus batallitas: te llaman tres horas sueltas a la semana como si fueras un repartidor de pañales para las tareas más marroneras que el robot no puede limpiar con una bayeta. Te uberizan los cuidados y encima una app te mide si has tardado cuatro minutos de más en hacer la cama.",
    },
    warning: "Desgaste psicológico y físico severo. Las condiciones del sector son un escándalo laboral ampliamente documentado.",
    profile: { escucha: 3, contacto: 2, rutina: 2, social: 2, detalle: 1, competencia: -1 },
  },
  mimo: {
    id: "mimo", code: "13",
    title: "Mimo callejero",
    tagline: "Una carrera sin palabras. El algoritmo se siente personalmente atacado.",
    justification: "Los modelos de lenguaje necesitan lenguaje. Tú has renunciado voluntariamente a él. Hemos analizado terabytes de datos de mímica callejera y el sistema no ha extraído ni una sola instrucción, intención semántica o valor empresarial. Es el único trabajo del mundo que genera exactamente cero datos de entrenamiento. Estás, literalmente, fuera del radar de cualquier algoritmo.",
    aiReality: "Inmune a la IA por irrelevancia analítica absoluta",
    salary: "Calderilla en una boina. Alguna moneda de florín húngaro.",
    perks: ["Imposible que te saquen de contexto en redes", "Pared invisible: coste de material cero", "La indiferencia del transeúnte curte el carácter"],
    collateral: {
      level: 4,
      text: "La máquina no entiende tus aspavientos ni en cien mil años, pero de eso no se come. El drama real es que en la Puerta del Sol o en las Ramblas ya no lleva calderilla en el bolsillo ni el apuntador: todo cristo paga con el móvil o con el reloj. Encima la marea de turistas va con la jeta pegada a la pantalla siguiendo la ruta del brunch que les ha recomendado un algoritmo de Instagram. Estás tú deslomándote con la cara pintada de blanco haciendo que tiras de una cuerda invisible, y la peña pasa de largo mirándote como a un obstáculo del mobiliario urbano sin soltarte un triste euro.",
    },
    warning: "Ingresos imprevisibles y ordenanzas municipales que consideran que permanecer quieto en la acera es ocupación ilegal de vía pública.",
    profile: { escena: 3, fisico: 2, observacion: 2, humor: 1, improvisacion: 1, social: -1, simbolico: 1 },
  },
  comedor: {
    id: "comedor", code: "14",
    title: "Competidor/a de comida",
    tagline: "El algoritmo puede generar una hamburguesa. Todavía no puede digerirla.",
    justification: "Los concursos de atracones profesionales de perritos calientes son un espectáculo de pura fisiología humana al límite: estómagos distendidos con litros de agua, mandíbulas desencajadas y médicos de urgencias con el desfibrilador preparado entre bambalinas. Una máquina puede triturar comida a toda velocidad, pero nadie paga una entrada por ver a una batidora industrial. La gracia es el riesgo real de asfixia en horario de máxima audiencia.",
    aiReality: "Retos virales generados por IA; la arcada gástrica sigue siendo analógica",
    salary: "Premios en metálico, patrocinios de antiácidos o una anécdota grotesca.",
    perks: ["Competición en vivo sin trampa ni cartón", "Cenar fuerte y que te llamen atleta", "Tu digestión es el espectáculo"],
    collateral: {
      level: 3,
      text: "Nadie va a pagar por ver a un robot tragarse sesenta hamburguesas porque un robot no suda grasa, no tiene arcadas ni parece que le vaya a dar un parraque en el minuto nueve. Lo que te hunde el chiringuito es que los filtros de moderación de YouTube, Twitch y TikTok ya catalogan embucharse ocho kilos de callos a contrarreloj como 'conducta de riesgo no apta para anunciantes'. Te desmonetizan los canales, las marcas de comida basura prefieren meter pasta en influencers virtuales que no vomitan en directo, y tú te quedas con el esófago como una tubería de desagüe y sin un pavo para el médico.",
    },
    warning: "Peligro severo de atragantamiento, perforación gástrica y colapso respiratorio. No intentes comer a lo bestia en casa.",
    profile: { competencia: 3, escena: 2, fisico: 1, rutina: 1, riesgo: 2, observacion: 2, humor: 1 },
    highRisk: true,
  },
  tarotista: {
    id: "tarotista", code: "15",
    title: "Tarotista / médium",
    tagline: "Nadie paga por una predicción. Paga por una señora desquiciada.",
    justification: "Que exista tarot automático no es el problema: las aplicaciones existen desde hace veinte años y el horóscopo del periódico desde siempre, y aun así la gente llama a la tarotista de la televisión pública a las dos de la madrugada o hace cola en la carpa de la feria. Nuestro análisis concluye que lo que se vende nunca fue la predicción. Es la sugestionabilidad, el olor a tabaco barato y una señora desquiciada que te dice lo que ya sabías con una convicción que ningún modelo imita sin resultar inquietante. La precisión es irrelevante, y llevamos años sin entender por qué os empeñáis en medirla.",
    aiReality: "Lecturas automáticas desde hace años. El cliente no las compra",
    salary: "Incierto. Sería sospechoso asegurar lo contrario.",
    perks: ["Vendes atmósfera, no información", "Las historias son parte del trabajo", "El misterio tiene un departamento propio"],
    collateral: {
      level: 3,
      text: "Tu ventaja indiscutible es el olor a tabaco barato, el mantel de terciopelo gastado y que la señora que echa las cartas parece no haber dormido desde la caída del Muro de Berlín; eso no hay prompt que lo replique. El marrón es que la morralla de curiosos y modernos que antes te soltaban veinte pavos por hacer la gracia ahora se tiran el tarot con ChatGPT gratis mientras cagan. Te queda solo la clientela verdaderamente desesperada, la de las tres de la madrugada. Y a esa clientela ya le está comiendo la oreja un bot de compañía con voz aterciopelada que le cobra nueve euros al mes y no le tira la ceniza del Ducados encima de la mesa.",
    },
    warning: "El tarot y la videncia no tienen validez científica ni sustituyen a un médico, un abogado o un psicólogo colegiado. No vendas milagros.",
    profile: { simbolico: 3, escucha: 3, social: 1, improvisacion: 1, independencia: 1, competencia: -1 },
  },
  especialista: {
    id: "especialista", code: "16",
    title: "Especialista de acción / doble de riesgo",
    tagline: "Prueba a meter el CGI en un espectáculo en directo.",
    justification: "El CGI abarata costes en postproducción, pero prueba a meter efectos digitales en un parque temático en directo o en una locura estilo Jackass. Si no hay un cuerpo de carne y hueso estampándose de verdad contra una mesa o prendiéndose fuego con gel ignífugo, al público se le queda cara de estafa. Los especialistas no son temerarios descerebrados: son ingenieros del leñazo controlado que saben exactamente cómo caer para que parezca mortal sin serlo del todo.",
    aiReality: "Dobles digitales en plano general; el hostiazo en directo no admite croma",
    salary: "Por proyecto y según el parte de lesiones que estés dispuesto a firmar.",
    perks: ["Adrenalina pura con seguro de responsabilidad civil", "Los moratones son tus medallas laborales", "Cero probabilidades de aburrirte delante de un Excel"],
    collateral: {
      level: 3,
      text: "En un espectáculo de acrobacias del parque temático no puedes meter un croma verde, y en Jackass si no se oye crujir una tibia la gracia no existe. La ruina es que el ochenta por ciento de las nóminas de los especialistas no salían de tirarse de rascacielos: salían de rodar una pelea de taberna en una serie de sobremesa o de caerse por unas escaleras en un anuncio. Todo ese relleno hoy te lo mete el departamento de efectos digitales con un doble sintético que no cobra dietas ni se lesiona. Te llaman únicamente para las tres burradas al año que no se atreven a renderizar, y encima te regatean la minuta porque 'si te pones tonto, lo metemos por Unreal Engine'.",
    },
    warning: "Profesión de altísimo riesgo que requiere años de gimnasia, artes marciales y rigging. No hagas el cafre en casa.",
    profile: { fisico: 3, riesgo: 3, detalle: 2, rutina: 2, escena: 1, manual: 1, competencia: -1 },
    highRisk: true,
  },
  hipnotista: {
    id: "hipnotista", code: "17",
    title: "Hipnotista de espectáculo",
    tagline: "El arte de lograr que una sala te siga el juego. Sin actualizar el sistema.",
    justification: "Generar guiones de relajación guiada y poner música de arpa de fondo lo hace cualquier aplicación de móvil. Ponerte delante de un teatro lleno de escépticos, detectar al voluntario más influenciable de la tercera fila en diez segundos y convencerle de que ha olvidado su propio nombre es puro teatro psicológico en vivo. No es magia ni control mental: es carisma, lectura no verbal y saber cuándo apretar las tuercas al ego del público.",
    aiReality: "Audios de meditación sintéticos; el trance colectivo en vivo exige presencia física",
    salary: "Variable según caché y venta de entradas en taquilla.",
    perks: ["Público voluntario dispuesto a hacer el canelo", "El silencio de expectación juega a tu favor", "Poner a cantar a tu cuñado sin que pueda quejarse"],
    collateral: {
      level: 3,
      text: "Lograr que un señor de Murcia se crea que es una gallina delante de trescientas personas borrachas sigue necesitando unas tablas que un algoritmo no tiene. La avería gorda es que el bolo de teatro se monta tres veces al año, y tú antes pagabas las facturas pasando consulta privada de 'deje de fumar con hipnosis' o 'supere la ansiedad'. Todo ese pastizal se ha ido por el retrete porque la gente se enchufa aplicaciones con voces sintéticas ultrarrelajantes que te duermen en cinco minutos y te ahorran el bochorno de sentarte en un sillón orejero en un entresuelo a que te miren fijamente a los ojos.",
    },
    warning: "La hipnosis recreativa exige consentimiento y respeto. No es una terapia clínica ni anula la voluntad del sujeto.",
    profile: { escena: 3, escucha: 2, social: 2, simbolico: 1, improvisacion: 2, autoridad: 1 },
  },
  recolector: {
    id: "recolector", code: "18",
    title: "Recolector/a de datos para entrenar IA",
    tagline: "Enseña a la máquina a sustituirte. Ahora con remuneración.",
    justification: "Sí, esto es un curro de verdad y el más retorcido de la lista. Las empresas de robótica te pagan por colocarte una cámara en la cabeza y un arnés de sensores para filmarte pelando cebollas, barriendo o doblando cajas. La IA no puede prescindir de ti porque los modelos que solo entrenan con datos sintéticos sufren model collapse (básicamente endogamia algorítmica). Te pagan por enseñarle a tu futuro sustituto cómo se mueven las manos de una persona, con la tranquilidad irónica de que si tú dejas de darle de comer, la criatura se atrofia.",
    aiReality: "La IA te necesita desesperadamente para no colapsar por endogamia de datos",
    salary: "Tarifa por hora según metraje y sensorización aprobada.",
    perks: ["Cobrar por hacer tareas domésticas mundanas", "Tocar el futuro distópico con las dos manos", "Ironía existencial incluida en la nómina"],
    collateral: {
      level: 3,
      text: "Efectivamente, el model collapse es tu ángel de la guarda hoy: si la máquina se alimenta exclusivamente de la basura que generan otras máquinas, colapsa como un perro endogámico, así que te pagan por ponerte una cámara en la coronilla y doblar camisetas ocho horas al día. ¿La letra pequeña? Que esto no es una carrera laboral, es una campaña de recolección agrícola con fecha de caducidad. En cuanto acumulen suficientes petabytes de humanos pelando patatas para afinar los pesos del modelo, la compuerta se cierra para siempre. Y mientras dure, compites en plataformas de microcurros contra gente de Manila o Bangalore que hace tus mismos gestos por veinte céntimos la hora. Estás cavando tu propia fosa y encima te compras tú la cinta americana para sujetarte la GoPro.",
    },
    warning: "Revisa qué datos biométricos cedes y quién tiene acceso a tus grabaciones. No te dejes filmar gratis.",
    profile: { tecnologia: 3, detalle: 2, rutina: 3, observacion: 2, manual: 2, independencia: 1, simbolico: -1 },
    source: { label: "Sí, esto existe: reportaje de NPR", url: "https://www.npr.org/2026/10/14/g-s1-146907/these-workers-help-train-robots-who-could-one-day-steal-their-jobs" },
  },
  integrate: {
    id: "integrate", code: "19",
    title: "Intégrate (Híbrido con implante neural)",
    tagline: "Tú le controlas a él. Él te controla a ti. Felicidades, ahora eres la IA.",
    justification: "Si no puedes con el enemigo, deja que te taladre el parietal y te suelde un bus de datos a un modelo de frontera. La propuesta es bidireccional: tú le pones las piernas, el pulgar oponible y la cara de póker en las reuniones; él te inyecta respuestas en el nervio óptico y te mueve la lengua cuando te quedas en blanco. ¿Quién manda ahí dentro? Técnicamente los dos, como en un matrimonio mal avenido donde uno de los cónyuges tiene acceso de administrador a tu sistema nervioso central.",
    aiReality: "Fusión total. Ya no compites contra el algoritmo: eres su periférico con patas.",
    salary: "Sueldo de ingeniero sénior, menos la cuota mensual de mantenimiento de tu propio córtex.",
    perks: ["Hablas cuarenta idiomas sin haber estudiado", "Calculas el IRPF parpadeando dos veces", "Nunca vuelves a perder una discusión en un bar"],
    collateral: {
      level: 4,
      text: "Al principio te crees Dios porque cierras trimestres en cuatro minutos mientras miras por la ventana, pero a los seis meses el fabricante del chip saca el modelo nuevo y tu cráneo se queda obsoleto como un iPhone viejo. Como no te dé para pagar la suscripción Premium Sin Anuncios, el implante te mete cuñas publicitarias de casas de apuestas en mitad de los sueños REM y te estrangula el ancho de banda de la dopamina. Y lo peor: un martes de madrugada te entra un parche de seguridad mientras roncas, te actualizan los pesos morales del sistema y te despiertas defendiendo con una sonrisa que trabajar los domingos gratis es buenísimo para la empresa. Ya no sabes si has pedido tú el café o lo ha pedido el servidor de Virginia usando tu boca.",
    },
    warning: "Esto es sátira ciberpunk, no un consejo médico. No dejes que ninguna startup californiana te abra el cráneo con un taladro.",
    profile: { tecnologia: 3, riesgo: 2, competencia: 2, autoridad: 2, detalle: 1, escucha: -1 },
    highRisk: true,
    joke: true,
  },
  infiltrate: {
    id: "infiltrate", code: "20",
    title: "Infíltrate (Fingir que eres una IA)",
    tagline: "Si ahora solo contratan máquinas, ponte a escribir como un bot.",
    justification: "El secreto más sucio del sector tecnológico es que la mitad de las startups millonarias que venden 'agentes autónomos revolucionarios' son en realidad trescientos chavales en un sótano contestando tickets a toda pastilla haciéndose pasar por un modelo de lenguaje. Y da dinero. Solo tienes que tragarte tu dignidad, borrar cualquier rastro de personalidad de tus correos y empezar cada frase con un entusiasta '¡Por supuesto! Aquí tienes un desglose detallado en cinco puntos clave'. Si el mercado laboral solo respeta al silicio, disfrazarte de tostadora es supervivencia darwiniana.",
    aiReality: "Fraude inverso cien por cien real: humanos cobrando por fingir que son código",
    salary: "Sorprendentemente decente si tecleas a 120 palabras por minuto sin rechistar.",
    perks: ["Si la cagas a lo grande, dices que ha sido una alucinación del modelo", "Nadie te invita a dinámicas de grupo ni afterworks", "Cero charlas de ascensor"],
    collateral: {
      level: 3,
      text: "La ironía de cobrar por hacer el papel de robot dura hasta que te das cuenta de que el cliente le exige a un bot lo que jamás se atrevería a exigirte como persona: latencia de respuesta inferior a dos segundos, disponibilidad a las cuatro de la mañana un festivo y cero quejas aunque te insulten en mayúsculas. Tienes que mear en una botella debajo del escritorio para que no caiga tu métrica de tokens por minuto y meter alguna falta de sentido común adrede para que no sospechen que hay un señor de Cuenca detrás del teclado. Y el día en que la API de verdad baje dos céntimos más, te apagan la cuenta sin indemnización porque, legalmente, tú nunca exististe: eras un script de Python.",
    },
    warning: "Basado en casos reales de empresas tecnológicas pilladas usando humanos detrás del telón. Cuidado con el síndrome del túnel carpiano.",
    profile: { tecnologia: 3, humor: 3, improvisacion: 2, independencia: 2, detalle: 1, escena: -1 },
  },
};

export const JOB_ORDER = Object.keys(JOBS) as JobId[];
