import {
  PARRANDEROS, nearestParrandero,
  type StopId, type NPC, type MapId, type StarterId, type ParranderoId, type SchoolId,
} from './maps';
import { CARDS, buildStarterDeck } from '../battle/cards';
import type { PendingBooster } from './rewards';
import { buildGymDebugDeck, buildGym2DebugDeck, buildGym3DebugDeck, buildGym4DebugDeck } from './presets';
import { DRIVABLE_TILES, SOLID } from './sprites';
import { MAPS } from './maps';
import { CALETILLAS_RECORTE, CANDELARIA_ORILLA } from './mapsTf1';
import { LA_QUINTA_EXIT, TACO_TF5 } from './mapsTf5';
import { SANTA_URSULA_ENTRY, URSULA_DOORS } from './mapsSantaUrsula';
import { MONTANA_ENTRY } from './mapsMontanaBlanca';
import { SENDERO_ENTRY } from './mapsSenderoTelesforo';
import { CUEVA_ENTRY } from './mapsCuevaMagec';

import { migrateMirroredCoast } from './coastGeometry';
import type { PresetId } from './checkpoints';
import { BINTER_DESTINATIONS, syncBinterVisits } from './binterDestinations';
import { grantUnelco } from './firstEdition';
import { buyBeer, offerBeer, readBeerBag, type BeerBag } from './rosarioQuest';
import { MAGOS_KEYS } from './rosarioQuest';
export type { PresetId } from './checkpoints';

export const SAVE_VERSION = 12;

/** Campeón del Alto Mando: el mazo que entró al Hall de la Fama. */
export interface HallOfFameEntry {
  date: string;
  deck: string[];
}

export interface SaveState {
  version: number;
  timestamp: string;
  flags: Record<string, boolean>;
  npcs: Record<string, { x: number; y: number; hidden?: boolean }>;
  tramStop: StopId | null;
  mapId: MapId;
  playerPos: { x: number; y: number; dir: 'up' | 'down' | 'left' | 'right' };
  starter: StarterId | null;
  /** Ultimo Centro Parrandero en el que estas o al que te llevaron tras perder. */
  lastCenter: ParranderoId;
  /** Ultimo Colegio en cuyo patio te colaste. */
  lastSchool: SchoolId;
  /** Moneda oficial del juego: 1 duro = 25 pesetas. */
  duros: number;
  beers: BeerBag;
  /** Tu mazo (max 60, max 4 copias por carta no-tierra). */
  deck: string[];
  /** PC de Ayoze: almacenamiento sin limite. */
  pc: string[];
  /** Brillo permanente por carta: al combinar 5 en la ultima etapa da +1/+1. */
  shine: Record<string, number>;
  /** Entrenadores vencidos (1 en normales/gimnasios; contador en colegios repetibles). */
  beaten: Record<string, number>;
  sobres: number;
  /** Un sobre ya ganado, pendiente de elegir exactamente una carta. */
  pendingBooster: PendingBooster | null;
  /** Llaves ya recogidas en la sede del Coco (1 y 2). */
  magosKeys: number[];
  /** Mazos que han entrado al Hall de la Fama (uno por cada campeón del Alto Mando). */
  hallOfFame: HallOfFameEntry[];
  /** Club del Cable (2ª planta de los Centros Parranderos): combates e intercambios por cable. */
  linkStats: { wins: number; losses: number; trades: number };
}

const fresh = (): SaveState => ({
  version: SAVE_VERSION,
  timestamp: new Date().toISOString(),
  flags: {},
  npcs: {},
  tramStop: null,
  mapId: 'apartment',
  playerPos: { x: 4, y: 6, dir: 'down' },
  starter: null,
  lastCenter: 'weyler',
  lastSchool: 'sc',
  duros: 0,
  beers: {},
  deck: [],
  pc: [],
  shine: {},
  beaten: {},
  hallOfFame: [],
  linkStats: { wins: 0, losses: 0, trades: 0 },
  sobres: 0,
  pendingBooster: null,
  magosKeys: [],
});

export const save: SaveState = fresh();

export function npcState(n: NPC): { x: number; y: number; hidden?: boolean } {
  if (n.id === 'mago_americas' && save.flags.mago_americas_done) return { x: 5, y: 7, hidden: false };
  if (n.afterFlag && save.flags[n.afterFlag.key]) return { x: n.afterFlag.x, y: n.afterFlag.y, hidden: false };
  return save.npcs[n.id] ?? { x: n.x, y: n.y, hidden: !!n.hidden };
}

const listeners = new Set<() => void>();
export function subscribeSave(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export function touchSave() {
  save.timestamp = new Date().toISOString();
  listeners.forEach((f) => f());
}

/** Da de alta el mazo promocional del starter elegido (solo si aun no tiene mazo). */
export function grantStarterDeck(id: StarterId) {
  save.starter = id;
  save.flags.starterChosen = true;
  if (save.deck.length === 0) save.deck = buildStarterDeck(id);
  touchSave();
}

export function exportSaveJSON(): string {
  return JSON.stringify(save, null, 2);
}

export function getSaveDataURI(): string {
  return 'data:application/json;charset=utf-8,' + encodeURIComponent(exportSaveJSON());
}

/** Tras perder un duelo: te llevan al Centro Parrandero mas cercano y Chaxiraxi te repone. */
export function blackoutToNearestCenter(lostDuros: number): string[] {
  const cid = nearestParrandero(save.mapId, save.playerPos.x, save.playerPos.y, save.lastCenter, save.lastSchool);
  const def = PARRANDEROS[cid];
  save.lastCenter = cid;
  save.mapId = 'parrandero';
  save.flags.car_out = false; save.flags.pukas_out = false; save.flags.tf5_underpass = false;
  save.playerPos = { x: 3, y: 3, dir: 'up' };
  touchSave();
  return [
    `Te dio una pajara tras la derrota! Te trajeron en volandas al ${def.name} (${def.zona}).`,
    lostDuros > 0
      ? `CHAXIRAXI: Ay mi nino, perdiste ${lostDuros} duros en la mesa, pero ya te planche las cartas.`
      : 'CHAXIRAXI: Menos mal que ibas pelao sin un duro suelto y peleaste sin riesgo: 0 duros perdidos!',
    'CHAXIRAXI: Toma un barraquito y un Clipper. Si necesitas cartas, cuelate en el patio de un colegio!',
  ];
}

const VALID_STARTERS: StarterId[] = ['cabra', 'angelote', 'pinzon'];
const VALID_CENTERS: ParranderoId[] = ['weyler', 'candelaria', 'cuesta', 'ull', 'sanbenito', 'taganana', 'galdar', 'muelle', 'aeropuerto', 'troya', 'rosario', 'gomera', 'santa_ursula', 'refugio'];
const VALID_SCHOOLS: SchoolId[] = ['sc', 'cuesta', 'sanbenito', 'taganana', 'galdar', 'rosario', 'gomera', 'santa_ursula', 'refugio'];

export function importSaveJSON(jsonStr: string): boolean {
  try {
    const d = JSON.parse(jsonStr);
    if (!d || typeof d !== 'object') return false;
    Object.assign(save, fresh());
    save.flags = d.flags && typeof d.flags === 'object' ? { ...d.flags } : {};
    save.npcs = d.npcs && typeof d.npcs === 'object' ? { ...d.npcs } : {};
    // Partidas anteriores: los destinos Binter ya visitados quedan desbloqueados.
    syncBinterVisits(save);
    save.hallOfFame = Array.isArray(d.hallOfFame) ? d.hallOfFame : [];
    {
      const count = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
      const ls = d.linkStats && typeof d.linkStats === 'object' ? d.linkStats : {};
      save.linkStats = { wins: count(ls.wins), losses: count(ls.losses), trades: count(ls.trades) };
    }
    // Migracion suave de Yanira (v5) -> Cathaysa + Pedro (v6)
    if (save.flags.yanira_rescued) {
      save.flags.cathaysa_rescued = true;
      delete save.flags.yanira_rescued;
    }
    if (save.flags.cathaysa_rescued) {
      save.npcs.cathaysa_surf = { x: 60, y: 3, hidden: true };
      save.npcs.cathaysa_gym = { x: 44, y: 6, hidden: false };
      save.npcs.pedro = { x: 42, y: 7, hidden: false };
    }
    if (save.flags.got_translator && !save.npcs.portero_cuevas) {
      save.npcs.portero_cuevas = { x: 20, y: 5, hidden: false };
    }
    if (save.flags.olsen_benijo) save.flags.olsen_sailed = true;
    save.tramStop = d.tramStop === 'weyler' || d.tramStop === 'candelaria' ? d.tramStop : null;
    const oldCaletillas = d.mapId === 'caletillas';
    const version = Number(d.version) || 0;
    save.mapId = oldCaletillas ? 'tf1' : Object.prototype.hasOwnProperty.call(MAPS, d.mapId) ? d.mapId : 'apartment';
    const rawPos = (d.playerPos && typeof d.playerPos.x === 'number' && typeof d.playerPos.y === 'number')
      ? { x: d.playerPos.x, y: d.playerPos.y, dir: d.playerPos.dir ?? 'down' }
      : { x: 4, y: 6, dir: 'down' as const };
    // La versión anterior dibujaba Adeje al este; conservar el punto relativo al reflejar el mapa.
    if (version < 9) {
      if (save.mapId === 'las_americas' || save.mapId === 'veronicas') {
        rawPos.x = (save.mapId === 'las_americas' ? 27 : 82) - rawPos.x;
        if (rawPos.dir === 'left') rawPos.dir = 'right';
        else if (rawPos.dir === 'right') rawPos.dir = 'left';
      }
      const stationNpcs = ['mago_americas', 'romera_americas', 'timplista_americas'];
      const coastNpcs = ['recepcion_h10', 'monkeys_camarera', 'tourist_map', 'troyalocal', 'malick', 'barry_troya', 'tourist_song', 'ibrahima', 'tourist_shoe', 'sarah_karaoke', 'taxi_noche'];
      for (const id of stationNpcs) if (save.npcs[id]) save.npcs[id].x = 27 - save.npcs[id].x;
      for (const id of coastNpcs) if (save.npcs[id]) save.npcs[id].x = 82 - save.npcs[id].x;
    }
    // v10 changes only the coastal leg. Migrate v8 via v9 exactly once.
    const oldCoast = version < 10;
    if (oldCoast) {
      if (save.mapId === 'veronicas') Object.assign(rawPos, migrateMirroredCoast(rawPos));
      for (const n of MAPS.veronicas.npcs) if (save.npcs[n.id]) {
        save.npcs[n.id] = { ...save.npcs[n.id], x: n.x, y: n.y };
      }
    }
    // Las partidas de la antigua rada vuelven a la plaza sin perder la carta ni el progreso.
    const { left, right, top, bottom } = CALETILLAS_RECORTE;
    const newCoast = (rawPos.x >= left && rawPos.x <= right && rawPos.y >= top && rawPos.y <= bottom)
      || (rawPos.x === 132 && rawPos.y === 20) || (rawPos.x === 136 && rawPos.y === 17);
    if (oldCaletillas || (version < 11 && save.mapId === 'tf1' && newCoast)) {
      Object.assign(rawPos, CANDELARIA_ORILLA, { dir: 'right' });
      save.flags.pukas_out = false;
    }
    // Llaves de Magos de la Costa: las partidas antiguas no las tienen.
    save.magosKeys = Array.isArray(d.magosKeys) ? [...new Set<number>(d.magosKeys.filter((n: unknown): n is number => n === 1 || n === 2))] : [];
    for (const k of MAGOS_KEYS) if (save.magosKeys.includes(k.key)) save.flags[k.flag] = true;
    if (save.mapId === 'magos_azotea' && !(save.magosKeys.includes(1) && save.magosKeys.includes(2))) {
      rawPos.x = 10; rawPos.y = 5; rawPos.dir = 'up';
    }
    if (save.mapId === 'magos_pb' && rawPos.x === 10 && rawPos.y === 10) { rawPos.y = 9; }
    const loadedMap = MAPS[save.mapId];
    const rowStr = loadedMap?.rows[rawPos.y];
    save.playerPos = (rowStr && rawPos.x >= 0 && rawPos.x < rowStr.length) ? rawPos : { x: 4, y: 6, dir: 'down' };
    // Recolocar partidas de la estación anterior si el nuevo plano dejó un muro bajo sus pies.
    if (save.mapId === 'las_americas' && (SOLID[loadedMap.legend[loadedMap.rows[save.playerPos.y]?.[save.playerPos.x]]] || loadedMap.npcs.some(n => n.x === save.playerPos.x && n.y === save.playerPos.y))) save.playerPos = { x: 18, y: 9, dir: 'up' };
    if (oldCoast && save.mapId === 'veronicas') {
      const canStand = (x: number, y: number) => {
        const ch = loadedMap.rows[y]?.[x]; if (!ch) return false;
        const tile = loadedMap.legend[ch];
        if (SOLID[tile] && !(save.flags.pukas_out && (tile === 'sea' || tile === 'surf'))) return false;
        return !loadedMap.npcs.some(n => !n.hidden && n.x === x && n.y === y)
          && !loadedMap.triggers.some(t => t.x === x && t.y === y && t.kind === 'step' && (t.action.type === 'warp' || t.action.type === 'enterParrandero'));
      };
      if (!canStand(save.playerPos.x, save.playerPos.y)) {
        let distance = Infinity, best = {x: 41, y: 8};
        for (let y = 0; y < loadedMap.rows.length; y++) for (let x = 0; x < loadedMap.rows[y].length; x++) {
          const cost = Math.abs(rawPos.x - x) + Math.abs(rawPos.y - y);
          if (cost < distance && canStand(x, y)) { best = {x, y}; distance = cost; }
        }
        save.playerPos = { ...best, dir: rawPos.dir };
      }
    }
    // Nunca restaurar el Landcruiser encima de arena, acera o interior (salvo el paso inferior de la TF-5 en Taco)
    const validUnderpass = save.mapId === 'calle' && !!save.flags.tf5_underpass && !!save.flags.car_out
      && save.playerPos.x >= TACO_TF5.left && save.playerPos.x <= TACO_TF5.right;
    if (save.flags.car_out && loadedMap && !validUnderpass) {
      const tid = loadedMap.legend[loadedMap.rows[save.playerPos.y]?.[save.playerPos.x] ?? ''];
      if (!tid || !DRIVABLE_TILES.has(tid)) save.flags.car_out = false;
    }
    if (save.flags.tf5_underpass && !validUnderpass) save.flags.tf5_underpass = false;
    save.starter = VALID_STARTERS.includes(d.starter) ? d.starter : null;
    save.lastCenter = VALID_CENTERS.includes(d.lastCenter) ? d.lastCenter : 'weyler';
    save.lastSchool = VALID_SCHOOLS.includes(d.lastSchool) ? d.lastSchool : 'sc';
    save.duros = typeof d.duros === 'number' && d.duros >= 0 ? Math.floor(d.duros) : 0;
    save.beers = readBeerBag(d.beers);
    save.deck = Array.isArray(d.deck) ? d.deck.filter((c: unknown) => typeof c === 'string') : [];
    save.pc = Array.isArray(d.pc) ? d.pc.filter((c: unknown) => typeof c === 'string') : [];
    save.shine = d.shine && typeof d.shine === 'object' ? { ...d.shine } : {};
    save.beaten = d.beaten && typeof d.beaten === 'object' ? { ...d.beaten } : {};
    // Migracion: partidas hechas ANTES de que existiera el portazo del Magomaniaco.
    // Si ya pasaste por Taganana/Galdar, el portazo quedo a tu espalda (nunca mas).
    if (save.flags.boliche_2 || save.flags.boliche_3 || (save.beaten.gym_taganana ?? 0) > 0 || (save.beaten.gym_galdar ?? 0) > 0) {
      save.flags.magomaniaco_done = true;
    }
    save.sobres = typeof d.sobres === 'number' && d.sobres >= 0 ? Math.floor(d.sobres) : 0;
    const pending = d.pendingBooster;
    if (
      pending && typeof pending.trainerId === 'string' && typeof pending.trainerName === 'string' &&
      typeof pending.purse === 'number' && Number.isFinite(pending.purse) && pending.purse >= 0 &&
      Array.isArray(pending.cards) && pending.cards.length === 5 &&
      pending.cards.every((id: unknown) => typeof id === 'string' && !!CARDS[id])
    ) {
      save.pendingBooster = {
        trainerId: pending.trainerId,
        trainerName: pending.trainerName,
        purse: Math.floor(pending.purse),
        cards: [...pending.cards],
        ...(typeof pending.gym === 'number' ? { gym: pending.gym } : {}),
        ...(typeof pending.bolicheName === 'string' ? { bolicheName: pending.bolicheName } : {}),
      };
      save.beaten[pending.trainerId] = Math.max(1, Number(save.beaten[pending.trainerId]) || 0);
    }
    save.version = SAVE_VERSION;
    touchSave();
    return true;
  } catch {
    return false;
  }
}

function markDeckSeen() {
  for (const card of save.deck) {
    if (CARDS[card]?.type === 'creature') save.flags['seen_' + card] = true;
  }
}

function applyPreset(id: PresetId, starterChoice: StarterId) {
  Object.assign(save, fresh());
  const seenStarter: Record<string, boolean> =
    starterChoice === 'cabra' ? { seen_cabra: true, seen_baifo: true, seen_tabaiba: true }
    : starterChoice === 'angelote' ? { seen_angelote: true, seen_vieja: true, seen_choco: true }
    : { seen_pinzon: true, seen_cernicalo: true, seen_pardela: true };

  const base = {
    visited_apartment: true, visited_rellano: true, talkedYeray: true,
    visited_calle: true, visited_hospital: true,
  };

  if (id === 'inicio') {
    save.flags = { visited_apartment: true };
  } else if (id === 'hospital') {
    save.flags = { ...base };
    save.npcs = { yeray: { x: 3, y: 4, hidden: true } };
    save.tramStop = 'candelaria';
    save.lastCenter = 'candelaria';
    save.mapId = 'hospital';
    save.playerPos = { x: 4, y: 5, dir: 'up' };
  } else if (id === 'recado') {
    save.flags = { ...base, starterChosen: true, ...seenStarter, seen_lagarto: true, seen_lapa: true, seen_gaviota: true, errand: true };
    save.npcs = { yeray: { x: 3, y: 4, hidden: true } };
    save.tramStop = 'candelaria';
    save.lastCenter = 'candelaria';
    save.mapId = 'hospital';
    save.playerPos = { x: 4, y: 6, dir: 'down' };
    save.starter = starterChoice;
    save.deck = buildStarterDeck(starterChoice);
    save.duros = 10;
  } else if (id === 'capitulo1') {
    save.flags = { ...base, starterChosen: true, ...seenStarter, seen_lagarto: true, seen_lapa: true, seen_gaviota: true, errand: true, parcel: true, delivered: true, magodex: true, ruta: true };
    save.flags.tf5 = true;
    save.flags.taco = true;
    save.npcs = {
      yeray: { x: 3, y: 4, hidden: true },
      acaymo: { x: 7, y: 5, hidden: true },
      bencomo: { x: 2, y: 5, hidden: false },
      ayoze: { x: 6, y: 5, hidden: false },
    };
    save.tramStop = 'candelaria';
    save.lastCenter = 'candelaria';
    save.mapId = 'hospital';
    save.playerPos = { x: 4, y: 6, dir: 'down' };
    save.starter = starterChoice;
    save.deck = buildStarterDeck(starterChoice);
    save.duros = 15;
  } else if (id === 'weyler') {
    applyPreset('capitulo1', starterChoice);
    save.flags.pcIntro = true;
    save.tramStop = 'weyler';
    save.lastCenter = 'weyler';
    save.mapId = 'calle';
    save.playerPos = { x: 56, y: 4, dir: 'up' };
    save.duros = 25;
    save.beaten = { chacho_portal: 1, abuela_kiosco: 1 };
  } else if (id === 'ull') {
    applyPreset('capitulo1', starterChoice);
    save.flags.visited_subida = true;
    save.flags.pcIntro = true;
    save.tramStop = 'weyler';
    save.lastCenter = 'ull';
    save.lastSchool = 'cuesta';
    save.mapId = 'subida';
    save.playerPos = { x: 24, y: 8, dir: 'up' };
    save.duros = 40;
    save.beaten = { chacho_portal: 1, abuela_kiosco: 1, runner_granja: 1, pibe_cuesta: 1 };
    save.deck = buildGymDebugDeck(starterChoice);
    markDeckSeen();
  } else if (id === 'sanbenito') {
    applyPreset('ull', starterChoice);
    save.flags.boliche_1 = true;
    save.flags.reached_ull = true;
    save.flags.visited_anaga = true;
    save.beaten.gym_ull = 1;
    save.lastCenter = 'sanbenito';
    save.lastSchool = 'sanbenito';
    save.mapId = 'anaga';
    save.playerPos = { x: 9, y: 62, dir: 'up' };
    save.duros = 70;
  } else if (id === 'taganana') {
    applyPreset('sanbenito', starterChoice);
    save.lastCenter = 'taganana';
    save.lastSchool = 'taganana';
    save.mapId = 'anaga';
    save.playerPos = { x: 43, y: 8, dir: 'up' };
    save.duros = 95;
    save.beaten = {
      ...save.beaten,
      pibe_sanbenito: 1, mago_mercedes: 1, senderista_tf12: 1, dominguero_llano: 1, cabrero_vueltas: 1,
    };
    save.deck = buildGym2DebugDeck(starterChoice);
    markDeckSeen();
    // Para llegar a Taganana has tenido que pasar el portazo del Magomaniaco
    save.beaten.magomaniaco = 1;
    save.flags.magomaniaco_done = true;
    save.flags.first_ed_claimed = true;
    save.pc = [...save.pc, 'burgado_1ed'];
    save.flags.seen_burgado_1ed = true;
  } else if (id === 'benijo') {
    applyPreset('taganana', starterChoice);
    save.flags.cathaysa_rescued = true;
    save.flags.boliche_2 = true;
    save.beaten.gym_taganana = 1;
    save.npcs.cathaysa_surf = { x: 60, y: 3, hidden: true };
    save.npcs.cathaysa_gym = { x: 44, y: 6, hidden: false };
    save.npcs.pedro = { x: 42, y: 7, hidden: false };
    save.mapId = 'anaga';
    save.playerPos = { x: 71, y: 5, dir: 'up' };
    save.duros = 135;
  } else if (id === 'galdar') {
    applyPreset('benijo', starterChoice);
    save.flags.cayuco_done = true;
    save.flags.visited_galdar = true;
    save.lastCenter = 'galdar';
    save.lastSchool = 'galdar';
    save.mapId = 'galdar';
    save.playerPos = { x: 13, y: 50, dir: 'up' };
    save.duros = 145;
    save.deck = buildGym3DebugDeck(starterChoice);
    markDeckSeen();
  } else if (id === 'cuevas') {
    applyPreset('galdar', starterChoice);
    save.flags.heard_canarion = true;
    save.flags.got_translator = true;
    save.flags.olsen_sailed = true;
    save.flags.visited_cuevas_pintadas = true;
    save.npcs.portero_cuevas = { x: 20, y: 5, hidden: false };
    save.mapId = 'cuevas_pintadas';
    save.playerPos = { x: 10, y: 17, dir: 'up' };
    save.duros = 165;
  } else if (id === 'magomaniaco') {
    // Justo frente al fogon y al Magomaniaco en Las Mercedes: aun NO le has ganado
    applyPreset('sanbenito', starterChoice);
    save.beaten.magomaniaco = 0;
    delete save.flags.magomaniaco_done;
    delete save.flags.first_ed_claimed;
    save.pc = save.pc.filter((c) => c !== 'burgado_1ed');
    save.mapId = 'anaga';
    save.playerPos = { x: 39, y: 48, dir: 'up' };
    save.duros = 75;
  } else if (id === 'carretera') {
    // Gym #3 hecho, Olsen zarpado y Landcruiser listo sobre el asfalto de la TF-134
    applyPreset('cuevas', starterChoice);
    save.flags.cueva_door_open = true;
    save.flags.boliche_3 = true;
    save.flags.olsen_sailed = true;
    save.flags.hm_todo_terreno = true;
    save.flags.car_out = true;
    save.beaten.gym_galdar = 1;
    save.mapId = 'anaga';
    save.playerPos = { x: 33, y: 17, dir: 'down' };
    save.duros = 210;
    save.deck = buildGym4DebugDeck(starterChoice);
    markDeckSeen();
  } else if (id === 'sanandres') {
    applyPreset('carretera', starterChoice);
    save.flags.visited_carretera_noche = true;
    save.flags.visited_san_andres = true;
    save.lastCenter = 'muelle';
    save.mapId = 'san_andres';
    save.playerPos = { x: 15, y: 4, dir: 'down' };
  } else if (id === 'palmetum') {
    applyPreset('sanandres', starterChoice);
    save.flags.visited_santacruz_sur = true;
    save.lastCenter = 'muelle';
    save.mapId = 'santacruz_sur';
    // Sobre el asfalto de Av. Anaga junto a la rampa reventada del parking del Palmetum
    save.playerPos = { x: 22, y: 10, dir: 'left' };
    save.duros = 225;
  } else if (id === 'meridiano') {
    applyPreset('palmetum', starterChoice);
    save.flags.car_out = false;
    save.flags.boliche_4 = true;
    save.flags.visited_meridiano = true;
    save.beaten.jardinera_palmetum = 1;
    save.beaten.gym_palmetum = 1;
    save.mapId = 'meridiano';
    save.playerPos = { x: 12, y: 12, dir: 'up' };
    save.duros = 260;
  } else if (id === 'meridiano_final') {
    // El Coco ya no aparece en Meridiano: el equipo cazafantasmas queda aquí y la máquina sube a Magos.
    applyPreset('meridiano', starterChoice);
    save.flags.has_cazafantasmas = true;
    save.flags.coco_meridiano_moved = true;
    save.flags.boliche_4 = true;
    save.beaten.jardinera_palmetum = 1;
    save.beaten.gym_palmetum = 1;
    save.mapId = 'meridiano';
    save.playerPos = { x: 11, y: 12, dir: 'up' };
    save.duros = 260;
  } else if (id === 'magos_pb') {
    applyPreset('terrero', starterChoice);
    save.flags.visited_el_rosario = true;
    save.flags.rosario_open = true;
    save.mapId = 'magos_pb';
    save.playerPos = { x: 10, y: 9, dir: 'down' };
  } else if (id === 'magos_llave_1') {
    applyPreset('magos_pb', starterChoice);
    save.magosKeys = [1]; save.flags.magos_key_1 = true;
    save.mapId = 'magos_2';
    save.playerPos = { x: 3, y: 3, dir: 'down' };
  } else if (id === 'magos_llave_2') {
    applyPreset('magos_llave_1', starterChoice);
    save.magosKeys = [1, 2]; save.flags.magos_key_1 = true; save.flags.magos_key_2 = true;
    save.mapId = 'magos_4';
    save.playerPos = { x: 16, y: 9, dir: 'down' };
  } else if (id === 'magos_azotea') {
    applyPreset('magos_llave_2', starterChoice);
    save.mapId = 'magos_azotea';
    save.playerPos = { x: 10, y: 6, dir: 'up' };
  } else if (id === 'guarida') {
    applyPreset('meridiano_final', starterChoice);
    save.flags.bershka_opened = true;
    save.flags.visited_guarida_enriscada = true;
    save.beaten.enriscada_guarida_1 = 1;
    save.mapId = 'guarida_enriscada';
    save.playerPos = { x: 11, y: 13, dir: 'down' };
    save.duros = 290;
  } else if (id === 'torre') {
    applyPreset('meridiano_final', starterChoice);
    save.flags.has_cazafantasmas = true;
    save.flags.visited_torre_teresitas_1 = true;
    save.flags.car_out = false;
    save.lastCenter = 'muelle';
    save.mapId = 'torre_teresitas_1';
    save.playerPos = { x: 9, y: 12, dir: 'up' };
    save.duros = 310;
  } else if (id === 'torre_final') {
    applyPreset('torre', starterChoice);
    for (let floor = 1; floor <= 4; floor++) save.beaten[`torre_enriscada_${floor}`] = 1;
    save.mapId = 'torre_teresitas_5';
    save.playerPos = { x: 9, y: 12, dir: 'up' };
    save.duros = 370;
  } else if (id === 'tf1') {
    // Tras bajar de la Torre con el Bucio: montado en el Toyota al inicio de la TF-1 rumbo a Adeje!
    applyPreset('torre_final', starterChoice);
    save.flags.has_bucio = true;
    save.flags.tower_bruja_gifted = true;
    save.flags.car_out = true;
    save.flags.visited_tf1 = true;
    save.lastCenter = 'muelle';
    save.mapId = 'tf1';
    save.playerPos = { x: 155, y: 12, dir: 'left' };
    save.duros = 400;
  } else if (id === 'aeropuerto') {
    // Dentro de la Terminal del Aeropuerto TFS frente a Doña Maruca (M.O. 2 Tarifa Plana Binter)
    applyPreset('tf1', starterChoice);
    save.flags.car_out = false;
    save.flags.visited_aeropuerto = true;
    save.beaten.caddy_anaza = 1;
    save.beaten.guagua_candelaria = 1;
    save.beaten.caddy_abades = 1;
    save.beaten.caddy_medano = 1;
    save.lastCenter = 'aeropuerto';
    save.mapId = 'aeropuerto';
    save.playerPos = { x: 12, y: 9, dir: 'up' };
    save.duros = 480;
  } else if (id === 'romeria') {
    // Final de la TF-1 frente a la Romeria que corta la entrada a Adeje (listo para tocar el Bucio!)
    applyPreset('aeropuerto', starterChoice);
    save.flags.hm_binter = true;
    save.flags.car_out = true;
    save.beaten.guagua_aeropuerto = 1;
    save.beaten.caddy_adeje = 1;
    save.mapId = 'tf1';
    save.playerPos = { x: 6, y: 12, dir: 'left' };
    save.duros = 530;
  } else if (id === 'americas') {
    // En la Estacion de Las Americas tras la Romeria, frente al Mago Don Servando antes de Ciudad Fucsia (Adeje)
    applyPreset('romeria', starterChoice);
    save.flags.car_out = false;
    save.flags.reached_adeje_gate = true;
    save.flags.romeria_done = true;
    save.flags.visited_las_americas = true;
    save.mapId = 'las_americas';
    save.playerPos = { x: 16, y: 9, dir: 'right' };
    save.duros = 550;
  } else if (id === 'siam') {
    // Entrada al parque por el puente del Magma; las dos misiones aún están pendientes.
    applyPreset('americas', starterChoice);
    save.flags.mago_americas_done = true;
    save.beaten.mago_americas = 1;
    save.flags.visited_siam_park = true;
    save.mapId = 'siam_park';
    save.playerPos = { x: 48, y: 14, dir: 'left' };
    save.duros = 620;
  } else if (id === 'noche') {
    applyPreset('siam', starterChoice);
    Object.assign(save.flags, {
      visited_puente_magma: true, saw_guiri_crema: true, has_crema_fp50: false,
      hm_salto_pastor: true, pukas_dropped: true, pukas_recovered: false, hm_pukas: true, pukas_out: false,
    });
    save.mapId = 'las_americas';
    save.playerPos = { x: 14, y: 8, dir: 'left' };
  } else if (id === 'papagayos') {
    applyPreset('noche', starterChoice);
    save.flags.visited_veronicas = true;
    for (const k of ['san_eugenio', 'h10', 'callejuela', 'monkeys', 'troya', 'veronicas']) save.flags['coast_' + k] = true;
    save.lastCenter = 'troya';
    save.mapId = 'papagayos';
    save.playerPos = { x: 9, y: 18, dir: 'up' };
  } else if (id === 'candelaria') {
    applyPreset('papagayos', starterChoice);
    save.flags.boliche_5 = true;
    save.flags.visited_papagayos = true;
    save.beaten.gym_papagayos = 1;
    save.mapId = 'tf1';
    save.playerPos = { ...CANDELARIA_ORILLA, dir: 'right' };
  } else if (id === 'caletillas') {
    applyPreset('candelaria', starterChoice);
    save.playerPos = { x: 148, y: 18, dir: 'up' };
  } else if (id === 'barranco_hondo' || id === 'obras_taco') {
    applyPreset('caletillas', starterChoice);
    grantUnelco(save);
    save.mapId = id === 'barranco_hondo' ? 'barranco_hondo' : 'acceso_taco';
    save.playerPos = id === 'barranco_hondo' ? { x: 4, y: 16, dir: 'up' } : { x: 22, y: 8, dir: 'left' };
  } else if (id === 'guachinche_rosario' || id === 'guachinche_sabina') {
    applyPreset('terrero', starterChoice);
    save.flags.visited_guachinche_rosario = true;
    save.mapId = 'guachinche_rosario';
    save.playerPos = { x: 27, y: 36, dir: 'up' };
  } else if (id === 'corte_ingles') {
    applyPreset('barranco_hondo', starterChoice);
    save.flags.met_rosario_workers = true;
    save.mapId = 'santacruz_sur';
    save.playerPos = { x: 44, y: 7, dir: 'up' };
  } else if (id === 'gourmet') {
    applyPreset('corte_ingles', starterChoice);
    save.mapId = 'eci_azotea';
    save.playerPos = { x: 5, y: 6, dir: 'up' };
  } else if (id === 'entrega') {
    applyPreset('gourmet', starterChoice);
    buyBeer(save, 'dorada');
    save.mapId = 'barranco_hondo';
    save.playerPos = { x: 22, y: 8, dir: 'right' };
  } else if (id === 'rosario') {
    applyPreset('entrega', starterChoice);
    offerBeer(save, 'dorada');
    save.mapId = 'el_rosario';
    save.playerPos = { x: 2, y: 9, dir: 'right' };
  } else if (id === 'terrero') {
    applyPreset('rosario', starterChoice);
    save.lastCenter = 'rosario';
    save.lastSchool = 'rosario';
    save.playerPos = { x: 23, y: 11, dir: 'down' };
  } else if (id === 'gomera') {
    applyPreset('guachinche_rosario', starterChoice);
    save.flags.boliche_6 = true;
    save.flags.guachinche_rosario_beaten = true;
    save.beaten.guachinche_rosario = 1;
    save.flags.visited_san_sebastian = true;
    save.lastCenter = 'troya';
    save.mapId = 'san_sebastian';
    save.playerPos = { x: 23, y: 2, dir: 'down' };
  } else if (id === 'tf5') {
    applyPreset('gomera', starterChoice);
    save.flags.has_curbelo_key = true;
    save.flags.boliche_7 = true;
    save.beaten.gym_curbelo = 1;
    save.lastCenter = 'muelle';
    save.mapId = 'santacruz_sur';
    save.playerPos = { x: 49, y: 8, dir: 'up' };
  } else if (id === 'la_quinta') {
    applyPreset('tf5', starterChoice);
    save.flags.visited_tf5 = true;
    save.flags.tf5_quinta_chill = true;
    save.lastCenter = 'ull';
    save.mapId = 'tf5';
    save.playerPos = { ...LA_QUINTA_EXIT };
  } else if (id === 'santa_ursula') {
    applyPreset('la_quinta', starterChoice);
    // Estos saltos tardios recuerdan las dos victorias anteriores, no la tercera.
    Object.assign(save.flags, {
      coco_meridiano_beaten: true, coco_beaten: true, has_cazafantasmas: true,
      has_fotocopiadora: true, coco_ricardo_rescued: true,
      visited_santa_ursula: true,
    });
    save.beaten.coco_santa_ursula = 1;
    save.mapId = 'santa_ursula';
    save.playerPos = { ...SANTA_URSULA_ENTRY, dir: 'down' };
  } else if (id === 'diablito') {
    applyPreset('santa_ursula', starterChoice);
    save.lastCenter = 'santa_ursula';
    save.lastSchool = 'santa_ursula';
    save.playerPos = { x: URSULA_DOORS.diablito.x, y: URSULA_DOORS.diablito.y + 1, dir: 'up' };
  } else if (id === 'montana_blanca') {
    applyPreset('diablito', starterChoice);
    save.flags.boliche_8 = true;
    save.flags.coco_diablito_beaten = true;
    save.beaten.gym_diablito = 1;
    save.flags.hm_salto_pastor = true;
    save.flags.montana_blanca_seen = true;
    save.lastCenter = 'refugio';
    save.lastSchool = 'refugio';
    save.mapId = 'montana_blanca';
    save.playerPos = { ...MONTANA_ENTRY, dir: 'up' };
  } else if (id === 'sendero_telesforo') {
    applyPreset('montana_blanca', starterChoice);
    markEndgameVisited();
    save.mapId = 'sendero_telesforo';
    save.playerPos = { ...SENDERO_ENTRY, dir: 'up' };
  } else if (id === 'cueva_magec') {
    applyPreset('sendero_telesforo', starterChoice);
    // El debug salta directo al final: aquí el jugador YA es el campeón, así que el guardia
    // de la boca tiene que haberse apartado (igual que al vencer a Bencomo de verdad).
    save.flags.campeon_teide = true;
    save.beaten.alto_mando_bencomo = 1;
    save.mapId = 'cueva_magec';
    save.playerPos = { ...CUEVA_ENTRY, dir: 'up' };
  }
}

/**
 * Los checkpoints del final del juego (Alto Mando y cueva) presuponen que el jugador ya ha
 * recorrido toda la isla, incluidos los ramales laterales que la cadena de presets no pisa
 * (El Rosario, Adeje, La Gomera...). Dejamos todos los destinos Binter como visitados.
 */
function markEndgameVisited() {
  for (const d of BINTER_DESTINATIONS) save.flags[d.visited] = true;
  save.flags.rosario_open = true;
  save.flags.guachinche_rosario_beaten = true;
}

export function loadPreset(id: PresetId, starterChoice: StarterId = 'cabra') {
  applyPreset(id, starterChoice);
  touchSave();
}
