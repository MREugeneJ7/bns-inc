// "La Ruta del Buen Yantar": los 8 guachinches con lider de gimnasio.
// Copia en papel que Bencomo le da al guirufo. Los combates llegan en el capitulo 2.

export interface Guachinche {
  n: number;
  name: string;
  zona: string;
  leader: string;
  type: string;
  icon: string;
  boliche: string;
  note: string;
}

export const RUTA: Guachinche[] = [
  { n: 1, name: 'Guachinche-Truck ULL', zona: 'Campus Central', leader: 'Domingo "El del Truck"', type: 'VOLCAN', icon: '🚚', boliche: 'Boliche del Carne Fiesta', note: 'Parking del Campus Central. Subes desde Weyler to tieso parriba.' },
  { n: 2, name: 'La Ola de Taganana', zona: 'Taganana · Anaga', leader: 'Cathaysa "La Surfista"', type: 'CHARCO', icon: '🏄', boliche: 'Boliche de la Marea', note: 'En Taganana. Si Pedro dice que no esta, bajala del agua en Almaciga.' },
  { n: 3, name: 'Guachinche Cueva Pintada', zona: 'Galdar · G.C.', leader: 'Bentejui "El del Caldero"', type: 'MALPAIS', icon: '🪨', boliche: 'Boliche de la Cueva Pintada', note: 'Sube las Curvas del Demonio. Abren a "landon" (las dos). Busca los 2 botones entre la carne fiesta!' },
  { n: 4, name: 'Palmetum de S/C', zona: 'Av. Anaga · Cabo Llanos', leader: 'Jonay "El del Palmetum"', type: 'PLANTA', icon: '🌴', boliche: 'Boliche del Palmetum', note: 'Gimnasio TIPO PLANTA junto al mar. Entra con el 4x4 por su parking reventado, aparca y pasa a pie al jardin!' },
  { n: 5, name: 'Guachinche Papagayos', zona: 'Las Verónicas · Adeje', leader: 'Yéssica, la del cierre', type: 'VENENO', icon: '🎧', boliche: 'Boliche de la Chola', note: 'Desde el H10 baja a Monkeys y sigue Troya. La pista es un laberinto de garrafón seco: llega a la cabina sin perder las cholas.' },
  { n: 6, name: 'Guachinche de El Rosario', zona: 'El Rosario · Anaga', leader: 'Doña Sabina', type: 'PSIQUICO', icon: '🔮', boliche: 'Boliche de la Mesa del Fondo', note: 'Nueve salas en la misma planta. La bola de cristal está en la mesa del fondo; la placa de salida vuelve a la entrada.' },
  { n: 7, name: 'Guachinche de Casimiro', zona: 'San Sebastián · La Gomera', leader: 'Casimiro Curbelo', type: 'FUEGO', icon: '🌋', boliche: 'Boliche de Colón', note: 'En San Sebastián, donde estuvo Colón. La llave está en el laberinto de la mansión de Casimiro.' },
  { n: 8, name: 'El Diablito', zona: 'Carretera General · Santa Úrsula', leader: 'El Coco de Santa Úrsula', type: 'MALPAIS', icon: '🪨', boliche: 'Boliche del Diablito', note: 'Sube desde La Quinta hasta el pueblo y sigue la general al suroeste. Aunque el cartel ponga cerrado, huele a cocina italiana.' },
];

export const BOLICHES_TOTAL = RUTA.length;

export interface MagodexEntry {
  id: string;
  name: string;
  biome: string;
  text: string;
}

export const MAGODEX_ENTRIES: MagodexEntry[] = [
  { id: 'cabra', name: 'Cabra Majorera', biome: 'RISCO', text: 'Muro con cuernos. Guardia y regeneracion.' },
  { id: 'baifo', name: 'Baifo', biome: 'RISCO', text: 'Cabra chica, mala leche grande.' },
  { id: 'tabaiba', name: 'Tabaiba', biome: 'RISCO', text: 'Planta rara que aguanta lo que le echen.' },
  { id: 'angelote', name: 'Angelote', biome: 'MAR', text: 'Se entierra en la arena. Muerde primero.' },
  { id: 'vieja', name: 'Vieja', biome: 'MAR', text: 'El pez mas querido de la isla.' },
  { id: 'choco', name: 'Choco de Charco', biome: 'MAR', text: 'Se hace el charco si le miran mal.' },
  { id: 'pinzon', name: 'Pinzon Azul', biome: 'PINAR', text: 'Dos picotazos del Teide.' },
  { id: 'cernicalo', name: 'Cernicalo', biome: 'PINAR', text: 'Vuela quedo y pega dos veces.' },
  { id: 'pardela', name: 'Pardela Cenicienta', biome: 'PINAR', text: 'Llora de noche como un bebe.' },
  { id: 'lagarto', name: 'Lagarto Tizon', biome: 'OFRA', text: 'El magomon de los Lagartos de Ofra.' },
  { id: 'lapa', name: 'Lapa', biome: 'OFRA', text: 'Aferrada a la roca del charco.' },
  { id: 'gaviota', name: 'Gaviota Patiamarilla', biome: 'OFRA', text: 'Te roba el bocata en pleno vuelo.' },
  { id: 'tunera', name: 'Tunera Picona', biome: 'PINAR', text: 'Flora del Palmetum. Evoluciona a Tajinaste Real y Palmera Canaria.' },
  { id: 'gato_callejero', name: 'Gato Callejero', biome: 'OFRA', text: 'Los favoritos del Coco de Santa Ursula. Evolucionan hasta Don Michi.' },
  { id: 'burgado_1ed', name: 'Burgado (1ª Ed.)', biome: 'MAR', text: 'Descatalogado hasta certificar en La Gomera. Evoluciona a Burgado Tentacular.' },
  { id: 'cangrejo_1ed', name: 'Cangrejo (1ª Ed.)', biome: 'MAR', text: 'Descatalogado hasta La Gomera. Le crecen cuchillas y anda a dos patas.' },
  { id: 'cuarta_vino', name: 'Cuarta de Peleon', biome: 'RISCO', text: 'Vino aspero de guachinche. Evoluciona a Garrafa de Peleon y Barrica de Romeria.' },
  { id: 'novillo_romero', name: 'Novillo Romero', biome: 'RISCO', text: 'Engalanado pa la fiesta. Evoluciona a Yunta de Bueyes y Yunta de Carreta.' },
  { id: 'chupito_garrafon', name: 'Chupito Sospechoso', biome: 'OFRA', text: 'La barra de Papagayos embotellada. Su ataque deja veneno.' },
];
