import { StarterId } from '../game/maps';

export type Keyword = 'guardia' | 'prisa' | 'sigilo' | 'doble' | 'regen' | 'directo' | 'veneno';
export const MANA_COLORS = ['R', 'U', 'G', 'W', 'B'] as const;
export type LandColor = typeof MANA_COLORS[number];

export interface ManaCost {
  generic?: number;
  R?: number; U?: number; G?: number; W?: number; B?: number;
}

export type SpellEffect =
  | { kind: 'damage'; amount: number; target: 'enemy' | 'all_enemies' }
  | { kind: 'heal'; amount: number }
  | { kind: 'buff'; atk: number; hp: number }
  | { kind: 'draw'; amount: number }
  | { kind: 'fog'; turns: number }
  | { kind: 'day_of_judgement' };

export interface CardDef {
  id: string;
  name: string;
  type: 'creature' | 'spell' | 'land';
  mana?: ManaCost;
  produces?: LandColor;
  /** Tierra especial: gira por un mana del color que haga falta. */
  producesAny?: boolean;
  /** Carta unica/legendaria: maximo una copia en el mazo. */
  legendary?: boolean;
  /** Habilidad de sacrificio activable desde la mesa de duelo. */
  sacrifice?: { name: string; text: string };
  atk?: number;
  hp?: number;
  keywords?: Keyword[];
  effect?: SpellEffect;
  text: string;
  icon: string;
  biome?: 'mar' | 'risco' | 'pinar' | 'ofra' | 'fantasma';
  stage?: number;   // 0 huevo/bebe, 1 base, 2..4 evoluciones
  chain?: string;   // raiz de la cadena evolutiva
  rarity?: 'comun' | 'inicial';
  /** Carta de 1a edicion (descatalogada): no entra en mazos hasta certificarla en La Gomera. */
  firstEdition?: boolean;
}

export const LAND_INFO: Record<LandColor, { name: string; color: string; short: string; icon: string }> = {
  R: { name: 'Volcan', color: 'Rojo', short: 'R', icon: '🌋' },
  U: { name: 'Charco', color: 'Azul', short: 'U', icon: '🌊' },
  G: { name: 'Laurisilva', color: 'Verde', short: 'G', icon: '🌿' },
  W: { name: 'Playa', color: 'Blanco', short: 'W', icon: '🏖️' },
  B: { name: 'Malpais', color: 'Negro', short: 'B', icon: '🪨' },
};

export const KEYWORD_TEXT: Record<Keyword, string> = {
  guardia: 'GUARDIA: el rival debe atacarla primero.',
  prisa: 'PRISA: ataca el turno que entra.',
  sigilo: 'SIGILO: intocable hasta que ataque.',
  doble: 'DOBLE: ataca dos veces por turno.',
  regen: 'REGEN: se cura entera al final del turno.',
  directo: 'DIRECTO: puede pegar al entrenador con mesa rival.',
  veneno: 'VENENO: el objetivo pierde 1 vida al final de cada uno de sus turnos.',
};

export const STAGE_LABEL = ['HUEVO', 'BEBE', 'EVO I', 'EVO II', 'EVO III'];

export function totalMana(mana?: ManaCost): number {
  if (!mana) return 0;
  return (mana.generic ?? 0) + (mana.R ?? 0) + (mana.U ?? 0) + (mana.G ?? 0) + (mana.W ?? 0) + (mana.B ?? 0);
}

export function formatMana(mana?: ManaCost, ascii = false): string {
  if (!mana) return '0';
  const parts: string[] = [];
  if (mana.generic) parts.push(String(mana.generic));
  for (const k of MANA_COLORS) {
    const n = mana[k] ?? 0;
    for (let i = 0; i < n; i++) parts.push(ascii ? k : LAND_INFO[k].icon);
  }
  return parts.join('') || '0';
}

const L = (id: string, name: string, produces: LandColor, icon: string, text: string): CardDef =>
  ({ id, name, type: 'land', produces, icon, text });

const C = (
  id: string, name: string, mana: ManaCost, atk: number, hp: number,
  text: string, biome: CardDef['biome'], stage: number, chain: string,
  keywords: Keyword[] = [], inicial = false
): CardDef => ({
  id, name, type: 'creature', mana, atk, hp, icon: id, text, keywords, biome, stage, chain,
  rarity: inicial ? 'inicial' : 'comun',
});

const S = (id: string, name: string, mana: ManaCost, icon: string, effect: SpellEffect, text: string): CardDef =>
  ({ id, name, type: 'spell', mana, icon, effect, text });

// ==================================================================
// 37 CRIATURAS EN 11 CADENAS EVOLUTIVAS (max 5 etapas: HUEVO -> BEBE -> 3 EVOS)
// Los hechizos y las tierras NO evolucionan.
// ==================================================================
export const CARDS: Record<string, CardDef> = {
  // ---------- 1ª EDICION (premio del Magomaniaco): dos criaturas DESCATALOGADAS ----------
  // Sin certificar en La Gomera no entran en el mazo, y tampoco salen en sobres normales.
  burgado_1ed: { ...C('burgado_1ed', 'Burgado 1ª Ed.', { generic: 1, U: 1 }, 2, 4, 'Caracolillo de charco de la tirada descatalogada. Huele a ceniza de fogon y a pleito de copyright.', 'mar', 1, 'burgado_1ed', ['guardia']), firstEdition: true },
  burgado_gigante_1ed: { ...C('burgado_gigante_1ed', 'Burgado Tentacular', { generic: 2, U: 2, B: 1 }, 6, 9, 'Burgado descomunal con caracola de pinchos y demasiados tentaculos. Alabad al Burgado.', 'mar', 2, 'burgado_1ed', ['guardia', 'regen', 'doble']), firstEdition: true },
  cangrejo_1ed: { ...C('cangrejo_1ed', 'Cangrejo 1ª Ed.', { generic: 1, W: 1 }, 3, 3, 'Cangrejo de bajamar impreso en 1998. Mira sus pinzas como si planeara afilarlas.', 'mar', 1, 'cangrejo_1ed', ['sigilo']), firstEdition: true },
  cangrejo_sierra_1ed: { ...C('cangrejo_sierra_1ed', 'Cangrejo Navajero', { generic: 2, W: 1, U: 1 }, 7, 5, 'Le crecieron cuchillas en las pinzas y aprendio a caminar a dos patas. Cero referencias a nada.', 'mar', 2, 'cangrejo_1ed', ['prisa', 'doble', 'directo']), firstEdition: true },

  // ---------- MAGEC: el magomon libre original. No sale en sobres ni se captura: solo la fotocopiadora lo ha conseguido ----------
  magec: { ...C('magec', 'Magec', { generic: 3, B: 2 }, 7, 7, 'El magomon libre original, el que nunca quiso entrar en una carta. Corria por la laurisilva mucho antes de que existieran los sobres.', 'fantasma', 4, 'magec', ['sigilo', 'regen']), legendary: true },

  // ==================== CADENA GATOS CALLEJEROS (4 etapas) ====================
  michino: C('michino', 'Michino', { B: 1 }, 1, 2, 'Duerme sobre el capo tibio de un Twingo. Pide latita y te roba la cartera.', 'ofra', 0, 'gato', ['sigilo']),
  gato_callejero: C('gato_callejero', 'Gato Callejero', { generic: 1, B: 1 }, 3, 2, 'Oreja despuntada y amo de tres contenedores. Araña primero y maulla despues.', 'ofra', 1, 'gato', ['prisa', 'sigilo']),
  gato_azotea: C('gato_azotea', 'Gato de Azotea', { generic: 1, B: 2 }, 5, 4, 'Maulla a las tres de la manana como un senor enfadado. Doble zarpazo garantizado.', 'ofra', 2, 'gato', ['prisa', 'doble']),
  don_michi: C('don_michi', 'Don Michi', { generic: 2, B: 2, W: 1 }, 7, 6, 'Collar dorado, cicatriz fina y aires de trattoria. Duerme en el regazo del Coco de Santa Ursula.', 'ofra', 3, 'gato', ['sigilo', 'doble', 'directo']),

  // ==================== CADENA FLORA DEL PALMETUM (3 etapas) ====================
  tunera: C('tunera', 'Tunera Picona', { G: 1 }, 2, 3, 'Llena de picos invisibles. Coges un higo pico sin guantes y te acuerdas hasta Carnavales.', 'pinar', 1, 'tunera', ['guardia']),
  tajinaste: C('tajinaste', 'Tajinaste Real', { generic: 1, G: 2 }, 4, 5, 'Torre floral de tres metros que brota derecha hacia el cielo.', 'pinar', 2, 'tunera', ['regen']),
  palmera_real: C('palmera_real', 'Palmera Canaria', { generic: 2, G: 3 }, 6, 8, 'Reina del Palmetum. Da miel de palma, sombra fresquita y pencazos como vigas.', 'pinar', 3, 'tunera', ['guardia', 'regen']),

  // ==================== MAGOMON FANTASMA DE LA TORRE DE LAS TERESITAS ====================
  perita_barranco: C('perita_barranco', 'Perita del Barranco', { B: 1 }, 2, 3, 'Una pera fantasmal que rueda cuesta arriba y corta el aire al pasar. Favorita de la Niña de las Peras del Barranco de Santos.', 'fantasma', 1, 'perita_barranco', ['sigilo', 'directo']),

  // ==================== TERRERO DE EL ROSARIO (sin cadena: cada uno es etapa unica) ====================
  pancho_camurria: C('pancho_camurria', 'Pancho Camurria', { generic: 2, R: 2 }, 6, 6, 'Puntal del terrero de El Rosario. Agarra por la pernera y no suelta hasta que suena la arena.', 'risco', 3, 'pancho_camurria', ['guardia', 'doble']),
  pollito_frontera: C('pollito_frontera', 'Pollito de la Frontera', { generic: 1, R: 1 }, 4, 2, 'Pequeño, rapido y con mas moral que un gallo de pelea. Entra el primero a la brega.', 'risco', 2, 'pollito_frontera', ['prisa', 'directo']),

  // ==================== CADENA VINO PELEON (3 etapas · Romeria) ====================
  cuarta_vino: C('cuarta_vino', 'Cuarta de Peleon', { R: 1 }, 2, 2, 'Vaso de tubo con vino de monte tan aspero que te peina pa atras. Calienta el pecho al instante.', 'risco', 1, 'vino', ['prisa']),
  garrafa_peleon: C('garrafa_peleon', 'Garrafa de Vino Peleon', { generic: 1, R: 1, G: 1 }, 4, 4, 'Cinco litros en garrafa plastica sin etiqueta. Sabe a uva pisada, sulfato y romeria de pueblo.', 'risco', 2, 'vino', ['prisa', 'regen']),
  barrica_romera: C('barrica_romera', 'Barrica de Romeria', { generic: 2, R: 2, G: 1 }, 6, 6, 'Tonel centenario subido en la carreta. El que sobrevive al segundo vaso empieza a hablar en silbo.', 'risco', 3, 'vino', ['prisa', 'regen', 'doble']),

  // ==================== CADENA YUNTA DE BUEYES (3 etapas · Romeria) ====================
  novillo_romero: C('novillo_romero', 'Novillo Romero', { generic: 1, G: 1 }, 2, 4, 'Becerro engalanado con cintas de papel de seda. Camina despacio pero no lo mueve ni una grua.', 'risco', 1, 'yunta', ['guardia']),
  yunta_bueyes: C('yunta_bueyes', 'Yunta de Bueyes', { generic: 1, G: 1, W: 1 }, 4, 6, 'Dos bueyes enormes bajo el mismo yugo tallado. Cortan la TF-1 entera a paso de procesion.', 'risco', 2, 'yunta', ['guardia', 'regen']),
  yunta_real: C('yunta_real', 'Yunta de Carreta', { generic: 2, G: 2, W: 1 }, 7, 8, 'Yunta imperial tirando de una carreta con parrandera, brasero de chorizos y barrica. Imposible adelantarla.', 'risco', 3, 'yunta', ['guardia', 'regen', 'doble']),

  // ==================== CADENA GARRAFON (gimnasio de veneno) ====================
  chupito_garrafon: C('chupito_garrafon', 'Chupito Sospechoso', { B: 1 }, 1, 2, 'El vaso dice ron. La etiqueta de la botella prefiere no declarar.', 'ofra', 1, 'garrafon', ['veneno']),
  cubata_garrafon: C('cubata_garrafon', 'Cubata de Garrafon', { generic: 1, B: 1 }, 2, 3, 'Pega desde la barra. Pega mas fuerte a la manana siguiente.', 'ofra', 2, 'garrafon', ['veneno', 'directo']),
  bidon_toxico: C('bidon_toxico', 'Bidon Toxico', { generic: 2, B: 2 }, 4, 5, 'La reserva de la barra. Lleva tantos cierres de Papagayos como la fregona.', 'ofra', 3, 'garrafon', ['veneno', 'guardia']),

  // ==================== CADENA LEON MARINO (3 etapas · Siam Park / Safari) ====================
  cria_leon: C('cria_leon', 'Cria de Leon Marino', { U: 1 }, 1, 3, 'Chapotea en las piscinas de la entrada de Siam Park. Aplaude si le tiras sardinas.', 'mar', 1, 'leon_marino', ['sigilo']),
  leon_marino: C('leon_marino', 'Leon Marino de Siam', { generic: 1, U: 1, W: 1 }, 3, 5, 'Gran mamifero marino de show acuatico. Pega panzazos de 300 kilos desde el flotador.', 'mar', 2, 'leon_marino', ['guardia', 'regen']),
  gran_otario: C('gran_otario', 'Gran Otario de Siam', { generic: 2, U: 2, W: 1 }, 6, 7, 'Coloso con bigotes y corona tailandesa. Duerme atravesado en la cola del Mai Thai River.', 'mar', 3, 'leon_marino', ['guardia', 'regen', 'doble']),

  // ==================== CADENA TIBURON (3 etapas · Siam Park / Safari) ====================
  cazon: C('cazon', 'Cazon de Acuario', { U: 1, B: 1 }, 3, 2, 'Tiburon joven que nada veloz bajo el tunel transparente de la Torre del Poder.', 'mar', 1, 'tiburon', ['prisa', 'directo']),
  jaqueton: C('jaqueton', 'Jaqueton de Torre', { generic: 1, U: 2, B: 1 }, 5, 4, 'Acecha tras el cristal acrilico mientras caes a 80 km/h por el tobogan vertical.', 'mar', 2, 'tiburon', ['prisa', 'doble']),
  megalodon_siam: C('megalodon_siam', 'Megalodon de Siam', { generic: 3, U: 2, B: 2 }, 8, 7, 'Tiburon prehistorico que no cabe en el tanque. Salta de la piscina con fauces abiertas.', 'mar', 3, 'tiburon', ['prisa', 'doble', 'directo']),

  // ==================================================================
  // EXPANSION "FOLCLORE Y LEYENDA": equilibra los colores sin tocar las cartas antiguas.
  //   ROJO   -> pocas cartas monocolor: GUAYOTA (mitologia guanche) y TIMPLE (folclore)
  //   AZUL   -> sin evolucion final propia y 2 hechizos: TORTUGA BOBA (especie) + MAR DE NUBES
  //   BLANCO -> casi siempre color secundario: CHAXIRAXI/ACHAMAN (mitologia) + SILBO GOMERO
  //   NEGRO  -> 2 hechizos: TENIQUE (folclore)
  //   Personajes famosos: Cesar Manrique (G/W), Pedro Guerra (W), Oscar Dominguez (B/U)
  // ==================================================================

  // ==================== CADENA GUAYOTA (4 etapas · mitologia guanche · ROJO) ====================
  chispa_echeyde: C('chispa_echeyde', 'Chispa de Echeyde', { R: 1 }, 1, 2, 'Una brasa que se escapo del infierno guanche. Si la pisas con chola, te acuerdas de Echeyde toda la semana.', 'risco', 0, 'guayota'),
  tibicena: C('tibicena', 'Tibicena', { generic: 1, R: 1 }, 3, 2, 'Perro negro de ojos rojos que sale de las cuevas por la noche. En el barrio lo confunden con el de la vecina.', 'risco', 1, 'guayota', ['prisa']),
  guayota_menor: C('guayota_menor', 'Guayota Menor', { generic: 1, R: 2 }, 5, 4, 'El demonio del Teide con las pilas a medias. Secuestra al sol, pero solo hasta la hora de la siesta.', 'risco', 2, 'guayota', ['prisa']),
  guayota: C('guayota', 'Guayota', { generic: 2, R: 3 }, 7, 6, 'Senor de Echeyde, raptor de Magec. Acha man lo encerro en el Teide y sigue ahi, rabiando y fumando.', 'risco', 3, 'guayota', ['prisa', 'doble']),

  // ==================== CADENA TIMPLE (3 etapas · folclore · ROJO) ====================
  timple_tenderete: C('timple_tenderete', 'Timple de Tenderete', { R: 1 }, 2, 1, 'Cinco cuerdas y una caja de madera de moral. Afinado a ojo tras tres vasos de vino.', 'risco', 1, 'timple', ['prisa']),
  parranda_timples: C('parranda_timples', 'Parranda de Timples', { generic: 1, R: 2 }, 4, 3, 'Tres timples, un laud y un senor que solo sabe la Isa. Nadie se va hasta que se acabe el vino.', 'risco', 2, 'timple', ['prisa', 'doble']),
  los_sabandenos: C('los_sabandenos', 'Los Sabandenos', { generic: 2, R: 3 }, 6, 5, 'Treinta voces y treinta chalecos. Cuando arrancan con el Pasodoble, hasta el Teide se pone de pie.', 'risco', 3, 'timple', ['prisa', 'doble', 'directo']),

  // ==================== CADENA TORTUGA BOBA (4 etapas · especie autoctona · AZUL) ====================
  huevo_tortuga: C('huevo_tortuga', 'Huevo de Tortuga', { U: 1 }, 0, 3, 'Enterrado en la arena de Cofete. No lo pises, que la Guardia Civil anda cerca.', 'mar', 0, 'tortuga', ['guardia']),
  tortuguita: C('tortuguita', 'Tortuguita', { generic: 1, U: 1 }, 1, 4, 'Recien salida del huevo y ya corriendo al mar. Las gaviotas la miran como un bocata.', 'mar', 1, 'tortuga', ['guardia']),
  tortuga_boba: C('tortuga_boba', 'Tortuga Boba', { generic: 1, U: 2 }, 3, 7, 'Caretta caretta de concha rayada. Boba de nombre, pero esquiva las redes mejor que tu la ITV.', 'mar', 2, 'tortuga', ['guardia', 'regen']),
  tortuga_laud: C('tortuga_laud', 'Tortuga Laud', { generic: 2, U: 3 }, 4, 9, 'La mas grande del Atlantico. Vive cien anos y ha visto hundirse mas barcos que la Armada Invencible.', 'mar', 3, 'tortuga', ['guardia', 'regen']),
  tortuga_abuela: C('tortuga_abuela', 'Abuela de las Tortugas', { generic: 3, U: 4 }, 6, 11, 'Dicen que es la que trajo a los guanches en la concha. Cuando se mueve, sube la marea.', 'mar', 4, 'tortuga', ['guardia', 'regen']),

  // ==================== CADENA CHAXIRAXI (4 etapas · mitologia guanche · BLANCO) ====================
  luz_candelaria: C('luz_candelaria', 'Luz de Candelaria', { W: 1 }, 1, 2, 'Una vela que no se apaga aunque sople el alisio. Los pastores la siguieron hasta la playa.', 'pinar', 0, 'chaxiraxi', ['sigilo']),
  pastor_guanche: C('pastor_guanche', 'Pastor Guanche', { generic: 1, W: 1 }, 2, 3, 'Encontro a la Virgen en la playa de Chimisay y penso que era una pescadora. Se lleva bien con las cabras.', 'pinar', 1, 'chaxiraxi', ['guardia']),
  guanarteme: C('guanarteme', 'Guanarteme', { generic: 1, W: 2 }, 5, 5, 'Rey de un bando entero. Manda sobre los pastores, las cabras y, con suerte, sobre su suegra.', 'pinar', 2, 'chaxiraxi', ['guardia', 'regen']),
  chaxiraxi: C('chaxiraxi', 'Chaxiraxi', { generic: 2, W: 3 }, 6, 8, 'La Madre del Sol, la que sostiene el cielo. Los guanches le llevaban leche y gofio; ahora le llevan velas del Hiperdino.', 'pinar', 3, 'chaxiraxi', ['guardia', 'regen', 'sigilo']),
  achaman: C('achaman', 'Achaman', { generic: 3, W: 4 }, 9, 9, 'El dios del cielo. Encerro a Guayota en el Teide con una mano y con la otra sostenia el mundo. Multitarea divina.', 'pinar', 4, 'chaxiraxi', ['guardia', 'regen', 'directo']),

  // ==================== CADENA GARA Y JONAY (4 etapas · leyenda gomera · VERDE) ====================
  brote_garajonay: C('brote_garajonay', 'Brote de Garajonay', { G: 1 }, 2, 1, 'Un retono de laurel que crece donde murieron los amantes. Brota rapido y pincha si lo arrancas.', 'pinar', 0, 'garajonay', ['prisa']),
  jonay: C('jonay', 'Jonay', { generic: 1, G: 1 }, 3, 2, 'Principe tinerfeno que cruzo el mar a nado con dos vejigas de cabra para ver a Gara. Fuerte de brazos, flojo de cabeza.', 'pinar', 1, 'garajonay', ['prisa', 'directo']),
  gara: C('gara', 'Gara', { generic: 1, G: 2 }, 4, 4, 'Princesa de Agulo. Se miro en el Chorro del Cedro y salio el sol: senal de fuego. Nadie le hizo caso.', 'pinar', 2, 'garajonay', ['prisa']),
  gigante_laurisilva: C('gigante_laurisilva', 'Gigante de la Laurisilva', { generic: 2, G: 3 }, 6, 6, 'Los amantes se clavaron una vara de cedro y el bosque se los trago. De ahi salio este, hecho de raices y rabia.', 'pinar', 3, 'garajonay', ['prisa', 'doble']),

  // ==================== CADENA BRUJAS DE ANAGA (3 etapas · folclore · NEGRO) ====================
  bruja_nina: C('bruja_nina', 'Brujita de Anaga', { B: 1 }, 2, 3, 'Aprendiz de bruja con escoba de palma. Todavia se cae en las curvas de Las Mercedes.', 'fantasma', 1, 'bruja', ['sigilo']),
  bruja_anaga: C('bruja_anaga', 'Bruja de Anaga', { generic: 1, B: 2 }, 5, 5, 'Baja del monte las noches de San Juan a bailar en los charcos. Si te mira fijo, te quedas sin cobertura.', 'fantasma', 2, 'bruja', ['sigilo', 'veneno']),
  aquelarre_bailadero: C('aquelarre_bailadero', 'Aquelarre del Bailadero', { generic: 2, B: 3 }, 8, 8, 'Trece brujas en el Bailadero de Anaga con un chivo que no es un chivo. El Cabildo lo llama "folclore".', 'fantasma', 3, 'bruja', ['sigilo', 'veneno', 'regen', 'directo']),

  // ==================== PERSONAJES FAMOSOS (etapa unica, sin cadena) ====================
  cesar_manrique: C('cesar_manrique', 'Cesar Manrique', { generic: 2, G: 2, W: 1 }, 4, 7, 'Pinto Lanzarote de blanco y verde y prohibio los rascacielos. Si levantas mas de dos plantas, vuelve del mas alla a regañarte.', 'pinar', 3, 'cesar_manrique', ['guardia', 'regen']),
  pedro_guerra: C('pedro_guerra', 'Pedro Guerra', { generic: 1, W: 2 }, 4, 4, 'Con una guitarra y una voz suave convencio a media isla de que el amor es contrabando. Hay que ver.', 'pinar', 2, 'pedro_guerra', ['sigilo', 'regen', 'directo']),
  oscar_dominguez: C('oscar_dominguez', 'Oscar Dominguez', { generic: 1, B: 1, U: 1 }, 4, 3, 'Surrealista de La Laguna. Pintaba decalcomanias con tinta y salia a la calle con el pincel aun humedo.', 'ofra', 2, 'oscar_dominguez', ['sigilo', 'prisa']),

  // ---------- TIERRAS (no evolucionan, sin limite de copias) ----------
  tierra_volcan: L('tierra_volcan', 'Volcan', 'R', '🌋', 'Gira: agrega 1 mana Rojo.'),
  tierra_charco: L('tierra_charco', 'Charco', 'U', '🌊', 'Gira: agrega 1 mana Azul.'),
  tierra_laurisilva: L('tierra_laurisilva', 'Laurisilva', 'G', '🌿', 'Gira: agrega 1 mana Verde.'),
  tierra_playa: L('tierra_playa', 'Playa', 'W', '🏖️', 'Gira: agrega 1 mana Blanco.'),
  tierra_malpais: L('tierra_malpais', 'Malpais', 'B', '🪨', 'Gira: agrega 1 mana Negro.'),
  // ---------- TIERRAS DE DOBLE COLOR (expansion): giran por uno de dos colores ----------
  tierra_roque: { id: 'tierra_roque', name: 'Roque Nublo', type: 'land', icon: '🗿', produces: 'R', text: 'Gira: agrega 1 mana Rojo. Los antiguos lo adoraban; tu lo usas pa fundir mana.', biome: undefined },
  tierra_barranco: { id: 'tierra_barranco', name: 'Barranco de Masca', type: 'land', icon: '🏞️', produces: 'U', text: 'Gira: agrega 1 mana Azul. Baja al mar entre paredes de piedra. Sube con el agua hasta las rodillas.' },
  tierra_dehesa: { id: 'tierra_dehesa', name: 'Dehesa de Garajonay', type: 'land', icon: '🌳', produces: 'W', text: 'Gira: agrega 1 mana Blanco. Laurisilva gomera con niebla eterna. Aqui se escondio Gara.' },
  tierra_bailadero: { id: 'tierra_bailadero', name: 'Bailadero de Anaga', type: 'land', icon: '🌑', produces: 'B', text: 'Gira: agrega 1 mana Negro. Donde bailaban las brujas. De dia es un mirador con guaguas de turistas.' },
  tierra_pinar: { id: 'tierra_pinar', name: 'Pinar de Vilaflor', type: 'land', icon: '🌲', produces: 'G', text: 'Gira: agrega 1 mana Verde. Pino canario que sobrevive al fuego y al domingo de romeria.' },
  unelco: {
    id: 'unelco', name: 'Unelco', type: 'land', icon: '⚡',
    text: 'Girar: añade 1 maná de cualquier color. Sacrificar (Apagón): ningún jugador vuelve a enderezar tierras en este duelo.',
    producesAny: true,
    legendary: true,
    sacrifice: { name: 'APAGÓN', text: 'Unelco va al cementerio y ningún jugador vuelve a enderezar tierras en este duelo.' },
  },

  // ---------- HECHIZOS NUEVOS (expansion "Folclore y leyenda") ----------
  mar_de_nubes: S('mar_de_nubes', 'Mar de Nubes', { generic: 1, U: 2 }, '☁️', { kind: 'fog', turns: 2 }, 'La panza de burro baja de Anaga y tapa el campo 2 turnos: nadie te ataca mientras dura.'),
  silbo_gomero: S('silbo_gomero', 'Silbo Gomero', { W: 2 }, '📯', { kind: 'draw', amount: 2 }, 'Un silbido cruza el barranco y te avisan de todo. Roba 2 cartas. Patrimonio de la Humanidad.'),
  tenique: S('tenique', 'Tenique', { generic: 1, B: 1 }, '🪨', { kind: 'damage', amount: 5, target: 'enemy' }, 'Piedra del fogon lanzada con la rabia de quien se le enfrio el potaje. 5 de dano a una criatura.'),
  baile_del_tambor: S('baile_del_tambor', 'Baile del Tambor', { generic: 1, R: 1, W: 1 }, '🥁', { kind: 'buff', atk: 2, hp: 3 }, 'Tambor gomero y chacaras. Una criatura tuya gana +2/+3 y no se cansa de bailar.'),
  escaldon: S('escaldon', 'Escaldon de Gofio', { generic: 1, G: 2 }, '🍲', { kind: 'heal', amount: 8 }, 'Caldo de pescado y gofio amasado con la cuchara. Tu entrenador recupera 8 de vida y gana tres kilos.'),

  // ---------- HECHIZOS (no evolucionan) ----------
  chola: S('chola', 'Chola Voladora', { W: 1 }, '🩴', { kind: 'damage', amount: 3, target: 'enemy' }, '3 de dano. Precision de madre canaria.'),
  gofio: S('gofio', 'Pella de Gofio', { G: 1 }, '🥣', { kind: 'heal', amount: 5 }, 'Tu entrenador recupera 5 de vida.'),
  mojo: S('mojo', 'Mojo Picon', { R: 1 }, '🌶️', { kind: 'buff', atk: 2, hp: 2 }, 'Una criatura tuya gana +2/+2.'),
  clipper: S('clipper', 'Clipper de Fresa', { U: 1 }, '🥤', { kind: 'draw', amount: 2 }, 'Roba 2 cartas.'),
  calima: S('calima', 'Calima', { generic: 1, B: 1 }, '🌫️', { kind: 'damage', amount: 2, target: 'all_enemies' }, '2 de dano a todas las criaturas rivales.'),
  tolete: S('tolete', 'Toletazo', { generic: 1, R: 1 }, '🪵', { kind: 'damage', amount: 4, target: 'enemy' }, '4 de dano a una criatura enemiga.'),
  barraquito: S('barraquito', 'Barraquito', { generic: 1, W: 1, U: 1 }, '☕', { kind: 'draw', amount: 3 }, 'Roba 3 cartas. Licor, cafe, leche y limon.'),
  parranda: S('parranda', 'Parranda', { generic: 2, G: 1, W: 1 }, '🎶', { kind: 'buff', atk: 3, hp: 3 }, 'Una criatura tuya gana +3/+3. Isas, folias y malaguenas.'),
  nevada_teide: {
    ...S('nevada_teide', 'Nevada del Teide', { generic: 4 }, '*', { kind: 'fog', turns: 3 },
      'Previene todo el daño a ti y a tus Magomones durante los 3 turnos siguientes. No protege en el turno en que se lanza.'),
    legendary: true,
  },
  narices_teide: {
    ...S('narices_teide', 'Narices del Teide', { generic: 3, R: 2, W: 1 }, '✹', { kind: 'day_of_judgement' },
      'DÍA DEL JUICIO: destruye TODAS las criaturas de ambos lados. Nadie se salva, ni con guardia, sigilo o brillo.'),
    legendary: true,
  },
  cortar_el_aire: S('cortar_el_aire', 'Cortar el Aire', { generic: 1, B: 1 }, 'CA', { kind: 'damage', amount: 4, target: 'enemy' }, 'Un tajo de aire frio hace 4 de dano a una criatura enemiga. La brisa trae olor a tuno.'),

  // ==================== CADENA CABRA (5 etapas) ====================
  huevo_risco: C('huevo_risco', 'Huevo de Risco', { G: 1 }, 0, 3, 'Duro como el basalto. Incuba quieto.', 'risco', 0, 'cabra', ['guardia']),
  baifo: C('baifo', 'Baifo', { generic: 1, R: 1 }, 3, 3, 'Cabra chica, mala leche grande.', 'risco', 1, 'cabra'),
  cabra: C('cabra', 'Cabra Majorera', { generic: 1, R: 1, G: 1 }, 3, 5, 'Muro con cuernos del barranco.', 'risco', 2, 'cabra', ['guardia', 'regen'], true),
  cabra_chispera: C('cabra_chispera', 'Cabra Chispera', { generic: 2, R: 2, G: 1 }, 6, 6, 'Cabeza de acero inoxidable y dos cohetes de feriante. Ya no es una cabra, es un evento.', 'risco', 3, 'cabra', ['guardia', 'regen', 'prisa']),
  cabra_titan_teide: C('cabra_titan_teide', 'Titan del Teide', { generic: 3, R: 2, G: 2 }, 9, 9, 'Lleva el Roque Cinchado en el lomo. Cuando embiste, tiembla La Laguna entera.', 'risco', 4, 'cabra', ['guardia', 'regen', 'doble']),

  // ==================== CADENA TABAIBA (4 etapas) ====================
  semilla: C('semilla', 'Semilla de Tabaiba', { G: 1 }, 0, 2, 'Leche de tabaiba dentro. Pega la boca del que la abre.', 'risco', 0, 'tabaiba', ['guardia']),
  tabaiba: C('tabaiba', 'Tabaiba', { G: 1 }, 1, 4, 'No pega. Pero ahi esta, aguantando.', 'risco', 1, 'tabaiba', ['guardia']),
  cardon: C('cardon', 'Cardon', { generic: 1, G: 2 }, 2, 7, 'Cactus arborescente de tres metros. Pincha solo con mirarlo.', 'risco', 2, 'tabaiba', ['guardia', 'regen']),
  drago_milenario: C('drago_milenario', 'Drago Milenario', { generic: 2, G: 3 }, 4, 12, 'Mil anos sin moverse. No va a empezar hoy. Sangra rojo.', 'risco', 3, 'tabaiba', ['guardia', 'regen']),

  // ==================== CADENA LAGARTO (4 etapas) ====================
  huevo_malpais: C('huevo_malpais', 'Huevo de Malpais', { B: 1 }, 0, 3, 'Puesto entre lava cuajada. Tibio todavia.', 'ofra', 0, 'lagarto', ['guardia']),
  lagarto: C('lagarto', 'Lagarto Tizon', { B: 1 }, 2, 2, 'Manchas azules en la garganta y mucha soberbia.', 'ofra', 1, 'lagarto', ['directo']),
  lagarto_gigante: C('lagarto_gigante', 'Lagarto Gigante', { generic: 1, B: 1, R: 1 }, 4, 4, 'Gallotia intermedia: del tamano de un gato y con el mismo caracter.', 'ofra', 2, 'lagarto', ['directo']),
  lagarto_magma: C('lagarto_magma', 'Lagarto de Magma', { generic: 2, B: 2, R: 1 }, 6, 5, 'Le sale humo por las escamas. Nacio en la colada del 2021.', 'ofra', 3, 'lagarto', ['directo', 'prisa']),

  // ==================== CADENA LAPA (2 etapas) ====================
  lapa: C('lapa', 'Lapa', { B: 1 }, 1, 3, 'Pegada al basalto. No sale ni con cuchillo.', 'ofra', 1, 'lapa', ['guardia']),
  lapa_acorazada: C('lapa_acorazada', 'Lapa Acorazada', { generic: 1, B: 2 }, 2, 8, 'Blindaje de chapa de coche. Le da igual todo.', 'ofra', 2, 'lapa', ['guardia', 'regen']),

  // ==================== CADENA CHOCO (4 etapas) ====================
  huevo_charco: C('huevo_charco', 'Huevo de Charco', { U: 1 }, 0, 2, 'Gelatinoso y sospechoso. Flota en la marea.', 'mar', 0, 'choco', ['sigilo']),
  choco: C('choco', 'Choco de Charco', { U: 1 }, 2, 2, 'Tinta y escaqueo directo al entrenador.', 'mar', 1, 'choco', ['sigilo', 'directo']),
  calamar: C('calamar', 'Calamar de Puerto', { generic: 1, U: 2 }, 4, 3, 'Frito, con limon. O el te fríe a ti.', 'mar', 2, 'choco', ['sigilo', 'directo']),
  kraken_anaga: C('kraken_anaga', 'Kraken de Anaga', { generic: 2, U: 2, W: 1 }, 7, 6, 'Ocho brazos y ninguno es legal. Lo vieron los pescadores de Taganana.', 'mar', 3, 'choco', ['sigilo', 'directo', 'doble']),

  // ==================== CADENA VIEJA (4 etapas) ====================
  alevin: C('alevin', 'Alevin', { W: 1 }, 1, 1, 'Dos milimetros de pez con muchos planes.', 'mar', 0, 'vieja', ['prisa']),
  vieja: C('vieja', 'Vieja', { generic: 1, U: 1 }, 2, 4, 'El pez mas querido de la isla. Sancocho incluido.', 'mar', 1, 'vieja', ['guardia']),
  vieja_reina: C('vieja_reina', 'Vieja Reina', { generic: 1, U: 2 }, 3, 6, 'Corona de coral y cardumen de escolta.', 'mar', 2, 'vieja', ['guardia', 'regen']),
  vieja_abismo: C('vieja_abismo', 'Vieja del Abismo', { generic: 2, U: 3 }, 5, 9, 'Sube de la rasa a mil metros. Trae presion y mala leche.', 'mar', 3, 'vieja', ['guardia', 'regen', 'doble']),

  // ==================== CADENA ANGELOTE (3 etapas) ====================
  angelote: C('angelote', 'Angelote', { generic: 1, U: 1, W: 1 }, 5, 4, 'Enterrado en la arena de Las Teresitas.', 'mar', 1, 'angelote', ['sigilo'], true),
  angelote_abisal: C('angelote_abisal', 'Angelote Abisal', { generic: 2, U: 2, W: 1 }, 7, 5, 'Se hundio tanto que volvio con ojos de mas.', 'mar', 2, 'angelote', ['sigilo', 'directo']),
  leviatan_bajamar: C('leviatan_bajamar', 'Leviatan de Bajamar', { generic: 3, U: 2, W: 2 }, 10, 7, 'Cuando baja la marea se le ve la aleta. Cuando sube, ya es tarde.', 'mar', 3, 'angelote', ['sigilo', 'directo', 'doble']),

  // ==================== CADENA GAVIOTA (3 etapas) ====================
  huevo_playa: C('huevo_playa', 'Huevo de Playa', { W: 1 }, 0, 2, 'Puesto en un nido de algas. Vigilado con mal genio.', 'mar', 0, 'gaviota', ['guardia']),
  gaviota: C('gaviota', 'Gaviota Patiamarilla', { generic: 1, R: 1 }, 3, 1, 'Te roba el bocata en pleno vuelo.', 'mar', 1, 'gaviota', ['prisa', 'directo']),
  gaviota_titan: C('gaviota_titan', 'Gaviota Titan', { generic: 2, W: 1, R: 1 }, 5, 3, 'Envergadura de cometa. Se llevo un bocadillo entero y la sombrilla.', 'mar', 2, 'gaviota', ['prisa', 'directo']),

  // ==================== CADENA PINZON (4 etapas) ====================
  huevo_pinar: C('huevo_pinar', 'Huevo de Pinar', { W: 1 }, 0, 2, 'Azul turquesa, puesto en un pino canario.', 'pinar', 0, 'pinzon', ['guardia']),
  pinzon: C('pinzon', 'Pinzon Azul', { generic: 1, W: 1, G: 1 }, 2, 4, 'Dos picotazos del Teide antes de parpadear.', 'pinar', 1, 'pinzon', ['prisa', 'doble'], true),
  pinzon_chispero: C('pinzon_chispero', 'Pinzon Chispero', { generic: 2, W: 1, G: 2 }, 4, 4, 'Le dio por el mojo picón y ahora escupe chispas azules.', 'pinar', 2, 'pinzon', ['prisa', 'doble']),
  fenix_azul_teide: C('fenix_azul_teide', 'Fenix Azul del Teide', { generic: 3, R: 1, G: 1, W: 2 }, 6, 5, 'Se quemo en Las Canadas y volvio mas azul y mas enfadado.', 'pinar', 3, 'pinzon', ['prisa', 'doble', 'regen']),

  // ==================== CADENA CERNICALO (2 etapas) ====================
  cernicalo: C('cernicalo', 'Cernicalo', { generic: 1, W: 1 }, 3, 2, 'Vuela quedo y clava por arriba.', 'pinar', 1, 'cernicalo', ['directo']),
  cernicalo_alisio: C('cernicalo_alisio', 'Cernicalo del Alisio', { generic: 2, W: 2 }, 5, 3, 'Cabarga el viento norte. Nadie lo ve venir.', 'pinar', 2, 'cernicalo', ['directo', 'prisa']),

  // ==================== CADENA PARDELA (2 etapas) ====================
  pardela: C('pardela', 'Pardela Cenicienta', { G: 1 }, 2, 2, 'Llora de noche como un bebe. Da yuyu.', 'pinar', 1, 'pardela', ['prisa']),
  pardela_tormenta: C('pardela_tormenta', 'Pardela de Tormenta', { generic: 1, G: 2 }, 4, 4, 'Vuela dentro del temporal por gusto.', 'pinar', 2, 'pardela', ['prisa', 'doble']),
};

// ------------------------------------------------------------------
// CADENAS EVOLUTIVAS: combinar 5 copias -> 1 de la siguiente etapa
// ------------------------------------------------------------------
export const EVO_CHAINS: Record<string, string[]> = {
  cabra: ['huevo_risco', 'baifo', 'cabra', 'cabra_chispera', 'cabra_titan_teide'],
  tabaiba: ['semilla', 'tabaiba', 'cardon', 'drago_milenario'],
  lagarto: ['huevo_malpais', 'lagarto', 'lagarto_gigante', 'lagarto_magma'],
  lapa: ['lapa', 'lapa_acorazada'],
  choco: ['huevo_charco', 'choco', 'calamar', 'kraken_anaga'],
  vieja: ['alevin', 'vieja', 'vieja_reina', 'vieja_abismo'],
  angelote: ['angelote', 'angelote_abisal', 'leviatan_bajamar'],
  gaviota: ['huevo_playa', 'gaviota', 'gaviota_titan'],
  pinzon: ['huevo_pinar', 'pinzon', 'pinzon_chispero', 'fenix_azul_teide'],
  cernicalo: ['cernicalo', 'cernicalo_alisio'],
  pardela: ['pardela', 'pardela_tormenta'],
  gato: ['michino', 'gato_callejero', 'gato_azotea', 'don_michi'],
  tunera: ['tunera', 'tajinaste', 'palmera_real'],
  perita_barranco: ['perita_barranco'],
  vino: ['cuarta_vino', 'garrafa_peleon', 'barrica_romera'],
  yunta: ['novillo_romero', 'yunta_bueyes', 'yunta_real'],
  garrafon: ['chupito_garrafon', 'cubata_garrafon', 'bidon_toxico'],
  leon_marino: ['cria_leon', 'leon_marino', 'gran_otario'],
  tiburon: ['cazon', 'jaqueton', 'megalodon_siam'],
  // Expansion "Folclore y leyenda" (equilibrio de colores)
  guayota: ['chispa_echeyde', 'tibicena', 'guayota_menor', 'guayota'],
  timple: ['timple_tenderete', 'parranda_timples', 'los_sabandenos'],
  tortuga: ['huevo_tortuga', 'tortuguita', 'tortuga_boba', 'tortuga_laud', 'tortuga_abuela'],
  chaxiraxi: ['luz_candelaria', 'pastor_guanche', 'guanarteme', 'chaxiraxi', 'achaman'],
  cesar_manrique: ['cesar_manrique'],
  pedro_guerra: ['pedro_guerra'],
  oscar_dominguez: ['oscar_dominguez'],
  bruja: ['bruja_nina', 'bruja_anaga', 'aquelarre_bailadero'],
  garajonay: ['brote_garajonay', 'jonay', 'gara', 'gigante_laurisilva'],
  magec: ['magec'],
  // Cadenas de la 1ª edicion (descatalogadas: solo las regala el Magomaniaco)
  burgado_1ed: ['burgado_1ed', 'burgado_gigante_1ed'],
  cangrejo_1ed: ['cangrejo_1ed', 'cangrejo_sierra_1ed'],
  pancho_camurria: ['pancho_camurria'],
  pollito_frontera: ['pollito_frontera'],
};

export const EVO_NEXT: Record<string, string | undefined> = {};
for (const chain of Object.values(EVO_CHAINS)) {
  for (let i = 0; i < chain.length - 1; i++) EVO_NEXT[chain[i]] = chain[i + 1];
}

/** La siguiente etapa es la ultima de su cadena? (ahi combinar sube stats en vez de evolucionar) */
export function isFinalStage(id: string): boolean {
  const c = CARDS[id];
  if (!c?.chain) return true;
  const chain = EVO_CHAINS[c.chain];
  return !chain || chain[chain.length - 1] === id;
}

export const COMBINE_COST = 5;
export const MAX_DECK = 60;
export const MAX_COPIES = 4; // en mazo; la 5a copia puede ir al PC o combinarse

// ------------------------------------------------------------------
// SOBRES: probabilidad DECRECIENTE segun la etapa evolutiva
// ------------------------------------------------------------------
export const STAGE_WEIGHT: Record<number, number> = { 0: 46, 1: 30, 2: 16, 3: 6, 4: 2 };

export const CREATURE_IDS = Object.values(CARDS).filter((c) => c.type === 'creature' && !c.firstEdition).map((c) => c.id);
export const SPELL_IDS = Object.values(CARDS).filter((c) => c.type === 'spell' && !c.legendary).map((c) => c.id);
export const LAND_IDS = Object.values(CARDS).filter((c) => c.type === 'land' && !c.legendary).map((c) => c.id);

/** Devuelve las criaturas de la(s) biome(s) dadas, o todas si no se filtra. */
export function creaturesInBiomes(biomes?: CardDef['biome'][]): string[] {
  if (!biomes) return CREATURE_IDS;
  // Las de 1ª edicion no salen en sobres: solo las da el Magomaniaco.
  return Object.values(CARDS)
    .filter((c) => c.type === 'creature' && !c.firstEdition && biomes.includes(c.biome!))
    .map((c) => c.id);
}

export const STARTER_BIOME: Record<StarterId, CardDef['biome'][]> = {
  cabra: ['risco'],
  angelote: ['mar'],
  pinzon: ['pinar'],
};

// ------------------------------------------------------------------
// MAZOS PROMOCIONALES DE INICIO (24 cartas)
// ------------------------------------------------------------------
export const STARTER_DECK_RECIPES: Record<StarterId, {
  pack: string;
  lands: [string, number][];
  units: [string, number][];
  spells: [string, number][];
}> = {
  cabra: {
    pack: 'MAZO DEL RISCO',
    lands: [['tierra_volcan', 5], ['tierra_laurisilva', 5]],
    units: [['cabra', 2], ['baifo', 4], ['tabaiba', 4]],
    spells: [['gofio', 2], ['mojo', 1], ['tolete', 1]],
  },
  angelote: {
    pack: 'MAZO DE LA BAJAMAR',
    lands: [['tierra_charco', 5], ['tierra_playa', 5]],
    units: [['angelote', 2], ['vieja', 4], ['choco', 4]],
    spells: [['clipper', 2], ['chola', 2]],
  },
  pinzon: {
    pack: 'MAZO DEL PINAR',
    lands: [['tierra_playa', 5], ['tierra_laurisilva', 5]],
    units: [['pinzon', 2], ['cernicalo', 4], ['pardela', 4]],
    spells: [['chola', 2], ['gofio', 2]],
  },
};

export function buildStarterDeck(s: StarterId): string[] {
  const r = STARTER_DECK_RECIPES[s];
  const out: string[] = [];
  for (const [id, q] of [...r.lands, ...r.units, ...r.spells]) {
    const cap = CARDS[id].type === 'land' ? q : Math.min(q, MAX_COPIES);
    for (let i = 0; i < cap; i++) out.push(id);
  }
  return out;
}

export const PROFESSOR_DECK: string[] = [
  'tierra_malpais', 'tierra_malpais', 'tierra_malpais', 'tierra_malpais', 'tierra_malpais',
  'tierra_volcan', 'tierra_volcan', 'tierra_volcan', 'tierra_volcan', 'tierra_volcan',
  'lagarto', 'lagarto', 'lagarto', 'lagarto',
  'lapa', 'lapa', 'lapa',
  'gaviota', 'gaviota', 'gaviota',
  'calima', 'calima', 'mojo', 'tolete',
];

export const STARTER_INFO: Record<StarterId, { role: string; deckStyle: string; acaymo: string; pack: string }> = {
  cabra: {
    role: 'MURO + GUARDIA',
    deckStyle: '24 cartas: 5 Volcan, 5 Laurisilva, Cabra x2, Baifo x4, Tabaiba x4, Gofio, Mojo, Tolete.',
    acaymo: 'ACAYMO: La Cabra! Mazo del Risco (24 cartas, Volcan y Laurisilva). Robas 7 y lo que muere no vuelve.',
    pack: 'MAZO DEL RISCO',
  },
  angelote: {
    role: 'SIGILO + DIRECTO',
    deckStyle: '24 cartas: 5 Charco, 5 Playa, Angelote x2, Vieja x4, Choco x4, Clipper y Chola.',
    acaymo: 'ACAYMO: El Angelote! Mazo de la Bajamar (24 cartas, Charco y Playa). Todo del charco.',
    pack: 'MAZO DE LA BAJAMAR',
  },
  pinzon: {
    role: 'PRISA + DOBLE',
    deckStyle: '24 cartas: 5 Playa, 5 Laurisilva, Pinzon x2, Cernicalo x4, Pardela x4, Chola y Gofio.',
    acaymo: 'ACAYMO: El Pinzon Azul! Mazo del Pinar (24 cartas, Playa y Laurisilva). Doble picotazo.',
    pack: 'MAZO DEL PINAR',
  },
};
