export const phoneDisplay = "900 164 036";
export const phoneHref = "tel:+34900164036";

export const timeline = [
  {
    year: "1640",
    title: "Londres. Nace Carlisle",
    text: "Hijo de un pastor cazavampiros. Crece entre sermones, hogueras y un miedo cerval a la oscuridad. Ironías de la vida.",
  },
  {
    year: "1663",
    title: "La transformación",
    text: "Atacado en las alcantarillas durante una cacería. Despierta vampiro… y decide no beber sangre humana jamás. El primer vegetariano de la historia, básicamente.",
  },
  {
    year: "1918 – 2005",
    title: "Tres siglos de medicina",
    text: "Médico en guerras, pandemias y urgencias. Funda un aquelarre familiar en Forks. Salva miles de vidas. Aprende que la muerte, bien acompañada, también puede ser bella.",
  },
  {
    year: "2024",
    title: "Dejo el vampirismo",
    text: "“Estoy cansado de la eternidad. Quiero dedicarme a las despedidas”. Cuelga los colmillos, se colegia como funerario y abre Funeraria Carlisle entre Madrid y Forks.",
  },
  {
    year: "Hoy",
    title: "Velatorios con alma",
    text: "Más de 12.400 familias acompañadas. Especialistas en ceremonias nocturnas a la luz de las velas. Cero mordiscos desde la apertura. Garantizado por escrito.",
  },
];

export type CoffinOption = { id: string; name: string; desc: string; price: number; tag?: string };
export type FlowerOption = { id: string; name: string; desc: string; price: number };
export type CeremonyOption = { id: string; name: string; desc: string; price: number };
export type ExtraOption = { id: string; name: string; desc: string; price: number };

export const coffins: CoffinOption[] = [
  { id: "roble", name: "Roble Eterno", desc: "Roble macizo, interior de lino beige", price: 1450 },
  { id: "nogal", name: "Nogal Forks", desc: "Nogal oscuro, tallado a mano por Rosalie", price: 2400, tag: "El favorito" },
  { id: "caoba", name: "Caoba Volturi", desc: "Caoba italiana, herrajes dorados 24k", price: 3900, tag: "Premium" },
  { id: "eco", name: "Sauce Ecológico", desc: "Fibras vegetales biodegradables", price: 980 },
  { id: "gotic", name: "Gótico Nocturno", desc: "Negro piano, terciopelo burdeos, edición Carlisle", price: 5200, tag: "Signature" },
];

export const flowers: FlowerOption[] = [
  { id: "lirios", name: "Lirios del Alba", desc: "Blanco puro, el clásico de Esme", price: 280 },
  { id: "rosas", name: "Rosas Burdeos Eterno", desc: "80 rosas rojas + velo negro", price: 450 },
  { id: "bosque", name: "Bosque de Forks", desc: "Verde silvestre, musgo, helechos", price: 340 },
  { id: "luna", name: "Jardín de Medianoche", desc: "Orquídeas blancas + velas flotantes", price: 680 },
];

export const ceremonies: CeremonyOption[] = [
  { id: "clasica", name: "Clásica Diurna", desc: "Capilla, 4h de velatorio, maestro de ceremonias", price: 1200 },
  { id: "nocturna", name: "Nocturna Signature", desc: "De 22h a 04h, 300 velas, piano en directo (Edward)", price: 2100 },
  { id: "bosque-c", name: "Claro del Bosque", desc: "Al aire libre en pinar privado, antorchas", price: 2600 },
  { id: "intima", name: "Íntima Familiar", desc: "Sala privada 12 personas, sin protocolo", price: 850 },
];

export const extras: ExtraOption[] = [
  { id: "piano", name: "Piano en directo — Edward", desc: "“Bella's Lullaby” y piezas a petición", price: 400 },
  { id: "vision", name: "Coordinación Alice", desc: "Lo prevé todo antes de que pase", price: 250 },
  { id: "repat", name: "Repatriación Volterra", desc: "Traslado internacional exprés", price: 1800 },
  { id: "libro", name: "Libro de Recuerdos Eterno", desc: "Encuadernado en piel, papel de algodón", price: 180 },
  { id: "foto", name: "Retrato al óleo póstumo", desc: "Pintado por Eleazar Denali", price: 950 },
  { id: "mariposas", name: "Suelta de 100 mariposas blancas", desc: "Al amanecer, momento sobrecogedor", price: 320 },
];

export const obituaries = [
  {
    id: 1,
    name: "Eleonora Ashford Vane",
    dates: "1938 — 2026",
    age: 88,
    ceremony: "Nocturna Signature",
    text: "Amó los libros, el jazz y las tormentas. Pidió que su velatorio oliera a lluvia y sonara a piano. Así fue.",
    flowers: 214,
    image: "https://images.pexels.com/photos/8963948/pexels-photo-8963948.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
  {
    id: 2,
    name: "Marcus Volturi",
    dates: "c. 1300 a.C. — 2025",
    age: 3325,
    ceremony: "Íntima Familiar",
    text: "Tras tres milenios de duelo, por fin descansa junto a Didyme. Ceremonia privada. Sin colmillos, solo flores.",
    flowers: 89,
    image: "https://images.pexels.com/photos/7317675/pexels-photo-7317675.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  },
  {
    id: 3,
    name: "James Witherdale",
    dates: "1979 — 2026",
    age: 47,
    ceremony: "Claro del Bosque",
    text: "Corredor, rastreador, indomable. Su familia eligió despedirlo donde más corría: entre los pinos altos.",
    flowers: 156,
    image: "https://images.pexels.com/photos/29190193/pexels-photo-29190193.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  },
  {
    id: 4,
    name: "Carmen Denali",
    dates: "1948 — 2026",
    age: 78,
    ceremony: "Clásica Diurna",
    text: "Maestra de 40 generaciones. Sus alumnos llenaron tres salas. Hubo que abrir la capilla grande.",
    flowers: 342,
    image: "https://images.pexels.com/photos/13256146/pexels-photo-13256146.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
  {
    id: 5,
    name: "Laurent Dubois",
    dates: "1961 — 2025",
    age: 64,
    ceremony: "Nocturna Signature",
    text: "Amante del arte y de París. Velatorio con cuarteto de cuerda y 300 velas. “Como en casa”, dijo su viuda.",
    flowers: 178,
    image: "https://images.pexels.com/photos/7317666/pexels-photo-7317666.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  },
  {
    id: 6,
    name: "Bree Tanner",
    dates: "1994 — 2026",
    age: 32,
    ceremony: "Jardín de Medianoche",
    text: "Demasiado joven, demasiado luz. Su madre pidió mariposas blancas al amanecer. Lloramos todos, incluido Emmett.",
    flowers: 501,
    image: "https://images.pexels.com/photos/8963952/pexels-photo-8963952.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
];

export const team = [
  {
    name: "Dr. Carlisle Cullen",
    role: "Fundador · Tanatopractor jefe",
    quote: "“300 años ejerciendo la medicina. Ahora ejerzo la despedida.”",
    detail: "Colegiado nº 1663. Especialista en ceremonias nocturnas.",
    initials: "CC",
  },
  {
    name: "Esme Cullen",
    role: "Diseño floral & consuelo",
    quote: "“Cada flor dice lo que las palabras no alcanzan.”",
    detail: "Ex-restauradora. Abraza mejor que nadie desde 1921.",
    initials: "EC",
  },
  {
    name: "Alice Cullen",
    role: "Coordinadora de ceremonias",
    quote: "“Ya sabía que ibas a venir. Lo tengo todo listo.”",
    detail: "Previó tu llamada 3 días antes. Impecable con el protocolo.",
    initials: "AC",
  },
  {
    name: "Jasper Hale",
    role: "Acompañamiento al duelo",
    quote: "“Respira. Estoy aquí. Todo va a estar bien.”",
    detail: "Calma una sala entera con solo entrar. Don natural.",
    initials: "JH",
  },
  {
    name: "Rosalie Hale",
    role: "Restauración & ataúdes",
    quote: "“Se irá guapísimo. Me encargo yo personalmente.”",
    detail: "Perfeccionista. Talla, pule y restaura como nadie.",
    initials: "RH",
  },
  {
    name: "Emmett Cullen",
    role: "Logística & porte",
    quote: "“¿Que pesa? ¿Eso pesa? Sujétame el café.”",
    detail: "Levanta féretros de caoba con una mano. Corazón enorme.",
    initials: "EM",
  },
  {
    name: "Edward Cullen",
    role: "Pianista residente",
    quote: "“Toco lo que sientes sin que tengas que decirlo.”",
    detail: "Disponible para nocturnas. No lee mentes, lo jura.",
    initials: "ED",
  },
  {
    name: "Bella Cullen",
    role: "Atención a familias",
    quote: "“Sé lo que es despedirse de una vida para empezar otra.”",
    detail: "Tu persona de contacto 24h. Paciencia infinita.",
    initials: "BC",
  },
];

export const testimonials = [
  {
    name: "Renée Dwyer",
    place: "Phoenix · Ceremonia Nocturna",
    text: "Pensé que un velatorio de noche sería tétrico. Fue lo más hermoso que he vivido: 300 velas, piano en directo y el Dr. Cullen pendiente de cada detalle. Mi madre se merecía esa paz.",
    stars: 5,
  },
  {
    name: "Charlie Swan",
    place: "Forks · Claro del Bosque",
    text: "Soy policía, soy escéptico. Pero estos tipos… son puntuales, discretos y Emmett llevó el féretro por un barrizal como si nada. Profesionales de otro siglo. Literalmente.",
    stars: 5,
  },
  {
    name: "Gianna Tedeschi",
    place: "Volterra · Repatriación",
    text: "Trajeron a mi padre desde Italia en 48 horas, con todos los papeles y una ceremonia bilingüe preciosa. Alice lo había previsto todo, hasta la lluvia. Increíble.",
    stars: 5,
  },
  {
    name: "Angela Weber",
    place: "Madrid · Plan Eterno",
    text: "Contraté mi propio plan anticipado con 34 años. Carlisle me escuchó dos horas sin prisa. Salí llorando y riendo a la vez. Ahora lo tengo todo atado y pago a plazos.",
    stars: 5,
  },
];

export const faqs = [
  {
    q: "¿Es verdad que el Dr. Cullen era vampiro?",
    a: "Éramos, en pasado. Dieta vegetariana desde 1936 y jubilados del vampirismo desde 2024. Ya no brillamos al sol (usamos SPF 50), dormimos siesta y comemos ajo sin problema. Lo certificamos por escrito si lo necesita.",
  },
  {
    q: "¿De verdad atienden toda la noche?",
    a: "Es nuestra especialidad. La Ceremonia Nocturna Signature (22h–04h) es la más solicitada: capilla a la luz de las velas, piano en directo y chocolate caliente a las 2 de la mañana. Los que velan de noche nunca lo olvidan.",
  },
  {
    q: "¿Puedo planificar mi propio funeral en vida?",
    a: "Por supuesto, y lo recomendamos. El Testamento Vital Eterno congela el precio actual, lo pagas a plazos y dejas por escrito desde la música hasta quién NO puede dar el discurso. Carlisle te asesora personalmente.",
  },
  {
    q: "¿Hacen ceremonias laicas, religiosas o personalizadas?",
    a: "Todas. Católicas, laicas, humanistas, vikingas con antorchas (sí, ya hicimos dos), del bosque, del amanecer… Si se puede soñar con respeto, lo organizamos.",
  },
  {
    q: "¿Cuánto tarda todo el proceso?",
    a: "En 2 horas estamos donde nos necesites. Velatorio en 12–24h, entierro o cremación en 24–72h según certificados. Repatriaciones internacionales: 48–96h. Alice suele llegar antes de que llames.",
  },
  {
    q: "¿Son caros? ¿Hay ayudas?",
    a: "Nuestro Esencial parte de 1.950€ todo incluido, por debajo de la media nacional (3.500€). Aceptamos todos los seguros de decesos, tramitamos pensiones de viudedad y ofrecemos pago en 24 meses sin intereses.",
  },
];

export type SisterSite = {
  id: "dracula" | "barlow" | "carmilla" | "strahd";
  name: string;
  short: string;
  url: string;
  domain: string;
  tagline: string;
  desc: string;
  /** Texto publicado */
  bullets: string[];
  /** Borrador original, antes de pasar por Esme (mismo orden que bullets) */
  before?: string[];
  seat: string;
  perk: string;
  isNew?: boolean;
};

export const sisterSites: SisterSite[] = [
  {
    id: "dracula",
    name: "Correduría de Seguros Drácula",
    short: "Seguros Drácula",
    url: "#/seguros-dracula",
    domain: "seguros-dracula.es",
    tagline: "Antes chupaba sangre. Ahora cobra primas.",
    desc: "Resulta que no lo mataron bien del todo. Tras la estaca, el ajo y un pleito con Van Helsing, el Conde se reinventó como mediador de seguros colegiado. Sabe mucho de riesgos: lleva 500 años esquivándolos.",
    bullets: [
      "Seguro de Decesos Eterno (sin fecha de caducidad)",
      "Seguro del Hogar Anti-Ajo y Anti-Cruces",
      "Cobertura por estaca, sol y turba con antorchas",
    ],
    seat: "Transilvania 1897, 3.º izquierda",
    perk: "−15% si ya eres cliente de Funeraria Carlisle",
  },
  {
    id: "barlow",
    name: "Guardería Barlow · Dientes de Leche",
    short: "Guardería Barlow",
    url: "#/guarderia-barlow",
    domain: "guarderia-barlow.es",
    tagline: "Antes, colmillos afilados. Ahora, dientes de leche.",
    desc: "Kurt Barlow dejó Jerusalem's Lot, colgó la capa y abrió una guardería. Siestas obligatorias a mediodía (ya dormía de día), cuentacuentos nocturnos y cero mordiscos entre compañeros. Ni uno. Lo firma el personal.",
    bullets: [
      "Horario flexible: de 7h a 21h, o noche cerrada con cita",
      "Merienda de zumo de remolacha y galletas sin ajo",
      "Plantilla 100% jubilada del vampirismo y verificada",
    ],
    seat: "Jerusalem's Lot, Maine · Planta baja",
    perk: "Primera semana de adaptación gratis",
  },
  {
    id: "carmilla",
    name: "Centro de Bienestar Carmilla",
    short: "Bienestar Carmilla",
    url: "#/bienestar-carmilla",
    domain: "bienestar-carmilla.es",
    tagline: "Antes te dejaba sin sangre. Ahora te deja como nuevo.",
    desc: "Carmilla dejó Estiria y las visitas nocturnas sin invitación para abrir un centro de bienestar en Playa de las Américas, Tenerife. Manos expertas, trato muy cercano y una clientela que repite. Mucho.",
    bullets: [
      "Terapia manual con desenlace satisfactorio",
      "Horario ampliado para agendas exigentes",
      "Facturación con concepto neutro: «Mircalla S.L.»",
    ],
    before: [
      "Masaje con final feliz",
      "Abierto hasta las cinco de la madrugada",
      "En el extracto del banco no pone nada raro",
    ],
    seat: "Playa de las Américas, Tenerife · Local 18",
    perk: "Bono de 5 sesiones al precio de 4",
    isNew: true,
  },
  {
    id: "strahd",
    name: "Strahd von Zarovich · Firma de la Casa",
    short: "Firma de la Casa",
    url: "#/firma-de-la-casa",
    domain: "firmadelacasa.es",
    tagline: "Antes gobernaba Barovia con puño de hierro. Ahora escribe romance de alto voltaje.",
    desc: "El Conde Strahd von Zarovich dejó provisionalmente el castillo para firmar narrativa romántica de intensidad notable. Las entidades oscuras de Barovia estudian si le permiten salir y con Vecna se negocia si existiría manera de que ejecute su exploit. Mientras tanto, publica sin descanso.",
    bullets: [
      "Narrativa romántica de altas pasiones",
      "Tatiana en todas sus obras: firma de la casa",
      "Salida del castillo pendiente de las entidades oscuras",
      "Ejecución del exploit: viabilidad en estudio con Vecna",
    ],
    before: [
      "Erotismo gótico sin ningún disimulo",
      "Todas las protagonistas se llaman Tatiana. Todas. Siempre.",
      "Las entidades oscuras no lo dejan salir del castillo",
      "Vecna todavía no ha confirmado si le deja ejecutar su exploit",
    ],
    seat: "Castillo Ravenloft, Barovia · Ala este",
    perk: "Primer capítulo gratis. Tatiana también.",
    isNew: true,
  },
];

/** Solicitud denegada: no entra en el círculo y no lleva enlace. */
export const rejected = {
  name: "Conde Orlok",
  alias: "Nosferatu",
  business: "Clínica de Cirugía Estética Orlok",
  seat: "Wisborg · Junto al puerto",
  file: "Expediente 1922",
  reasons: [
    {
      title: "Plagio, según Drácula",
      text: "Dice que es él con otro nombre y sin pelo. Ya hubo sentencia en 1925 y se ordenó destruir todas las copias. Tampoco las destruyeron bien del todo.",
    },
    {
      title: "Demasiadas prótesis",
      text: "Orejas, uñas, dientes. No hemos encontrado ninguna pieza original, y eso en una clínica estética es mal escaparate.",
    },
    {
      title: "¿Vampiro o peste?",
      text: "Llegó en barco, con ratas, y en el barrio empezó a toser todo el mundo. Sin diagnóstico claro no podemos certificarlo como ex-vampiro.",
    },
  ],
  rating: "1,2",
  reviewCount: 847,
  reviews: [
    {
      text: "Pedí un retoque de nariz y salí con la suya.",
      author: "Ellen H.",
      place: "Wisborg",
    },
    {
      text: "En la sala de espera hay ratas. En recepción dicen que son de apoyo emocional.",
      author: "Thomas H.",
      place: "Wisborg",
    },
    {
      text: "Opera de noche y a oscuras. Dice que la luz le sienta fatal.",
      author: "Prof. Bulwer",
      place: "Wisborg",
    },
  ],
};

export const outOfFashion = [
  "Capas con cuello alto",
  "Dormir en un ataúd",
  "Chupar cuellos",
  "Castillos con goteras",
  "Brillar al sol",
];
export const inFashion = [
  "Crema solar SPF 50",
  "Colegiarse y emprender",
  "Terapia de grupo",
  "Siestas con horario",
  "Comer ajo sin drama",
];
