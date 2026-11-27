import type { MapId } from './maps';
import type { TileId } from './sprites';

/**
 * Textos de sprite SEGUN EL SITIO donde está el sprite.
 *
 * REGLAS (para no romper nada):
 *  - Esta función es PURA y ADITIVA: devuelve `undefined` cuando no hay texto
 *    contextual. En GameCanvas se usa como `spriteText(...) ?? msg[tile]`, así que
 *    el texto original sigue siendo el de siempre en todo lo que no se sobreescribe.
 *  - Los sprites con trigger `interact` (carteles, puertas, botones, objetos de
 *    historia, NPCs...) se resuelven ANTES de llegar aquí y hacen `return`: sus
 *    textos especiales NO se tocan. Tampoco se tocan los textos "de autor" de la
 *    tabla msg (radar de El Sauzal, tablón del aeropuerto, pinturas rupestres...).
 *  - Solo se contextualizan los textos genéricos que mencionaban un lugar concreto
 *    y por eso sonaban a disparate en otros mapas: agua, fogones, cajas, barras...
 */

type TextTable = Partial<Record<MapId, Partial<Record<TileId, string>>>>;

const BY_MAP: TextTable = {
  // ---------------- EL DIABLITO: es una PIZZERÍA, no un guachinche de carne fiesta ----------------
  el_diablito: {
    fogon: 'Horno de leña de la pizzería El Diablito. Huele a masa, tomate y mozzarella; el Coco amasa cantando «O sole mio» con el último boliche al lado.',
    counter: 'Mostrador de El Diablito con la cuenta sin pagar y el boliche del octavo guachinche detrás de la caja. Se oye el horno al fondo.',
    table: 'Mesa de la pizzería: harina en el mantel, vasos de vino peleón y una carta de Magomon olvidada debajo del plato.',
    window: 'Ventanal empañado por el calor del horno. Fuera, la carretera general de Santa Úrsula.',
    bench: 'Banco de la entrada de la pizzería. Don Michi duerme encima con una huella de harina en la nariz.',
  },

  // ---------------- SANTA CRUZ: el agua del final de la calle es la dársena del puerto ----------------
  calle: {
    sea: 'La dársena del puerto de Santa Cruz: grúas, un ferry de Armas atracado y el agua quieta entre los muelles. Mar abierto, pero al otro lado del dique.',
  },

  // ---------------- AGUA DE CUEVA: lago subterráneo, no mar abierto ----------------
  cueva_magec: {
    sea: 'Agua negra y quieta del lago subterráneo de la cueva del Llano. Solo gotea la bóveda y la Pukas flota sola, sin olas ni mareas.',
    surf: 'Remolinos del río subterráneo. Aquí no hay marea que valga, solo corriente fría bajo la piedra.',
    pothole: 'Socavón natural de la cueva: la piedra cedió hace siglos. No es una obra del Team Enriscada, pero solo el 4x4 lo cruza.',
    bench: 'Repisa de piedra tallada a mano. Alguien dejó una vara de pastor apoyada hace mucho tiempo.',
  },

  // ---------------- SIAM PARK: piscinas de azulejo, NO mar abierto ----------------
  siam_park: {
    sea: 'Agua clorada de las piscinas de Siam Park. La de olas ruge cuando entra la serie, pero esto es azulejo y bomba de agua, no costa.',
    surf: 'Espuma de la piscina de olas de The Wave Palace. La serie la programa un operario, no la luna.',
    bench: 'Tumbona de Siam Park con crema solar FP50 a medio gastar y una toalla ocupando sitio.',
    tree: 'Palmera ornamental del parque acuático: sombra de pago, con altavoz tailandés escondido entre las hojas.',
    plant: 'Vegetación exótica de Siam Park, regada con agua de piscina y música tailandesa.',
  },

  // ---------------- PARQUE MARÍTIMO (santacruz_sur): piscinas de agua salada ----------------
  santacruz_sur: {
    // El agua la resuelve zonedText(): arriba (y<19) piscinas del Parque Marítimo,
    // abajo (y>=19) mar abierto, que conserva el texto original del Atlántico.
  },

  // ---------------- CAJAS: solo en TU PISO son de la mudanza ----------------
  apartment: {
    box: 'Cajas de tu mudanza a Santa Cruz. Siguen oliendo a cartón y a salitre, y todavía no has sacado los abrigos de invierno.',
  },
  aeropuerto: {
    box: 'Maletas y cajas de facturación de la terminal TFS. Una lleva una etiqueta de plátanos y otra, un candado de la cinta 3.',
    window: 'Ventanal de la terminal: se ven las hélices del ATR-72 de Binter y la pista 07/25.',
    counter: 'Mostrador de Binter Canarias: tarifa plana de residente y chocolatina Tirma reglamentaria.',
    plant: 'Palmera de plástico del aeropuerto. Ni riega ni se queja.',
  },
  guarida_enriscada: {
    box: 'Cajas del Team Enriscada con material de la «obra oficial» del Bershka. Dentro solo hay fotocopias y bocadillos a medio comer.',
    machine: 'Consola del sótano del Coco: botones, tickets y una impresora sin tóner.',
    window: 'Ventilación del sótano de Bershka. Se oyen las escaleras mecánicas y a alguien silbando una Isa.',
    counter: 'Mesa de operaciones de la Guarida Enriscada con planos del Meridiano y llaves de despacho.',
    plant: 'Planta de plástico de la guarida. Ni el Coco la riega.',
  },
  certificador_gomera: {
    box: 'Cajas de cartas de 1ª edición pendientes de certificar. Casimiro las revisa con lupa y mucho solemnidad.',
    counter: 'Ventanilla del centro certificador de La Gomera. Colón estuvo aquí, pero no trajo ninguna carta.',
    plant: 'Helecho gomero junto al mostrador, con la humedad de Garajonay pegada a las hojas.',
    window: 'Ventana del certificador: se ve San Sebastián y, si te descuidas, Colón otra vez.',
  },

  // ---------------- MAGOS DE LA COSTA: archivo y oficinas ----------------
  magos_pb: {
    box: 'Cajas de archivo de Magos de la Costa: facturas, albaranes y llaves. Nada que ver con una mudanza.',
    table: 'Mesa de recepción con un montón de copias y un teléfono que nunca suena.',
    counter: 'Mostrador de recepción de Magos. La recepcionista te mira como si ya supiera a qué planta vas.',
    plant: 'Planta de oficina regada con café frío.',
    window: 'Cristalera de la recepción con vistas al aparcamiento de Magos de la Costa.',
  },
  magos_azotea: {
    box: 'Cajas del despacho de la azotea con contratos y fotocopias. El Coco las dejó al marcharse.',
    machine: 'La Máquina Fotocopiadora del Coco: un solo uso, y aquí dentro se gastó media guerra por ella.',
    table: 'Mesa del despacho de la azotea. Quedan dos llaves, un boli mordido y una taza de barraquito frío.',
    plant: 'Planta de despacho de director, sobreviviendo a base de aire acondicionado.',
    window: 'Ventanal de la azotea: Santa Cruz a los pies y el Teide al fondo.',
  },

  // ---------------- EL CORTE INGLÉS: grandes almacenes ----------------
  eci_pb: {
    table: 'Mesa de exposición de la planta baja con folletos de rebajas y una caja registradora.',
    window: 'Escaparate de Tres de Mayo con maniquíes mirando a la calle.',
    plant: 'Planta decorativa de los grandes almacenes. Perfectamente simétrica y falsa.',
  },
  eci_azotea: {
    table: 'Mesa de la Zona Gourmet con botellas de vino y una carta de cervezas de importación.',
    window: 'Ventanal de la azotea: se ven los tejados de Santa Cruz y el auditorio.',
    plant: 'Maceta de la terraza gourmet, regada con agua con gas.',
    counter: 'Barra de la Zona Gourmet. Aquí se compran las cervezas que abren la carretera de El Rosario.',
    bench: 'Banco de la terraza con vistas. Nadie se sienta: todos están en la cola del ascensor.',
  },

  // ---------------- OTROS INTERIORES CON NOMBRE PROPIO ----------------
  hospital: {
    counter: 'Mostrador del laboratorio de Acaymo: botes de muestras, una libreta de resorte y olor a café recalentado.',
    window: 'Cristalera del laboratorio de La Candelaria. Se ve la plaza de la Patrona y las estatuas de los menceyes.',
    machine: 'Aparato de laboratorio con lucecitas. Acaymo dice que es un analizador de cartas; tú dirías que es una tostadora.',
    plant: 'Planta del laboratorio, medio mustia entre tanto tubo de ensayo.',
    table: 'Mesa de trabajo con Magodex abierta y tres mazos iniciales esperando a que elijas.',
  },
  cuevas_pintadas: {
    fogon: 'Brasas de la cocina de la Cueva Pintada: calderos de carne fiesta en adobo y mantel de papel. Aquí sí huele a guachinche.',
    table: 'Mesa de mantel de papel de la cueva-guachinche. Debajo puede esconderse uno de los botones de los cerrojos.',
    counter: 'Barra del guachinche con vino de monte y roscas. El camarero no levanta la vista.',
    window: 'Respiradero de la cueva con pinturas rupestres geométricas alrededor.',
    plant: 'Helecho en la pared húmeda de la cueva, al lado de las pinturas.',
  },
  guachinche_curbelo: {
    fogon: 'Fogón de fuego del guachinche de La Gomera: brasas, hierro y vino peleón. Colón estuvo aquí y tampoco encontraba la salida.',
    counter: 'Barra del guachinche de fuego de Casimiro Curbelo. Colón estuvo aquí, por si no te lo habían dicho.',
    table: 'Mesa del guachinche con marcas de vasos y una libreta de Colón olvidada.',
  },
  guachinche_rosario: {
    counter: 'Barra del guachinche de Doña Sabina, con la mesa del fondo reservada para el sexto boliche.',
    table: 'La mesa del fondo del guachinche de El Rosario: mantel limpio, gofio y una silla libre para ti.',
  },
  parrandero: {
    counter: 'Barra del Centro Parrandero: barraquito caliente, cháchara y mazo planchado las 24 horas.',
    machine: 'Terminal del PC de Ayoze: aquí se guardan las cartas que no caben en el mazo.',
    plant: 'Maceta del Centro Parrandero, regada con lo que sobra de los barraquitos.',
    window: 'Ventana del Centro Parrandero. Se oye la parranda desde la calle.',
  },
  ss_olsen: {
    table: 'Mesa del camarote del S.S. Olsen con una carta de navegación y un vaso que no se cae ni con marejada.',
    window: 'Ojo de buey del camarote. Fuera, el muelle de Galdar y un capitán con ganas de que le rasquen la espalda.',
    machine: 'Cuadro de mandos del trimarán con luces de navegación y una radio que solo emite rancheras.',
    plant: 'Maceta atornillada al camarote, la única planta con chaleco salvavidas de la isla.',
  },
  papagayos: {
    counter: 'Barra de Papagayos con cholas voladoras colgadas y un cubata de garrafón a medio servir.',
    machine: 'Equipo de música de la pista de Papagayos. El bombo no es el bombo, dice Yéssica.',
  },
  meridiano: {
    counter: 'Caja del C.C. Meridiano con tickets de rebajas y un cartel de Bershka medio descolgado.',
    window: 'Escaparate de fast-fashion del Meridiano con descuentos que nadie se cree.',
    plant: 'Planta decorativa del centro comercial, entre el Bershka y la máquina de tragaperras.',
  },
  mansion_curbelo: {
    window: 'Ventana de la mansión de Casimiro en San Sebastián de La Gomera. Colón estuvo aquí.',
    plant: 'Helecho del patio de la mansión, con humedad de la Gomera y demasiada historia encima.',
  },

  // ---------------- CUEVAS / TORRE / SENDEROS ----------------
  parrandero_2: {
    bench: 'Silla del Club del Cable: uno a cada lado de la mesa y el cable en medio.',
    plant: 'Planta del Club del Cable. Crece torcida hacia la regleta.',
    window: 'Ventana de la segunda planta. Abajo se oye la parranda; aquí arriba, solo el zumbido de las consolas.',
  },
  sendero_telesforo: {
    guardrail: 'Barandilla del mirador del Sendero Telesforo Bravo. No es una bionda de autopista: aquí lo que cae es el mar de nubes.',
    bench: 'Banco de piedra del mirador con vistas al mar de nubes y a la sombra del Teide.',
    tree: 'Pino canario retorcido por el viento de la cumbre, agarrado a la arena negra.',
  },
  montana_blanca: {
    bench: 'Banco del merendero del Refugio de Montaña Blanca, con arena blanca pegada en las patas.',
    tree: 'Pino canario en la subida al Refugio, con el viento peinándolo hacia el cráter.',
  },
  anaga: {
    tree: 'Laurisilva de Anaga: laurel, brezo y helechos con la niebla pegada a las ramas.',
    fogon: 'Fogón del merendero del Llano de los Viejos, con chuletas al fuego y bancos alrededor.',
  },
  santa_ursula: {
    fogon: 'Fogón del pueblo de Santa Úrsula, entre la carretera general y el aroma italiano que viene del Diablito.',
  },
  tf5: {
    car: 'Otro coche parado en la ultra-cola de la TF-5. El conductor ha sacado el termo y el barraquito ya se le enfrió.',
    runway: 'Pista 12/30 del Aeropuerto TFN Los Rodeos, entre la bruma y el último kilómetro de la cola.',
    window: 'Ventanilla de un coche de la cola. Dentro, alguien baraja cartas para matar el atasco.',
  },
  tf1: {
    car: 'Coche en el arcén de la TF-1 Sur, con el maletero abierto y nevera de playa dentro.',
    window: 'Ventanal de la autopista del sur: se ven aerogeneradores de Abades y Montaña Roja.',
  },
  subida: {
    car: 'Coche aparcado en la cuesta de Ramón y Cajal, con pegatina del Campus ULL en la luneta.',
    tree: 'Árbol de la subida a La Laguna, con humedad y sombra para los que van al Campus a pie.',
  },
  san_borondon: {
    redrock: 'Risco rojizo de San Borondón, la isla que aparece y desaparece. La piedra tampoco acaba de creérselo.',
    sea: 'Mar brava alrededor de la octava isla: océano con niebla y sin carta de navegación fiable.',
  },
};

// Los pisos de Magos y El Corte Inglés comparten el mismo texto de oficina.
const GROUP_OVERRIDES: { prefix: string; table: Partial<Record<TileId, string>> }[] = [
  {
    prefix: 'magos_',
    table: {
      box: 'Cajas de archivo de Magos de la Costa: facturas, copias y llaves de planta. Nada de mudanzas.',
      table: 'Mesa de oficina con teclas, grapadora y un montón de fotocopias por revisar.',
      plant: 'Planta de oficina sobreviviendo a base de fluorescente y café de máquina.',
      window: 'Ventana de la planta de Magos de la Costa con vistas al aparcamiento.',
      machine: 'Impresora de planta con un papel atascado desde la época del Coco.',
    },
  },
  {
    prefix: 'eci_',
    table: {
      table: 'Mesa de exposición de El Corte Inglés con etiquetas de rebajas dobladas.',
      window: 'Escaparate de la planta con maniquíes y carteles de descuento.',
      plant: 'Planta decorativa de los grandes almacenes, simétrica y claramente de plástico.',
      counter: 'Mostrador de planta de El Corte Inglés con tickets regalo y devoluciones.',
    },
  },
  {
    prefix: 'torre_teresitas_',
    table: {
      plant: 'Maceta de la Torre Encantada, con tierra de cementerio y una cinta roja atada al tallo.',
      machine: 'Consola de la Torre Encantada: botones, luces y el eco de las peras del barranco.',
      window: 'Ventana de la Torre Encantada con vistas a Las Teresitas y a la niebla de San Andrés.',
    },
  },
];

/** Textos que dependen de la zona exacta DENTRO de un mapa (piscinas vs mar abierto). */
function zonedText(mapId: MapId, tile: TileId, x: number, y: number): string | undefined {
  if (mapId === 'santacruz_sur' && (tile === 'sea' || tile === 'surf')) {
    // y=20..21 es el mar abierto; las piscinas del Parque Marítimo están arriba (y≈15).
    return y >= 19
      ? undefined // texto original del mar abierto es correcto aquí
      : 'Piscina de agua salada del Parque Marítimo César Manrique: piedra volcánica, palmeras y un socorrista que no se moja. El mar abierto está un poco más allá.';
  }
  if (mapId === 'siam_park' && (tile === 'sea' || tile === 'surf')) {
    return x >= 33
      ? 'Piscina de los leones marinos de Siam Park, con agua clorada y aplausos de aleta. Del mar solo tiene el color.'
      : 'Agua de The Wave Palace, la piscina de olas de Siam Park. La serie la programa un operario, no la luna.';
  }
  if (mapId === 'cueva_magec' && (tile === 'sea' || tile === 'surf')) {
    return 'Agua negra y quieta del lago subterráneo de la cueva del Llano. Solo gotea la bóveda y la Pukas flota sola, sin olas ni mareas.';
  }
  return undefined;
}

/**
 * Texto contextual de un sprite genérico, o `undefined` para conservar el texto
 * original de la tabla `msg` de GameCanvas (incluidos los textos especiales).
 */
export function spriteText(mapId: MapId, tile: TileId, x: number, y: number): string | undefined {
  const zoned = zonedText(mapId, tile, x, y);
  if (zoned) return zoned;
  const exact = BY_MAP[mapId]?.[tile];
  if (exact) return exact;
  for (const g of GROUP_OVERRIDES) {
    if (mapId.startsWith(g.prefix)) {
      const t = g.table[tile];
      if (t) return t;
    }
  }
  return undefined;
}
