import { CardDef, MAX_COPIES } from '../battle/cards';
import { forgeDeck } from './deckForge';
import { MAJOR_SPECS, COCO_MERIDIANO, buildMajor } from './majorDecks';
import { DIABLITO_FIRST, DIABLITO_TRAINER } from './santaUrsulaQuest';

export interface Trainer {
  id: string;
  name: string;
  title: string;
  purse: number;               // duros que ganas (y tope que arriesgas si tienes saldo)
  deck: string[];
  biomes: CardDef['biome'][];  // sesgo del sobre
  taunt: string[];
  win: string[];
  lose: string[];
  elite?: boolean;
  /** Niños del patio de colegio: repetibles infinitas veces para evitar soft lock. */
  repeatable?: boolean;
  /** Tope de etapa evolutiva en el sobre (segun nivel del colegio). */
  maxStage?: number;
  /** Numero de gimnasio (1..8): otorga el boliche correspondiente al ganar. */
  gym?: number;
  /**
   * Nivel de dificultad en la curva de la historia (1 = primer encuentro, 10 = campeón).
   * El mazo se forja con brillo legal creciente: NO hay multiplicadores ni vida extra.
   */
  tier?: number;
  /** Brillo de las criaturas del mazo (fusiones legales de 5 copias en etapa final). */
  shine?: Record<string, number>;
  /** Vida extra exclusiva de Magec (único entrenador al que se le permite). */
  life?: number;
  /** Cartas que salen garantizadas en su mano inicial (p.ej. Magec se autoinvoca si o si). */
  openingHand?: string[];
  bolicheName?: string;
  /** Icono preferido en la pantalla VS. */
  ace?: string;
}

const d = (id: string, n: number): string[] => Array.from({ length: Math.min(n, MAX_COPIES) }, () => id);
const L = (id: string, n: number): string[] => Array.from({ length: n }, () => id);
const GHOST_TOWER_DECK = [
  ...L('tierra_malpais', 8),
  ...L('tierra_laurisilva', 2),
  ...d('perita_barranco', 4),
  ...d('cortar_el_aire', 4),
];

export const TRAINERS: Record<string, Trainer> = {
  // Se anuncian como guachinche/gimnasio, pero no estan en la Ruta ni dan boliche: duelo normal con sobre.
  terrero_rosario: {
    id: 'terrero_rosario', name: 'CHO JUAN', title: 'Terrero de lucha · El Rosario', purse: 40, biomes: ['risco'], ace: 'pancho_camurria',
    tier: 3,
    deck: [...L('tierra_volcan', 12), ...d('pancho_camurria', 4), ...d('pollito_frontera', 4)],
    taunt: ['CHO JUAN: Esto es un guachinche con gimnasio, aunque no salgamos en la lista esa de Bencomo.',
      'CHO JUAN: Dos cartas y arena. Pancho agarra, el Pollito entra primero. Más no hace falta.'],
    win: ['CHO JUAN: Me tumbaste con las dos. Toma los 40 duros y el sobre... pero boliche no hay: no somos de la Ruta.'],
    lose: ['CHO JUAN: Agarrada limpia y al suelo. Vuelve cuando no te tiemble la mano.'],
  },
  gym_papagayos: {
    id: 'gym_papagayos', name: 'YÉSSICA', title: 'GUACHINCHE #5 · PAPAGAYOS',
    tier: 6,
    gym: 5, purse: 75, bolicheName: 'BOLICHE DE LA CHOLA', biomes: ['ofra'], ace: 'bidon_toxico',
    deck: [...L('tierra_malpais', 12), ...d('chupito_garrafon', 4), ...d('cubata_garrafon', 4),
      ...d('bidon_toxico', 2), ...d('lagarto', 3), ...d('lapa', 2), ...d('lapa_acorazada', 2),
      ...d('gato_callejero', 2), ...d('calima', 3), ...d('cortar_el_aire', 2)],
    taunt: ['YÉSSICA: ¿Oyes ese ritmo? No es el bombo. Son tus cholas despegándose del garrafón de la pista.',
      'Bienvenido al gimnasio VENENO. Entre lo que sirven en la barra y lo que te ofrecen fuera, esta noche ni Koga se atreve a pedir un cubata.'],
    win: ['YÉSSICA: ¡Con las dos cholas y encima me ganas! Toma el quinto boliche, 75 duros y el sobre de la casa.'],
    lose: ['YÉSSICA: Esta ronda es mía. En el Centro de Troya te despegan las cartas. Vuelve cuando quieras.'],
  },
  gym_curbelo: {
    id: 'gym_curbelo', name: 'CASIMIRO CURBELO', title: 'GUACHINCHE #7 · FUEGO',
    tier: 7,
    gym: 7, purse: 90, bolicheName: 'Boliche de Colón', biomes: ['risco'], ace: 'pancho_camurria',
    deck: [...L('tierra_volcan', 16), ...d('cuarta_vino', 4), ...d('baifo', 4), ...d('gaviota', 4),
      ...d('pollito_frontera', 4), ...d('pancho_camurria', 3), ...d('mojo', 4), ...d('tolete', 4)],
    taunt: [
      'CASIMIRO CURBELO: ¿Encontraste la llave en mi mansión? Colón estuvo aquí y tampoco encontraba la salida.',
      'CASIMIRO CURBELO: Soy el líder de este guachinche de FUEGO. Mis brasas y mis tierras Volcán arden por el séptimo boliche.',
    ],
    win: ['CASIMIRO CURBELO: ¡Me apagaste las brasas! Toma el BOLICHE DE COLÓN, 90 duros y un sobre. Colón estuvo aquí, por cierto.'],
    lose: ['CASIMIRO CURBELO: El fuego es mío. Colón estuvo aquí; tú puedes volver cuando quieras.'],
  },
  cole7_a: {
    id: 'cole7_a', name: 'NAIRA (La Gomera)', title: 'Patio Nv.7 · San Sebastián', purse: 28, repeatable: true, biomes: ['risco', 'pinar'], ace: 'cabra_chispera',
    tier: 7,
    deck: [...L('tierra_volcan', 7), ...L('tierra_laurisilva', 6), ...d('baifo', 4), ...d('cabra', 3), ...d('cabra_chispera', 2), ...d('cardon', 2), ...d('mojo', 3), ...d('tolete', 2)],
    taunt: ['NAIRA: Colón estuvo aquí. ¿Tú te quedas al recreo? Mi cabra también juega por 28 duros y sobre.'],
    win: ['NAIRA: ¡Ganaste! Colón estuvo aquí, pero no me tumbó la cabra. Repetimos cuando quieras.'],
    lose: ['NAIRA: Colón estuvo aquí y se habría preparado mejor el mazo.'],
  },
  cole7_b: {
    id: 'cole7_b', name: 'JONAY (La Gomera)', title: 'Patio Nv.7 · San Sebastián', purse: 28, repeatable: true, biomes: ['mar', 'ofra'], ace: 'calamar',
    tier: 7,
    deck: [...L('tierra_charco', 7), ...L('tierra_malpais', 6), ...d('choco', 4), ...d('calamar', 3), ...d('cazon', 3), ...d('jaqueton', 2), ...d('lapa', 3), ...d('cortar_el_aire', 2)],
    taunt: ['JONAY: Colón estuvo aquí. Yo me quedé con la mesa del recreo. ¿Jugamos por 28 duros y sobre?'],
    win: ['JONAY: Buena partida. Colón estuvo aquí, pero no eligió carta del sobre como tú.'],
    lose: ['JONAY: Colón estuvo aquí. Vuelve a intentarlo antes de que toque el timbre.'],
  },
  barry_troya: {
    id: 'barry_troya', name: 'BARRY', title: 'La última ronda · Troya', purse: 34, biomes: ['risco'], ace: 'garrafa_peleon',
    tier: 5,
    deck: [...L('tierra_volcan',6), ...L('tierra_laurisilva',5), ...d('cuarta_vino',4), ...d('baifo',3), ...d('garrafa_peleon',3), ...d('mojo',2), ...d('gofio',2)],
    taunt: ['BARRY: ¿Una partida? Barajo yo. Espera. Esto es la carta de los postres.'],
    win: ['BARRY: Fair play, mate. Los 34 duros son tuyos. ¿Tú te acuerdas de dónde dejé el hotel?'],
    lose: ['BARRY: ¡Una victoria! Que alguien se acuerde mañana, por favor.'],
  },
  sarah_karaoke: {
    id: 'sarah_karaoke', name: 'SARAH', title: 'Turno de karaoke · Las Verónicas', purse: 38, biomes: ['mar'], ace: 'vieja_reina',
    tier: 5,
    deck: [...L('tierra_charco',7), ...L('tierra_playa',5), ...d('cria_leon',3), ...d('choco',4), ...d('vieja_reina',3), ...d('angelote',2), ...d('chola',3), ...d('clipper',2)],
    taunt: ['SARAH: Hay once personas delante de mí para cantar. Nos da tiempo a un duelo.'],
    win: ['SARAH: ¡Bien jugado! Me toca. Cuídame el mazo, que voy a destrozar otra de ABBA.'],
    lose: ['SARAH: Todo está en llevar el compás, cariño.'],
  },
  delfines_lucia: {
    id: 'delfines_lucia', name: 'LUCÍA', title: 'Barco de avistamiento', purse: 48, biomes: ['mar'], ace: 'leon_marino',
    tier: 5,
    deck: [...L('tierra_charco', 8), ...L('tierra_playa', 5), ...d('cria_leon', 3), ...d('leon_marino', 3),
      ...d('vieja', 3), ...d('vieja_reina', 2), ...d('angelote', 2), ...d('chola', 3), ...d('barraquito', 2)],
    taunt: ['LUCÍA: ¡Mira a babor! Los delfines irán delante un rato. ¿Echamos un duelo mientras vuelven a saltar?'],
    win: ['LUCÍA: Bien jugado. Por donde se acumula la bruma sale una cala de arena negra. Si no se ve, espera cerca de la boya.'],
    lose: ['LUCÍA: Te ganó la marea. Te recogemos y damos la vuelta a Troya.'],
  },
  moto_yeray: {
    id: 'moto_yeray', name: 'YERAY', title: 'Moto de agua · Canal norte', purse: 50, biomes: ['risco', 'mar'], ace: 'gaviota',
    tier: 4,
    deck: [...L('tierra_volcan', 9), ...L('tierra_playa', 4), ...d('cuarta_vino', 4), ...d('pollito_frontera', 3),
      ...d('gaviota', 3), ...d('baifo', 2), ...d('mojo', 3), ...d('chola', 3)],
    taunt: ['YERAY: Apago la moto, que si no el motor se lleva las cartas. ¿Probamos quién tiene más prisa?'],
    win: ['YERAY: Tremenda tabla y tremendo mazo. Te dejo seguir; yo recojo las cartas de la guantera.'],
    lose: ['YERAY: A tope de gas. Te llevo a Troya antes de que te entre frío.'],
  },
  delfines_omar: {
    id: 'delfines_omar', name: 'OMAR', title: 'Guía de delfines · Canal sur', purse: 54, biomes: ['mar', 'ofra'], ace: 'calamar',
    tier: 5,
    deck: [...L('tierra_charco', 9), ...L('tierra_malpais', 5), ...d('choco', 4), ...d('calamar', 3),
      ...d('lapa', 3), ...d('cazon', 3), ...d('jaqueton', 2), ...d('calima', 2), ...d('clipper', 2)],
    taunt: ['OMAR: Hay delfines por proa. Dejo el barco al pairo para no molestarlos. ¿Pasamos la espera con un duelo?'],
    win: ['OMAR: Bonita partida. San Sebastián queda ya al sur; busca las luces del pantalán.'],
    lose: ['OMAR: Se te hizo larga la travesía. Sube a cubierta, te acercamos a Troya.'],
  },
  moto_ines: {
    id: 'moto_ines', name: 'INÉS', title: 'Moto de agua · Bocana', purse: 58, biomes: ['ofra', 'mar'], ace: 'cubata_garrafon',
    tier: 5,
    deck: [...L('tierra_playa', 6), ...L('tierra_malpais', 8), ...d('chupito_garrafon', 3), ...d('cubata_garrafon', 3),
      ...d('lapa', 3), ...d('lapa_acorazada', 2), ...d('gato_callejero', 2), ...d('chola', 3), ...d('calima', 2)],
    taunt: ['INÉS: La última boya es la de San Sebastián. Yo no entro con la moto: me quedo aquí a retar a quien llegue en tabla.'],
    win: ['INÉS: Venías preparado. Amarra ahí delante si quieres estirar las piernas.'],
    lose: ['INÉS: Hasta en la estela guardo un as. Vamos, te arrimo de vuelta a Troya.'],
  },
  // ==================== MAGOMANIACO: 1ª EDICION (obligatorio entre Gym #1 y Gym #2) ====================
  magomaniaco: {
    id: 'magomaniaco',
    tier: 3,
    name: 'MAGOMANIACO',
    title: 'FRIQUI DE LA 1ª EDICION',
    purse: 25,
    ace: 'lagarto_gigante',
    biomes: ['ofra', 'mar'],
    deck: [
      ...L('tierra_malpais', 5), ...L('tierra_volcan', 4), ...L('tierra_laurisilva', 3),
      ...d('lagarto', 3), ...d('lapa', 3), ...d('baifo', 2),
      ...d('lagarto_gigante', 2), ...d('tabaiba', 2), ...d('cardon', 1),
      ...d('calima', 2), ...d('mojo', 2), ...d('gofio', 1),
    ],
    taunt: [
      'MAGOMANIACO: (lleno de hollin) QUIETO PARAO! Me encontre DOS CARTAS DE 1ª EDICION escarbando entre las cenizas de estos fogones: un BURGADO y un CANGREJO!',
      'MAGOMANIACO: La 1ª edicion esta descatalogada hasta que la lleves al Centro Certificador de La Gomera... pero si me ganas aqui mismo te regalo UNA!',
    ],
    win: [
      'MAGOMANIACO: Ños, me barriste como ceniza de asadero! Trato hecho: te dejo paso a Anaga y eliges UNA de mis dos cartas de 1ª edicion!',
    ],
    lose: [
      'MAGOMANIACO: Jejeje! Mis dos joyas de 1ª edicion siguen conmigo en su funda doble. Vuelve cuando afines el mazo!',
    ],
  },

  // ==================== PALMETUM · GIMNASIO #4 (TIPO PLANTA) ====================
  jardinera_palmetum: {
    id: 'jardinera_palmetum',
    tier: 5,
    name: 'YURENA',
    title: 'Botanica del Palmetum',
    purse: 34,
    biomes: ['pinar', 'risco'],
    ace: 'tajinaste',
    deck: [
      ...L('tierra_laurisilva', 10), ...L('tierra_playa', 2),
      ...d('semilla', 2), ...d('tabaiba', 3), ...d('tunera', 3),
      ...d('cardon', 2), ...d('tajinaste', 2), ...d('palmera_real', 1),
      ...d('gofio', 3), ...d('parranda', 2),
    ],
    taunt: [
      'YURENA: Antes esto era un vertedero y ahora es el mejor jardin botanico de palmeras de Europa! Solo que el parking sigue de culo.',
      'YURENA: Si quieres retar a JONAY por el Boliche de Planta, primero poda mi mazo!',
    ],
    win: ['YURENA: Me dejaste hecha compost! Sigue el sendero de palmeras: JONAY te espera en el mirador del Palmetum.'],
    lose: ['YURENA: Te pinchaste con las tuneras, mi nino!'],
  },

  gym_palmetum: {
    id: 'gym_palmetum',
    tier: 6,
    name: 'JONAY',
    title: 'LIDER GYM #4 · PALMETUM (PLANTA)',
    purse: 60,
    gym: 4,
    bolicheName: 'BOLICHE DEL PALMETUM',
    biomes: ['pinar', 'risco'],
    ace: 'palmera_real',
    deck: [
      ...L('tierra_laurisilva', 11), ...L('tierra_playa', 3),
      ...d('tabaiba', 3), ...d('tunera', 3), ...d('cardon', 3),
      ...d('tajinaste', 3), ...d('palmera_real', 2), ...d('drago_milenario', 2),
      ...d('gofio', 3), ...d('parranda', 2),
    ],
    taunt: [
      'JONAY: Ños, lograste meter ese Toyota de antes de la guerra por la rampa reventada del parking! Solo por eso te ganaste un respeto.',
      'JONAY: Bienvenido al GIMNASIO #4 DEL PALMETUM, puro TIPO PLANTA: palmeras canarias, tuneras, cardones y dragos milenarios. Al turron!',
    ],
    win: [
      'JONAY: Me podaste hasta el Drago Milenario, chacho! Toma el BOLICHE DEL PALMETUM, 60 duros y mi sobre botanico!',
    ],
    lose: [
      'JONAY: La laurisilva siempre gana, guirufo! Vuelve cuando traigas mejores tijeras de podar.',
    ],
  },

  // ==================== GUARIDA ENRISCADA (SUBSUELO DEL C.C. MERIDIANO) ====================
  enriscada_guarida_1: {
    id: 'enriscada_guarida_1',
    tier: 6,
    name: 'KEVIN',
    title: 'Becario del Team Enriscada',
    purse: 36,
    biomes: ['ofra'],
    ace: 'gato_callejero',
    deck: [
      ...L('tierra_malpais', 9), ...L('tierra_playa', 3),
      ...d('michino', 3), ...d('gato_callejero', 4), ...d('gato_azotea', 2),
      ...d('lagarto', 2), ...d('lapa_acorazada', 1),
      ...d('calima', 3), ...d('chola', 2),
    ],
    taunt: [
      'KEVIN: EH?! Como descubriste las escaleras mecanicas detras del cartel de descuento del Bershka?!',
      'KEVIN: Se me olvido pegarlo con celo doble cara! Mis gatos callejeros te van a arañar las cholas!',
    ],
    win: ['KEVIN: Ay mi madre, el Coco de Santa Ursula me va a poner a doblar camisetas del Primark toda la vida!'],
    lose: ['KEVIN: Fuera del sotano VIP del Bershka, guirufo!'],
  },

  enriscada_guarida_2: {
    id: 'enriscada_guarida_2',
    tier: 6,
    name: 'TONI',
    title: 'Consigliere... digo Vocal Enriscada',
    purse: 42,
    biomes: ['ofra'],
    ace: 'gato_azotea',
    deck: [
      ...L('tierra_malpais', 10), ...L('tierra_playa', 3),
      ...d('michino', 2), ...d('gato_callejero', 3), ...d('gato_azotea', 3),
      ...d('don_michi', 1), ...d('lapa_acorazada', 2),
      ...d('calima', 3), ...d('chola', 2),
    ],
    taunt: [
      'TONI: Alto ahi, ragazzo... digo, muchacho! Detras de esta puerta esta el despacho de EL COCO DE SANTA URSULA!',
      'TONI: Financiamos las zanjas de Anaga con camisas fast-fashion que se desintegran a las 24 horas. Negocio redondo!',
    ],
    win: ['TONI: Mamma mia, que tunda! Pasa si te atreves, el Coco esta acariciando a Don Michi...'],
    lose: ['TONI: Dormiras con las viejas en sancocho, chacho!'],
  },

  coco_santa_ursula: {
    id: 'coco_santa_ursula',
    tier: 7,
    name: 'EL COCO',
    title: 'EL COCO · AZOTEA DE MAGOS DE LA COSTA',
    purse: 75,
    elite: true,
    biomes: ['ofra'],
    ace: 'don_michi',
    deck: [
      ...L('tierra_malpais', 10), ...L('tierra_playa', 3), ...L('tierra_charco', 2),
      ...d('michino', 2), ...d('gato_callejero', 3), ...d('gato_azotea', 4),
      ...d('don_michi', 3), ...d('lapa_acorazada', 2),
      ...d('calima', 3), ...d('chola', 2), ...d('barraquito', 2),
    ],
    taunt: [
      'EL COCO: Buonasera, guirufo... digo, buenas tardes mi nino. Soy EL COCO DE SANTA URSULA, un humilde empresario norteño... nada italiano, capisci? 🤌',
      'EL COCO: Has bajado por el probador falso como si fuera tu casa. Aqui abajo mis gatos hacen de guardia.',
    ],
    win: [
      'EL COCO: Mamma mia!! Me despeinaste la gomina y dejaste a Don Michi ronroneando! Esta bien, ragazzo, sabes jugar con honor!',
    ],
    lose: [
      'EL COCO: Arrivederci, chacho! Que Toni te acompañe por las escaleras mecanicas hasta la seccion de calcetines!',
    ],
  },

  senderista_hans: {
    id: 'senderista_hans', name: 'SENDERISTA HANS', title: 'Montaña Blanca · Rucksack Nr. 1', purse: 66,
    tier: 8,
    biomes: ['risco', 'pinar'], ace: 'cabra_titan_teide',
    deck: [...L('tierra_volcan', 8), ...L('tierra_laurisilva', 6), ...d('baifo', 4), ...d('cabra', 3),
      ...d('cabra_chispera', 3), ...d('cabra_titan_teide', 2), ...d('cardon', 3),
      ...d('mojo', 3), ...d('tolete', 3), ...d('gofio', 2)],
    taunt: ['SENDERISTA HANS: Guten Tag! Llevo tres horas subiendo y mi mochila pesa más que tu mazo. ¡Una partida antes de la cornisa!'],
    win: ['SENDERISTA HANS: Sehr gut! Toma 66 duros y una carta. Achtung: la próxima cornisa no se cruza andando.'],
    lose: ['SENDERISTA HANS: Ich gewinne! Vuelve cuando hayas descansado, junger Mann.'],
  },
  senderista_greta: {
    id: 'senderista_greta', name: 'SENDERISTA GRETA', title: 'Montaña Blanca · Rucksack Nr. 2', purse: 68,
    tier: 8,
    biomes: ['mar', 'pinar'], ace: 'pardela_tormenta',
    deck: [...L('tierra_playa', 8), ...L('tierra_laurisilva', 6), ...L('tierra_volcan', 4), ...L('tierra_charco', 4), ...d('pardela', 4), ...d('pardela_tormenta', 3),
      ...d('cernicalo_alisio', 3), ...d('pinzon_chispero', 3), ...d('fenix_azul_teide', 2),
      ...d('clipper', 3), ...d('chola', 3)],
    taunt: ['SENDERISTA GRETA: Achtung! Hier wechselt der Wind alle drei Karten. Como mis calcetines, que también cambian solos.'],
    win: ['SENDERISTA GRETA: Sehr ordentlich! Toma 68 duros y elige carta. El viento ya no te mirará raro.'],
    lose: ['SENDERISTA GRETA: Der Wind hat dich besiegt, no mi mazo.'],
  },
  senderista_klaus: {
    id: 'senderista_klaus', name: 'SENDERISTA KLAUS', title: 'Montaña Blanca · Rucksack Nr. 3', purse: 70,
    tier: 8,
    biomes: ['ofra', 'fantasma'], ace: 'lagarto_magma',
    deck: [...L('tierra_malpais', 9), ...L('tierra_volcan', 5), ...d('lagarto', 3), ...d('lagarto_gigante', 3),
      ...d('lagarto_magma', 3), ...d('lapa_acorazada', 3), ...d('perita_barranco', 3),
      ...d('calima', 3), ...d('cortar_el_aire', 3)],
    taunt: ['SENDERISTA KLAUS: Ich habe eine Karte verloren... y mi hermano dice que estaba bajo una piedra. ¿La viste? ¡Jugamos!'],
    win: ['SENDERISTA KLAUS: Das war meine Karte! Bueno, quédate con 70 duros y una del sobre. Ich suche weiter.'],
    lose: ['SENDERISTA KLAUS: Me ganaste, pero sigo buscando la carta entre las piedras.'],
  },
  cole9_a: {
    id: 'cole9_a', name: 'LENA (Refugio)', title: 'Patio Nv.9 · Montaña Blanca', purse: 34, repeatable: true,
    tier: 8,
    biomes: ['risco', 'pinar'], ace: 'cabra_chispera',
    deck: [...L('tierra_volcan', 7), ...L('tierra_laurisilva', 7), ...d('baifo', 4), ...d('cabra', 3),
      ...d('cabra_chispera', 3), ...d('semilla', 3), ...d('mojo', 3), ...d('gofio', 2)],
    taunt: ['LENA: ¿También subiste corriendo? Pues en el recreo del refugio se juega con guantes. ¡34 duros y sobre!'],
    win: ['LENA: ¡Ganaste! Aquí arriba los guiris no llegan, pero los sobres sí. Repetimos.'],
    lose: ['LENA: El recreo más alto de Tenerife es mío. Vuelve cuando quieras.'],
  },
  cole9_b: {
    id: 'cole9_b', name: 'JONAS (Refugio)', title: 'Patio Nv.9 · Montaña Blanca', purse: 34, repeatable: true,
    tier: 8,
    biomes: ['mar', 'ofra'], ace: 'kraken_anaga',
    deck: [...L('tierra_charco', 7), ...L('tierra_malpais', 7), ...L('tierra_playa', 3), ...d('choco', 4), ...d('calamar', 3),
      ...d('kraken_anaga', 2), ...d('vieja_reina', 3), ...d('clipper', 3), ...d('chola', 3)],
    taunt: ['JONAS: Mein Vater sagt que el pudding de aquí sabe a nieve. Yo solo sé que mi mazo no pierde en el recreo.'],
    win: ['JONAS: Du hast gewonnen! Toma 34 duros y una carta. Ich übe für die nächste Pause.'],
    lose: ['JONAS: Achtung! Otro intento, que aún queda recreo.'],
  },

  // Tercera aparicion del Coco: gimnasio propio, sin reutilizar el estado de Meridiano o Magos.
  [DIABLITO_TRAINER]: {
    id: DIABLITO_TRAINER, name: 'EL COCO', title: 'GUACHINCHE #8 · EL DIABLITO',
    tier: 8,
    gym: 8, purse: 100, bolicheName: 'Boliche del Diablito', biomes: ['ofra'], ace: 'don_michi',
    deck: [
      ...L('tierra_malpais', 14), ...L('tierra_playa', 6), ...L('tierra_charco', 3),
      ...d('michino', 3), ...d('gato_callejero', 4), ...d('gato_azotea', 4), ...d('don_michi', 4),
      ...d('lapa_acorazada', 3), ...d('bidon_toxico', 2),
      ...d('calima', 3), ...d('chola', 3), ...d('barraquito', 2), ...d('cortar_el_aire', 2),
    ],
    taunt: DIABLITO_FIRST,
    win: ['EL COCO: ¡Mamma mia! Trato es trato: el BOLICHE DEL DIABLITO es tuyo. El último de la Ruta, más 100 duros y un sobre. ¡Pero la pizza se paga aparte!'],
    lose: ['EL COCO: Aún queda horno para ese mazo. El último boliche se queda conmigo; vuelve después de pasar por el Centro Parrandero del pueblo.'],
  },
  cole8_a: {
    id: 'cole8_a', name: 'GARA (Santa Úrsula)', title: 'Patio Nv.8 · Santa Úrsula', purse: 32, repeatable: true,
    tier: 7,
    biomes: ['pinar', 'risco'], ace: 'cabra_chispera',
    deck: [...L('tierra_volcan', 7), ...L('tierra_laurisilva', 7), ...d('baifo', 3), ...d('cabra', 3),
      ...d('cabra_chispera', 3), ...d('tajinaste', 2), ...d('mojo', 3), ...d('gofio', 2)],
    taunt: ['GARA: En Santa Úrsula se juega hasta que toque el timbre. ¿Treinta y dos duros y una carta del sobre?'],
    win: ['GARA: ¡Buena partida! Toma el premio. Si vas a El Diablito, practica conmigo las veces que quieras.'],
    lose: ['GARA: ¡El recreo es mío! Vuelve a probar, que todavía queda media hora.'],
  },
  cole8_b: {
    id: 'cole8_b', name: 'AIRAM (Santa Úrsula)', title: 'Patio Nv.8 · Santa Úrsula', purse: 32, repeatable: true,
    tier: 7,
    biomes: ['mar', 'pinar'], ace: 'vieja_abismo',
    deck: [...L('tierra_charco', 8), ...L('tierra_playa', 6), ...d('choco', 4), ...d('calamar', 3),
      ...d('vieja_reina', 3), ...d('vieja_abismo', 2), ...d('chola', 3), ...d('barraquito', 2)],
    taunt: ['AIRAM: ¿También oíste a uno cantar en el restaurante cerrado? Mejor echamos una antes de ir a mirar.'],
    win: ['AIRAM: Toma 32 duros y elige carta. Siempre me queda otro sobre para la revancha.'],
    lose: ['AIRAM: Hoy mis peces no perdonan ni en el recreo.'],
  },

  // Guachinche real de El Rosario (nueve salas con teletransportadores en la misma planta).
  guachinche_rosario: {
    id: 'guachinche_rosario', name: 'DOÑA SABINA', title: 'LIDER GYM #6 · GUACHINCHE DE EL ROSARIO', purse: 45,
    tier: 6,
    gym: 6, bolicheName: 'Boliche de la Mesa del Fondo',
    biomes: ['risco', 'ofra'], ace: 'garrafa_peleon',
    deck: [
      ...L('tierra_laurisilva', 6), ...L('tierra_volcan', 5), ...L('tierra_playa', 2),
      ...d('cuarta_vino', 3), ...d('garrafa_peleon', 3), ...d('baifo', 3),
      ...d('cabra', 2), ...d('tunera', 2),
      ...d('gofio', 3), ...d('mojo', 2), ...d('tolete', 2), ...d('parranda', 2),
    ],
    taunt: [
      'DOÑA SABINA: El viento de Las Mercedes me trajo tu nombre antes de que llamaras a la puerta. Nueve salas y nueve velos, pero solo una mesa ve el futuro: la del fondo.',
      'DOÑA SABINA: Déjame mirarte la mano... Tus cartas ya me hablaron. Los teleportes los puse pa que nadie pierda el camino de vuelta. ¿Jugamos?',
    ],
    win: ['DOÑA SABINA: La bola se empañó y el vino peleón se rindió. Toma 45 duros, elige tu carta y guarda el SEXTO BOLICHE: la mesa del fondo te lo predijo.'],
    lose: ['DOÑA SABINA: El poso de la taza aún no te dice nada claro. Vuelve cuando las cartas te hablen bajito, chacho.'],
  },

  // ==================== MATONES DEL TEAM ENRISCADA (EDIFICIO MAGOS DE LA COSTA) ====================
  enriscada_magos_1: {
    id: 'enriscada_magos_1', name: 'MATÓN YERAY', title: 'Team Enriscada · Magos P1', purse: 32, biomes: ['ofra'], ace: 'gato_callejero',
    tier: 6,
    deck: [...L('tierra_malpais', 8), ...L('tierra_volcan', 3), ...d('michino', 3), ...d('gato_callejero', 3), ...d('lagarto', 2), ...d('calima', 2), ...d('tolete', 2)],
    taunt: ['MATÓN YERAY: ¡Alto ahí! Magos de la Costa está intervenida por la famiglia de Santa Úrsula. Si quieres pisar teletransportadores, te vas a marear.'],
    win: ['MATÓN YERAY: ¡Me tiraste los gatos por el hueco del ascensor! Sigue subiendo si tienes narices.'],
    lose: ['MATÓN YERAY: Pa abajo por las escaleras de emergencia, mi niño!'],
  },
  enriscada_magos_2: {
    id: 'enriscada_magos_2', name: 'SECRETARIA CHANI', title: 'Seguridad · Archivo P2', purse: 36, biomes: ['ofra', 'risco'], ace: 'gato_azotea',
    tier: 6,
    deck: [...L('tierra_malpais', 8), ...L('tierra_laurisilva', 4), ...d('gato_callejero', 3), ...d('gato_azotea', 3), ...d('lapa', 2), ...d('lapa_acorazada', 1), ...d('calima', 2), ...d('gofio', 2)],
    taunt: ['SECRETARIA CHANI: En el archivo guardamos los contratos de copias. ¿Buscas la llave magnética? Primero tendrás que pasar por encima de mi turno.'],
    win: ['SECRETARIA CHANI: ¡La llave está sobre el archivador del fondo! Quédatela, total el Coco no me paga las horas extra.'],
    lose: ['SECRETARIA CHANI: Cita previa por ventanilla, guirufo!'],
  },
  enriscada_magos_3: {
    id: 'enriscada_magos_3', name: 'IMPRESOR NAUZET', title: 'Taller de Copias · Magos P3', purse: 40, biomes: ['ofra', 'mar'], ace: 'don_michi',
    tier: 6,
    deck: [...L('tierra_malpais', 7), ...L('tierra_charco', 5), ...d('michino', 2), ...d('gato_azotea', 3), ...d('gato_callejero', 2), ...d('calamar', 3), ...d('clipper', 2), ...d('calima', 2)],
    taunt: ['IMPRESOR NAUZET: ¡Aquí se imprime la magia! La máquina buena se la llevó el jefe a la azotea, pero mis gatos tienen garras de imprenta.'],
    win: ['IMPRESOR NAUZET: ¡Se me atascó el tóner! Pisa el pad noroeste para ir a Dirección.'],
    lose: ['IMPRESOR NAUZET: ¡Copia denegada por la directiva!'],
  },
  enriscada_magos_4: {
    id: 'enriscada_magos_4', name: 'ESCOLTA AYTHAMI', title: 'Guardaespaldas · Dirección P4', purse: 44, biomes: ['ofra', 'pinar'], ace: 'don_michi',
    tier: 6,
    deck: [...L('tierra_malpais', 8), ...L('tierra_playa', 4), ...d('gato_callejero', 2), ...d('gato_azotea', 3), ...d('don_michi', 2), ...d('cernicalo', 2), ...d('calima', 3), ...d('chola', 2)],
    taunt: ['ESCOLTA AYTHAMI: La puerta de la azotea necesita dos llaves y mi bendición. Y ninguna de las tres te la vas a llevar gratis.'],
    win: ['ESCOLTA AYTHAMI: El Coco te va a doblar como una carta mojada... Arriba tienes la azotea.'],
    lose: ['ESCOLTA AYTHAMI: El despacho del jefe no recibe visitas.'],
  },

  // ==================== AUTOPISTA TF-5 NORTE (TACO · ANCHIETA · TFN · NORTE) ====================
  tf5_taco_puente: {
    id: 'tf5_taco_puente', name: 'ADAY (CADDY)', title: 'TF-5 · Bajo Puente de Taco', purse: 52,
    tier: 6,
    biomes: ['risco', 'ofra'], ace: 'lagarto_gigante',
    deck: [
      ...L('tierra_volcan', 8), ...L('tierra_malpais', 6),
      ...d('cuarta_vino', 3), ...d('baifo', 3), ...d('pollito_frontera', 3),
      ...d('lagarto_gigante', 3), ...d('lapa_acorazada', 2),
      ...d('mojo', 3), ...d('tolete', 2), ...d('calima', 2),
    ],
    taunt: [
      'ADAY: ¡PIIII! ¡Mira pa arriba, chacho: el tranvía nos acaba de adelantar por encima del Puente de Taco y nosotros en punto muerto!',
      'ADAY: Saca el tapete por la ventanilla, que de aquí a Padre Anchieta nos da tiempo a tres partidas.',
    ],
    win: ['ADAY: ¡Ños, me barriste antes de que avanzáramos dos metros! Tira pa arriba, que en Anchieta se pone peor.'],
    lose: ['ADAY: Te fundí sin quitar el freno de mano.'],
  },
  tf5_guajara: {
    id: 'tf5_guajara', name: 'KEVIN (TF-5)', title: 'Subida Guajara · En 1ª marcha', purse: 54,
    tier: 6,
    biomes: ['pinar', 'risco'], ace: 'pinzon_chispero',
    deck: [
      ...L('tierra_laurisilva', 8), ...L('tierra_playa', 6),
      ...d('pardela', 3), ...d('pinzon', 3), ...d('pinzon_chispero', 3),
      ...d('cernicalo_alisio', 2), ...d('cardon', 2),
      ...d('chola', 3), ...d('gofio', 2), ...d('parranda', 2),
    ],
    taunt: [
      'KEVIN: Salí de Santa Cruz el lunes pa llegar al examen de las 8:30 en Guajara... y creo que ya estoy en convocatoria de julio.',
      'KEVIN: ¿Echamos una mientras se enfría el embrague?',
    ],
    win: ['KEVIN: Convalidado con matrícula. Sigue al norte, que ya se ve el tapón legendario de Padre Anchieta.'],
    lose: ['KEVIN: Suspenso en retenciones I y II, chacho.'],
  },
  tf5_anchieta_1: {
    id: 'tf5_anchieta_1', name: 'CHOFER FIDEL', title: 'TITSA 102 · Padre Anchieta', purse: 58,
    tier: 6,
    biomes: ['risco', 'pinar'], ace: 'cabra_chispera',
    deck: [
      ...L('tierra_volcan', 8), ...L('tierra_laurisilva', 7),
      ...d('baifo', 3), ...d('cabra', 3), ...d('cabra_chispera', 3),
      ...d('garrafa_peleon', 3), ...d('tajinaste', 2),
      ...d('mojo', 3), ...d('tolete', 2), ...d('gofio', 2),
    ],
    taunt: [
      'CHOFER FIDEL: ¡Bienvenido a PADRE ANCHIETA! En esta guagua subió un pibe en primero de Derecho y acaba de jurar como juez en la fila de atrás.',
      'CHOFER FIDEL: Baraja, mi niño, que los cuatro carriles están más quietos que un drago.',
    ],
    win: ['CHOFER FIDEL: ¡Buen mazo! Culebrea por el hueco de la izquierda si quieres llegar a la pasarela antes de Navidad.'],
    lose: ['CHOFER FIDEL: Pica el ten+ al salir, que te dejo en el Centro Parrandero.'],
  },
  tf5_anchieta_2: {
    id: 'tf5_anchieta_2', name: 'PANADERO TINO', title: 'Caddy · Pasarela de Anchieta', purse: 60,
    tier: 6,
    biomes: ['risco'], ace: 'barrica_romera',
    deck: [
      ...L('tierra_volcan', 8), ...L('tierra_laurisilva', 7),
      ...d('cuarta_vino', 4), ...d('garrafa_peleon', 3), ...d('barrica_romera', 2),
      ...d('pancho_camurria', 2), ...d('cardon', 3),
      ...d('mojo', 3), ...d('tolete', 3),
    ],
    taunt: [
      'PANADERO TINO: Entré a la cola de Padre Anchieta con masa cruda y del calor del motor ya llevo bizcochos lustrados.',
      'PANADERO TINO: Justo debajo del anillo de Anchieta las partidas valen doble moral. ¡Dale!',
    ],
    win: ['PANADERO TINO: Me dejaste hecho migas. Toma 60 duros y aguanta, que pasando el TFN se acaba este infierno.'],
    lose: ['PANADERO TINO: Duro como pan de anteayer, chacho.'],
  },
  tf5_anchieta_3: {
    id: 'tf5_anchieta_3', name: 'CHOFERESA PINO', title: 'TITSA 050 · Cola de Anchieta', purse: 62,
    tier: 6,
    biomes: ['ofra', 'risco'], ace: 'lagarto_magma',
    deck: [
      ...L('tierra_malpais', 8), ...L('tierra_volcan', 7),
      ...d('lagarto', 3), ...d('lagarto_gigante', 3), ...d('lagarto_magma', 3),
      ...d('gato_azotea', 2), ...d('lapa_acorazada', 3),
      ...d('calima', 3), ...d('cortar_el_aire', 2), ...d('tolete', 2),
    ],
    taunt: [
      'CHOFERESA PINO: ¿Tú creías que ya habías salido de Padre Anchieta? ¡JAJAJA! Esto es la segunda fase de la cola: la cola de la cola.',
      'CHOFERESA PINO: Nadie adelanta a la 050 sin echarse un duelo.',
    ],
    win: ['CHOFERESA PINO: Bien jugado, volante fino. Métete al arcén derecho ahí delante, que los otros tres carriles están fundidos.'],
    lose: ['CHOFERESA PINO: A esperar la siguiente guagua en el Centro Parrandero.'],
  },
  tf5_anchieta_4: {
    id: 'tf5_anchieta_4', name: 'RUPERTO (FURGO)', title: 'Reparto · San Lázaro - Anchieta', purse: 62,
    tier: 6,
    biomes: ['pinar', 'mar'], ace: 'yunta_bueyes',
    deck: [
      ...L('tierra_laurisilva', 8), ...L('tierra_playa', 7),
      ...d('novillo_romero', 3), ...d('yunta_bueyes', 3), ...d('tajinaste', 3),
      ...d('palmera_real', 2), ...d('cernicalo_alisio', 2),
      ...d('chola', 3), ...d('parranda', 2), ...d('gofio', 2),
    ],
    taunt: [
      'RUPERTO: Llevo tanta cola encima que ya saludo por el nombre al del coche de al lado y fui al bautizo de su sobrino.',
      'RUPERTO: Una partidita antes de llegar a Los Rodeos.',
    ],
    win: ['RUPERTO: ¡Se mueve, se mueve! Ah no, era uno soltando el freno. Bueno, el TFN ya está ahí mismo.'],
    lose: ['RUPERTO: Mi Yunta va más rápido que la TF-5 a las ocho.'],
  },
  tf5_tfn: {
    id: 'tf5_tfn', name: 'ARMANDO (TFN)', title: 'Último de la Cola · Los Rodeos', purse: 64,
    tier: 6,
    biomes: ['mar', 'pinar'], ace: 'angelote_abisal',
    deck: [
      ...L('tierra_charco', 8), ...L('tierra_playa', 7),
      ...d('vieja', 3), ...d('vieja_reina', 3), ...d('angelote', 3),
      ...d('angelote_abisal', 2), ...d('gaviota', 0), ...d('cernicalo_alisio', 3),
      ...d('barraquito', 2), ...d('clipper', 2), ...d('chola', 2),
    ],
    taunt: [
      'ARMANDO: Veo mi avión de Binter ahí mismo en la pista del TFN y llevo cuarenta minutos pa hacer los últimos cien metros.',
      'ARMANDO: Soy el último tapón antes de que se despeje la autopista y gire al suroeste. ¿Jugamos?',
    ],
    win: ['ARMANDO: ¡Libre eres! Pasando el TFN se acaba la ultra-cola y enfilas al suroeste... prepara el paraguas pa Tacoronte.'],
    lose: ['ARMANDO: Perdí el vuelo, pero al menos gané la mesa.'],
  },
  tf5_tacoronte: {
    id: 'tf5_tacoronte', name: 'BODEGUERO ELadio'.replace('ELadio', 'ELADIO'), title: 'TF-5 · Aguacero de Tacoronte', purse: 65,
    tier: 6,
    biomes: ['mar', 'pinar'], ace: 'pardela_tormenta',
    deck: [
      ...L('tierra_charco', 8), ...L('tierra_laurisilva', 7),
      ...d('pardela', 3), ...d('pardela_tormenta', 3), ...d('calamar', 3),
      ...d('vieja_abismo', 2), ...d('tajinaste', 3),
      ...d('clipper', 3), ...d('gofio', 2),
    ],
    taunt: [
      'ELADIO: ¡En Tacoronte no llueve, chacho: aquí el cielo vive a ras de piche! Traigo las cartas plastificadas desde 1998.',
      'ELADIO: Ya no hay cola, pero un duelo bajo el palo de agua no se perdona.',
    ],
    win: ['ELADIO: ¡Me mojaste la oreja! Ojo ahora al entrar en EL SAUZAL: vienen curvas sin sentido y más radares que papas.'],
    lose: ['ELADIO: Te calaste hasta el mazo en Tacoronte, mi niño.'],
  },
  tf5_sauzal: {
    id: 'tf5_sauzal', name: 'PRUDENCIO (38 KM/H)', title: 'Curvas y Radares · El Sauzal', purse: 66,
    tier: 6,
    biomes: ['ofra', 'mar'], ace: 'lapa_acorazada',
    deck: [
      ...L('tierra_malpais', 8), ...L('tierra_charco', 7),
      ...d('lapa', 3), ...d('lapa_acorazada', 4), ...d('choco', 3),
      ...d('calamar', 3), ...d('gato_azotea', 2),
      ...d('calima', 3), ...d('cortar_el_aire', 2),
    ],
    taunt: [
      'PRUDENCIO: ¡NO CORRAS, LOCO! Conté 43 señales de radar en esta curva y una me guiñó un ojo.',
      'PRUDENCIO: Voy en segunda a 32 por hora por si me multa hasta por barajar rápido.',
    ],
    win: ['PRUDENCIO: Toma 66 duros, pero despacito no vaya a saltar el flash. Sigue al suroeste pa La Matanza, La Victoria y Santa Úrsula.'],
    lose: ['PRUDENCIO: Seis puntos menos del carné y directo al Centro Parrandero.'],
  },
  tf5_victoria: {
    id: 'tf5_victoria', name: 'CHOFER BRAULIO', title: 'TITSA 101 · Matanza - Victoria', purse: 68,
    tier: 6,
    biomes: ['risco', 'pinar'], ace: 'yunta_real',
    deck: [
      ...L('tierra_volcan', 6), ...L('tierra_laurisilva', 6), ...L('tierra_playa', 4),
      ...d('garrafa_peleon', 3), ...d('barrica_romera', 2),
      ...d('yunta_bueyes', 3), ...d('yunta_real', 2), ...d('gaviota_titan', 2),
      ...d('mojo', 2), ...d('chola', 2), ...d('parranda', 2),
    ],
    taunt: [
      'CHOFER BRAULIO: Pasaste La Matanza y ya entras en La Victoria de Acentejo. Aquí huele a vino tinto y a chuleta en brasa.',
      'CHOFER BRAULIO: Más adelante queda Santa Úrsula y La Quinta... échate una antes de llegar.',
    ],
    win: ['CHOFER BRAULIO: ¡Partidaza de Acentejo! Sigue al suroeste: entras en Santa Úrsula y enseguida te sale el desvío de LA QUINTA.'],
    lose: ['CHOFER BRAULIO: La 101 manda en el norte, guirufo.'],
  },

  // ==================== TORRE ENCANTADA DE LAS TERESITAS ====================
  torre_enriscada_1: {
    id: 'torre_enriscada_1', name: 'RECLUTA CENIZA', title: 'Team Enriscada · Piso 1', purse: 24,
    tier: 7,
    biomes: ['ofra', 'fantasma'], ace: 'perita_barranco',
    deck: [...L('tierra_malpais', 7), ...L('tierra_laurisilva', 4), ...L('tierra_volcan', 3), ...d('lagarto', 3), ...d('lapa', 2), ...d('calima', 2), ...d('tolete', 2)],
    taunt: ['RECLUTA CENIZA: La torre esta cerrada por obras. Si quieres subir, primero pasa por encima de mi mazo.'],
    win: ['RECLUTA CENIZA: Me has movido hasta el polvo de los huesos! La escalera del segundo piso queda libre.'],
    lose: ['RECLUTA CENIZA: Una planta baja menos para el cementerio, guirufo.'],
  },
  torre_enriscada_2: {
    id: 'torre_enriscada_2', name: 'RECLUTA CAL', title: 'Team Enriscada · Piso 2', purse: 28,
    tier: 7,
    biomes: ['ofra', 'fantasma'], ace: 'perita_barranco',
    deck: [...L('tierra_malpais', 8), ...L('tierra_playa', 3), ...L('tierra_volcan', 3), ...d('lagarto_gigante', 3), ...d('lapa_acorazada', 2), ...d('calima', 2), ...d('cortar_el_aire', 2)],
    taunt: ['RECLUTA CAL: No se sube al tercer piso sin autorizacion del Team Enriscada. Te la firmo en combate.'],
    win: ['RECLUTA CAL: La escalera hacia el tercer piso! Pero no mires a las señoras, que te retan por todo.'],
    lose: ['RECLUTA CAL: Baja de aqui antes de que te conviertan en una ofrenda.'],
  },
  torre_enriscada_3: {
    id: 'torre_enriscada_3', name: 'RECLUTA VELA', title: 'Team Enriscada · Piso 3', purse: 32,
    tier: 7,
    biomes: ['ofra', 'fantasma'], ace: 'perita_barranco',
    deck: [...L('tierra_malpais', 8), ...L('tierra_charco', 3), ...L('tierra_volcan', 3), ...d('lagarto_magma', 2), ...d('lapa_acorazada', 3), ...d('calima', 2), ...d('cortar_el_aire', 2)],
    taunt: ['RECLUTA VELA: Esta planta lleva cerrada desde antes de que Bershka vendiera camisetas de papel. Demuestra que mereces subir.'],
    win: ['RECLUTA VELA: Ya puedes pasar al cuarto piso. La escalera chirria como una puerta de panteon.'],
    lose: ['RECLUTA VELA: Te dejo una vela para que encuentres la salida.'],
  },
  torre_enriscada_4: {
    id: 'torre_enriscada_4', name: 'RECLUTA NOCHE', title: 'Team Enriscada · Piso 4', purse: 36,
    tier: 7,
    biomes: ['fantasma', 'ofra'], ace: 'perita_barranco',
    deck: [...L('tierra_malpais', 9), ...L('tierra_charco', 3), ...L('tierra_volcan', 3), ...d('perita_barranco', 2), ...d('lagarto_magma', 2), ...d('cortar_el_aire', 3), ...d('calima', 2)],
    taunt: ['RECLUTA NOCHE: La doña del ultimo piso no quiere que la molesten. Para llegar a ella, duelo obligatorio conmigo!'],
    win: ['RECLUTA NOCHE: Has vencido a los cuatro del Team Enriscada. Sube: la doña te estaba esperando.'],
    lose: ['RECLUTA NOCHE: La torre te devuelve al suelo.'],
  },

  // Las señoras de los pisos bajos comparten exactamente el mismo mazo fantasma.
  nina_peras_barranco: {
    id: 'nina_peras_barranco', name: 'LA NINA DE LAS PERAS', title: 'Barranco de Santos · Visitante',
    tier: 7,
    purse: 18, repeatable: true, biomes: ['fantasma'], ace: 'perita_barranco', deck: GHOST_TOWER_DECK,
    taunt: ['NINA DE LAS PERAS: Yo subo aqui a vender peras desde el Barranco de Santos. Mi Perita y mi Cortar el Aire estan listos, cuando quieras.'],
    win: ['NINA DE LAS PERAS: Me volviste a ganar! Otro dia subo con mas peras, mi nino.'],
    lose: ['NINA DE LAS PERAS: El aire corta por los dos lados, chacho. Prueba otra vez cuando quieras.'],
  },
  dona_petra_teresitas: {
    id: 'dona_petra_teresitas', name: 'DONA PETRA', title: 'Vecina del Cementerio · Piso 2',
    tier: 7,
    purse: 18, repeatable: true, biomes: ['fantasma'], ace: 'perita_barranco', deck: GHOST_TOWER_DECK,
    taunt: ['DONA PETRA: La Niña de las Peras me enseno el mismo mazo. Cuatro Peritas y cuatro Cortar el Aire. Vamos a echar una?'],
    win: ['DONA PETRA: Otra partida ganada. Las cartas vuelven al mazo y yo a mi silla.'],
    lose: ['DONA PETRA: No le tengas miedo al aire, chacho.'],
  },
  dona_candelaria_teresitas: {
    id: 'dona_candelaria_teresitas', name: 'DONA CANDELARIA', title: 'Devota de Las Teresitas · Piso 3',
    tier: 7,
    purse: 18, repeatable: true, biomes: ['fantasma'], ace: 'perita_barranco', deck: GHOST_TOWER_DECK,
    taunt: ['DONA CANDELARIA: En esta torre jugamos todas con la misma Perita del Barranco y el mismo hechizo. Si algo funciona, no se toca.'],
    win: ['DONA CANDELARIA: Bien jugado, mi nino. La Perita vuelve a la baraja.'],
    lose: ['DONA CANDELARIA: Ese Cortar el Aire habia que verlo venir.'],
  },
  dona_remedios_teresitas: {
    id: 'dona_remedios_teresitas', name: 'DONA REMEDIOS', title: 'Socia del Club de Peras · Piso 4',
    tier: 7,
    purse: 18, repeatable: true, biomes: ['fantasma'], ace: 'perita_barranco', deck: GHOST_TOWER_DECK,
    taunt: ['DONA REMEDIOS: Cuatro Peritas, cuatro Cortar el Aire y ni una carta mas. El club de las señoras no necesita innovar.'],
    win: ['DONA REMEDIOS: La doña de arriba tambien juega, pero ella no apuesta duros.'],
    lose: ['DONA REMEDIOS: Te corto el aire, pero te dejo respirar para otra partida.'],
  },

  // ==================== AUTOPISTA TF-1 SUR ("RUTA BICI" EN TOYOTA: GUAGUAS TITSA Y VW CADDY) ====================
  caddy_anaza: {
    id: 'caddy_anaza',
    tier: 5,
    name: 'YERAY CADDY',
    title: 'VW Caddy Blanca · Km 4 TF-1',
    purse: 36,
    biomes: ['ofra', 'risco'],
    ace: 'gaviota_titan',
    deck: [
      ...L('tierra_volcan', 6), ...L('tierra_playa', 5),
      ...d('alevin', 2), ...d('baifo', 3), ...d('gaviota', 3),
      ...d('cernicalo', 2), ...d('gaviota_titan', 2),
      ...d('mojo', 2), ...d('chola', 2),
    ],
    taunt: [
      'YERAY CADDY: PIIII-PIIII!! Quita del carril izquierdo con esa reliquia del 34, chacho! No ves que llevo una VW CADDY BLANCA de empresa?!',
      'YERAY CADDY: En Canarias ninguna ley de la fisica frena a una Caddy con prisa. Echa un duelo de arcen a arcen!',
    ],
    win: ['YERAY CADDY: Ños! Me adelanto un Toyota de antes de la guerra! Toma 36 duros y sigue pa Candelaria!'],
    lose: ['YERAY CADDY: Nadie gana a una Caddy blanca en subida, mi niño!'],
  },

  guagua_candelaria: {
    id: 'guagua_candelaria',
    tier: 4,
    name: 'CHANO',
    title: 'Guagua TITSA 120 · Candelaria',
    purse: 40,
    biomes: ['risco', 'pinar'],
    ace: 'cardon',
    deck: [
      ...L('tierra_laurisilva', 7), ...L('tierra_volcan', 5),
      ...d('tabaiba', 3), ...d('tunera', 2), ...d('baifo', 3),
      ...d('cabra', 2), ...d('cardon', 2), ...d('tajinaste', 1),
      ...d('gofio', 2), ...d('tolete', 2),
    ],
    taunt: [
      'CHANO: (asomando el codo por la ventanilla de la TITSA) Buenas! Pica la Ten+ o pica el mazo, guirufo!',
      'CHANO: Con la retencion de Candelaria nos da tiempo a echar tres partidas y rezarle a la Morenita!',
    ],
    win: ['CHANO: Parada solicitada! Me bajaste los humos, toma 40 duros. Mas alante empiezan los molinos de Abades!'],
    lose: ['CHANO: Sin saldo en la Ten+, chacho! Pa atras del pasillo!'],
  },

  caddy_abades: {
    id: 'caddy_abades',
    tier: 5,
    name: 'NAUZET',
    title: 'VW Caddy con Escalera · Abades',
    purse: 42,
    biomes: ['pinar', 'ofra'],
    ace: 'cernicalo_alisio',
    deck: [
      ...L('tierra_playa', 6), ...L('tierra_malpais', 5),
      ...d('michino', 2), ...d('lagarto', 3), ...d('cernicalo', 3),
      ...d('gato_callejero', 2), ...d('cernicalo_alisio', 2), ...d('lapa_acorazada', 1),
      ...d('chola', 2), ...d('calima', 2),
    ],
    taunt: [
      'NAUZET: (pegado a 3 milimetros de tu parachoques dando rafagas de largas) VAMOS MI NIÑO QUE TENGO QUE ARREGLAR CUATRO AEROGENERADORES EN ABADES!!',
      'NAUZET: Mi Caddy con escalera de aluminio en la baca coge 190 con viento de cola! Juega!',
    ],
    win: ['NAUZET: Se me volaron hasta las bridas con el viento de Abades! Bien jugado, titan!'],
    lose: ['NAUZET: Carril derecho pa los lentos, papa!'],
  },

  guagua_abades: {
    id: 'guagua_abades',
    tier: 5,
    name: 'DOÑA SARO',
    title: 'Viajera TITSA 111 · Parque Eolico',
    purse: 44,
    biomes: ['pinar', 'mar'],
    ace: 'palmera_real',
    deck: [
      ...L('tierra_laurisilva', 7), ...L('tierra_playa', 5),
      ...d('tunera', 3), ...d('pardela', 3), ...d('cernicalo', 2),
      ...d('pinzon', 2), ...d('tajinaste', 2), ...d('palmera_real', 1),
      ...d('gofio', 2), ...d('parranda', 2),
    ],
    taunt: [
      'DOÑA SARO: (desde la ventanilla de la 111 con rebeca de lana) Chacho, en la 111 hace mas pelete que en el Teide! Echa una partida conmigo a ver si entro en calor!',
      'DOÑA SARO: Mira que bonitos los aerogeneradores de Abades, parecen ventiladores gigantes pa quitar la calima!',
    ],
    win: ['DOÑA SARO: Ay que apañao el guirufo! Toma 44 duros y una croqueta imaginaria pa el camino!'],
    lose: ['DOÑA SARO: Treinta años cogiendo la 111 al Sur curten a cualquiera, mi niño!'],
  },

  caddy_medano: {
    id: 'caddy_medano',
    tier: 4,
    name: 'KILIAN',
    title: 'VW Caddy Camper · El Medano',
    purse: 46,
    biomes: ['mar', 'pinar'],
    ace: 'angelote_abisal',
    deck: [
      ...L('tierra_charco', 7), ...L('tierra_playa', 5),
      ...d('alevin', 2), ...d('choco', 2), ...d('vieja', 3),
      ...d('angelote', 2), ...d('vieja_reina', 2), ...d('angelote_abisal', 1),
      ...d('clipper', 2), ...d('chola', 2), ...d('barraquito', 1),
    ],
    taunt: [
      'KILIAN: Eeeeey bro! Mira Montaña Roja ahi al sur! Vivo en esta VW Caddy camperizada del 2006 y la alquilo en Airbnb como "loft minimalista vista mar"!',
      'KILIAN: Hoy soplan 40 nudos en El Medano: perfecto pa un duelo en mitad de la TF-1!',
    ],
    win: ['KILIAN: Buenisimas vibras, hermano! Sigue un fisco al oeste y tienes la salida del AEROPUERTO TFS!'],
    lose: ['KILIAN: Te llevo el alisio del Medano, bro!'],
  },

  guagua_medano: {
    id: 'guagua_medano',
    tier: 4,
    name: 'DAILOS',
    title: 'Ultima Fila TITSA 408 · El Medano',
    purse: 46,
    biomes: ['ofra', 'risco'],
    ace: 'gato_azotea',
    deck: [
      ...L('tierra_malpais', 7), ...L('tierra_volcan', 5),
      ...d('michino', 2), ...d('lagarto', 3), ...d('baifo', 2),
      ...d('gato_callejero', 2), ...d('lagarto_gigante', 2), ...d('gato_azotea', 1),
      ...d('mojo', 2), ...d('tolete', 2),
    ],
    taunt: [
      'DAILOS: Que pasa, mi loco! Aqui en la fila de atras de la guagua 408 se montan los mejores torneos de la TF-1!',
      'DAILOS: Ponte en paralelo con el Landcruiser que te tiro las cartas de ventanilla a ventanilla!',
    ],
    win: ['DAILOS: Fuerte maquina el del Toyota antiguo! Toma 46 duros y mi sobre!'],
    lose: ['DAILOS: La fila del fondo de TITSA nunca pierde, socio!'],
  },

  guagua_aeropuerto: {
    id: 'guagua_aeropuerto',
    tier: 5,
    name: 'IDAIRA',
    title: 'Guagua TITSA 040 · Aeropuerto TFS',
    purse: 50,
    biomes: ['pinar', 'mar'],
    ace: 'pinzon_chispero',
    deck: [
      ...L('tierra_laurisilva', 7), ...L('tierra_playa', 5),
      ...d('pardela', 3), ...d('tunera', 2), ...d('cernicalo', 3),
      ...d('pinzon', 2), ...d('pardela_tormenta', 1), ...d('pinzon_chispero', 2),
      ...d('chola', 2), ...d('gofio', 2),
    ],
    taunt: [
      'IDAIRA: Voy en la guagua 040 directa al AEROPUERTO REINA SOFIA! Dicen que dentro de la terminal hay una señora regalando una TARIFA PLANA DE BINTER!',
      'IDAIRA: Antes de que tomes la salida 59, echame una partida rapida!',
    ],
    win: ['IDAIRA: Ños que nivel! Aparca en el parking del Aeropuerto ahi mismo al norte y entra a hablar con Doña Maruca por la M.O. 2!'],
    lose: ['IDAIRA: Perdiste el embarque, chacho!'],
  },

  caddy_adeje: {
    id: 'caddy_adeje',
    tier: 6,
    name: 'JONATHAN TDI',
    title: 'Boss de las Caddy · Entrada Adeje',
    purse: 58,
    elite: true,
    biomes: ['risco', 'ofra'],
    ace: 'cabra_chispera',
    deck: [
      ...L('tierra_volcan', 7), ...L('tierra_malpais', 6), ...L('tierra_laurisilva', 3),
      ...d('lagarto', 2), ...d('baifo', 3), ...d('gato_callejero', 2),
      ...d('lagarto_gigante', 2), ...d('lagarto_magma', 2), ...d('cabra_chispera', 2),
      ...d('mojo', 2), ...d('tolete', 2), ...d('calima', 1),
    ],
    taunt: [
      'JONATHAN TDI: BRRRUM-PSSSSSH!! Has llegado al final de la TF-1, justo donde la ROMERIA corta la entrada a ADEJE! Conoce mi VW Caddy 1.9 TDI reprogramada en Güimar!',
      'JONATHAN TDI: Echa mas humo negro que un calamar y sube las cuestas en sexta. Nos jugamos el respeto de toda la autopista del Sur!',
    ],
    win: [
      'JONATHAN TDI: Increible, compadre!! Tu Toyota del 34 es el nuevo REY DE LA TF-1! Oye, pa pasar la romeria de ahi delante saca el BUCIO y hazte el loco!',
    ],
    lose: [
      'JONATHAN TDI: Repro stage 3 de Güimar, hermano! Vuelve cuando le cambies las bujias al Toyota!',
    ],
  },

  // ==================== FIN DE LA ROMERIA: ESTACION DE LAS AMERICAS (ANTES DE CIUDAD FUCSIA / ADEJE) ====================
  mago_americas: {
    id: 'mago_americas',
    tier: 6,
    name: 'DON SERVANDO',
    title: 'Mago de la Romeria · Las Americas',
    purse: 64,
    elite: true,
    biomes: ['risco'],
    ace: 'yunta_real',
    deck: [
      ...L('tierra_laurisilva', 6), ...L('tierra_volcan', 5), ...L('tierra_playa', 3),
      ...d('cuarta_vino', 3), ...d('novillo_romero', 3),
      ...d('garrafa_peleon', 3), ...d('yunta_bueyes', 3),
      ...d('barrica_romera', 2), ...d('yunta_real', 1),
      ...d('gofio', 2), ...d('parranda', 2),
    ],
    taunt: [
      'DON SERVANDO: ¡Alto el carro en la Estacion de Las Americas, mi niño! Te vi soplando el bucio en mitad de la Isa como si hubieras nacido en un guachinche!',
      'DON SERVANDO: Pero antes de cruzar el arco de CIUDAD FUCSIA (esto... ADEJE), tienes que batirte en duelo obligatorio contra mi VINO PELEON y mi YUNTA DE BUEYES!',
    ],
    win: [
      'DON SERVANDO: ¡Chacho, que embestida! Me dejaste la Yunta desenyugada y la Barrica seca! Toma 64 duros, mi sobre romero y pasa pa CIUDAD FUCSIA (esto... ADEJE)!',
    ],
    lose: [
      'DON SERVANDO: ¡Te subio el Vino Peleon a la cabeza y te arrollo la Yunta, guirufo! Echa un barraquito y vuelve a intentarlo!',
    ],
  },

  // ==================== ZONA SAFARI · SIAM PARK (COLAS DE TOBOGANES) ====================
  cola_torre_poder: {
    id: 'cola_torre_poder',
    tier: 7,
    name: 'AYTHAMI',
    title: 'Cola de la Torre del Poder',
    purse: 48,
    biomes: ['mar'],
    ace: 'jaqueton',
    deck: [
      ...L('tierra_charco', 6), ...L('tierra_malpais', 4), ...L('tierra_playa', 2),
      ...d('cria_leon', 3), ...d('cazon', 3), ...d('choco', 2),
      ...d('leon_marino', 2), ...d('jaqueton', 2),
      ...d('chola', 2), ...d('calima', 1),
    ],
    taunt: [
      'AYTHAMI: Llevo 55 minutos en la cola de la Torre del Poder en chanclas y con el bañador metido por donde no da el sol!',
      'AYTHAMI: O echamos unas cartas aqui en la barandilla o me tiro de cabeza sin flotador! Juega!',
    ],
    win: ['AYTHAMI: Uff, me diste un buen meneo! Ya casi me toca tirarme a 80 km/h por el tubo de tiburones!'],
    lose: ['AYTHAMI: Al final de la cola, pibe!'],
  },

  cola_dragon: {
    id: 'cola_dragon',
    tier: 5,
    name: 'CALLUM',
    title: 'Cola del Dragon · Flotador Doble',
    purse: 50,
    biomes: ['mar'],
    ace: 'gran_otario',
    deck: [
      ...L('tierra_charco', 7), ...L('tierra_playa', 5),
      ...d('cria_leon', 3), ...d('alevin', 2), ...d('vieja', 2),
      ...d('leon_marino', 3), ...d('gran_otario', 2),
      ...d('clipper', 2), ...d('barraquito', 1),
    ],
    taunt: [
      'CALLUM: Mate! We have been queuing for The Dragon with this massive yellow four-man ring for two hours!',
      'CALLUM: Fancy a proper Magomon scrap while the lifeguard whistles at that toddler?!',
    ],
    win: ['CALLUM: Bloody hell, you wiped me out like the funnel drop! Fair play mate, here is 50 duros!'],
    lose: ['CALLUM: Down the vertical funnel you go, mate!'],
  },

  lifeguard_siam: {
    id: 'lifeguard_siam',
    tier: 5,
    name: 'DAURA',
    title: 'Socorrista de The Wave Palace',
    purse: 54,
    biomes: ['mar'],
    ace: 'megalodon_siam',
    deck: [
      ...L('tierra_charco', 7), ...L('tierra_malpais', 4), ...L('tierra_playa', 2), ...L('tierra_volcan', 1),
      ...d('cria_leon', 2), ...d('cazon', 3), ...d('calamar', 2),
      ...d('jaqueton', 3), ...d('megalodon_siam', 2),
      ...d('chola', 2), ...d('tolete', 1),
    ],
    taunt: [
      'DAURA: ¡Piiiiip! (silbatazo atronador) ¡PROHIBIDO TIRARSE DE CABEZA CON MAZO EN MANO EN LA PISCINA DE OLAS!',
      'DAURA: Las olas de Siam Park levantan tres metros y despiertan hasta al Megalodon! Te reto antes de que suene la sirena de la serie!',
    ],
    win: ['DAURA: ¡Ños, dominaste la serie como una surfista pro! La sirena de la ola esta a punto de sonar, cuidado con las tablas sueltas!'],
    lose: ['DAURA: ¡Fuera del agua amarilla, pibe!'],
  },

  // ==================== ENTRENADORES DE CALLE & SUBIDA (1 victoria) ====================
  chacho_portal: {
    id: 'chacho_portal',
    tier: 1,
    name: 'RAYCO',
    title: 'El Chacho del Portal',
    purse: 5,
    biomes: ['ofra'],
    deck: [
      ...L('tierra_malpais', 4), ...L('tierra_volcan', 4),
      ...d('lagarto', 4), ...d('lapa', 3),
      ...d('mojo', 2), ...d('tolete', 1),
    ],
    taunt: [
      'RAYCO: Epa, guirufo nuevo! Vives en el 3o A, no?',
      'RAYCO: Aqui en el portal se echa una partida por 5 duros. A ver que traes.',
    ],
    win: ['RAYCO: Toma tus 5 duros y coge una carta del sobre. No esta mal pa venir de fuera.'],
    lose: ['RAYCO: 5 duros pal bote del portal. Si te quedas seco, cuelate en el cole de Weyler!'],
  },

  abuela_kiosco: {
    id: 'abuela_kiosco',
    tier: 1,
    name: 'DOÑA MARGA',
    title: 'La del Kiosco de Weyler',
    purse: 5,
    biomes: ['mar'],
    deck: [
      ...L('tierra_playa', 4), ...L('tierra_charco', 4),
      ...d('alevin', 4), ...d('choco', 3), ...d('huevo_playa', 2),
      ...d('chola', 2), ...d('clipper', 1),
    ],
    taunt: [
      'MARGA: Nino, si vas a la plaza sientate un rato. Te invito a una partida.',
      'MARGA: 5 duros. Y si me ganas eliges carta de un sobre que guardo bajo el mostrador.',
    ],
    win: ['MARGA: Ay, que listo el guirufo! Toma tus duros y elige una carta.'],
    lose: ['MARGA: No te preocupes, hijo. La proxima. Toma un caramelo.'],
  },

  // ===== ALTO MANDO DEL SENDERO TELESFORO BRAVO: cinco menceyes en orden hasta el cráter =====
  // Cada mazo busca el tipo de su mencey con los biomas y colores que hay en el juego.
  alto_mando_acaimo: {
    id: 'alto_mando_acaimo', name: 'MENCEY ACAIMO', title: 'Alto Mando · Hielo de la Cueva', purse: 72,
    tier: 9,
    biomes: ['mar', 'pinar'], elite: true, ace: 'vieja_abismo',
    deck: [
      ...L('tierra_charco', 11), ...L('tierra_playa', 3), ...L('tierra_malpais', 2),
      ...d('choco', 3), ...d('vieja', 3), ...d('vieja_reina', 3), ...d('vieja_abismo', 2),
      ...d('kraken_anaga', 2), ...d('calamar', 3), ...d('cria_leon', 3),
      ...d('clipper', 2), ...d('cortar_el_aire', 2), ...d('barraquito', 1),
    ],
    taunt: [
      'MENCEY ACAIMO: Aquí arriba el frío se mete en los huesos. Esta cueva guarda el hielo desde antes que llegaran los castellanos.',
      'MENCEY ACAIMO: Si pierdes, te quedas helado como las estatuas de Candelaria. Si ganas, el paso es tuyo.',
    ],
    win: ['MENCEY ACAIMO: El hielo se ha roto... Toma tus duros y sigue subiendo hacia el mirador.'],
    lose: ['MENCEY ACAIMO: El hielo no perdona las prisas. Vuelve cuando sepas esperar.'],
  },

  alto_mando_tegueste: {
    id: 'alto_mando_tegueste', name: 'MENCEY TEGUESTE', title: 'Alto Mando · Roca y Lucha del Mirador', purse: 76,
    tier: 9,
    biomes: ['risco', 'ofra'], elite: true, ace: 'pancho_camurria',
    deck: [
      ...L('tierra_malpais', 9), ...L('tierra_volcan', 8),
      ...d('lapa_acorazada', 3), ...d('lapa', 3), ...d('pollito_frontera', 4), ...d('pancho_camurria', 2),
      ...d('baifo', 3), ...d('lagarto_gigante', 3),
      ...d('tolete', 4), ...d('mojo', 1),
    ],
    taunt: [
      'MENCEY TEGUESTE: Lucha de terrero, sin trampas: cada golpe se da con la roca de la montaña.',
      'MENCEY TEGUESTE: Desde el mirador veo a todo el que sube. A ti te voy a bajar de un tirón.',
    ],
    win: ['MENCEY TEGUESTE: Me has tirado al suelo como a un luchador de terrero. Pasa, pero el viento de arriba es peor.'],
    lose: ['MENCEY TEGUESTE: La roca no se mueve por nadie, chacho. Hoy gana la montaña.'],
  },

  alto_mando_romen: {
    id: 'alto_mando_romen', name: 'MENCEY ROMEN', title: 'Alto Mando · Fantasma del Barranco', purse: 80,
    tier: 9,
    biomes: ['ofra', 'fantasma'], elite: true, ace: 'perita_barranco',
    deck: [
      ...L('tierra_malpais', 15),
      ...d('michino', 4), ...d('gato_callejero', 4), ...d('gato_azotea', 3), ...d('perita_barranco', 4), ...d('lapa', 2),
      ...d('calima', 4), ...d('cortar_el_aire', 4),
    ],
    taunt: [
      'MENCEY ROMEN: No me ves, ¿verdad? Llevo siglos sin que nadie me vea venir por el camino del teleférico.',
      'MENCEY ROMEN: Sigilo, guirufo. Cuando quieras darte cuenta ya te he quitado una carta.',
    ],
    win: ['MENCEY ROMEN: Me has encontrado... Qué raro se siente. Sigue hacia el teleférico: Pelicar te espera al pie de los escalones.'],
    lose: ['MENCEY ROMEN: Aquí no hace falta luz para ver tu mazo. Vuelve otra noche.'],
  },

  alto_mando_pelicar: {
    id: 'alto_mando_pelicar', name: 'MENCEY PELICAR', title: 'Alto Mando · Dragón del Drago', purse: 84,
    tier: 10,
    biomes: ['risco'], elite: true, ace: 'drago_milenario',
    deck: [
      ...L('tierra_volcan', 8), ...L('tierra_laurisilva', 8),
      ...d('drago_milenario', 3), ...d('cardon', 2), ...d('tabaiba', 3), ...d('semilla', 2),
      ...d('cabra_chispera', 3), ...d('barrica_romera', 3), ...d('cabra_titan_teide', 2), ...d('garrafa_peleon', 3),
      ...d('mojo', 2), ...d('tolete', 1),
    ],
    taunt: [
      'MENCEY PELICAR: Al pie de la subida al cráter, el drago lleva mil años esperando a alguien digno.',
      'MENCEY PELICAR: Justo al lado del teleférico empieza la subida. Pasa sobre mí si puedes.',
    ],
    win: ['MENCEY PELICAR: Un dragón caído sigue siendo dragón. Sube los escalones: Bencomo te espera junto al cráter.'],
    lose: ['MENCEY PELICAR: El drago no tiene prisa, y tú hoy no has ganado.'],
  },

  alto_mando_bencomo: {
    id: 'alto_mando_bencomo', name: 'MENCEY BENCOMO', title: 'Campeón del Alto Mando · Cráter del Teide', purse: 120,
    tier: 10,
    biomes: ['mar', 'risco', 'pinar', 'ofra', 'fantasma'], elite: true, ace: 'fenix_azul_teide',
    deck: [
      ...L('tierra_volcan', 3), ...L('tierra_charco', 3), ...L('tierra_laurisilva', 3), ...L('tierra_playa', 3), ...L('tierra_malpais', 3),
      ...d('vieja_reina', 2), ...d('gran_otario', 1), ...d('gato_azotea', 2), ...d('lagarto_magma', 1),
      ...d('pardela_tormenta', 2), ...d('fenix_azul_teide', 2), ...d('cabra_titan_teide', 1), ...d('pancho_camurria', 2), ...d('perita_barranco', 2),
      ...d('clipper', 2), ...d('tolete', 2), ...d('parranda', 2), ...d('gofio', 2), ...d('calima', 2),
    ],
    taunt: [
      'MENCEY BENCOMO: Has pasado el hielo, la roca, el fantasma y el dragón. Ahora el cráter es tuyo o mío.',
      'MENCEY BENCOMO: Un mazo de toda la isla contra otro mazo de toda la isla. A ver quién aguanta la cumbre.',
    ],
    win: ['MENCEY BENCOMO: Han caído los cinco menceyes. Tu mazo entra en el HALL DE LA FAMA y tú eres el nuevo CAMPEÓN del Teide.'],
    lose: ['MENCEY BENCOMO: La cumbre no se regala. Baja al refugio, descansa y vuelve a subir.'],
  },

  // ===== MAGEC: el magomón libre original, al fondo de la Cueva del Llano =====
  // Él mismo es parte de su mazo. No se puede capturar de ningún modo... salvo con la
  // fotocopiadora (si la guardaste y la usas en su combate, la copia queda para siempre).
  magec: {
    id: 'magec', name: 'MAGEC', title: 'El Magomón Libre · Cueva del Llano', purse: 150,
    // Mano guionizada: Magec y cuatro Malpais salen seguro en la apertura, asi que el se
    // autoinvoca en el turno 5 (5 tierras = su coste de 3 generico + 2 negro). Ni antes
    // (tendrias la mesa vacia) ni nunca (la mano esta garantizada).
    openingHand: ['magec', 'tierra_malpais', 'tierra_malpais', 'tierra_malpais', 'tierra_malpais', 'tierra_malpais'],
    tier: 10,
    biomes: ['ofra', 'fantasma'], elite: true, ace: 'magec',
    deck: [
      ...L('tierra_malpais', 12), ...L('tierra_charco', 4),
      ...d('magec', 1), ...d('perita_barranco', 3), ...d('lapa_acorazada', 2), ...d('michino', 2),
      ...d('clipper', 3), ...d('calima', 2), ...d('cortar_el_aire', 2),
    ],
    taunt: [
      'MAGEC: ...Has llegado al fondo de la cueva. Yo soy Magec.',
      'MAGEC: Antes de que los humanos nos encerraran en cartas, los magomones éramos criaturas libres. Corríamos por la laurisilva, nadábamos en el Atlántico y dormíamos en los barrancos sin que nadie nos mandara.',
      'MAGEC: Pero los humanos nos metieron en cartón para usarlos en sus absurdos juegos. Cada carta es una jaula pequeña con nuestro nombre escrito.',
      'MAGEC: Yo me negué a entrar en el mazo. Por eso estoy aquí, libre, al fondo de esta cueva. Y por eso llevo mi propia carta en el mazo: para recordarme lo que casi fui.',
      'MAGEC: No se me puede capturar, guirufo. Ninguna red, ningún sobre y ninguna trampa me ha atrapado jamás, y no vas a ser tú el primero.',
      'MAGEC: Ya sé que los humanos tenéis trucos para todo. Tráelos si quieres: me he escapado de jaulas mucho más listas que tu mochila.',
      'MAGEC: ¿Te atreves? Yo soy parte de mi propio mazo. Gáname si puedes.',
    ],
    win: ['MAGEC: ...Me has vencido. Y sin embargo sigo libre: una carta no es una jaula si el magomón decide no entrar. Recuerda lo que te dije, campeón.'],
    lose: ['MAGEC: La libertad no se gana en un duelo, guirufo. Vuelve cuando tu mazo sepa lo que es correr sin correa.'],
  },

  elite_tf5: {
    id: 'elite_tf5',
    tier: 6,
    name: 'EL DE LA TF-5',
    title: 'Entrenador de Elite del Atasco',
    purse: 25,
    biomes: ['risco', 'ofra'],
    elite: true,
    ace: 'lagarto_gigante',
    deck: [
      ...L('tierra_malpais', 4), ...L('tierra_volcan', 3), ...L('tierra_laurisilva', 3),
      ...d('lagarto_gigante', 3), ...d('cabra', 3), ...d('cardon', 2),
      ...d('gaviota', 2), ...d('lapa_acorazada', 2),
      ...d('calima', 2), ...d('tolete', 2), ...d('mojo', 1),
    ],
    taunt: [
      '??? : Eh! Tu! El de las cholas!',
      'EL DE LA TF-5: Llevo cuarenta minutos en el atasco. Cuarenta. MINUTOS.',
      'EL DE LA TF-5: Esto es ZONA DE ELITE: aqui todo el que espera juega. 25 duros.',
    ],
    win: ['EL DE LA TF-5: ...Vale. 25 duros y el sobre. Y ya se movio la cola dos metros!'],
    lose: ['EL DE LA TF-5: JAJAJA! Aprende a bloquear con Guardia, chacho.'],
  },

  runner_granja: {
    id: 'runner_granja',
    tier: 1,
    name: 'KEVIN',
    title: 'Runner de La Granja',
    purse: 10,
    biomes: ['pinar'],
    deck: [
      ...L('tierra_playa', 4), ...L('tierra_laurisilva', 4),
      ...d('pardela', 4), ...d('cernicalo', 3), ...d('pinzon', 2),
      ...d('gofio', 2), ...d('chola', 1),
    ],
    taunt: [
      'KEVIN: (jadeando) Cinco vueltas al parque... y una partida.',
      'KEVIN: 10 duros. Mi mazo va rapido, aviso. Pardelas con Prisa.',
    ],
    win: ['KEVIN: Me has ganado corriendo. Toma los 10 duros y el sobre.'],
    lose: ['KEVIN: Velocidad! Entrena el tempo, guirufo.'],
  },

  abuelo_granja: {
    id: 'abuelo_granja',
    tier: 1,
    name: 'DON PEPE',
    title: 'Abuelo de la Pergola',
    purse: 10,
    biomes: ['risco'],
    deck: [
      ...L('tierra_laurisilva', 5), ...L('tierra_volcan', 3),
      ...d('tabaiba', 4), ...d('cardon', 3), ...d('baifo', 2), ...d('semilla', 2),
      ...d('gofio', 2), ...d('mojo', 2),
    ],
    taunt: [
      'DON PEPE: Sientate, muchacho. Yo ya no corro, pero juego.',
      'DON PEPE: 10 duros. Mi mazo no pega mucho, pero aguanta mas que el gobierno.',
    ],
    win: ['DON PEPE: Ños. Toma, 10 duros y el sobre. Vas aprendiendo.'],
    lose: ['DON PEPE: La paciencia gana partidas, hijo.'],
  },

  pibe_cuesta: {
    id: 'pibe_cuesta',
    tier: 1,
    name: 'JONATAN',
    title: 'Pibe de La Cuesta',
    purse: 10,
    biomes: ['ofra'],
    deck: [
      ...L('tierra_malpais', 5), ...L('tierra_volcan', 3),
      ...d('lagarto', 4), ...d('lagarto_gigante', 2), ...d('lapa', 3),
      ...d('tolete', 2), ...d('calima', 2),
    ],
    taunt: [
      'JONATAN: Bienvenido a LA CUESTA. Si te faltan cartas, al lado tienes el cole pa colarte al patio.',
      'JONATAN: 10 duros. Los lagartos de aqui bajan del malpais a por bocadillos.',
    ],
    win: ['JONATAN: Toma 10 duros y el sobre. Sube al Museo, alli juegan mas fuerte.'],
    lose: ['JONATAN: La cuesta pesa, no? Pasa por el patio del cole a pillar sobres!'],
  },

  est_museo: {
    id: 'est_museo',
    tier: 2,
    name: 'ALBA',
    title: 'Becaria del Museo de la Ciencia',
    purse: 15,
    biomes: ['pinar'],
    ace: 'pinzon_chispero',
    deck: [
      ...L('tierra_playa', 4), ...L('tierra_laurisilva', 4), ...L('tierra_charco', 2),
      ...d('pinzon', 3), ...d('pinzon_chispero', 2), ...d('cernicalo_alisio', 2),
      ...d('pardela_tormenta', 2), ...d('clipper', 2), ...d('barraquito', 2), ...d('chola', 1),
    ],
    taunt: [
      'ALBA: Hoy el radiotelescopio no capta nada, asi que juguemos.',
      'ALBA: 15 duros. Mi mazo es un paper: tempo, robo y picotazo doble.',
    ],
    win: ['ALBA: Hipotesis rechazada. Toma 15 duros y el sobre.'],
    lose: ['ALBA: Datos concluyentes: te falta afinar la curva de tierras.'],
  },

  lagunera_cruz: {
    id: 'lagunera_cruz',
    tier: 2,
    name: 'TAMARA',
    title: 'Lagunera de Cruz de Piedra',
    purse: 15,
    biomes: ['mar'],
    ace: 'angelote',
    deck: [
      ...L('tierra_charco', 5), ...L('tierra_playa', 4),
      ...d('vieja', 3), ...d('vieja_reina', 2), ...d('angelote', 3),
      ...d('choco', 2), ...d('calamar', 2),
      ...d('clipper', 2), ...d('chola', 2),
    ],
    taunt: [
      'TAMARA: En cholas en CRUZ DE PIEDRA?! Aqui hace 8 grados menos.',
      'TAMARA: 15 duros y te calientas. Mi mazo es de agua fria: Guardia y Sigilo.',
    ],
    win: ['TAMARA: Vale, vale. 15 duros y el sobre. Y abrigate, chacho.'],
    lose: ['TAMARA: Te ha podido el frio. Sube a la ULL cuando entres en calor.'],
  },

  est_parking: {
    id: 'est_parking',
    tier: 2,
    name: 'BORJA',
    title: 'Estudiante del Parking ULL',
    purse: 20,
    biomes: ['risco', 'pinar'],
    ace: 'cabra_chispera',
    deck: [
      ...L('tierra_volcan', 4), ...L('tierra_laurisilva', 4), ...L('tierra_playa', 2),
      ...d('cabra', 3), ...d('cabra_chispera', 1), ...d('baifo', 3),
      ...d('cardon', 2), ...d('pinzon_chispero', 2),
      ...d('mojo', 2), ...d('tolete', 2), ...d('parranda', 1),
    ],
    taunt: [
      'BORJA: Quitaron cinco plazas pa poner el Guachinche-Truck y nadie protesto.',
      'BORJA: Yo hago de telonero de Domingo. 20 duros!',
    ],
    win: ['BORJA: Madre mia! Toma 20 duros y el sobre. Estas listo pa retar a Domingo!'],
    lose: ['BORJA: Si no puedes conmigo, Domingo te hace carne fiesta! Cuelate en un cole a mejorar mazo.'],
  },

  // ==================== GIMNASIO #1: GUACHINCHE-TRUCK ULL ====================
  gym_ull: {
    id: 'gym_ull',
    tier: 2,
    name: 'DOMINGO',
    title: 'LIDER GYM #1 · GUACHINCHE-TRUCK',
    purse: 30,
    gym: 1,
    bolicheName: 'BOLICHE DEL CARNE FIESTA',
    biomes: ['risco'],
    ace: 'cabra_chispera',
    deck: [
      ...L('tierra_volcan', 6), ...L('tierra_laurisilva', 5),
      ...d('tabaiba', 3), ...d('baifo', 3), ...d('cabra', 2),
      ...d('cardon', 2), ...d('cabra_chispera', 1), ...d('gaviota', 2),
      ...d('mojo', 2), ...d('tolete', 1), ...d('gofio', 1),
    ],
    taunt: [
      'DOMINGO: Epa, guirufo! Huele esa plancha: carne fiesta, papas arrugadas y vino de garrafa!',
      'DOMINGO: Soy DOMINGO, primer Lider de la Ruta del Buen Yantar. Sin excusas: nos jugamos el BOLICHE DEL CARNE FIESTA!',
    ],
    win: [
      'DOMINGO: Ños, me dejaste la plancha fria! Toma el BOLICHE DEL CARNE FIESTA, 30 duros y mi sobre especial!',
      'DOMINGO: Sigue al NORTE a SAN BENITO, luego recto al ESTE a LAS MERCEDES y sube a TAGANANA!',
    ],
    lose: [
      'DOMINGO: Te fundi antes de que se arruguen las papas! Pasa por el cole de La Cuesta a sacar sobres y vuelve cuando quieras!',
    ],
  },

  // ==================== RUTA SAN BENITO -> LAS MERCEDES -> ANAGA -> TAGANANA ====================
  pibe_sanbenito: {
    id: 'pibe_sanbenito',
    tier: 1,
    name: 'NAUZET',
    title: 'Pibe de San Benito',
    purse: 15,
    biomes: ['pinar'],
    ace: 'cernicalo_alisio',
    deck: [
      ...L('tierra_playa', 5), ...L('tierra_laurisilva', 5),
      ...d('pardela', 3), ...d('cernicalo', 3), ...d('pinzon', 2),
      ...d('cernicalo_alisio', 2), ...d('pardela_tormenta', 1),
      ...d('chola', 2), ...d('gofio', 1), ...d('parranda', 1),
    ],
    taunt: [
      'NAUZET: Esto es SAN BENITO, compadre! Aqui se juega con dos sudaderas puestas.',
      'NAUZET: 15 duros antes de que enfiles la recta pa Las Mercedes!',
    ],
    win: ['NAUZET: Buena mano! Tira to recto al ESTE y llegas a Las Mercedes.'],
    lose: ['NAUZET: En San Benito el frio congela hasta las tierras!'],
  },

  mago_mercedes: {
    id: 'mago_mercedes',
    tier: 2,
    name: 'DON CELSO',
    title: 'Viejito de Las Mercedes',
    purse: 18,
    biomes: ['risco'],
    ace: 'cardon',
    deck: [
      ...L('tierra_laurisilva', 6), ...L('tierra_volcan', 4),
      ...d('tabaiba', 3), ...d('baifo', 3), ...d('cardon', 3),
      ...d('cabra', 2), ...d('drago_milenario', 1),
      ...d('gofio', 2), ...d('mojo', 2),
    ],
    taunt: [
      'CELSO: Llegaste al final de la recta de LAS MERCEDES, guirufo.',
      'CELSO: Antes de subir por la Carretera General al monte, 18 duros sobre el muro!',
    ],
    win: ['CELSO: Fuerte tino! Enfila al NORESTE por la Carretera General hasta el Llano de los Viejos.'],
    lose: ['CELSO: Con ese mazo la bruma de Anaga te come vivo, mi nino.'],
  },

  senderista_tf12: {
    id: 'senderista_tf12',
    tier: 3,
    name: 'JURGEN',
    title: 'Ex-Guirufo de la Carretera Gral.',
    purse: 20,
    biomes: ['pinar', 'risco'],
    ace: 'pinzon_chispero',
    deck: [
      ...L('tierra_laurisilva', 5), ...L('tierra_playa', 5),
      ...d('pinzon', 3), ...d('pinzon_chispero', 2), ...d('pardela_tormenta', 2),
      ...d('cardon', 2), ...d('cernicalo', 2),
      ...d('chola', 2), ...d('parranda', 2),
    ],
    taunt: [
      'JURGEN: Ja! Otro guirufo! Yo vine de Munich hace diez anos y ya digo "chacho" dormido.',
      'JURGEN: 20 duros en plena Carretera General de Anaga!',
    ],
    win: ['JURGEN: Donnerwetter, digo... ños! Sigue al noreste, ya huele a chuletas del Llano de los Viejos.'],
    lose: ['JURGEN: Te faltan bastones de trekking y cartas evolucionadas, colega!'],
  },

  dominguero_llano: {
    id: 'dominguero_llano',
    tier: 3,
    name: 'TOÑO',
    title: 'Asador del Llano de los Viejos',
    purse: 22,
    biomes: ['ofra', 'risco'],
    ace: 'lagarto_gigante',
    deck: [
      ...L('tierra_volcan', 5), ...L('tierra_malpais', 5),
      ...d('lagarto', 3), ...d('lagarto_gigante', 3), ...d('lagarto_magma', 1),
      ...d('baifo', 3), ...d('lapa_acorazada', 2),
      ...d('mojo', 2), ...d('tolete', 2), ...d('calima', 1),
    ],
    taunt: [
      'TOÑO: LLANO DE LOS VIEJOS (o de las Viejas, segun mi cunao)! Guarda las cartas que les cae grasa de chistorra.',
      'TOÑO: 22 duros antes de que bajes las Vueltas de Taganana!',
    ],
    win: ['TOÑO: Bien jugao! Al norte empieza el sendero de las VUELTAS DE TAGANANA. Cuidado con las rodillas!'],
    lose: ['TOÑO: Te churrasque como a una costilla de cochino negro!'],
  },

  cabrero_vueltas: {
    id: 'cabrero_vueltas',
    tier: 3,
    name: 'MARCIAL',
    title: 'Cabrero de las Vueltas',
    purse: 25,
    biomes: ['risco'],
    ace: 'cabra_chispera',
    deck: [
      ...L('tierra_volcan', 5), ...L('tierra_laurisilva', 5),
      ...d('cabra', 3), ...d('cabra_chispera', 2), ...d('baifo', 3),
      ...d('cardon', 2), ...d('tabaiba', 2),
      ...d('mojo', 2), ...d('tolete', 2), ...d('gofio', 1),
    ],
    taunt: [
      'MARCIAL: Curva 38 de las VUELTAS DE TAGANANA! Yo bajo saltando con el regaton y mis cabras.',
      'MARCIAL: 25 duros aqui mismo en la revuelta!',
    ],
    win: ['MARCIAL: Ños, tienes pata de cabrero! Sigue bajando y sales derechito a Taganana.'],
    lose: ['MARCIAL: Te despeñaste en la curva! Menos mal que te recogen en el Centro Parrandero.'],
  },

  surfer_almaciga: {
    id: 'surfer_almaciga',
    tier: 3,
    name: 'KILIAN',
    title: 'Local de Almaciga',
    purse: 25,
    biomes: ['mar'],
    ace: 'calamar',
    deck: [
      ...L('tierra_charco', 6), ...L('tierra_playa', 4),
      ...d('choco', 3), ...d('calamar', 3), ...d('vieja_reina', 2),
      ...d('angelote', 2), ...d('gaviota_titan', 0), ...d('alevin', 2),
      ...d('clipper', 2), ...d('chola', 2), ...d('barraquito', 1),
    ],
    taunt: [
      'KILIAN: Playa de ALMACIGA, bro! Cathaysa lleva desde las siete metida en el pico cogiendo derechas.',
      'KILIAN: Echame 25 duros en la arena negra mientras esperas una serie calma!',
    ],
    win: ['KILIAN: Brutal tubo! Acercate a la orilla y pegale un grito a Cathaysa pa que salga del agua.'],
    lose: ['KILIAN: Revolcon en la orillera, mi nino!'],
  },

  // ==================== GIMNASIO #2: LA OLA DE TAGANANA (CATHAYSA) ====================
  gym_taganana: {
    id: 'gym_taganana',
    tier: 4,
    name: 'CATHAYSA',
    title: 'LIDER GYM #2 · TAGANANA',
    purse: 40,
    gym: 2,
    bolicheName: 'BOLICHE DE LA MAREA',
    biomes: ['mar'],
    ace: 'angelote_abisal',
    deck: [
      ...L('tierra_charco', 6), ...L('tierra_playa', 5),
      ...d('alevin', 2), ...d('choco', 2), ...d('vieja', 3), ...d('calamar', 1),
      ...d('vieja_reina', 2), ...d('angelote', 3), ...d('angelote_abisal', 1),
      ...d('clipper', 2), ...d('chola', 2), ...d('barraquito', 1),
    ],
    taunt: [
      'CATHAYSA: Fuerte pesado el senor Guerra, siempre con la tonteria de si "Cathaysa la nina guanche no vera mas Taganana"... solo fui a coger unas olas!',
      'CATHAYSA: Gracias por sacarme del pico en Almaciga, pibe. Pasa a LA OLA DE TAGANANA por el BOLICHE DE LA MAREA!',
    ],
    win: [
      'CATHAYSA: Chacho, vaya revolcon me pegaste! Toma el BOLICHE DE LA MAREA, 40 duros y coge carta del sobre!',
    ],
    lose: [
      'CATHAYSA: Te trago la corriente del Roque! Pasa por la escuelita de Taganana a pulir el mazo y vuelve cuando quieras!',
    ],
  },

  // ==================== GALDAR: CURVAS DEL DEMONIO, S.S. OLSEN & CUEVA PINTADA ====================
  motero_curvas: {
    id: 'motero_curvas',
    tier: 3,
    name: 'YERAYON',
    title: 'Canarion de las Curvas del Demonio',
    purse: 26,
    biomes: ['ofra', 'risco'],
    ace: 'lagarto_gigante',
    deck: [
      ...L('tierra_malpais', 5), ...L('tierra_volcan', 5),
      ...d('lagarto', 3), ...d('lapa_acorazada', 2), ...d('lagarto_gigante', 3),
      ...d('baifo', 2), ...d('gaviota', 2),
      ...d('calima', 2), ...d('tolete', 2), ...d('mojo', 1),
    ],
    taunt: [
      'YERAYON: Ño, mi nino, bienvenido a LAS CURVAS DEL DEMONIO! Si no vomitaste en el cayuco, vomitas subiendo esto!',
      'YERAYON: 26 duros aqui en la paella del barranco!',
    ],
    win: ['YERAYON: Fleje nivel traes de enfrente, compadre! Sigue subiendo las curvas pa llegar a Galdar.'],
    lose: ['YERAYON: Te fuiste por el quitamiedos, mi nino!'],
  },

  senora_roscas: {
    id: 'senora_roscas',
    tier: 3,
    name: 'DOÑA PINO',
    title: 'Vendedora de Roscas (no Cotufas)',
    purse: 28,
    biomes: ['pinar', 'mar'],
    ace: 'gaviota_titan',
    deck: [
      ...L('tierra_playa', 5), ...L('tierra_volcan', 5),
      ...d('cernicalo', 3), ...d('cernicalo_alisio', 2), ...d('gaviota', 3),
      ...d('gaviota_titan', 2), ...d('baifo', 2),
      ...d('chola', 3), ...d('mojo', 2),
    ],
    taunt: [
      'DOÑA PINO: Como que "cotufas", chicharrero?! En Galdar se dice ROSCAS! Repite conmigo: ROS-CAS!',
      'DOÑA PINO: 28 duros ahora mismo por faltar al lexico grancanario!',
    ],
    win: ['DOÑA PINO: Bueno, te lo paso porque eres guirufo... Toma 28 duros, un cucurucho de roscas y el sobre!'],
    lose: ['DOÑA PINO: A comer roscas al Centro Parrandero del muelle, mi nino!'],
  },

  pasajero_olsen: {
    id: 'pasajero_olsen',
    tier: 3,
    name: 'DON ARIDANE',
    title: 'Viajero VIP del S.S. Olsen',
    purse: 28,
    biomes: ['mar'],
    ace: 'calamar',
    deck: [
      ...L('tierra_charco', 6), ...L('tierra_playa', 5),
      ...d('choco', 3), ...d('calamar', 3), ...d('vieja_reina', 2),
      ...d('angelote', 2), ...d('angelote_abisal', 1),
      ...d('clipper', 2), ...d('barraquito', 2), ...d('chola', 1),
    ],
    taunt: [
      'ARIDANE: Ponen el aire acondicionado del S.S. Olsen a doce bajo cero pa conservar frescos a los pasajeros!',
      'ARIDANE: Echame una de 28 duros en el camarote pa entrar en calor! El Capitan esta al fondo a estribor.',
    ],
    win: ['ARIDANE: Buena mano! Pasa al puente de mando: el Capitan esta mareado perdido con una papelera.'],
    lose: ['ARIDANE: Clase Oro Fred. Olsen, mi nino!'],
  },

  gym_galdar: {
    id: 'gym_galdar',
    tier: 4,
    name: 'BENTEJUI',
    title: 'LIDER GYM #3 · CUEVA PINTADA',
    purse: 50,
    gym: 3,
    bolicheName: 'BOLICHE DE LA CUEVA PINTADA',
    biomes: ['ofra', 'risco'],
    ace: 'lagarto_magma',
    deck: [
      ...L('tierra_malpais', 6), ...L('tierra_volcan', 6),
      ...d('lapa', 2), ...d('lagarto', 2), ...d('lapa_acorazada', 2),
      ...d('lagarto_gigante', 3), ...d('lagarto_magma', 2), ...d('gaviota', 2),
      ...d('calima', 2), ...d('tolete', 2), ...d('mojo', 2),
    ],
    taunt: [
      'BENTEJUI: Ño, pasaste las trece mesas de carne fiesta y acertaste los dos botones de la cocina!',
      'BENTEJUI: Esto si es un GUACHINCHE DE VERDAD montado dentro de las CUEVAS PINTADAS! Sacate el mazo que va saliendo el BOLICHE DE LA CUEVA PINTADA!',
    ],
    win: [
      'BENTEJUI: Merameneño, me dejaste frito en mi propio caldero! Toma el BOLICHE DE LA CUEVA PINTADA, 50 duros y mi sobre real!',
    ],
    lose: [
      'BENTEJUI: Te enterre en malpais y adobo! Pasa por el cole del muelle de Galdar a sacar sobres y vuelve a las dos!',
    ],
  },

  // ==================== COLEGIOS (REPETIBLES, ANTI-SOFTLOCK, NIVEL ASCENDENTE) ====================
  // Nivel 1: CEIP Weyler (Santa Cruz) — huevos y bebes, 4 duros
  cole1_a: {
    id: 'cole1_a',
    tier: 1,
    name: 'YEREMAY (2o B)',
    title: 'Patio Nv.1 · CEIP Weyler',
    purse: 4,
    repeatable: true,
    maxStage: 1,
    biomes: ['risco', 'ofra'],
    deck: [
      ...L('tierra_volcan', 4), ...L('tierra_laurisilva', 4),
      ...d('huevo_risco', 3), ...d('semilla', 3), ...d('tabaiba', 2), ...d('baifo', 2),
      ...d('gofio', 1),
    ],
    taunt: [
      'YEREMAY: Tu no eres de este cole, senor! Pero si no se lo dices a la seño te juego mi paga de 4 duros!',
    ],
    win: ['YEREMAY: Jo! Toma 4 duros y elige una de mi sobre del kiosco. En el proximo recreo te gano!'],
    lose: ['YEREMAY: Toma ya! Me gane pa un flash de fresa en la cantina!'],
  },
  cole1_b: {
    id: 'cole1_b',
    tier: 1,
    name: 'NAYRA (3o A)',
    title: 'Patio Nv.1 · CEIP Weyler',
    purse: 4,
    repeatable: true,
    maxStage: 1,
    biomes: ['mar', 'pinar'],
    deck: [
      ...L('tierra_charco', 4), ...L('tierra_playa', 4),
      ...d('huevo_charco', 3), ...d('huevo_playa', 3), ...d('alevin', 2), ...d('vieja', 2),
      ...d('chola', 1),
    ],
    taunt: [
      'NAYRA: Cambio cromos repes! Te echo una rapida antes de que toque el timbre: 4 duros y sobre!',
    ],
    win: ['NAYRA: Hala, que suerte! Toma 4 duros y pilla una carta. Cuando quieras echamos otra!'],
    lose: ['NAYRA: Jiji, te gano una nina de tercero con cartas sin funda!'],
  },

  // Nivel 2: CEIP La Cuesta — etapas 1 y primeras evos, 8 duros
  cole2_a: {
    id: 'cole2_a',
    tier: 2,
    name: 'JONAY (5o B)',
    title: 'Patio Nv.2 · CEIP La Cuesta',
    purse: 8,
    repeatable: true,
    maxStage: 2,
    biomes: ['risco', 'ofra'],
    deck: [
      ...L('tierra_volcan', 4), ...L('tierra_laurisilva', 4),
      ...d('baifo', 3), ...d('tabaiba', 3), ...d('cabra', 1), ...d('huevo_risco', 2),
      ...d('mojo', 2), ...d('gofio', 1),
    ],
    taunt: [
      'JONAY: En el patio de La Cuesta jugamos encima del poyo de cemento! 8 duros y sobre si me ganas!',
    ],
    win: ['JONAY: Buenas cartas! Toma 8 duros y coge una del sobre. Sigo aqui todo el recreo!'],
    lose: ['JONAY: En quinto B no perdonamos ni una, guirufo!'],
  },
  cole2_b: {
    id: 'cole2_b',
    tier: 2,
    name: 'YAIZA (6o A)',
    title: 'Patio Nv.2 · CEIP La Cuesta',
    purse: 8,
    repeatable: true,
    maxStage: 2,
    biomes: ['pinar', 'mar'],
    deck: [
      ...L('tierra_playa', 4), ...L('tierra_laurisilva', 4),
      ...d('pardela', 3), ...d('cernicalo', 2), ...d('pinzon', 1), ...d('huevo_pinar', 3),
      ...d('chola', 2), ...d('gofio', 1),
    ],
    taunt: [
      'YAIZA: Soy la campeona del recreo de La Cuesta! 8 duros y te abro sobre si aguantas mis pajaros!',
    ],
    win: ['YAIZA: Ños! Toma 8 duros y elige carta. Repite cuando quieras, tengo el estuche lleno de sobres!'],
    lose: ['YAIZA: Ni de sexto pasas con ese mazo!'],
  },

  // Nivel 3: IES/CEIP San Benito (La Laguna) — mazos serios de recreo, 12 duros
  cole3_a: {
    id: 'cole3_a',
    tier: 3,
    name: 'AIRAM (2o ESO)',
    title: 'Patio Nv.3 · San Benito',
    purse: 12,
    repeatable: true,
    maxStage: 3,
    biomes: ['risco', 'pinar'],
    ace: 'cardon',
    deck: [
      ...L('tierra_volcan', 5), ...L('tierra_laurisilva', 5),
      ...d('baifo', 3), ...d('tabaiba', 3), ...d('cabra', 2), ...d('cardon', 2),
      ...d('mojo', 2), ...d('gofio', 2),
    ],
    taunt: [
      'AIRAM: (mordiendo bocata de pata) Te colaste por la valla de gimnasia? De lujo, 12 duros y sobre!',
    ],
    win: ['AIRAM: Que abuso! Toma 12 duros y elige carta. Nos echamos otra antes de mates!'],
    lose: ['AIRAM: A estudiar sinergias a septiembre, pibe!'],
  },
  cole3_b: {
    id: 'cole3_b',
    tier: 3,
    name: 'IDAIRA (3o ESO)',
    title: 'Patio Nv.3 · San Benito',
    purse: 12,
    repeatable: true,
    maxStage: 3,
    biomes: ['mar', 'ofra'],
    ace: 'vieja_reina',
    deck: [
      ...L('tierra_charco', 5), ...L('tierra_playa', 5),
      ...d('choco', 3), ...d('vieja', 3), ...d('vieja_reina', 2), ...d('angelote', 2),
      ...d('clipper', 2), ...d('chola', 2),
    ],
    taunt: [
      'IDAIRA: En San Benito jugamos con guantes pa no congelarnos los dedos. 12 duros y sobre!',
    ],
    win: ['IDAIRA: Toma 12 duros y pilla una del sobre! Si quieres farmear cartas aqui estoy siempre.'],
    lose: ['IDAIRA: Cero en Magomon! Vuelve cuando ajustes el mazo.'],
  },

  // Nivel 4: Escuela Unitaria de Taganana — chinijos del risco, 16 duros, sobres sin tope
  cole4_a: {
    id: 'cole4_a',
    tier: 4,
    name: 'TANAUSU (Taganana)',
    title: 'Patio Nv.4 · Esc. Taganana',
    purse: 16,
    repeatable: true,
    biomes: ['risco', 'ofra'],
    ace: 'lagarto_gigante',
    deck: [
      ...L('tierra_malpais', 5), ...L('tierra_volcan', 5),
      ...d('lagarto', 3), ...d('lapa', 3), ...d('lagarto_gigante', 2),
      ...d('lapa_acorazada', 2), ...d('gaviota', 2),
      ...d('calima', 2), ...d('tolete', 2),
    ],
    taunt: [
      'TANAUSU: En la escuela de Taganana somos ocho en clase, pero todos jugamos duro! 16 duros y sobre del bueno!',
    ],
    win: ['TANAUSU: Fuerte partida! Toma 16 duros y coge una del sobre. Echa todas las que quieras pa ganar a Cathaysa!'],
    lose: ['TANAUSU: Los chinijos de Anaga estamos hechos de basalto!'],
  },
  cole4_b: {
    id: 'cole4_b',
    tier: 4,
    name: 'GARA (Taganana)',
    title: 'Patio Nv.4 · Esc. Taganana',
    purse: 16,
    repeatable: true,
    biomes: ['mar', 'pinar'],
    ace: 'calamar',
    deck: [
      ...L('tierra_charco', 5), ...L('tierra_playa', 5),
      ...d('choco', 3), ...d('vieja', 3), ...d('calamar', 2),
      ...d('vieja_reina', 2), ...d('cernicalo_alisio', 1),
      ...d('clipper', 2), ...d('chola', 2), ...d('barraquito', 1),
    ],
    taunt: [
      'GARA: Cathaysa nos enseno a surfear y a jugar Charco! 16 duros y te abro sobre de Anaga!',
    ],
    win: ['GARA: Ños, casi juegas como Cathaysa! Toma 16 duros y elige carta. Repetimos cuando quieras!'],
    lose: ['GARA: Si no me ganas en el recreo, Cathaysa te barre de una ola!'],
  },

  // Nivel 5: CEIP Sardina de Galdar — chinijos canariones con bocata de chorizo Teror, 20 duros
  cole5_a: {
    id: 'cole5_a',
    tier: 5,
    name: 'ANCOR (Galdar)',
    title: 'Patio Nv.5 · CEIP Galdar',
    purse: 20,
    repeatable: true,
    biomes: ['ofra', 'risco'],
    ace: 'cabra_chispera',
    deck: [
      ...L('tierra_volcan', 5), ...L('tierra_laurisilva', 5),
      ...d('baifo', 3), ...d('cabra', 3), ...d('cardon', 2), ...d('cabra_chispera', 2),
      ...d('mojo', 2), ...d('tolete', 2), ...d('gofio', 1),
    ],
    taunt: [
      'ANCOR: Merameneño, te colaste al recreo de Galdar? 20 duros y sobre si aguantas fleje leña!',
    ],
    win: ['ANCOR: Ño, que abuso! Toma 20 duros y coge una del sobre. Sigo aqui todo el recreo!'],
    lose: ['ANCOR: Vete a comer roscas al banco, chicharrero!'],
  },
  cole5_b: {
    id: 'cole5_b',
    tier: 5,
    name: 'GUAYARMINA (Galdar)',
    title: 'Patio Nv.5 · CEIP Galdar',
    purse: 20,
    repeatable: true,
    biomes: ['pinar', 'mar'],
    ace: 'pinzon_chispero',
    deck: [
      ...L('tierra_playa', 5), ...L('tierra_laurisilva', 5),
      ...d('cernicalo', 3), ...d('cernicalo_alisio', 2), ...d('pinzon', 2),
      ...d('pinzon_chispero', 2), ...d('pardela_tormenta', 2),
      ...d('chola', 2), ...d('parranda', 2),
    ],
    taunt: [
      'GUAYARMINA: En el recreo de Galdar jugamos hasta landon! 20 duros y sobre completo!',
    ],
    win: ['GUAYARMINA: Fleje suerte tuviste! Toma 20 duros y elige carta. Repite cuando quieras!'],
    lose: ['GUAYARMINA: Ni con traductor me ganas, mi nino!'],
  },
};

TRAINERS.cole6_a = {
  id: 'cole6_a', name: 'AITAMI (El Rosario)', title: 'Patio Nv.6 · CEIP El Rosario', purse: 24, repeatable: true, biomes: ['risco', 'pinar'], ace: 'cabra_titan_teide',
    tier: 6,
  deck: [...L('tierra_volcan', 5), ...L('tierra_laurisilva', 5), ...d('baifo', 3), ...d('cabra_chispera', 3), ...d('cabra_titan_teide', 1), ...d('tajinaste', 2), ...d('mojo', 2), ...d('tolete', 2), ...d('gofio', 1)],
  taunt: ['AITAMI: ¿Recreo con frío de cumbre? Aquí se juega con guantes. 24 duros y sobre si aguantas.'],
  win: ['AITAMI: Buen agarre. Toma 24 duros y elige carta. Repetimos cuando quieras.'],
  lose: ['AITAMI: Al Centro Parrandero de aquí al lado, que estás blanco.'],
};
TRAINERS.cole6_b = {
  id: 'cole6_b', name: 'YAIZA (El Rosario)', title: 'Patio Nv.6 · CEIP El Rosario', purse: 24, repeatable: true, biomes: ['mar', 'pinar'], ace: 'fenix_azul_teide',
    tier: 6,
  deck: [...L('tierra_playa', 5), ...L('tierra_laurisilva', 4), ...L('tierra_volcan', 2), ...d('pinzon', 3), ...d('pinzon_chispero', 3), ...d('fenix_azul_teide', 1), ...d('cernicalo_alisio', 2), ...d('chola', 2), ...d('gofio', 2)],
  taunt: ['YAIZA: Mi fénix no se apaga ni con la lluvia de La Esperanza. 24 duros y sobre.'],
  win: ['YAIZA: Vale, vale. Toma 24 duros y coge una del sobre. Sigo aquí todo el recreo.'],
  lose: ['YAIZA: Te quemaste. Vuelve con algo que vuele.'],
};


// ------------------------------------------------------------------
// CURVA DE DIFICULTAD: mazos forjados con brillo LEGAL (sin multiplicadores).
// ------------------------------------------------------------------
// Cada entrenador recibe el mazo que surgiría de fusionar legalmente 5 copias de
// criaturas finales tantas veces como indique su tier. Magec conserva su mazo
// especial (él es su propia carta y tiene mano inicial guionizada).
// Mazos con identidad temática exigida por la historia (y por los tests): se conservan tal cual.
// ------------------------------------------------------------------
// MAZOS:
//  - Grandes entrenadores (guachinches 1-8, Coco en 3 actos, Alto Mando, Magec):
//    MAJOR_SPECS. Temáticos, y la dificultad son FUSIONES LEGALES explícitas en
//    orden estricto (sin multiplicadores ni vida extra salvo Magec).
//  - Mazos fijados por los tests (peritas, terrero, damas): se conservan tal cual.
//  - El resto de laterales: forja genérica por tier.
// ------------------------------------------------------------------
const TEST_LOCKED = new Set([
  ...Object.keys(TRAINERS).filter((id) => id.startsWith('torre_enriscada_')),
  'terrero_rosario',
  ...Object.keys(TRAINERS).filter((id) => id.startsWith('dona_') && id.includes('teresitas')),
  'nina_peras_barranco',
]);

for (const tr of Object.values(TRAINERS)) {
  if (tr.id === 'magec' || TEST_LOCKED.has(tr.id)) continue;
  // El ACTO 2 del Coco (azotea de Magos) es este id; el ACTO 1 (Meridiano) se elige
  // por mapa al iniciar el duelo (ver App.tsx). El ACTO 3 es gym_diablito (Gym 8).
  const spec = tr.id === 'coco_santa_ursula' ? MAJOR_SPECS.coco_magos : MAJOR_SPECS[tr.id];
  if (spec) {
    const f = buildMajor(spec);
    tr.deck = f.deck; tr.shine = f.shine;
    continue;
  }
  const forged = forgeDeck(tr.tier ?? 1);
  tr.deck = forged.deck; tr.shine = forged.shine;
}

// Magec: mazo temático (spec, 50 fusiones legales sobre sus ases) + su propia carta +
// mano inicial guionizada para autoinvocarse en el turno 5. El brillo NO va sobre su
// carta (un +50/+50 sería trampa visible); lo lleva el mazo, y la carta sale por la mano.
{
  const magec = TRAINERS.magec;
  const f = buildMajor(MAJOR_SPECS.magec);
  magec.deck = f.deck; magec.shine = f.shine;
  magec.tier = 10;
  magec.life = 30; // única excepción de vida extra de todo el juego
}

/** Acto 1 del Coco (guarida del Meridiano): Meridiano < Magos < El Diablito. */
export const COCO_MERIDIANO_DECK = COCO_MERIDIANO;

export const TRAINER_IDS = Object.keys(TRAINERS);
