import { coastLocation } from './coastGeometry';
import { useEffect, useRef } from 'react';
import { PAL, TILE, SPRITES, drawSprite, drawTile, SOLID, DRIVABLE_TILES, TileId } from './sprites';
import {
  MAPS, MapId, StarterId, StopId, STOPS, PARRANDEROS, SCHOOLS,
  TRUCK_POS, CAYUCO_POS, GALDAR_CAYUCO_POS, OLSEN_POS, CUEVA_DOOR,
  cuevaTableIndex, adjacentCuevaTables, Trigger, GameMap, DIALOGUE, NPC,
} from './maps';
import { input, bindKeyboard, Dir, ui } from './input';
import { CARDS, KEYWORD_TEXT, STARTER_INFO, formatMana, MAX_DECK } from '../battle/cards';
import { canAddToDeck } from '../battle/booster';
import { drawCreature } from './creatureArt';
import {
  BENCOMO, CHINO, LIDER1, RUNNER, ESTUDIANTE, AYOZE, CHAXIRAXI, PARRANDERO,
  CHINIJO, CHINIJA, CONSERJE, CATHAYSA, CATHAYSA_SURF, PEDRO, ENRISCADA, CAYUQUERO,
  CANARION, CAPITAN, MARINERO, COCO_URSULA, GATO_NPC, MAGOMANIACO_SPR, JARDINERO,
  BRUJA_CANARIA, NINA_PERAS, GUAGUERO, REPARTIDOR, DONA_BINTER, MAGO_ROMERO,
  GUIRI_CREMA, SURFERO_PUKAS, LEON_NPC, CREMA_NPC, CASIMIRO,
  drawTram, drawGuachincheTruck, drawCayuco, drawCayucoFeverDream, drawSSOlsen, drawKitchenDoor,
  drawGuaguaTitsa, drawVWCaddy, drawMontanaRoja, drawBinterPlane, drawCarretaRomera, drawRomeriaCutscene,
} from './props';
import { beep, playIsaBeat } from './sfx';
import { spriteText } from './spriteText';
import { save, npcState, touchSave, grantStarterDeck } from './save';
import { TRAINERS } from './trainers';
import { trainerDefeated } from './rewards';
import {
  claimFirstEdition, grantBucio, grantBinterTicket, findCremaFP50, grantPukasBoard, grantVaraPastor,
  certifyFirstEdition, grantNevada, grantUnelco, MAGOMANIACO_OFFER, MERIDIANO_PRIZES, redeemMeridianoPrize,
} from './firstEdition';
import { PARKING_GATE, BERSHKA_ESCALATOR, BERSHKA_POSTER } from './mapsRuta';
import {
  TF1_VEHICLES, MONTANA_ROJA_POS, BINTER_PLANE_POS,
  TF1_ROMERIA_CART_POS, AMER_CARRETA_POS, AMER_GUAGUA_POS, tf1VehicleAt,
} from './mapsTf1';
import type { ParranderoId } from './maps';
import { BINTER_DESTINATIONS } from './binterDestinations';
import { SlotMachineState, createSlotState, updateSlotMachine, drawSlotMachine } from './meridianoSlots';
import { STORY } from './story';
import { CAR_SPRITES } from './vehicle';
import { RUTA } from './ruta';
import { boardWater, vaultable, waveActive, LOOSE_PUKAS } from './safariMoves';
import { NIGHT_TALKS, stickyAt } from './nightRoute';
import { drawCoastDetails, FUCSIA_PALETTE } from './nightArt';
import { LIFT, STORE_FLOORS, worksTile, MAGOS_KEY_1, MAGOS_KEY_2 } from './mapsRosario';
import { buyBeer, canOpenMagosDoor, cocoEncounter, GOURMET, hasMagosKeys, offerBeer } from './rosarioQuest';
import { MAGOS_DOOR } from './mapsRosario';
import { BORONDON_COVE, BORONDON_PRIZE, BORONDON_RETURN, CURBELO_KEY, borondonAboveWater, borondonBankAt, GOMERA_SEA_START, GOMERA_TALKS, gomeraVesselRadius } from './mapsGomera';
import { drawGomeraSea, drawGomeraTown, drawGomeraVessel } from './gomeraArt';
import {
  LA_QUINTA_EXIT, TACO_TF5, TACO_UNDERPASS_VEHICLES, TF5_BINTER_POS, TF5_VEHICLES,
  drawAnchietaBridge, drawCalleTf5BridgeOverpass, drawCalleTf5Ground, drawTacoronteRain,
  drawTf5Vehicle, inTacoronteRain, tacoUnderpassVehicleAt, tf5VehicleAt,
} from './mapsTf5';
import { drawSantaUrsulaDetails, URSULA_DOORS, URSULA_TALKS } from './mapsSantaUrsula';
import { drawRefugioDetails, MONTANA_ENTRY, NARICES_CARD, REFUGIO_TALKS } from './mapsMontanaBlanca';
import { drawSenderoDetails } from './mapsSenderoTelesforo';
import { drawCuevaDetails } from './mapsCuevaMagec';
import { CABLE_ARRIVAL, CABLE_INTRO, CABLE_LOCKED, CABLE_TALKS, drawCableClubDetails, isChampion } from './mapsCableClub';
import { drawOrotavaRally, ORO_ARRIVAL_LINES, RALLY_TIMES, type RallyCutscene } from './orotavaRally';
import {
  DIABLITO_AFTER, DIABLITO_DISCOVERY, DIABLITO_FIRST, DIABLITO_RETRY, DIABLITO_SINGING,
  DIABLITO_TRAINER, discoverDiablito,
} from './santaUrsulaQuest';

const W = 320, H = 288, COLS = 36;
const VIEW_W = 160, VIEW_H = 144;
const GAME_BOY_PALETTE = [...PAL];
const FUCSIA_MAPS: readonly MapId[] = ['las_americas', 'puente_magma', 'veronicas', 'papagayos'];
const TRAM_Y = 5 * TILE;
const DV: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const NPC_SPR: Record<string, string[]> = {
  ...SPRITES,
  chino: CHINO,
  bencomo: BENCOMO,
  lider1: LIDER1,
  runner: RUNNER,
  estudiante: ESTUDIANTE,
  ayoze: AYOZE,
  chaxiraxi: CHAXIRAXI,
  parrandero: PARRANDERO,
  chinijo: CHINIJO,
  chinija: CHINIJA,
  conserje: CONSERJE,
  cathaysa: CATHAYSA,
  cathaysa_surf: CATHAYSA_SURF,
  pedro: PEDRO,
  enriscada: ENRISCADA,
  cayuquero: CAYUQUERO,
  canarion: CANARION,
  capitan: CAPITAN,
  marinero: MARINERO,
  coco_ursula: COCO_URSULA,
  gato_npc: GATO_NPC,
  magomaniaco: MAGOMANIACO_SPR,
  jardinero: JARDINERO,
  bruja_canaria: BRUJA_CANARIA,
  nina_peras: NINA_PERAS,
  guaguero: GUAGUERO,
  repartidor: REPARTIDOR,
  dona_binter: DONA_BINTER,
  mago_romero: MAGO_ROMERO,
  guiri_crema: GUIRI_CREMA,
  surfero_pukas: SURFERO_PUKAS,
  leon_npc: LEON_NPC,
  crema_npc: CREMA_NPC, tabla_pukas: LOOSE_PUKAS,
  casimiro: CASIMIRO,
  malick: GUAGUERO, ibrahima: GUAGUERO, dj_yessica: CATHAYSA,
  luchador: [
    '................', '.....dddddd.....', '....dbbbbbbd....', '...dbaaaaaabd...',
    '...dbadaadabd...', '...dbaaaaaabd...', '....dbaddabd....', '.....ddaadd.....',
    '..dddaaaaaaddd..', '.daaddaaaaddaad.', '.dad.dccccccdad.', '.dd..dccccccd.dd',
    '.....daaaaaad...', '.....daaddaad...', '....daad..daad..', '....dddd..dddd..',
  ],
  obrero: [
    '................', '.....dddddd.....', '....daabbaad....', '...daabbaaaad...',
    '..dddddddddddd..', '....daaaaaad....', '....dadaadad....', '....daaaaacd....',
    '.....dcccad.....', '....ddaaadd.....', '...dacbacbcad...', '..dadcaaaacdad..',
    '..dddcbbbccddd..', '....dcccccd.....', '....dcc.dcd.....', '....ddd.ddd.....',
  ],
};

/** Interiores donde jamas puede entrar ni spawnear el Toyota Landcruiser. */
export const INDOOR_MAPS: readonly MapId[] = [
  'apartment', 'rellano', 'hospital', 'parrandero', 'parrandero_2', 'colegio',
  'ss_olsen', 'cuevas_pintadas', 'meridiano', 'guarida_enriscada',
  'torre_teresitas_1', 'torre_teresitas_2', 'torre_teresitas_3', 'torre_teresitas_4', 'torre_teresitas_5',
  'aeropuerto', 'siam_park', 'puente_magma', 'veronicas', 'papagayos', 'guachinche_rosario',
  'certificador_gomera', 'mansion_curbelo', 'guachinche_curbelo', 'el_diablito',
  ...STORE_FLOORS.map(([id]) => id),
];

const CARNE_FIESTA_MISS = [
  'Levantas el mantel de papel... NADA! Solo una fuente hasta arriba de CARNE FIESTA con papas fritas en dados.',
  'Palpas debajo de la mesa... Te pringaste los dedos de adobo y oregano de CARNE FIESTA! Aqui no hay boton.',
  'Apartas la cuarta de vino... Solo hay mas CARNE FIESTA humeante y servilletas manchadas! Sigue probando.',
];

function rollCuevaSwitches(): [number, number] {
  const s1 = Math.floor(Math.random() * 15);
  const adj = adjacentCuevaTables(s1);
  const s2 = adj[Math.floor(Math.random() * adj.length)];
  return [s1, s2];
}

interface Dialogue {
  pages: string[][];
  page: number;
  chars: number;
  onDone?: () => void;
  choice?: { options: string[]; sel: number; onPick: (i: number) => void; cancellable?: boolean; lastDir?: Dir | null; nextNav?: number };
}

interface Anim {
  from: number;
  to: number;
  t: number;
  dur: number;
  riding: boolean;
  marks: { x: number; lines: string[]; done: boolean }[];
  onDone: () => void;
}

interface CayucoCutscene {
  stage: 'storm' | 'dream' | 'vomit' | 'after';
  t: number;
}

interface RomeriaCutscene {
  stage: 'bucio' | 'isa' | 'arrival';
  t: number;
}

interface GS {
  mapId: MapId;
  px: number; py: number; ox: number; oy: number;
  dir: Dir; moving: boolean; frame: number; hidden: boolean;
  dialogue: Dialogue | null;
  cardView: StarterId | null;
  slots: SlotMachineState | null;
  fade: { t: number; dir: 1 | -1; then?: () => void } | null;
  title: boolean;
  anim: Anim | null;
  tramX: number; tramVisible: boolean;
  camX: number; camY: number;
  chapter: 0 | 1;
  chapterTimer: number;
  cayuco: CayucoCutscene | null;
  romeria: RomeriaCutscene | null;
  rally: RallyCutscene | null;
  cuevaS1: number;
  cuevaS2: number;
  cuevaFirstFound: boolean;
  banner: { name: string; t: number } | null;
  lastZone: string;
}

function wrap(text: string, cols: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > cols) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

function makeDialogue(lines: string[], onDone?: () => void, choice?: Dialogue['choice']): Dialogue {
  const pages: string[][] = [];
  for (const l of lines) {
    const ws = wrap(l, COLS);
    for (let i = 0; i < ws.length; i += 2) pages.push(ws.slice(i, i + 2));
  }
  if (pages.length === 0) pages.push(['']);
  return { pages, page: 0, chars: 0, onDone, choice };
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function resolveTrainerId(npc: NPC): string | undefined {
  if (npc.schoolKid !== undefined) {
    const school = SCHOOLS[save.lastSchool ?? 'sc'] ?? SCHOOLS.sc;
    return school.kids[npc.schoolKid];
  }
  return npc.trainer;
}

interface Props {
  onStarterChosen: (id: StarterId) => void;
  onChallenge: (trainerId: string) => void;
  onOpenPC?: () => void;
  showTitle?: boolean;
  onTitleStart?: () => void;
  resume?: boolean;
  afterBattle?: boolean;
  blackoutLines?: string[] | null;
  postWinLines?: string[] | null;
}

export function GameCanvas({
  onStarterChosen, onChallenge, onOpenPC, showTitle, onTitleStart, resume, afterBattle, blackoutLines, postWinLines,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveDialogue = useRef<HTMLSpanElement>(null);
  const cbRef = useRef({ onStarterChosen, onChallenge, onOpenPC, onTitleStart });
  cbRef.current = { onStarterChosen, onChallenge, onOpenPC, onTitleStart };

  useEffect(() => {
    bindKeyboard();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    if (document.fonts?.load) document.fonts.load('8px "Press Start 2P"').catch(() => undefined);

    const hasProgress = resume || afterBattle || Object.keys(save.flags).length > 0;
    const initMap: MapId = save.mapId ?? 'apartment';
    const initPos = save.playerPos ?? { x: 4, y: 6, dir: 'down' as Dir };
    const [initS1, initS2] = rollCuevaSwitches();

    const g: GS = {
      mapId: initMap,
      px: initPos.x, py: initPos.y, ox: 0, oy: 0,
      dir: initPos.dir, moving: false, frame: 0, hidden: false,
      dialogue: null, cardView: null, slots: null, fade: null,
      title: !!showTitle || !hasProgress,
      anim: null,
      tramX: save.tramStop ? STOPS[save.tramStop].x : 74,
      tramVisible: !!save.tramStop,
      camX: 0, camY: 0,
      chapter: 0, chapterTimer: 0,
      cayuco: null,
      romeria: null,
      rally: null,
      cuevaS1: initS1, cuevaS2: initS2, cuevaFirstFound: false,
      banner: null, lastZone: '',
    };
    save.mapId = g.mapId;
    save.playerPos = { x: g.px, y: g.py, dir: g.dir };

    if (blackoutLines && blackoutLines.length > 0) {
      beep('parranda');
      g.banner = { name: PARRANDEROS[save.lastCenter ?? 'weyler'].name, t: 180 };
      g.dialogue = makeDialogue(blackoutLines);
    } else if (postWinLines && postWinLines.length > 0) {
      beep('fanfare');
      g.dialogue = makeDialogue(postWinLines);
    } else if (afterBattle) {
      if (save.flags.starterChosen && !save.flags.errand) {
        g.dialogue = makeDialogue(DIALOGUE.acaymo_after_battle, () => {
          save.flags.errand = true;
          touchSave();
        });
      } else if (save.flags.magodex && g.mapId === 'hospital') {
        g.dialogue = makeDialogue(['Vuelves al laboratorio. Ayoze sigue en el PC y Bencomo con las cartas.']);
      }
    }

    let borondonVisible = false;
    const map = (): GameMap => MAPS[g.mapId];
    const tileAt = (x: number, y: number): TileId => {
      const m = map();
      if (y < 0 || x < 0 || y >= m.rows.length || x >= m.rows[0].length) return 'wall';
      // Desaparición visual de las llaves magnéticas recogidas:
      if (m.id === 'magos_2' && save.flags.magos_key_1 && x === MAGOS_KEY_1.x && y === MAGOS_KEY_1.y) return 'floor';
      if (m.id === 'magos_4' && save.flags.magos_key_2 && x === MAGOS_KEY_2.x && y === MAGOS_KEY_2.y) return 'floor';
      if (m.id === 'san_borondon' && save.flags.got_nevada_teide && x === BORONDON_PRIZE.x && y === BORONDON_PRIZE.y) return 'floor';
      if (m.id === 'montana_blanca' && save.flags.got_narices_teide && x === NARICES_CARD.x && y === NARICES_CARD.y) return 'floor';
      if (m.id === 'mansion_curbelo' && save.flags.has_curbelo_key && x === CURBELO_KEY.x && y === CURBELO_KEY.y) return 'floor';
      if (m.id === 'veronicas' && borondonVisible && y >= GOMERA_SEA_START) {
        const bankTile = borondonBankAt(x, y);
        if (bankTile) return bankTile;
      }
      const works = worksTile(g.mapId, x, y, !!save.flags.rosario_open);
      if (works) return works;
      if (m.id === 'meridiano' && save.flags.bershka_opened && x === BERSHKA_ESCALATOR.x && y === BERSHKA_ESCALATOR.y) {
        return 'escalator';
      }
      // Al bajar de la Torre de Las Teresitas con el Bucio, se abre la incorporacion oeste a la TF-1!
      if (m.id === 'santacruz_sur' && save.flags.has_bucio && (x === 0 || x === 1) && y >= 8 && y <= 10) {
        return 'road';
      }
      return m.legend[m.rows[y][x]] ?? 'floor';
    };
    const isNpcHidden = (n: NPC, s: { hidden?: boolean }) =>
      !!s.hidden ||
      (n.id === 'coco_ursula' && g.mapId === 'guarida_enriscada' && !!save.flags.coco_meridiano_beaten) ||
      (n.id === 'coco_ursula' && g.mapId === 'magos_azotea' && !!save.flags.coco_beaten) ||
      (n.id === 'enriscada_bershka' && !!save.flags.boliche_4) ||
      (n.id === 'crema_fp50' && !!(save.flags.has_crema_fp50 || save.flags.hm_salto_pastor)) ||
      (n.id === 'pukas_perdida' && (!save.flags.pukas_dropped || !!save.flags.pukas_recovered || !!save.flags.hm_pukas)) ||
      // Alto Mando: cada mencey vencido se aparta del paso. Bencomo se queda para hablar con el campeón.
      (n.id.startsWith('alto_mando_') && n.id !== 'alto_mando_bencomo' && !!n.trainer && trainerDefeated(save, n.trainer)) ||
      // Guardia de la cueva: se aparta ante el campeón del Alto Mando (flag o Bencomo vencido, por partidas anteriores).
      (n.id === 'guardia_cueva' && (!!save.flags.campeon_teide || trainerDefeated(save, 'alto_mando_bencomo'))) ||
      // Magec desaparece de la cueva tras ser vencido.
      (n.id === 'magec' && !!save.flags.magec_beaten);
    const npcHere = (x: number, y: number) => {
      for (const n of map().npcs) {
        const s = npcState(n);
        if (s.y === y && Math.abs(s.x - x) <= gomeraVesselRadius(n.sprite) && !isNpcHidden(n, s)) return { n, s };
      }
      return null;
    };
    const tramBlocks = (x: number, y: number) => {
      if (!g.tramVisible || g.anim || !save.tramStop || g.mapId !== 'calle') return false;
      const sx = STOPS[save.tramStop].x;
      return (y === 5 || y === 6) && x >= sx && x <= sx + 3 && x !== sx + 1;
    };
    const truckBlocks = (x: number, y: number) => {
      if (g.mapId !== 'subida') return false;
      return x >= TRUCK_POS.x && x < TRUCK_POS.x + TRUCK_POS.w && y >= TRUCK_POS.y && y < TRUCK_POS.y + TRUCK_POS.h;
    };
    const cayucoBlocks = (x: number, y: number) => {
      if (g.mapId === 'anaga') {
        return x >= CAYUCO_POS.x && x < CAYUCO_POS.x + CAYUCO_POS.w && y >= CAYUCO_POS.y && y < CAYUCO_POS.y + CAYUCO_POS.h;
      }
      if (g.mapId === 'galdar') {
        return x >= GALDAR_CAYUCO_POS.x && x < GALDAR_CAYUCO_POS.x + GALDAR_CAYUCO_POS.w && y >= GALDAR_CAYUCO_POS.y && y < GALDAR_CAYUCO_POS.y + GALDAR_CAYUCO_POS.h;
      }
      return false;
    };
    const olsenSailed = () => !!(save.flags.olsen_sailed || save.flags.olsen_benijo);
    const olsenBlocks = (x: number, y: number) => {
      if (g.mapId !== 'galdar' || olsenSailed()) return false;
      if (x === OLSEN_POS.gangwayX && y === OLSEN_POS.gangwayY) return false;
      return x >= OLSEN_POS.x && x < OLSEN_POS.x + OLSEN_POS.w && y >= OLSEN_POS.y && y < OLSEN_POS.y + OLSEN_POS.h;
    };
    const kdoorBlocks = (x: number, y: number) => {
      if (g.mapId !== 'cuevas_pintadas' || save.flags.cueva_door_open) return false;
      return y === CUEVA_DOOR.y && x >= CUEVA_DOOR.x && x < CUEVA_DOOR.x + CUEVA_DOOR.w;
    };
    const tf1PropBlocks = (x: number, y: number) => {
      if (g.mapId === 'las_americas') {
        if (x >= AMER_CARRETA_POS.x && x < AMER_CARRETA_POS.x + AMER_CARRETA_POS.w && y >= AMER_CARRETA_POS.y && y < AMER_CARRETA_POS.y + AMER_CARRETA_POS.h) return true;
        if (x >= AMER_GUAGUA_POS.x && x < AMER_GUAGUA_POS.x + AMER_GUAGUA_POS.w && y >= AMER_GUAGUA_POS.y && y < AMER_GUAGUA_POS.y + AMER_GUAGUA_POS.h) return true;
        return false;
      }
      if (g.mapId === 'tf5') {
        if (tf5VehicleAt(x, y)) return true;
        if (x >= TF5_BINTER_POS.x && x < TF5_BINTER_POS.x + TF5_BINTER_POS.w && y >= TF5_BINTER_POS.y && y < TF5_BINTER_POS.y + TF5_BINTER_POS.h) return true;
        return false;
      }
      if (g.mapId !== 'tf1') return false;
      if (tf1VehicleAt(x, y)) return true;
      if (x >= TF1_ROMERIA_CART_POS.x && x < TF1_ROMERIA_CART_POS.x + TF1_ROMERIA_CART_POS.w && y >= TF1_ROMERIA_CART_POS.y && y < TF1_ROMERIA_CART_POS.y + TF1_ROMERIA_CART_POS.h) return true;
      if (x >= MONTANA_ROJA_POS.x && x < MONTANA_ROJA_POS.x + MONTANA_ROJA_POS.w && y >= MONTANA_ROJA_POS.y && y < MONTANA_ROJA_POS.y + MONTANA_ROJA_POS.h) return true;
      if (x >= BINTER_PLANE_POS.x && x < BINTER_PLANE_POS.x + BINTER_PLANE_POS.w && y >= BINTER_PLANE_POS.y && y < BINTER_PLANE_POS.y + BINTER_PLANE_POS.h) return true;
      return false;
    };
    // Dos alturas en `calle`: cuando vas por la TF-5 pasas POR DEBAJO del Puente de Taco (y=4..8) y del tranvia.
    const onTf5Underpass = () => g.mapId === 'calle' && !!save.flags.tf5_underpass;
    // Coche (M.O. 1 Todo Terreno): SOLO circula por asfalto/parking/baches + la barrera del Palmetum + paso inferior TF-5.
    // Prohibido pisar playas, aceras, plazas, cesped, senderos, puertas o interiores.
    const carOut = () => !!save.flags.car_out && !INDOOR_MAPS.includes(g.mapId);
    const isParkingGate = (x: number, y: number) =>
      g.mapId === 'santacruz_sur' && PARKING_GATE.some((p) => p.x === x && p.y === y);
    const carCanPass = (x: number, y: number) => {
      if (!carOut()) return false;
      const t = tileAt(x, y);
      return t === 'pothole' || (t === 'fence' && isParkingGate(x, y));
    };
    const carBlocks = (x: number, y: number) => {
      if (!carOut()) return false;
      return !DRIVABLE_TILES.has(tileAt(x, y)) && !isParkingGate(x, y);
    };
    const gum = (x: number, y: number) => g.mapId === 'papagayos' && stickyAt(x, y, !!save.flags.boliche_5);
    let lastSquish = -100;
    let waveTick = 0;
    let radarFlash = 0;
    let hop: {dx:number;dy:number;t:number} | null = null;
    const water=(x:number,y:number)=>boardWater(g.mapId,tileAt(x,y),x,y);
    const solid = (x: number, y: number) => {
      if (onTf5Underpass()) {
        // Cota 0 (TF-5 hundida en Taco): muros de contencion en x=21 y x=26; libre bajo el puente y el tranvia.
        if (y < 0 || y >= map().rows.length || x < TACO_TF5.left || x > TACO_TF5.right) return true;
        return !!tacoUnderpassVehicleAt(x, y);
      }
      return gum(x, y) || (SOLID[tileAt(x, y)] && !carCanPass(x, y) && !(save.flags.pukas_out && save.flags.hm_pukas && water(x,y))) || carBlocks(x, y) || !!npcHere(x, y) || tramBlocks(x, y) || truckBlocks(x, y) || cayucoBlocks(x, y) || olsenBlocks(x, y) || kdoorBlocks(x, y) || tf1PropBlocks(x, y);
    };

    const say = (lines: string[], onDone?: () => void) => { g.dialogue = makeDialogue(lines, onDone); };
    const ask = (lines: string[], options: string[], onPick: (i: number) => void, cancellable = false) => {
      g.dialogue = makeDialogue(lines, undefined, { options, sel: 0, onPick, cancellable });
    };
    const showZone = (name: string) => {
      if (g.lastZone === name) return;
      g.lastZone = name;
      g.banner = { name, t: 150 };
    };

    const certifyGomeraCards = () => {
      const certified = certifyFirstEdition(save);
      if (certified.length) {
        touchSave();
        beep('fanfare');
        say(['CASIMIRO CURBELO: Colón estuvo aquí. Ahora déjame revisar esas cartas antiguas.',
          `CERTIFICADAS: ${certified.map(id => CARDS[id].name).join(', ')}. Son legales para jugar.`,
          'CASIMIRO CURBELO: Las cartas siguen donde estaban. En el PC de Ayoze puedes pasarlas al mazo.']);
      } else if ([...save.deck, ...save.pc].some(id => CARDS[id]?.firstEdition)) {
        say(['CASIMIRO CURBELO: Colón estuvo aquí. Ya he certificado todas las cartas antiguas que llevas.',
          'CASIMIRO CURBELO: Si encuentras otra edición antigua, vuelve y se la sello también.']);
      } else {
        say(['CASIMIRO CURBELO: Colón estuvo aquí. Yo certifico gratis las cartas de ediciones antiguas que tengas en el mazo o en el PC.',
          'CASIMIRO CURBELO: Ahora no traes ninguna. Vuelve cuando encuentres una.']);
      }
    };

    // La cutscene siempre termina en Montaña Blanca, en la base de la subida.
    const finishRally = () => {
      g.fade = {
        t: 0, dir: 1, then: () => {
          g.rally = null;
          g.mapId = 'montana_blanca';
          g.px = MONTANA_ENTRY.x; g.py = MONTANA_ENTRY.y; g.dir = 'up';
          g.ox = 0; g.oy = 0; g.moving = false; g.lastZone = '';
          save.mapId = g.mapId;
          save.playerPos = { x: g.px, y: g.py, dir: g.dir };
          touchSave();
          g.fade = { t: 1, dir: -1 };
        },
      };
    };

    const enterMap = (to: MapId, x: number, y: number, dir: Dir, afterArrive?: () => void, underpass = false) => {
      g.fade = {
        t: 0, dir: 1, then: () => {
          const ridingBoard = save.flags.pukas_out || (g.mapId === 'san_borondon' && to === 'veronicas');
          g.mapId = to; g.px = x; g.py = y; g.ox = 0; g.oy = 0; g.moving = false; g.dir = dir;
          g.lastZone = '';
          // Los saltos entre mapas no tiran de la tabla si la llegada sigue siendo agua.
          const landTile = MAPS[to].legend[MAPS[to].rows[y]?.[x] ?? ''] ?? 'floor';
          save.mapId = to;
          save.flags.tf5_underpass = !!(to === 'calle' && underpass);
          if (save.flags.tf5_underpass) save.flags.car_out = true;
          save.flags.pukas_out = !!(save.flags.hm_pukas && ridingBoard && boardWater(to, landTile, x, y));
          // Si entras a un interior o desembarcas sobre arena/acera, el coche queda guardado en la mochila
          if (save.flags.car_out && !save.flags.tf5_underpass && (INDOOR_MAPS.includes(to) || !DRIVABLE_TILES.has(landTile))) {
            save.flags.car_out = false;
          }
          save.playerPos = { x, y, dir };
          touchSave();
          g.fade = { t: 1, dir: -1 };
          if (to === 'certificador_gomera') {
            save.flags.visited_certificador_gomera = true;
            certifyGomeraCards();
            return;
          }
          if (afterArrive) {
            save.flags['visited_' + to] = true;
            touchSave();
            afterArrive();
            return;
          }
          const key = 'visited_' + to;
          if (!save.flags[key]) {
            save.flags[key] = true;
            touchSave();
            const ol = MAPS[to].onEnter;
            if (ol) say(ol);
          }
        },
      };
    };

    // Una victoria contra un guardia de la torre despeja automaticamente la escalera siguiente.
    if (save.flags.tower_advance_pending) {
      save.flags.tower_advance_pending = false;
      touchSave();
      const floorMatch = /^torre_teresitas_([1-4])$/.exec(g.mapId);
      if (floorMatch) {
        const nextFloor = Number(floorMatch[1]) + 1;
        enterMap(`torre_teresitas_${nextFloor}` as MapId, 9, 12, 'down');
      }
    }

    // ---------- Tranvia ----------
    const arriveAt = (stop: StopId, then: () => void) => {
      g.tramVisible = true;
      const startX = stop === 'weyler' ? 72 : 28;
      g.tramX = startX;
      g.anim = {
        from: startX, to: STOPS[stop].x, t: 0, dur: 95, riding: false, marks: [],
        onDone: () => {
          save.tramStop = stop;
          g.tramX = STOPS[stop].x;
          then();
        },
      };
    };

    const rideTo = (dest: StopId) => {
      const from = STOPS[save.tramStop ?? 'weyler'].x;
      const to = STOPS[dest].x;
      g.hidden = true;
      g.tramVisible = true;
      g.tramX = from;
      beep('open');
      g.anim = {
        from, to, t: 0, dur: Math.abs(to - from) * 8, riding: true,
        marks: [{
          x: 49, done: false,
          lines: dest === 'candelaria'
            ? ['Tin-ton! Subiendo pal oeste: Cruz del Senor... Principes de Espana...', 'Proxima parada: HOSPITAL LA CANDELARIA (antes del puente de la TF-5 y Taco).']
            : ['Tin-ton! Bajando pal este hacia PLAZA WEYLER.'],
        }],
        onDone: () => {
          save.tramStop = dest;
          g.tramX = to;
          g.hidden = false;
          g.px = to + 1; g.py = 7; g.ox = 0; g.oy = 0; g.dir = 'down'; g.moving = false;
          save.playerPos = { x: g.px, y: g.py, dir: g.dir };
          touchSave();
          showZone(STOPS[dest].name);
          say([
            `Parada: ${STOPS[dest].name}.`,
            dest === 'candelaria'
              ? 'Cruza la acera hacia el norte para entrar al Hospital de La Candelaria.'
              : 'Estas en Plaza Weyler. La calle Ramon y Cajal sube al NORTE justo aqui al lado.',
          ]);
        },
      };
    };

    const boardTram = (from: StopId, to: StopId) => {
      if (g.anim) return;
      if (save.tramStop === from) { rideTo(to); return; }
      arriveAt(from, () => {
        say([`Llega el tranvia Linea 1 a ${STOPS[from].name}. Subes al vagon.`], () => rideTo(to));
      });
    };

    // ---------- Fever Dream del Cayuco (Benijo -> Muelle de Galdar) ----------
    const startCayucoFeverDream = () => {
      g.fade = {
        t: 0, dir: 1, then: () => {
          beep('motor');
          g.cayuco = { stage: 'storm', t: 0 };
          g.fade = { t: 1, dir: -1 };
        },
      };
    };

    // ---------- Cutscene de la Romeria con Isa Canaria (TF-1 -> Estacion de Las Americas) ----------
    const startRomeriaCutscene = () => {
      save.flags.reached_adeje_gate = true;
      save.flags.car_out = false;
      touchSave();
      g.fade = {
        t: 0, dir: 1, then: () => {
          beep('bucio');
          g.romeria = { stage: 'bucio', t: 0 };
          g.fade = { t: 1, dir: -1 };
        },
      };
    };

    const handleRomeriaBlockade = () => {
      save.flags.reached_adeje_gate = true;
      touchSave();
      if (save.flags.romeria_done) {
        ask(STORY.romeria_already_done, ['IR A LAS AMERICAS', 'REPETIR LA ISA!', 'QUEDARME'], (i) => {
          if (i === 0) enterMap('las_americas', 9, 9, 'left');
          else if (i === 1) startRomeriaCutscene();
        });
        return;
      }
      if (!save.flags.has_bucio) {
        say(STORY.tf1_adeje_wip);
        return;
      }
      ask(STORY.romeria_prompt, ['TOCAR EL BUCIO Y UNIRSE!', 'ESPERAR'], (i) => {
        if (i === 1) { say(STORY.romeria_wait); return; }
        startRomeriaCutscene();
      });
    };

    // ---------- Eventos de la Zona Safari (Siam Park) ----------
    const handlePickupCrema = () => {
      if (findCremaFP50(save)) {
        touchSave();
        beep('open');
        showZone('CREMA SOLAR FP50!');
        say(STORY.siam_crema_pickup);
      }
    };

    const handleSiamGuiriDave = () => {
      if (save.flags.hm_salto_pastor) {
        say(STORY.siam_guiri_done);
      } else if (grantVaraPastor(save)) {
        touchSave();
        beep('fanfare');
        showZone('M.O. 4 · SALTO DEL PASTOR!');
        say(STORY.siam_guiri_reward);
      } else {
        say(save.flags.saw_guiri_crema ? STORY.siam_guiri_waiting : STORY.siam_guiri_quest_prompt, () => {
          save.flags.saw_guiri_crema = true;
          touchSave();
        });
      }
    };

    const handleWavePoolPukas = () => {
      if (save.flags.hm_pukas) { say(STORY.siam_pukas_after); return; }
      if (save.flags.pukas_recovered) {
        ask(['Le tiendes la tabla a Borja. —¿Esta es tuya, no?'], ['DEVOLVER LA TABLA', 'UN MOMENTO'], i=>{
          if(i!==0||!grantPukasBoard(save))return;
          touchSave();beep('fanfare');showZone('M.O. 3 · PUKAS');
          say(['BORJA: ¿Tú has visto ese reflejo? Yo me voy a merendar. Quédatela, mi niño. ¡La Pukas es tuya!', 'M.O. 3 · PUKAS (SURF). Mira al agua y úsala desde la Mochila. Para bajarte, vuelve a tierra.']);
        });
      } else if(save.flags.pukas_dropped) say(['BORJA: ¡La tabla! Está en la orilla, a la izquierda del cartel. ¿Me la acercas?']);
      else say(['BORJA: Ahora está en calma. Quédate junto a la orilla: en unos segundos suena la sirena y entra la serie.']);
    };

    // ---------- Reto a entrenadores, ninos de colegio y lideres de gimnasio ----------
    const promptDuel = (trainerId: string, taunt?: string[]) => {
      const tr = TRAINERS[trainerId];
      if (!tr) return;
      if (trainerDefeated(save, tr.id)) {
        if (tr.id === 'magomaniaco') {
          if (save.flags.first_ed_claimed) say(STORY.magomaniaco_after);
          else offerFirstEdition();
          return;
        }
        if (tr.id === 'gym_papagayos') { say(['YÉSSICA: El Boliche de la Chola ya es tuyo. ¡La próxima sesión te toca pinchar a ti!']); return; }
        if (tr.id === 'gym_palmetum') say(STORY.palmetum_after);
        else if (tr.id === 'coco_santa_ursula') say(g.mapId === 'guarida_enriscada' ? STORY.coco_meridiano_after : STORY.magos_coco_after);
        else if (tr.id === 'mago_americas') say(STORY.mago_americas_after);
        else if (tr.id === 'gym_ull') say(DIALOGUE.domingo_post);
        else if (tr.id === 'gym_taganana') say(DIALOGUE.cathaysa_after_gym);
        else if (tr.id === 'gym_galdar') say(DIALOGUE.bentejui_post);
        else if (tr.id === 'gym_curbelo') say(['CASIMIRO CURBELO: El Boliche de Colón es tuyo. Colón estuvo aquí, pero no me ganó a las cartas.']);
        else if (tr.id === DIABLITO_TRAINER) say(DIABLITO_AFTER);
        else if (tr.id === 'terrero_rosario') say(['CHO JUAN: Ya me ganaste. Y sigue sin haber boliche: pregunta en Bencomo por qué no estamos en su lista.']);
        else if (tr.id === 'alto_mando_bencomo') say(['MENCEY BENCOMO: Ya eres el campeón del Alto Mando. Tu mazo ya está en el HALL DE LA FAMA, chacho.']);
        else say([`${tr.name}: Ya me ganaste, chacho. Busca otro entrenador (o cuelate en un colegio)!`]);
        return;
      }
      if (!save.flags.starterChosen || save.deck.length === 0) {
        say([`${tr.name}: Chacho, vas con las manos vacias! Ve antes a La Candelaria a por tu mazo inicial.`]);
        return;
      }
      if (tr.id === 'gym_ull') {
        save.flags.reached_ull = true;
        touchSave();
      }
      const ruleNote = tr.gym
        ? `DUELO DE GIMNASIO #${tr.gym}: si ganas te llevas el ${tr.bolicheName}, ${tr.purse} duros y 1 carta de 5.`
        : tr.repeatable
        ? `RECREO REPETIBLE: si ganas cobras ${tr.purse} duros y eliges 1 de 5 cartas (puedes repetir siempre!).`
        : tr.id === 'magomaniaco'
        ? 'Si ganas, te ofrece UNA carta de 1a edicion de las dos que saco de las cenizas. Sin certificar no se juega.'
        : 'Si ganas, eliges UNA de las cinco cartas del sobre.';
      const baseLines = [...(taunt ?? tr.taunt), ruleNote];
      const lines = save.duros === 0
        ? [...baseLines, '(Vas sin un duro: peleas SIN RIESGO! Si ganas cobras igual; si pierdes, al Centro Parrandero.)']
        : baseLines;
      const optFight = tr.gym
        ? (save.duros === 0 ? `RETAR GYM #${tr.gym} (0D)` : `RETAR GYM #${tr.gym}`)
        : save.duros === 0
        ? 'LUCHAR (SIN RIESGO)'
        : save.duros < tr.purse
        ? `LUCHAR (JUEGAS ${save.duros}D)`
        : `LUCHAR (${tr.purse} DUROS)`;
      ask(lines, [optFight, 'AHORA NO'], (i) => {
        if (i === 1) {
          say([tr.id === 'gym_curbelo' || tr.id.startsWith('cole7_')
            ? `${tr.name}: Aquí te espero. Colón estuvo aquí, por si no te lo habían dicho.`
            : `${tr.name}: Aqui te espero, chacho!`]);
          return;
        }
        cbRef.current.onChallenge(tr.id);
      });
    };

    // ---------- NPCs y misiones ----------
    const giveMagodex = () => {
      save.flags.magodex = true;
      save.flags.ruta = true;
      touchSave();
      say(DIALOGUE.bencomo_arrival, () => {
        beep('fanfare');
        g.chapter = 1;
        g.chapterTimer = 300;
        touchSave();
      });
    };

    const rescueCathaysa = (lines: string[]) => {
      beep('fanfare');
      say(lines, () => {
        save.flags.cathaysa_rescued = true;
        save.npcs.cathaysa_surf = { x: 60, y: 3, hidden: true };
        save.npcs.cathaysa_gym = { x: 44, y: 6, hidden: false };
        save.npcs.pedro = { x: 42, y: 7, hidden: false };
        touchSave();
        showZone('GYM #2 ABIERTO EN TAGANANA');
      });
    };

    const talkToCrew = () => {
      if (save.flags.rosario_open) { say(['OBRERO: Las dos entradas están abiertas, mi niño. El pueblo queda al este.']); return; }
      if (!save.flags.met_rosario_workers) { save.flags.met_rosario_workers = true; touchSave(); }
      const bag = GOURMET.filter(({ id }) => (save.beers[id] ?? 0) > 0);
      if (!bag.length) {
        say(['OBRERO: Estamos en el descanso. ¿Nos traes una cerveza de aquí? En la azotea de El Corte Inglés de Tres de Mayo las venden.',
          'OBRERO: Una Dorada, una Tacoa o una Tierra de Perros. Con una nos vale. Avisamos también a la otra cuadrilla.']);
        return;
      }
      ask(['OBRERO: ¿Qué cerveza nos traes?'], [...bag.map(b => `${b.name.toUpperCase()} x${save.beers[b.id]}`), 'AHORA NO'], i => {
        const beer = bag[i]; if (!beer) return;
        const result = offerBeer(save, beer.id);
        if (result === 'refused') {
          say([`OBRERO: ¿${beer.name}? No, esa guárdatela. Nosotros somos de Dorada, Tacoa o Tierra de Perros.`, 'Te devuelve la botella. Las vallas siguen puestas.']);
        } else if (result === 'accepted') {
          touchSave(); beep('open');
          say([`Entregas una ${beer.name}. El capataz aparta la valla y coge la radio.`,
            'CAPATAZ: Barranco Hondo y Taco, abrimos los dos pasos. ¡Tira pa El Rosario!']);
        }
      }, true);
    };

    const npcTalk = (npc: NPC) => {
      const id = npc.id;
      const f = save.flags;
      if (id.startsWith('cuadrilla_')) { talkToCrew(); return; }
      if (id === 'coco_diablito') {
        if (trainerDefeated(save, DIABLITO_TRAINER)) { say(DIABLITO_AFTER); return; }
        const lines = f.coco_diablito_seen ? DIABLITO_RETRY : DIABLITO_FIRST;
        f.coco_diablito_seen = true;
        touchSave();
        promptDuel(DIABLITO_TRAINER, lines);
        return;
      }
      if (id === 'coco_ursula') {
        const encounter = cocoEncounter(g.mapId, save.flags);
        if (!encounter) return;
        const meridiano = g.mapId === 'guarida_enriscada';
        const seenFlag = meridiano ? 'coco_meridiano_seen' : 'coco_magos_seen';
        const lines = meridiano
          ? (encounter === 'first' ? STORY.coco_meridiano_first : STORY.coco_meridiano_again)
          : (encounter === 'first' ? STORY.coco_magos_first : STORY.coco_magos_again);
        if (encounter === 'first') { f[seenFlag] = true; touchSave(); }
        promptDuel('coco_santa_ursula', lines);
        return;
      }
      if (id === 'ricardo_garcia') {
        if (f.coco_beaten) { say(STORY.ricardo_chat); return; }
        if (f.ricardo_spoken) { say(STORY.ricardo_waiting); return; }
        f.ricardo_spoken = true; touchSave();
        say(STORY.magos_ricardo);
        return;
      }

      if (id === 'yeray') {
        if (!f.talkedYeray) {
          f.talkedYeray = true;
          say(DIALOGUE.yeray_first, () => {
            const cur = npcState(MAPS.rellano.npcs[0]);
            save.npcs.yeray = { x: cur.x, y: cur.y, hidden: true };
            touchSave();
          });
        } else say(DIALOGUE.yeray_again);
        return;
      }
      if (id === 'acaymo') {
        if (!f.starterChosen) { say(DIALOGUE.acaymo_intro); return; }
        if (!f.errand) {
          say(DIALOGUE.acaymo_after_battle, () => { f.errand = true; touchSave(); });
          return;
        }
        if (!f.parcel) { say(DIALOGUE.acaymo_pending); return; }
        if (!f.delivered) {
          f.delivered = true;
          const ac = npcState(MAPS.hospital.npcs[0]);
          say(DIALOGUE.acaymo_delivery, () => {
            save.npcs.acaymo = { x: ac.x, y: ac.y, hidden: true };
            const bn = MAPS.hospital.npcs.find((n) => n.id === 'bencomo')!;
            save.npcs.bencomo = { x: bn.x, y: bn.y, hidden: false };
            touchSave();
            giveMagodex();
          });
        }
        return;
      }
      if (id === 'bencomo') {
        if (!f.magodex) giveMagodex();
        else say(DIALOGUE.bencomo_again);
        return;
      }
      if (id === 'chaxiraxi') {
        beep('parranda');
        const cName = PARRANDEROS[save.lastCenter ?? 'weyler'].name;
        say([`[${cName}]`, ...DIALOGUE.chaxiraxi_heal,
          ...(save.lastCenter === 'gomera' ? ['CHAXIRAXI: Y sí, mi niño, Colón estuvo aquí. Los Casimiros no me dejan olvidarlo.'] : [])]);
        return;
      }
      if (id === 'tio_suso') {
        say(save.lastCenter === 'gomera' ? ['CASIMIRO CURBELO: Colón estuvo aquí. Chaxiraxi le habría planchado las cartas también.'] : DIALOGUE.tio_suso);
        return;
      }
      if (id === 'conserje') {
        const sc = SCHOOLS[save.lastSchool ?? 'sc'] ?? SCHOOLS.sc;
        say([`[${sc.name}]`, ...sc.conserje]);
        return;
      }
      if (id === 'ayoze') {
        if (!f.pcIntro) { f.pcIntro = true; touchSave(); say(DIALOGUE.ayoze_first); }
        else say(DIALOGUE.ayoze_again);
        return;
      }
      if (id === 'chino') {
        if (!f.errand) say(DIALOGUE.chino_none);
        else if (!f.parcel) { f.parcel = true; beep('fanfare'); say(DIALOGUE.chino_give); touchSave(); }
        else say(DIALOGUE.chino_have);
        return;
      }
      if (id === 'pedro') {
        say(f.cathaysa_rescued ? DIALOGUE.pedro_after : DIALOGUE.pedro_closed);
        return;
      }
      if (id === 'cathaysa_surf') {
        ask(DIALOGUE.cathaysa_surf_prompt, ['TIRAR DEL CABO', 'AVISAR DE PEDRO!'], (i) => {
          rescueCathaysa(i === 0 ? DIALOGUE.cathaysa_rescue_rope : DIALOGUE.cathaysa_rescue_papas);
        });
        return;
      }
      if (id === 'enriscada_1') { say(DIALOGUE.enriscada_1); return; }
      if (id === 'enriscada_2') { say(DIALOGUE.enriscada_2); return; }
      if (id === 'carmelo') {
        if (!f.boliche_2) {
          say(DIALOGUE.carmelo_wait);
          return;
        }
        if (f.cayuco_done) {
          ask(['CARMELO: Quieres cruzar otra vez al muelle de GALDAR en el cayuco?'], ['CRUZAR A GALDAR', 'QUEDARME EN BENIJO'], (i) => {
            if (i === 1) return;
            beep('motor');
            save.lastCenter = 'galdar';
            enterMap('galdar', 13, 50, 'up');
          });
          return;
        }
        ask(DIALOGUE.carmelo_offer, ['SUBIR AL CAYUCO', 'ESPERAR EN TIERRA'], (i) => {
          if (i === 1) { say(['CARMELO: Normal que te lo pienses, mi nino. Aqui sigo amarrado en Benijo!']); return; }
          startCayucoFeverDream();
        });
        return;
      }
      const openMeridianoPrizes = () => {
        const opts = [...MERIDIANO_PRIZES.map((p) => p.label), 'NADA, GRACIAS'];
        ask(
          [`CAJERA: Canje de Tickets Fast-Fashion (llevas ${save.duros}D)! Estos Magomones NO encogen al lavarlos:`],
          opts,
          (i) => {
            if (i >= MERIDIANO_PRIZES.length) return;
            const res = redeemMeridianoPrize(save, i);
            if (!res.ok) { beep('bump'); say([res.error]); return; }
            touchSave();
            beep('fanfare');
            const cname = CARDS[res.cardId].name;
            say([`Canjeas ${cname} por ${res.cost} duros! Guardada en ${res.destination === 'deck' ? 'tu MAZO' : 'el PC de Ayoze'}.`]);
          },
        );
      };

      if (id === 'carmelo_galdar') {
        const defaultBack = f.boliche_3 && !f.hm_todo_terreno;
        const opts = defaultBack ? ['VOLVER A BENIJO', 'QUEDARME EN GALDAR'] : ['QUEDARME EN GALDAR', 'VOLVER A BENIJO'];
        ask(['CARMELO: El S.S. Olsen se largo y mi fueraborda sigue vivo! Volvemos a BENIJO en cayuco?'], opts, (i) => {
          const goBack = defaultBack ? i === 0 : i === 1;
          if (!goBack) return;
          beep('motor');
          save.lastCenter = 'taganana';
          const grantHM = !!(f.boliche_3 && !f.hm_todo_terreno);
          enterMap('anaga', 71, 5, 'down', grantHM ? () => {
            save.flags.hm_todo_terreno = true;
            touchSave();
            beep('fanfare');
            showZone('M.O. 1 · TODO TERRENO');
            say(STORY.m_o_granted);
          } : undefined);
        });
        return;
      }
      if (id === 'portero_cuevas') {
        if (!f.got_translator) {
          f.heard_canarion = true;
          touchSave();
          say(DIALOGUE.canarion_closed);
        } else {
          say(DIALOGUE.canarion_open);
        }
        return;
      }
      if (id === 'oficial_olsen') {
        if (olsenSailed()) say(STORY.olsen_gone);
        else say(f.heard_canarion ? DIALOGUE.oficial_olsen_open : DIALOGUE.oficial_olsen_closed);
        return;
      }
      if (id === 'capitan_olsen') {
        if (!f.got_translator) {
          f.got_translator = true;
          save.npcs.portero_cuevas = { x: 20, y: 5, hidden: false };
          touchSave();
          beep('fanfare');
          say(DIALOGUE.capitan_mareado);
        } else {
          say(DIALOGUE.capitan_curado);
        }
        return;
      }
      if (id === 'enriscada_bershka') {
        f.saw_enriscada_bershka = true;
        touchSave();
        say(STORY.enriscada_bershka);
        return;
      }
      if (id === 'dependienta_bershka') {
        say(f.boliche_4 ? STORY.meridiano_shopper_hint_after : STORY.meridiano_shopper_hint_before);
        return;
      }
      if (id === 'cajera_meridiano') {
        openMeridianoPrizes();
        return;
      }
      if (id === 'sanandres_vecina') {
        say(f.has_cazafantasmas ? STORY.sanandres_vecina_ghost : STORY.sanandres_vecina);
        return;
      }
      if (id === 'bruja_teresitas') {
        if (!f.has_bucio) {
          grantBucio(save);
          touchSave();
          beep('fanfare');
          showZone('BUCIO · TF-1 ABIERTA!');
          say(STORY.tower_bruja);
        } else {
          say(STORY.tower_bruja_after);
        }
        return;
      }
      if (id === 'dona_binter') {
        if (!f.hm_binter) {
          grantBinterTicket(save);
          touchSave();
          beep('fanfare');
          showZone('M.O. 2 · TARIFA BINTER');
          say(STORY.dona_binter_give);
        } else {
          say(STORY.dona_binter_after);
        }
        return;
      }
      if (id === 'guiri_dave') {
        handleSiamGuiriDave();
        return;
      }
      if (id === 'crema_fp50') {
        handlePickupCrema();
        return;
      }
      if (id === 'pukas_perdida') {
        if(save.flags.pukas_dropped && !save.flags.hm_pukas && !save.flags.pukas_recovered){
          save.flags.pukas_recovered=true;touchSave();beep('open');say(['Recoges la Pukas entre la espuma. Borja, el pibe de la orilla, te hace señas.']);
        }return;
      }
      if (id === 'surfero_borja') {
        handleWavePoolPukas();
        return;
      }
      if (id === 'taquillero_siam') {
        say(STORY.siam_gate);
        return;
      }
      if (id === 'leon_siam_1' || id === 'leon_siam_2') {
        beep('talk');
        say(['LEON MARINO: "¡¡Auuuuf, auuuuf!!" (Aplaude con las aletas esperando que le tires una sardina o una carta de charco).']);
        return;
      }
      if (id === 'curbelo_certificador') { certifyGomeraCards(); return; }

      // Entrenadores de calle, ninos repetibles de colegio, lideres de gimnasio y El Coco
      const trainerId = resolveTrainerId(npc);
      if (trainerId) {
        promptDuel(trainerId);
        return;
      }

      const ambient: Record<string, string[]> = {
        ...NIGHT_TALKS,
        ...GOMERA_TALKS,
        ...URSULA_TALKS,
        ...REFUGIO_TALKS,
        ...CABLE_TALKS,
        vecino_rc: DIALOGUE.vecino_rc,
        est_ull: DIALOGUE.est_ull,
        vecina_mercedes: DIALOGUE.vecina_mercedes,
        guardia_cueva: [
          'GUARDIA: Alto ahí. La boca de la cueva del Llano no se abre para cualquiera.',
          'GUARDIA: Solo el CAMPEÓN del Alto Mando puede entrar. Vence a los cinco menceyes del Sendero Telesforo Bravo y vuelve.',
          'GUARDIA: Mientras tanto, ni el salto del pastor te salva: aquí mando yo.',
        ],
        abuela_taganana: DIALOGUE.abuela_taganana,
        viajero_frio: DIALOGUE.viajero_frio,
        arqueologo_cueva: DIALOGUE.arqueologo_cueva,
        sanandres_pescador: STORY.sanandres_pescador,
        guardia_parking: STORY.parking_guard,
        clienta_meridiano: STORY.meridiano_shopper_1,
        pibe_meridiano: STORY.meridiano_shopper_2,
        don_michi_npc: STORY.don_michi_npc,
        azafata_binter: STORY.azafata_binter,
        guiri_aeropuerto: STORY.guiri_aeropuerto,
        romera_americas: STORY.romera_americas,
        timplista_americas: STORY.timplista_americas,
        camarero_cueva: DIALOGUE.camarero_cueva,
      };
      if (id === 'operario_adeje') {
        handleRomeriaBlockade();
        return;
      }
      if (ambient[id]) say(ambient[id]);
    };

    const counterStarter = (id: StarterId) => {
      if (save.flags.starterChosen) { say(DIALOGUE.counter_empty); return; }
      save.flags['seen_' + id] = true;
      touchSave();
      g.cardView = id;
      beep('open');
    };

    // ---------- Minijuego Electrico de las 15 Mesas de Carne Fiesta ----------
    const inspectGuachincheTable = (tx: number, ty: number) => {
      if (save.flags.cueva_door_open) {
        beep('talk');
        say(['Una fuente de CARNE FIESTA calentita con papas en dados. La puerta de la cocina ya esta abierta!']);
        return;
      }
      const idx = cuevaTableIndex(tx, ty);
      if (idx === -1) return;

      if (!g.cuevaFirstFound) {
        if (idx === g.cuevaS1) {
          beep('open');
          g.cuevaFirstFound = true;
          say([
            'Apartas una fuente de carne fiesta y debajo del mantel de papel... HAY UN BOTON OCULTO!',
            'CLIC! Se abrio el PRIMER cerrojo de la cocina! (El 2o boton esta en una mesa contigua...)',
          ]);
        } else {
          beep('bump');
          say([CARNE_FIESTA_MISS[(idx + g.frame) % CARNE_FIESTA_MISS.length]]);
        }
      } else {
        if (idx === g.cuevaS1) {
          beep('talk');
          say(['Ese es el primer boton que ya pulsaste! Busca el SEGUNDO en una mesa contigua.']);
        } else if (idx === g.cuevaS2) {
          beep('fanfare');
          save.flags.cueva_door_open = true;
          touchSave();
          say([
            'Debajo de la garrafa de vino... EL SEGUNDO BOTON!!',
            'CLIC-CLAC!! Se abrio de par en par la PUERTA DE LA COCINA! Entra a retar a BENTEJUI!',
          ]);
        } else {
          beep('bump');
          const [ns1, ns2] = rollCuevaSwitches();
          g.cuevaS1 = ns1;
          g.cuevaS2 = ns2;
          g.cuevaFirstFound = false;
          say([
            'Pura CARNE FIESTA grasienta sin rastro de boton!',
            'CLONC!! Se resbalaron los muelles con el adobo y SE CERRARON OTRA VEZ LOS DOS CERROJOS! A buscar de nuevo.',
          ]);
        }
      }
    };

    const runTrigger = (t: Trigger) => {
      const a = t.action;
      switch (a.type) {
        case 'text': say(a.lines); break;
        case 'once': if (!save.flags[a.key]) { save.flags[a.key] = true; touchSave(); say(a.lines); } break;
        case 'zone': showZone(a.name); break;
        case 'warp': enterMap(a.to, a.x, a.y, a.dir); break;
        case 'storeLift': {
          const index = STORE_FLOORS.findIndex(([id]) => id === g.mapId);
          if (index < 0) break;
          ask([`ASCENSOR · ${STORE_FLOORS[index][1]}. ¿A qué planta vas?`],
            [...STORE_FLOORS.map(([, label]) => label), 'SALIR'], i => {
              const floor = STORE_FLOORS[i];
              if (!floor || floor[0] === g.mapId) return;
              beep('bell');
              enterMap(floor[0], LIFT.x, LIFT.y + 1, 'down', () => showZone(floor[1]));
            }, true);
          break;
        }
        case 'gourmetShop': {
          ask([`ZONA GOURMET · ${save.duros} duros. Elige una botella.`],
            [...GOURMET.map(b => `${b.name.toUpperCase()}  ${b.price} D`), 'SALIR'], i => {
              const b = GOURMET[i]; if (!b) return;
              if (save.duros < b.price) { beep('bump'); say([`Te faltan ${b.price - save.duros} duros para esa ${b.name}. No se ha cobrado nada.`]); return; }
              ask([`¿Comprar una ${b.name} por ${b.price} duros?`], ['COMPRAR', 'CANCELAR'], j => {
                if (j !== 0) return;
                if (!buyBeer(save, b.id)) { say(['No se ha podido completar la compra.']); return; }
                touchSave(); beep('open');
                say([`Guardas una ${b.name} en la mochila. Te quedan ${save.duros} duros.`]);
              }, true);
            }, true);
          break;
        }
        case 'enterParrandero':
          if (carOut()) { beep('bump'); say(STORY.car_parrandero); break; }
          save.lastCenter = a.id;
          // Viajar a un Centro Parrandero desbloquea ese destino en la Tarifa Plana Binter.
          {
            const b = BINTER_DESTINATIONS.find((d) => d.parrandero === a.id);
            if (b) save.flags[b.visited] = true;
          }
          touchSave();
          enterMap('parrandero', 4, 7, 'up');
          setTimeout(() => showZone(PARRANDEROS[a.id].name), 220);
          break;
        case 'exitParrandero': {
          const out = PARRANDEROS[save.lastCenter ?? 'weyler'].outside;
          enterMap(out.mapId, out.x, out.y, out.dir);
          break;
        }
        case 'enterSchool':
          if (carOut()) { beep('bump'); say(STORY.car_escuela); break; }
          if (!save.flags.starterChosen || save.deck.length === 0) {
            say(['La verja del patio esta abierta, pero sin mazo los chinijos se van a reir de ti. Ve antes a La Candelaria!'], () => {
              g.py += 1; g.dir = 'down';
              save.playerPos = { x: g.px, y: g.py, dir: g.dir };
            });
            break;
          }
          beep('bell');
          save.lastSchool = a.id;
          touchSave();
          enterMap('colegio', 4, 7, 'up');
          setTimeout(() => showZone(SCHOOLS[a.id].name), 220);
          break;
        case 'exitSchool': {
          const out = (SCHOOLS[save.lastSchool ?? 'sc'] ?? SCHOOLS.sc).outside;
          enterMap(out.mapId, out.x, out.y, out.dir);
          break;
        }
        case 'openPC':
          if (carOut()) { beep('bump'); say(STORY.car_pc); break; }
          if (!save.flags.starterChosen) {
            say(['Terminal del PC de Ayoze. Necesitas haber elegido tu mazo inicial en La Candelaria.']);
          } else {
            beep('open');
            cbRef.current.onOpenPC?.();
          }
          break;
        case 'enterSubida':
          if (!save.flags.magodex) {
            say(DIALOGUE.subida_locked, () => {
              g.py = 1; g.dir = 'down';
              save.playerPos = { x: g.px, y: g.py, dir: g.dir };
            });
          } else {
            enterMap('subida', 18, 94, 'up');
          }
          break;
        case 'enterAnaga':
          if (!save.flags.boliche_1) {
            say(DIALOGUE.anaga_locked, () => {
              g.py = 1; g.dir = 'down';
              save.playerPos = { x: g.px, y: g.py, dir: g.dir };
            });
          } else {
            enterMap('anaga', 9, 64, 'up');
          }
          break;
        case 'gym2Door':
          if (!save.flags.magomaniaco_done) {
            say(STORY.gym2_block, () => {
              if (g.mapId === 'anaga' && g.px === 44 && g.py === 5) {
                g.py = 6; g.dir = 'down';
                save.playerPos = { x: g.px, y: g.py, dir: g.dir };
              }
            });
            break;
          }
          if (!save.flags.cathaysa_rescued) {
            say(DIALOGUE.pedro_closed, () => {
              if (g.mapId === 'anaga' && g.px === 44 && g.py === 5) {
                g.py = 6; g.dir = 'down';
                save.playerPos = { x: g.px, y: g.py, dir: g.dir };
              }
            });
          } else {
            say(DIALOGUE.gym2_open_door);
          }
          break;
        case 'boardOlsen':
          if (olsenSailed()) {
            beep('bump');
            say(STORY.olsen_gone, () => {
              g.py = 49; g.dir = 'up';
              save.playerPos = { x: g.px, y: g.py, dir: g.dir };
            });
            break;
          }
          if (!save.flags.heard_canarion) {
            say(DIALOGUE.oficial_olsen_closed, () => {
              g.py = 49; g.dir = 'up';
              save.playerPos = { x: g.px, y: g.py, dir: g.dir };
            });
          } else {
            enterMap('ss_olsen', 4, 14, 'up');
          }
          break;
        case 'enterCuevas':
          if (carOut()) { beep('bump'); say(STORY.car_cueva); break; }
          if (!save.flags.entered_cuevas_once) {
            save.flags.entered_cuevas_once = true;
            touchSave();
            say([
              'El reloj sobre la entrada marca las 14:02 (LAS DOS, o sea, "landon").',
              'CANARION: Ya son las dos, pasa pa dentro! Y ni te creas que fue por el traductor del barco, eh!',
            ], () => enterMap('cuevas_pintadas', 10, 18, 'up'));
          } else {
            enterMap('cuevas_pintadas', 10, 18, 'up');
          }
          break;
        case 'galdarBench':
          if (save.flags.heard_canarion && !save.flags.got_translator) {
            say([
              'Te sientas en el banco con unas roscas como te mando el canarion. De pie te cansabas, si...',
              '...pero sigues sin saber que rayos significa "hasta landon". Baja al muelle a buscar un traductor en el S.S. OLSEN!',
            ]);
          } else {
            say(['Un banco de la Plaza de Galdar. Corre brisita norteña y huele a roscas recien hechas.']);
          }
          break;
        case 'vehicleWarp':
          if (carOut()) enterMap(a.to, a.x, a.y, a.dir);
          else say(a.blocked);
          break;
        case 'tramBoard':
          if (carOut()) { beep('bump'); say(STORY.car_tranvia); break; }
          boardTram(a.from, a.to);
          break;
        case 'gate':
          if (save.flags[a.key]) break;
          beep('bump');
          g.px = a.back.x; g.py = a.back.y; g.dir = a.back.dir; g.ox = 0; g.oy = 0; g.moving = false;
          save.playerPos = { x: g.px, y: g.py, dir: g.dir };
          touchSave();
          if (a.key === 'magomaniaco_done') {
            ask(a.lines, ['RETAR AL MAGOMANIACO', 'AHORA NO'], (i) => {
              if (i === 0) cbRef.current.onChallenge('magomaniaco');
            });
          } else if (a.key === 'mago_americas_done') {
            g.dir = a.back.dir;
            save.playerPos.dir = a.back.dir;
            ask(a.lines, ['RETAR AL MAGO DON SERVANDO', 'AHORA NO'], (i) => {
              if (i === 0) cbRef.current.onChallenge('mago_americas');
            });
          } else {
            say(a.lines);
          }
          break;
        case 'giveTodoTerreno':
          if (!save.flags.boliche_3 || save.flags.hm_todo_terreno) break;
          save.flags.hm_todo_terreno = true;
          touchSave();
          beep('fanfare');
          showZone('M.O. 1 · TODO TERRENO');
          say(STORY.m_o_granted);
          break;
        case 'cableStairs':
          // Escalera del Centro Parrandero al Club del Cable: abierta solo para el campeón.
          if (isChampion(save)) {
            beep('open');
            enterMap('parrandero_2', CABLE_ARRIVAL.x, CABLE_ARRIVAL.y, 'up', () => {
              showZone('CLUB DEL CABLE · 2ª PLANTA');
              if (!save.flags.cable_club_intro) {
                save.flags.cable_club_intro = true;
                touchSave();
                say(CABLE_INTRO);
              }
            });
          } else {
            beep('bump');
            g.py += 1; g.dir = 'down'; g.ox = 0; g.oy = 0; g.moving = false;
            save.playerPos = { x: g.px, y: g.py, dir: g.dir };
            say(CABLE_LOCKED);
          }
          break;
        case 'cableClub':
          // La mesa o la consola de una sala: se abre la ventana del cable (la gestiona App).
          window.dispatchEvent(new CustomEvent('magomon:cable', { detail: a.room }));
          break;
        case 'takeOutCar':
          // Sacar el todoterreno dentro de la cueva (sala de socavones).
          if (carOut()) { say(['El todoterreno ya está fuera. A cruzar los socavones.']); break; }
          if (!save.flags.hm_todo_terreno) {
            say(['Necesitas el 🚙 M.O. 1 TODO TERRENO para cruzar los socavones. Te lo da Carmelo en Benijo (tras el Gym #3).']);
            break;
          }
          if (save.flags.pukas_out) { say(['Primero baja de la Pukas. El todoterreno no lleva remolque.']); break; }
          save.flags.car_out = true;
          touchSave();
          beep('motor');
          say(['Sacas el Toyota Landcruiser en el vestíbulo. Los socavones se cruzan en coche, zigzagueando entre los pilares.']);
          break;
        case 'exitOlsen':
          if (save.flags.got_translator && !olsenSailed()) {
            save.flags.olsen_sailed = true;
            touchSave();
            enterMap('galdar', 27, 49, 'down', () => {
              beep('motor');
              showZone('EL S.S. OLSEN ZARPO!');
              say(STORY.olsen_sail_on_exit);
            });
          } else {
            enterMap('galdar', 27, 49, 'up');
          }
          break;
        case 'cemeterySign':
          say(save.flags.has_cazafantasmas ? STORY.cemetery_sign_ready : STORY.cemetery_sign);
          break;
        case 'enterTeresitasTower':
          if (!save.flags.has_cazafantasmas) {
            beep('bump');
            say(STORY.cemetery_locked);
          } else {
            beep('open');
            enterMap('torre_teresitas_1', 9, 12, 'up');
          }
          break;
        case 'towerStairs': {
          if (!trainerDefeated(save, a.requiredTrainer)) {
            const floor = Number(a.requiredTrainer.split('_').pop()) || 1;
            ask(STORY.tower_guard_block(floor), ['RETAR AL RECLUTA', 'VOLVER'], (i) => {
              if (i === 0) cbRef.current.onChallenge(a.requiredTrainer);
            });
          } else {
            enterMap(a.to, a.x, a.y, 'down');
          }
          break;
        }
        case 'towerReturn':
          enterMap(a.to, a.x, a.y, a.to === 'san_andres' ? 'left' : 'up');
          break;
        case 'tf1Sign':
          say(save.flags.has_bucio ? STORY.tf1_sign_open : STORY.tf1_blocked);
          break;
        case 'enterTf1':
          if (!save.flags.has_bucio) {
            if (!save.flags.tf1_warn) {
              save.flags.tf1_warn = true;
              touchSave();
              say(STORY.tf1_blocked);
            }
            break;
          }
          if (!carOut()) {
            if (g.px <= 1) {
              beep('bump');
              g.px = 2; g.dir = 'right'; g.ox = 0; g.oy = 0; g.moving = false;
              save.playerPos = { x: g.px, y: g.py, dir: g.dir };
              touchSave();
              say(STORY.tf1_need_car);
            }
            break;
          }
          if (g.px === 0) {
            beep('motor');
            enterMap('tf1', 158, 12, 'left');
          }
          break;
        case 'enterTf5':
          if (!carOut()) {
            beep('bump');
            g.py = 1; g.dir = 'down'; g.ox = 0; g.oy = 0; g.moving = false;
            save.playerPos = { x: g.px, y: g.py, dir: g.dir };
            touchSave();
            if (save.flags.hm_todo_terreno) {
              ask(
                ['AUTOPISTA TF-5 NORTE (Taco · Padre Anchieta · TFN · Norte). A pata no llegas ni a Tres de Mayo: ¿sacas el Toyota Landcruiser y te metes?'],
                ['SACAR 4X4 Y ENTRAR', 'VOLVER'],
                (i) => {
                  if (i !== 0) return;
                  save.flags.car_out = true;
                  touchSave();
                  beep('motor');
                  enterMap('calle', 24, 10, 'up', () => showZone('TF-5 · PUENTE DE TACO'), true);
                },
                true,
              );
            } else {
              say(['AUTOPISTA TF-5 NORTE: Necesitas el 🚙 M.O. 1 TODO TERRENO para incorporarte a la autopista!']);
            }
            break;
          }
          beep('motor');
          enterMap('calle', 24, 10, 'up', () => showZone('TF-5 · PUENTE DE TACO'), true);
          break;
        case 'enterTf5Underpass':
          if (!carOut()) {
            if (!save.flags.hm_todo_terreno) {
              beep('bump');
              g.py = 94; g.dir = 'up'; g.ox = 0; g.oy = 0; g.moving = false;
              save.playerPos = { x: g.px, y: g.py, dir: g.dir };
              touchSave();
              say(['Saca el 🚙 M.O. 1 TODO TERRENO antes de meterte en el paso inferior de Taco!']);
              break;
            }
            save.flags.car_out = true;
            touchSave();
          }
          beep('motor');
          enterMap(
            'calle',
            a.from === 'north' ? 23 : 24,
            a.from === 'north' ? 1 : 10,
            a.from === 'north' ? 'down' : 'up',
            () => showZone('TF-5 · PUENTE DE TACO'),
            true,
          );
          break;
        case 'sauzalFlash':
          if (!save.flags.tf5_sauzal_flashed) {
            save.flags.tf5_sauzal_flashed = true;
            touchSave();
            radarFlash = 14;
            beep('bell');
            g.lastZone = '';
            showZone('¡FLASH! RADAR EL SAUZAL');
          }
          break;
        case 'laQuintaChill':
          g.lastZone = '';
          showZone('SALIDA 31 · LA QUINTA');
          if (!save.flags.tf5_quinta_chill) {
            save.flags.tf5_quinta_chill = true;
            touchSave();
            beep('talk');
            say(['TU: Siento un escalofrío, creo que debería salirme de la autopista aquí.']);
          }
          break;
        case 'orotavaCutscene': {
          // Sin el último boliche, la carretera te devuelve atrás como hacía la autopista.
          if (g.rally) break;
          g.lastZone = '';
          if (!save.flags.boliche_8) {
            beep('bump');
            if (a.from === 'motorway') {
              g.px = LA_QUINTA_EXIT.x; g.py = LA_QUINTA_EXIT.y;
              say(['TU: Siento un escalofrío, creo que debería salirme de la autopista aquí.',
                '(Vuelves a la salida de La Quinta. Antes de seguir hacia La Orotava, cierra el último gimnasio de la Ruta.)']);
            } else {
              g.px = URSULA_DOORS.diablito.x;
              g.py = URSULA_DOORS.diablito.y + 1;
              say(['El Diablito sigue abierto y tu último boliche aún no es tuyo.',
                '(Te das la vuelta delante del gimnasio. Gana allí antes de tomar la carretera general.)']);
            }
            g.dir = 'up'; g.ox = 0; g.oy = 0; g.moving = false;
            save.playerPos = { x: g.px, y: g.py, dir: g.dir };
            touchSave();
            break;
          }
          if (save.flags.montana_blanca_seen) {
            ask(['La subida a Montaña Blanca ya la conoces. ¿Saltas directo al refugio o la repites?'],
              ['IR DIRECTO A MONTAÑA BLANCA', 'REPETIR LA SUBIDA'],
              (i) => { if (i === 0) finishRally(); else { g.rally = { stage: 'rally', t: 0 }; beep('motor'); } },
              true);
            break;
          }
          g.rally = { stage: 'rally', t: 0 };
          save.flags.montana_blanca_seen = true;
          touchSave();
          beep('motor');
          break;
        }
        case 'orotavaReturn':
          beep('motor');
          enterMap('santa_ursula', URSULA_DOORS.diablito.x, URSULA_DOORS.diablito.y + 1, 'up');
          break;
        case 'pickupNarices': {
          if (save.flags.got_narices_teide) {
            say(['Las Narices del Teide ya están en tu colección. Ya no queda otra copia en la arena.']);
            break;
          }
          const id = 'narices_teide';
          const destination = canAddToDeck(save, id) === null ? 'deck' : 'pc';
          (destination === 'deck' ? save.deck : save.pc).push(id);
          save.flags.got_narices_teide = true;
          save.flags['seen_' + id] = true;
          touchSave();
          beep('fanfare');
          showZone('NARICES DEL TEIDE');
          say(['Arrancas NARICES DEL TEIDE de entre la arena: la montaña entera se queda sin aire.',
            'Hechizo legendario: destruye TODAS las criaturas de ambos lados de la mesa. Nadie se salva.',
            destination === 'deck' ? 'Entra en tu mazo.' : 'Tu mazo está lleno: va al PC de Ayoze.']);
          break;
        }
        case 'diablitoAroma':
          if (discoverDiablito(save)) {
            touchSave();
            beep('fanfare');
            showZone('EL DIABLITO · GYM #8');
            say(DIABLITO_DISCOVERY);
          }
          break;
        case 'enterDiablito': {
          if (carOut()) { beep('bump'); say(STORY.car_indoor_spawn); break; }
          const firstDiscovery = discoverDiablito(save);
          touchSave();
          beep('open');
          enterMap('el_diablito', 11, 16, 'up', () => {
            say([...(firstDiscovery ? DIABLITO_DISCOVERY : []), ...DIABLITO_SINGING]);
          });
          break;
        }
        case 'enterAeropuerto':
          if (carOut()) { beep('bump'); say(STORY.car_indoor_spawn); break; }
          beep('open');
          save.flags.visited_tfs_center = true;
          touchSave();
          enterMap('aeropuerto', 11, 14, 'up');
          setTimeout(() => showZone('AEROPUERTO TFS'), 220);
          break;
        case 'highwayChallenge': {
          const hk = 'honked_' + a.trainer;
          if (trainerDefeated(save, a.trainer) || save.flags[hk]) break;
          save.flags[hk] = true;
          touchSave();
          beep('bump');
          promptDuel(a.trainer);
          break;
        }
        case 'coastStop':
          if (!save.flags['coast_' + a.key]) { save.flags['coast_' + a.key] = true; touchSave(); }
          showZone(a.name); break;
        case 'romeriaBlockade':
          if (g.mapId === 'tf1' && g.px <= 4) {
            g.px = 5; g.dir = 'left'; g.ox = 0; g.oy = 0; g.moving = false;
            save.playerPos = { x: g.px, y: g.py, dir: g.dir };
          }
          handleRomeriaBlockade();
          break;
        case 'pickupCremaFP50':
          handlePickupCrema();
          break;
        case 'magosDoor': {
          if (save.flags.coco_beaten) { say(STORY.magos_door_after); break; }
          if (!canOpenMagosDoor(save.magosKeys)) {
            const have = save.magosKeys.length;
            beep('bump');
            say([`PUERTA DEL DESPACHO: dos cerraduras magnéticas. Llevas ${have}/2 llaves.`,
              have === 0 ? 'Busca la LLAVE MAGNÉTICA 1 en el archivo (planta 2) y la 2 en dirección (planta 4).' : 'Te falta la otra llave magnética.']);
            break;
          }
          beep('open');
          g.px = MAGOS_DOOR.x; g.py = MAGOS_DOOR.y + 1; g.dir = 'up'; g.ox = 0; g.oy = 0;
          save.playerPos = { x: g.px, y: g.py, dir: g.dir };
          const firstLook = !save.flags.ricardo_spoken;
          if (firstLook) save.flags.ricardo_spoken = true;
          touchSave();
          say(firstLook ? STORY.magos_ricardo : STORY.ricardo_waiting);
          break;
        }
        case 'claimGhostGear': {
          if (save.flags.has_cazafantasmas) { say(['Ya llevas el EQUIPO CAZAFANTASMAS en la mochila. El paquete está vacío.']); break; }
          save.flags.has_cazafantasmas = true;
          touchSave();
          beep('fanfare');
          showZone('EQUIPO CAZAFANTASMAS');
          say(['Abres el paquete: dentro está el 🖻 EQUIPO CAZAFANTASMAS que El Coco dejó a tu nombre.',
            'Con esto ya puedes entrar en la Torre Encantada del Cementerio de Las Teresitas. La FOTOCOPIADORA, en cambio, se la llevó a Magos de la Costa.']);
          break;
        }
        case 'pickupMagosKey': {
          if (save.magosKeys.includes(a.key)) break;
          save.magosKeys = [...save.magosKeys, a.key].sort();
          save.flags['magos_key_' + a.key] = true;
          touchSave();
          beep('fanfare');
          showZone(`LLAVE MAGNÉTICA ${a.key}`);
          say([`Recoges la LLAVE MAGNÉTICA ${a.key}. La guardas con las demás.`,
            hasMagosKeys(save.flags) ? 'Ya tienes las dos. El teletransportador de esta planta lleva a la azotea.' : 'Necesitas encontrar la otra para abrir el despacho de la azotea.']);
          break;
        }
        case 'pickupUnelco': {
          const got = grantUnelco(save);
          if (!got.ok) { say([got.error]); break; }
          touchSave();
          beep('fanfare');
          showZone('CARTA LEGENDARIA · UNELCO');
          say(STORY.unelco_pickup(got.destination));
          break;
        }
        case 'landBorondon': {
          if (borondonVisible && save.flags.hm_pukas && save.flags.pukas_out) {
            enterMap('san_borondon', BORONDON_COVE.x, BORONDON_COVE.y, 'up');
          }
          break;
        }
        case 'sailFromBorondon': {
          enterMap('veronicas', BORONDON_RETURN.x, BORONDON_RETURN.y, 'down', () => showZone('CANAL DE LA GOMERA'));
          break;
        }
        case 'pickupNevada': {
          const destination = grantNevada(save);
          if (!destination) break;
          touchSave();
          beep('fanfare');
          showZone('NEVADA DEL TEIDE');
          say(['Bajo una capa de escarcha encuentras NEVADA DEL TEIDE, un hechizo legendario.',
            'A partir del siguiente turno, tú y tus Magomones no recibís daño durante tres turnos.',
            destination === 'deck' ? 'Guardas la carta en tu mazo.' : 'Tu mazo está lleno. La carta se guarda en el PC de Ayoze.']);
          break;
        }
        case 'pickupCurbeloKey': {
          if (save.flags.has_curbelo_key) {
            say(['La llave del guachinche ya está en tu mochila. Colón estuvo aquí.']);
            break;
          }
          save.flags.has_curbelo_key = true;
          touchSave();
          beep('fanfare');
          showZone('LLAVE DEL GUACHINCHE');
          say(['Encontraste la LLAVE DEL GUACHINCHE DE CASIMIRO al fondo del laberinto.',
            'Una nota atada a la llave dice: «Colón estuvo aquí». Vuelve al vestíbulo y busca el guachinche en la plaza.']);
          break;
        }
        case 'enterCurbeloGym': {
          if (!save.flags.has_curbelo_key) {
            beep('bump');
            say(['La puerta del guachinche de fuego está cerrada. Un cartel dice: «Colón estuvo aquí».',
              'Necesitas la llave escondida en la mansión de Casimiro, al suroeste de la plaza.'], () => {
              g.py = t.y + 1; g.dir = 'down';
              save.playerPos = { x: g.px, y: g.py, dir: g.dir };
              touchSave();
            });
          } else {
            beep('open');
            enterMap('guachinche_curbelo', 10, 14, 'up');
          }
          break;
        }
        case 'wavePoolPukas':
          handleWavePoolPukas();
          break;
        case 'siamGuiriDave':
          handleSiamGuiriDave();
          break;
        case 'enterMeridiano':
          if (carOut()) { beep('bump'); say(STORY.car_indoor_spawn); break; }
          beep('open');
          enterMap('meridiano', 11, 14, 'up');
          setTimeout(() => showZone('C.C. MERIDIANO'), 220);
          break;
        case 'bershkaPoster':
          if (!save.flags.boliche_4) {
            say(['Cartel gigante: "BERSHKA · DESCUENTO -70%". Hay un recluta del Team Enriscada delante haciendose el loco.']);
          } else if (save.flags.bershka_opened) {
            say(STORY.bershka_poster_already);
          } else {
            const intro = save.flags.saw_enriscada_bershka
              ? STORY.bershka_poster_weird_seen
              : STORY.bershka_poster_weird_unseen;
            ask(intro, ['HUSMEAR EL CARTEL', 'DEJARLO'], (i) => {
              if (i === 1) return;
              save.flags.bershka_opened = true;
              touchSave();
              beep('fanfare');
              showZone('ESCALERAS SECRETAS!');
              say(STORY.bershka_poster_reveal);
            });
          }
          break;
        case 'bershkaEscalator':
          if (!save.flags.bershka_opened) break;
          beep('open');
          enterMap('guarida_enriscada', 3, 3, 'down');
          setTimeout(() => showZone('GUARIDA ENRISCADA'), 220);
          break;
        case 'fastFashionSlot':
          beep('open');
          g.slots = createSlotState(a.brand, a.bet);
          break;
        case 'meridianoPrizes': {
          const opts = [...MERIDIANO_PRIZES.map((p) => p.label), 'NADA, GRACIAS'];
          ask(
            [`CAJERA: Canje de Tickets Fast-Fashion (llevas ${save.duros}D)! Elige Magomon:`],
            opts,
            (i) => {
              if (i >= MERIDIANO_PRIZES.length) return;
              const res = redeemMeridianoPrize(save, i);
              if (!res.ok) { beep('bump'); say([res.error]); return; }
              touchSave();
              beep('fanfare');
              say([`Canjeas ${CARDS[res.cardId].name} por ${res.cost}D! Guardada en ${res.destination === 'deck' ? 'tu MAZO' : 'el PC de Ayoze'}.`]);
            },
          );
          break;
        }
        case 'starter': counterStarter(a.id); break;
      }
    };

    const interact = () => {
      const [dx, dy] = DV[g.dir];
      const fx = g.px + dx, fy = g.py + dy;
      if (onTf5Underpass()) {
        const uv = tacoUnderpassVehicleAt(fx, fy);
        if (uv) {
          beep('talk');
          if (uv.trainer) promptDuel(uv.trainer);
          else if (uv.flavor) say([uv.flavor]);
          return;
        }
        if (fx < TACO_TF5.left || fx > TACO_TF5.right) {
          beep('talk');
          say(['Muro del paso inferior de la TF-5 en Taco. ¡Por encima del puente cruzan la calle y el Tranvía Línea 1!']);
        }
        return;
      }
      let hit = npcHere(fx, fy);
      if (!hit && tileAt(fx, fy) === 'counter') hit = npcHere(fx + dx, fy + dy);
      if (hit) { beep('talk'); npcTalk(hit.n); return; }
      if (tileAt(fx, fy) === 'gtable') { inspectGuachincheTable(fx, fy); return; }
      if (tileAt(fx, fy) === 'keycard') {
        const m = map();
        const t = m.triggers.find((tt) => tt.kind === 'interact' && tt.x === fx && tt.y === fy && tt.action.type === 'pickupMagosKey');
        if (t) runTrigger(t);
        return;
      }
      if (tileAt(fx, fy) === 'teleport') {
        beep('open');
        say(g.mapId === 'guachinche_rosario'
          ? ['PLACAS DEL GUACHINCHE: pisa una y saltarás a otra sala de esta misma planta.']
          : ['PLATAFORMA DE TELETRANSPORTE. Pisa la baldosa para subir a la siguiente planta.']);
        return;
      }
      if (kdoorBlocks(fx, fy)) {
        beep('bump');
        say([
          g.cuevaFirstFound
            ? 'PUERTA DE LA COCINA: Primer cerrojo abierto! Falta pulsar el SEGUNDO boton en una mesa contigua!'
            : 'PUERTA DE LA COCINA: Cerrada con DOS cerrojos! Busca los 2 botones escondidos entre las 15 mesas de carne fiesta.',
        ]);
        return;
      }
      const tr = map().triggers.find((t) => t.kind === 'interact' && t.x === fx && t.y === fy);
      if (tr) { beep('talk'); runTrigger(tr); return; }
      if (g.mapId.startsWith('eci_')) return;
      if (truckBlocks(fx, fy)) {
        beep('talk');
        say([
          'GUACHINCHE-TRUCK DE LA ULL (Gimnasio #1). Huele a carne fiesta, papas arrugadas y vino de garrafa.',
          'Habla con DOMINGO delante de la ventanilla para retarlo por el Boliche!',
        ]);
        return;
      }
      if (olsenBlocks(fx, fy)) {
        beep('talk');
        say(['Casco trimaran del S.S. OLSEN. Sube por la pasarela central para embarcar.']);
        return;
      }
      if (g.mapId === 'tf5') {
        const veh5 = tf5VehicleAt(fx, fy);
        if (veh5) {
          beep('talk');
          if (veh5.trainer) promptDuel(veh5.trainer);
          else if (veh5.flavor) say([veh5.flavor]);
          return;
        }
        if (fx >= TF5_BINTER_POS.x && fx < TF5_BINTER_POS.x + TF5_BINTER_POS.w && fy >= TF5_BINTER_POS.y && fy < TF5_BINTER_POS.y + TF5_BINTER_POS.h) {
          beep('talk');
          say(['ATR-72 de Binter Canarias calentando hélices entre la bruma de Los Rodeos (TFN).']);
          return;
        }
        if (tileAt(fx, fy) === 'car') {
          beep('talk');
          say(['Otro coche clavado en la cola de la TF-5. Lleva el intermitente puesto desde 2019 y Radio Club a todo trapo.']);
          return;
        }
      }
      if (g.mapId === 'tf1') {
        const veh = tf1VehicleAt(fx, fy);
        if (veh) {
          beep('talk');
          promptDuel(veh.trainer);
          return;
        }
        if (fx >= TF1_ROMERIA_CART_POS.x && fx < TF1_ROMERIA_CART_POS.x + TF1_ROMERIA_CART_POS.w && fy >= TF1_ROMERIA_CART_POS.y && fy < TF1_ROMERIA_CART_POS.y + TF1_ROMERIA_CART_POS.h) {
          beep('talk');
          handleRomeriaBlockade();
          return;
        }
        if (fx >= MONTANA_ROJA_POS.x && fx < MONTANA_ROJA_POS.x + MONTANA_ROJA_POS.w && fy >= MONTANA_ROJA_POS.y && fy < MONTANA_ROJA_POS.y + MONTANA_ROJA_POS.h) {
          beep('talk');
          say(STORY.tf1_medano);
          return;
        }
      }
      if (g.mapId === 'las_americas') {
        if (fx >= AMER_CARRETA_POS.x && fx < AMER_CARRETA_POS.x + AMER_CARRETA_POS.w && fy >= AMER_CARRETA_POS.y && fy < AMER_CARRETA_POS.y + AMER_CARRETA_POS.h) {
          beep('talk');
          say(['La carreta de la Romeria con la Yunta de Bueyes descansando a la sombra y media barrica de vino peleon.']);
          return;
        }
        if (fx >= AMER_GUAGUA_POS.x && fx < AMER_GUAGUA_POS.x + AMER_GUAGUA_POS.w && fy >= AMER_GUAGUA_POS.y && fy < AMER_GUAGUA_POS.y + AMER_GUAGUA_POS.h) {
          beep('talk');
          say(['Guagua TITSA 467 en la Estacion de Las Americas. El chofer esta echandose un cortado antes de salir.']);
          return;
        }
      }
      if (cayucoBlocks(fx, fy)) {
        beep('talk');
        say([
          'El cayuco de chapas de Carmelo con su fueraborda Yamaha del 82. Solo de mirarlo te vuelve el pitido de 120dB al oido.',
          'Habla con Carmelo en el muelle si quieres cruzar.',
        ]);
        return;
      }
      const msg: Partial<Record<TileId, string>> = {
        box: 'Mas cajas. Que de cosas trae un guirufo.',
        plant: 'Una planta ornamental aguantando el tipo.',
        window: 'Se oye una tele y olor a potaje de berros.',
        porthole: 'Ojo de buey del S.S. Olsen. Fuera se ve el muelle de Galdar.',
        bucket: 'Cubo de mareo reglamentario.',
        pintada: 'Pinturas rupestres geometricas de la Cueva Pintada... con un cartel pegado de "HAY VINO DE MONTE".',
        machine: 'Consola llena de botones parpadeantes. Hace "bip".',
        sea: 'El Atlantico rugiendo contra la costa.',
        surf: 'Mar todo picao con olas de dos metros y espuma blanca.',
        roque: 'Los Roques emergiendo del Atlantico entre espuma.',
        pothole: 'Todo el piche levantado a picazos por el Team Enriscada. Por aqui no pasa ni una cabra.',
        fogon: 'Brasas a tope con calderos de carne fiesta en adobo.',
        colegio: 'Escudo del colegio. Se oye jaleo de chinijos barajando cartas en el recreo.',
        hoop: 'Canasta del patio. El aro ha visto mejores trimestres.',
        counter: 'Mostrador. Folleto: "5 Tierras de Canarias: Volcan, Charco, Laurisilva, Playa y Malpais".',
        tf5: 'La TF-5 abajo, petada de coches. La gente saca el tapete en el arcen mientras espera.',
        car: 'Un Seat Ibiza del 2004 con pegatina de "Soy Parrandero". Encontrar este hueco le llevo 45 minutos.',
        bench: 'Un banco a la sombra. Tus gemelos te suplican sentarte.',
        table: 'Mesa con marcas de vasos de vino y cartas de Magomon.',
        tree: 'Sombra fresquita.',
        fence: 'Verja de hierro forjado.',
        parranda: 'Emblema del Centro Parrandero. Barraquito caliente y mazo planchado las 24 horas.',
        turbine: 'Aerogenerador de Abades zumbando con el alisio del sur. Da luz a media isla y despeina a la otra media.',
        guardrail: 'Bionda metalica quitamiedos de la autopista.',
        radar: '📸 SEÑAL DE RADAR DE EL SAUZAL: "POR TU SEGURIDAD (Y LA DE HACIENDA)". Hay otro radar tres metros más allá vigilando a este radar.',
        redrock: 'Piedra volcanica rojiza de Montaña Roja, reserva natural de El Medano.',
        runway: 'Pista 07/25 del Aeropuerto Tenerife Sur. Huele a queroseno y a vacaciones.',
        board: STORY.airport_board[0],
      };
      // Si vas en el Landcruiser y pulsas A frente a una acera/sendero peatonal, ofrece aparcar y bajar
      if (carOut() && !SOLID[tileAt(fx, fy)] && !DRIVABLE_TILES.has(tileAt(fx, fy))) {
        const curTile = tileAt(g.px, g.py);
        if (curTile === 'pothole' || curTile === 'fence') {
          say(STORY.car_hazard_park);
        } else {
          ask(STORY.car_curb_hint, ['APARCAR Y BAJAR', 'SEGUIR EN COCHE'], (i) => {
            if (i === 1) return;
            save.flags.car_out = false;
            touchSave();
            beep('open');
            say(STORY.car_park);
          });
        }
        return;
      }
      const lookedTile = tileAt(fx, fy);
      // Texto contextual del sprite segun el mapa; si no hay override se conserva
      // EXACTAMENTE el texto generico de siempre. Los triggers especiales ya se
      // resolvieron mas arriba y han hecho return, asi que no se toca nada de historia.
      const m = spriteText(g.mapId, lookedTile, fx, fy) ?? msg[lookedTile];
      if (m) say([m]);
    };

    const chooseStarter = (id: StarterId) => {
      g.cardView = null;
      const c = CARDS[id];
      ask([`Eliges el ${STARTER_INFO[id].pack} (${c.name})?`], ['SI, ESTE', 'MIRAR OTROS'], (i) => {
        if (i === 1) return;
        save.flags['seen_' + id] = true;
        grantStarterDeck(id);
        beep('fanfare');
        say([
          STARTER_INFO[id].acaymo,
          `Recibes el ${STARTER_INFO[id].pack} (24 cartas con tierras canarias). A probarlo en la mesa!`,
        ], () => cbRef.current.onStarterChosen(id));
      });
    };

    // ---------- Coche: baches y primera edicion ----------
    let potholeHits = 0;
    let firstEdAsked = false;
    const potholeHit = () => {
      potholeHits++;
      beep('bump');
      if (potholeHits === 1) say(STORY.pothole_first);
      else g.banner = { name: STORY.pothole_banner[potholeHits % STORY.pothole_banner.length], t: 110 };
    };
    const claimFirst = (i: number) => {
      const r = claimFirstEdition(save, i);
      if (!r.ok) { say([r.error]); return; }
      beep('fanfare');
      touchSave();
      say(STORY.first_ed_received(CARDS[r.cardId].name));
    };
    const offerFirstEdition = () => {
      ask(STORY.first_ed_offer, [CARDS[MAGOMANIACO_OFFER[0]].name, CARDS[MAGOMANIACO_OFFER[1]].name, 'LO PIENSO LUEGO'], (i) => {
        if (i === 2) { say(STORY.first_ed_later); return; }
        claimFirst(i);
      });
    };

    // ---------- UPDATE ----------
    const update = () => {
      g.frame++;
      if (g.banner) {
        g.banner.t--;
        if (g.banner.t <= 0) g.banner = null;
      }
      if (ui.paused) { input.consumeA(); input.consumeB(); return; }
      if (g.fade) {
        g.fade.t += g.fade.dir * 0.08;
        if (g.fade.dir === 1 && g.fade.t >= 1) { g.fade.t = 1; const th = g.fade.then; g.fade = null; th?.(); }
        else if (g.fade.dir === -1 && g.fade.t <= 0) g.fade = null;
        input.consumeA(); input.consumeB();
        return;
      }
      if (g.title) {
        if (input.consumeA()) {
          g.title = false; beep('fanfare');
          cbRef.current.onTitleStart?.();
          if (!hasProgress) {
            save.flags.visited_apartment = true;
            touchSave();
            say(MAPS.apartment.onEnter ?? []);
          }
        }
        input.consumeB();
        return;
      }
      if (g.cardView) {
        if (input.consumeA()) { beep('talk'); chooseStarter(g.cardView); }
        else if (input.consumeB()) { beep('back'); g.cardView = null; }
        return;
      }
      if (g.slots) {
        const exit = updateSlotMachine(g.slots, input.consumeA(), input.consumeB());
        if (exit) g.slots = null;
        return;
      }
      if (g.dialogue) {
        if (g.cayuco) g.cayuco.t++;
        if (g.romeria) g.romeria.t++;
        const d = g.dialogue;
        const full = d.pages[d.page].join('\n').length;
        if (d.chars < full) {
          d.chars += 2;
          if (g.frame % 4 === 0) beep('text');
          if (input.consumeA() || input.consumeB()) d.chars = full;
          return;
        }
        const last = d.page === d.pages.length - 1;
        if (last && d.choice) {
          const ch = d.choice;
          if (input.consumeA()) {
            const onPick = ch.onPick; const sel = ch.sel;
            g.dialogue = null; beep('talk'); onPick(sel); return;
          }
          if (input.consumeB() && ch.cancellable) { g.dialogue = null; beep('back'); return; }
          const ld = input.lastDir();
          if ((ld === 'up' || ld === 'down') && (ld !== ch.lastDir || g.frame >= (ch.nextNav ?? 0))) {
            ch.sel = (ch.sel + (ld === 'up' ? -1 : 1) + ch.options.length) % ch.options.length;
            ch.nextNav = g.frame + (ld === ch.lastDir ? 8 : 17);
            beep('text');
          }
          ch.lastDir = ld;
          return;
        }
        if (input.consumeA() || input.consumeB()) {
          beep('talk');
          if (last) { const cb = d.onDone; g.dialogue = null; cb?.(); }
          else { d.page++; d.chars = 0; }
        }
        return;
      }
      // Cinematica de la Romeria hacia la Estacion de Las Americas con una Isa Canaria de fondo
      if (g.romeria) {
        const rm = g.romeria;
        rm.t++;
        const skip = input.consumeA();
        input.consumeB();
        if (rm.stage === 'bucio') {
          if (rm.t === 45) beep('bucio');
          if (rm.t >= 115 || (skip && rm.t > 30)) {
            rm.stage = 'isa';
            rm.t = 0;
            beep('isa');
          }
        } else if (rm.stage === 'isa') {
          if (rm.t % 11 === 0) playIsaBeat(Math.floor(rm.t / 11));
          if (rm.t >= 240 || (skip && rm.t > 45)) {
            rm.stage = 'arrival';
            rm.t = 0;
            beep('fanfare');
            say(STORY.romeria_arrival_after_isa, () => {
              g.fade = {
                t: 0, dir: 1, then: () => {
                  g.romeria = null;
                  save.flags.romeria_done = true;
                  save.flags.visited_las_americas = true;
                  save.flags.car_out = false;
                  save.lastCenter = 'aeropuerto';
                  g.mapId = 'las_americas';
                  g.px = 9; g.py = 9; g.ox = 0; g.oy = 0; g.dir = 'left'; g.moving = false;
                  save.mapId = 'las_americas';
                  save.playerPos = { x: g.px, y: g.py, dir: g.dir };
                  touchSave();
                  g.fade = { t: 1, dir: -1 };
                  showZone('ESTACION LAS AMERICAS');
                  say(MAPS.las_americas.onEnter ?? []);
                },
              };
            });
          }
        }
        return;
      }
      // Cutscene de la carretera general: La Orotava a toda velocidad, subida en zigzag y llegada a Montaña Blanca
      if (g.rally) {
        const rl = g.rally;
        rl.t++;
        // Sin saltarse la subida: el salto rápido se ofrece al llegar a la carretera, como la Romería.
        input.consumeA();
        input.consumeB();
        if (rl.stage === 'rally' && rl.t % 45 === 0) beep('motor');
        if (rl.t >= RALLY_TIMES[rl.stage]) {
          if (rl.stage === 'rally') { rl.stage = 'climb'; rl.t = 0; beep('motor'); }
          else if (rl.stage === 'climb') { rl.stage = 'arrival'; rl.t = 0; beep('bell'); }
          else say(ORO_ARRIVAL_LINES, () => finishRally());
        }
        return;
      }
      // Cinematica del Fever Dream del Cayuco (Benijo -> Muelle de Galdar a 120dB)
      if (g.cayuco) {
        const cy = g.cayuco;
        cy.t++;
        const skip = input.consumeA();
        input.consumeB();
        if (cy.stage === 'storm') {
          if (cy.t % 8 === 0) beep('motor');
          if (cy.t >= 170 || (skip && cy.t > 45)) {
            cy.stage = 'dream';
            cy.t = 0;
          }
        } else if (cy.stage === 'dream') {
          if (cy.t % 7 === 0) beep('motor');
          if (cy.t >= 165 || (skip && cy.t > 45)) {
            cy.stage = 'vomit';
            cy.t = 0;
            beep('vomit');
          }
        } else if (cy.stage === 'vomit') {
          if (cy.t === 55) beep('vomit');
          if (cy.t >= 115 || (skip && cy.t > 40)) {
            cy.stage = 'after';
            cy.t = 0;
            say(DIALOGUE.cayuco_arrival, () => {
              g.fade = {
                t: 0, dir: 1, then: () => {
                  g.cayuco = null;
                  save.flags.cayuco_done = true;
                  save.flags.visited_galdar = true;
                  save.lastCenter = 'galdar';
                  save.lastSchool = 'galdar';
                  g.mapId = 'galdar';
                  g.px = 13; g.py = 50; g.ox = 0; g.oy = 0; g.dir = 'up'; g.moving = false;
                  save.mapId = 'galdar';
                  save.playerPos = { x: g.px, y: g.py, dir: g.dir };
                  touchSave();
                  g.fade = { t: 1, dir: -1 };
                  showZone('MUELLE DE GALDAR');
                  say(MAPS.galdar.onEnter ?? []);
                },
              };
            });
          }
        }
        return;
      }
      if (g.anim) {
        const an = g.anim;
        an.t++;
        if (an.riding && an.t % 18 === 0) beep('bump');
        const k = Math.min(1, an.t / an.dur);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        g.tramX = an.from + (an.to - an.from) * e;
        const hit = an.marks.find((m) => !m.done && Math.abs(g.tramX - m.x) < 0.7);
        if (hit) { hit.done = true; say(hit.lines); return; }
        if (k >= 1) { const d = an.onDone; g.anim = null; d(); }
        return;
      }
      if (g.chapter > 0) {
        g.chapterTimer--;
        if (input.consumeA() || g.chapterTimer <= 0) {
          g.chapter = 0;
          g.chapterTimer = 0;
        }
        input.consumeB();
        return;
      }
      // The wave series runs only while exploring; a missed series returns naturally.
      if(g.mapId==='siam_park'){
        waveTick++;
        if(!save.flags.hm_pukas && !save.flags.pukas_dropped && waveActive(waveTick) && g.px>=2 && g.px<=14 && g.py>=11 && g.py<=14 && !g.moving){
          save.flags.pukas_dropped=true;touchSave();beep('bell');showZone('¡SERIE DE OLAS!');
          say([STORY.siam_pukas_event[0], 'A Borja se le escapa la tabla. La ola deja su Pukas en la orilla, dos pasos al oeste del cartel.']); return;
        }
      }
      if(hop){
        hop.t++;const p=hop.t/22;g.ox=Math.round(hop.dx*32*p);g.oy=Math.round(hop.dy*32*p-Math.sin(Math.PI*p)*10);
        if(hop.t>=22){g.px+=hop.dx*2;g.py+=hop.dy*2;g.ox=g.oy=0;hop=null;save.playerPos={x:g.px,y:g.py,dir:g.dir};touchSave();}
        return;
      }
      if (radarFlash > 0) radarFlash--;
      // Exploracion
      if (g.moving) {
        const [dx, dy] = DV[g.dir];
        const stepPx = (g.mapId === 'tf1' || g.mapId === 'tf5') && carOut() ? 3 : 2;
        g.ox += dx * stepPx; g.oy += dy * stepPx;
        if (Math.abs(g.ox) >= TILE || Math.abs(g.oy) >= TILE) {
          g.px += dx; g.py += dy; g.ox = 0; g.oy = 0; g.moving = false;
          save.mapId = g.mapId;
          save.playerPos = { x: g.px, y: g.py, dir: g.dir };
          if (onTf5Underpass()) {
            // Cota inferior del Puente de Taco: N (y=0) sube a la TF-5; S (y=11) vuelve a la Estacion S/C.
            if (g.py === 0) {
              beep('motor');
              const laneX = 115 + clamp(g.px - TACO_TF5.left, 0, 3);
              enterMap('tf5', laneX, 94, 'up');
              return;
            }
            if (g.py === map().rows.length - 1) {
              beep('motor');
              enterMap('santacruz_sur', 49, 1, 'down', () => showZone('ESTACION DE GUAGUAS'));
              return;
            }
            if (g.py === 6) showZone('BAJO PUENTE DE TACO');
            const honker = TACO_UNDERPASS_VEHICLES.find((v) => v.trainer && v.honkX === g.px && v.honkY === g.py);
            if (honker?.trainer) {
              const hk = 'honked_' + honker.trainer;
              if (!trainerDefeated(save, honker.trainer) && !save.flags[hk]) {
                save.flags[hk] = true;
                touchSave();
                beep('bump');
                promptDuel(honker.trainer);
              }
            }
            touchSave();
            return;
          }
          const tr = map().triggers.find((t) => t.kind === 'step' && t.x === g.px && t.y === g.py);
          // Stepping on hidden sand is still a surf step; a landing keeps the board until the transition.
          if (tr?.action.type === 'landBorondon') { runTrigger(tr); return; }
          if (save.flags.pukas_out && !water(g.px,g.py)) { save.flags.pukas_out=false;touchSave(); }
          if (carOut() && tileAt(g.px, g.py) === 'pothole') potholeHit();
          if (tr) runTrigger(tr);
        }
        return;
      }
      if (!firstEdAsked && save.flags.magomaniaco_done && !save.flags.first_ed_claimed) {
        firstEdAsked = true;
        offerFirstEdition();
        return;
      }
      if (input.consumeA()) { interact(); return; }
      input.consumeB();
      const d = input.lastDir();
      if (d) {
        g.dir = d;
        const [dx, dy] = DV[d];
        if (!solid(g.px + dx, g.py + dy)) g.moving = true;
        else if (gum(g.px + dx, g.py + dy) && g.frame - lastSquish > 65) {
          lastSquish = g.frame; beep('squelch');
          g.banner = { name: '¡CHOF! SUELA PEGADA', t: 72 };
        } else if (!gum(g.px + dx, g.py + dy) && g.frame % 20 === 0) beep('bump');
      }
    };

    // ---------- CAMARA ----------
    const updateCam = () => {
      const m = map();
      const mwPx = m.rows[0].length * TILE, mhPx = m.rows.length * TILE;
      let tx: number, ty: number;
      if (g.anim) { tx = g.tramX * TILE + 32; ty = TRAM_Y + 16; }
      else { tx = g.px * TILE + g.ox + 8; ty = g.py * TILE + g.oy + 8; }
      g.camX = Math.round(clamp(tx - VIEW_W / 2, 0, Math.max(0, mwPx - VIEW_W)));
      g.camY = Math.round(clamp(ty - VIEW_H / 2, 0, Math.max(0, mhPx - VIEW_H)));
    };

    // ---------- DRAW ----------
    const box = (x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = PAL[3]; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = PAL[0]; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      ctx.fillStyle = PAL[3]; ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
      ctx.fillStyle = PAL[0]; ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
    };
    const text = (s: string, x: number, y: number, c = 3) => { ctx.fillStyle = PAL[c]; ctx.fillText(s, x, y); };

    const drawWorld = () => {
      const m = map();
      const mw = m.rows[0].length, mh = m.rows.length;
      const x0 = Math.max(0, Math.floor(g.camX / TILE)), x1 = Math.min(mw - 1, Math.floor((g.camX + VIEW_W) / TILE));
      const y0 = Math.max(0, Math.floor(g.camY / TILE)), y1 = Math.min(mh - 1, Math.floor((g.camY + VIEW_H) / TILE));
      const rumbleY = g.anim?.riding && !g.dialogue ? (Math.floor(g.frame / 3) % 2 === 0 ? 1 : 0) : 0;
      ctx.save();
      ctx.scale(2, 2);
      ctx.translate(0, rumbleY);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        if(m.id==='siam_park' && tileAt(tx,ty)==='wavepool' && !waveActive(waveTick)) drawTile(ctx,'sea',tx*TILE-g.camX,ty*TILE-g.camY,Math.floor(g.frame/18));
        else drawTile(ctx, tileAt(tx, ty), tx * TILE - g.camX, ty * TILE - g.camY, Math.floor(g.frame / 15));
      }
      drawCoastDetails(ctx, m, g.camX, g.camY, g.frame);
      if (m.id === 'veronicas' && y1 >= GOMERA_SEA_START) drawGomeraSea(ctx, g.camX, g.camY, g.frame, borondonVisible);
      if (m.id === 'san_sebastian') drawGomeraTown(ctx, g.camX, g.camY);
      if (m.id === 'santa_ursula' || m.id === 'el_diablito') drawSantaUrsulaDetails(ctx, m.id, g.camX, g.camY, g.frame);
      if (m.id === 'montana_blanca') drawRefugioDetails(ctx, g.camX, g.camY);
      if (m.id === 'sendero_telesforo') drawSenderoDetails(ctx, g.camX, g.camY);
      if (m.id === 'cueva_magec') drawCuevaDetails(ctx, g.camX, g.camY);
      if (m.id === 'parrandero_2') drawCableClubDetails(ctx, g.camX, g.camY);
      // Doble altura en Taco (`calle`): cota 0 (TF-5 hundida + coches) debajo del tablero del puente
      if (m.id === 'calle') {
        drawCalleTf5Ground(ctx, g.camX, g.camY, onTf5Underpass());
        for (const uv of TACO_UNDERPASS_VEHICLES) {
          const ux = uv.x * TILE - g.camX, uy = uv.y * TILE - g.camY;
          drawTf5Vehicle(ctx, uv, ux, uy, g.frame);
          if (onTf5Underpass() && uv.trainer && !trainerDefeated(save, uv.trainer) && Math.floor(g.frame / 18) % 2 === 0) {
            const ex = ux + 6, ey = uy - 9;
            ctx.fillStyle = PAL[3]; ctx.fillRect(ex, ey, 4, 7); ctx.fillRect(ex, ey + 8, 4, 2);
            ctx.fillStyle = PAL[0]; ctx.fillRect(ex + 1, ey + 1, 2, 5); ctx.fillRect(ex + 1, ey + 8, 2, 1);
          }
        }
        if (!onTf5Underpass()) {
          drawCalleTf5BridgeOverpass(ctx, g.camX, g.camY, g.frame, null);
        }
      }
      if (g.tramVisible && m.id === 'calle' && !onTf5Underpass()) {
        drawTram(ctx, Math.round(g.tramX * TILE) - g.camX, TRAM_Y - g.camY, g.frame);
      }
      if (m.id === 'subida') {
        drawGuachincheTruck(ctx, TRUCK_POS.x * TILE - g.camX, TRUCK_POS.y * TILE - g.camY, g.frame);
      }
      if (m.id === 'anaga') {
        drawCayuco(ctx, CAYUCO_POS.x * TILE - g.camX, CAYUCO_POS.y * TILE - g.camY, g.frame);
      }
      if (m.id === 'galdar') {
        drawCayuco(ctx, GALDAR_CAYUCO_POS.x * TILE - g.camX, GALDAR_CAYUCO_POS.y * TILE - g.camY, g.frame);
        if (!olsenSailed()) drawSSOlsen(ctx, OLSEN_POS.x * TILE - g.camX, OLSEN_POS.y * TILE - g.camY, g.frame);
      }
      // Autopista TF-5: ATR-72 en TFN Los Rodeos y Guaguas TITSA + VW Caddy de la cola de Anchieta y el Norte!
      if (m.id === 'tf5') {
        drawBinterPlane(ctx, TF5_BINTER_POS.x * TILE - g.camX, TF5_BINTER_POS.y * TILE - g.camY, Math.floor(g.frame / 4));
        for (const v of TF5_VEHICLES) {
          if (v.x + v.w < x0 - 1 || v.x > x1 + 1 || v.y + v.h < y0 - 1 || v.y > y1 + 1) continue;
          const vx = v.x * TILE - g.camX, vy = v.y * TILE - g.camY;
          drawTf5Vehicle(ctx, v, vx, vy, g.frame);
          if (v.trainer && !trainerDefeated(save, v.trainer) && Math.floor(g.frame / 18) % 2 === 0) {
            const ex = vx + Math.floor((v.w * TILE) / 2) - 2;
            const ey = vy - 9;
            ctx.fillStyle = PAL[3]; ctx.fillRect(ex, ey, 4, 7); ctx.fillRect(ex, ey + 8, 4, 2);
            ctx.fillStyle = PAL[0]; ctx.fillRect(ex + 1, ey + 1, 2, 5); ctx.fillRect(ex + 1, ey + 8, 2, 1);
          }
        }
      }
      // Autopista TF-1: Montana Roja, Binter ATR-72, Carreta de la Romeria y Guaguas TITSA + VW Caddy!
      if (m.id === 'tf1') {
        drawCarretaRomera(ctx, TF1_ROMERIA_CART_POS.x * TILE - g.camX, TF1_ROMERIA_CART_POS.y * TILE - g.camY, g.frame);
        drawMontanaRoja(ctx, MONTANA_ROJA_POS.x * TILE - g.camX, MONTANA_ROJA_POS.y * TILE - g.camY, g.frame);
        drawBinterPlane(ctx, BINTER_PLANE_POS.x * TILE - g.camX, BINTER_PLANE_POS.y * TILE - g.camY, Math.floor(g.frame / 4));
        for (const v of TF1_VEHICLES) {
          if (v.x + v.w < x0 - 1 || v.x > x1 + 1 || v.y + v.h < y0 - 1 || v.y > y1 + 1) continue;
          const vx = v.x * TILE - g.camX, vy = v.y * TILE - g.camY;
          if (v.kind === 'guagua') drawGuaguaTitsa(ctx, vx, vy, g.frame);
          else drawVWCaddy(ctx, vx, vy, g.frame, v.variant ?? 'reparto');
          if (!trainerDefeated(save, v.trainer) && Math.floor(g.frame / 18) % 2 === 0) {
            const ex = vx + Math.floor((v.w * TILE) / 2) - 2;
            const ey = vy - 9;
            ctx.fillStyle = PAL[3]; ctx.fillRect(ex, ey, 4, 7); ctx.fillRect(ex, ey + 8, 4, 2);
            ctx.fillStyle = PAL[0]; ctx.fillRect(ex + 1, ey + 1, 2, 5); ctx.fillRect(ex + 1, ey + 8, 2, 1);
          }
        }
      }
      // Aviso parpadeante sobre el cartel raro de BERSHKA una vez vencido el Palmetum
      if (m.id === 'meridiano' && save.flags.boliche_4 && !save.flags.bershka_opened && Math.floor(g.frame / 18) % 2 === 0) {
        const px = BERSHKA_POSTER.x * TILE + 6 - g.camX;
        const py = BERSHKA_POSTER.y * TILE - 7 - g.camY;
        ctx.fillStyle = PAL[3]; ctx.fillRect(px, py, 4, 7); ctx.fillRect(px, py + 8, 4, 2);
        ctx.fillStyle = PAL[0]; ctx.fillRect(px + 1, py + 1, 2, 5); ctx.fillRect(px + 1, py + 8, 2, 1);
      }
      // Flecha vial ← TF-1 pintada en el asfalto en cuanto se abre la autopista tras la Torre
      if (m.id === 'santacruz_sur' && save.flags.has_bucio) {
        const ax = 2 * TILE - g.camX, ay = 9 * TILE - g.camY;
        ctx.fillStyle = PAL[0];
        ctx.fillRect(ax + 4, ay + 7, 9, 2);
        ctx.fillRect(ax + 2, ay + 6, 3, 4);
        ctx.fillRect(ax + 4, ay + 5, 2, 6);
      }
      // Flecha vial ↑ TF-5 pintada en la salida norte junto a la Estacion de Guaguas de S/C
      if (m.id === 'santacruz_sur') {
        const nx = 49 * TILE - g.camX, ny = 5 * TILE - g.camY;
        ctx.fillStyle = PAL[0];
        ctx.fillRect(nx + 7, ny + 4, 2, 9);
        ctx.fillRect(nx + 6, ny + 2, 4, 3);
        ctx.fillRect(nx + 5, ny + 4, 6, 2);
      }
      // Barrera del parking del Palmetum: bajada a pie, levantada con el todoterreno
      if (m.id === 'santacruz_sur') {
        const open = carOut();
        for (const p of PARKING_GATE) {
          const bx = p.x * TILE - g.camX, by = p.y * TILE - g.camY;
          ctx.fillStyle = PAL[3];
          if (open) {
            ctx.fillRect(bx + 2, by - 6, 4, TILE + 6);
            ctx.fillStyle = PAL[0];
            ctx.fillRect(bx + 3, by - 5, 2, TILE + 4);
          } else {
            ctx.fillRect(bx, by + 5, TILE, 5);
            ctx.fillStyle = PAL[0];
            for (let i = 0; i < 4; i++) ctx.fillRect(bx + 1 + i * 4, by + 6, 2, 3);
            ctx.fillRect(bx + 1, by + 5, 3, 9);
          }
        }
      }
      if (m.id === 'cuevas_pintadas' && !save.flags.cueva_door_open) {
        drawKitchenDoor(ctx, CUEVA_DOOR.x * TILE - g.camX, CUEVA_DOOR.y * TILE - g.camY, g.cuevaFirstFound);
      }
      if (m.id === 'las_americas') {
        drawCarretaRomera(ctx, AMER_CARRETA_POS.x * TILE - g.camX, AMER_CARRETA_POS.y * TILE - g.camY, g.frame);
        drawGuaguaTitsa(ctx, AMER_GUAGUA_POS.x * TILE - g.camX, AMER_GUAGUA_POS.y * TILE - g.camY, g.frame);
      }
      for (const n of m.npcs) {
        const s = npcState(n);
        if (isNpcHidden(n, s)) continue;
        if (s.x < x0 - 1 || s.x > x1 + 1 || s.y < y0 - 1 || s.y > y1 + 1) continue;
        const bob =
          n.id === 'cathaysa_surf' ? (Math.floor(g.frame / 14) % 2 === 0 ? -1 : 1)
          : (n.id === 'acaymo' || n.id === 'domingo' || n.id === 'cathaysa_gym' || n.id === 'pedro' || n.id === 'bentejui' || n.id === 'gym_palmetum' || n.id === 'coco_ursula' || n.id === 'coco_diablito' || n.id === 'mago_americas' || n.id === 'ricardo_garcia') && Math.floor(g.frame / 30) % 2 ? -1 : 0;
        const nx = s.x * TILE - g.camX, ny = s.y * TILE - g.camY;
        if (!drawGomeraVessel(ctx, n.sprite, nx, ny, g.frame)) {
          const gomeraCopy = (n.id === 'tio_suso' && g.mapId === 'parrandero' && save.lastCenter === 'gomera')
            || (n.id === 'conserje' && g.mapId === 'colegio' && save.lastSchool === 'gomera');
          drawSprite(ctx, gomeraCopy ? CASIMIRO : (NPC_SPR[n.sprite] ?? SPRITES.neighbor), nx, ny + bob);
        }

        const tid = resolveTrainerId(n);
        const showAlert =
          (tid && !trainerDefeated(save, tid)) ||
          (n.id === 'magomaniaco' && !!save.flags.magomaniaco_done && !save.flags.first_ed_claimed) ||
          n.id === 'cathaysa_surf' ||
          (n.id === 'pedro' && !save.flags.cathaysa_rescued) ||
          (n.id === 'carmelo' && !!save.flags.boliche_2 && !save.flags.cayuco_done) ||
          (n.id === 'portero_cuevas' && !save.flags.heard_canarion) ||
          (n.id === 'capitan_olsen' && !save.flags.got_translator) ||
          (n.id === 'carmelo_galdar' && !!save.flags.boliche_3 && !save.flags.hm_todo_terreno) ||
          (n.id === 'enriscada_bershka' && !save.flags.saw_enriscada_bershka) ||
          (n.id === 'bruja_teresitas' && !save.flags.has_bucio) ||
          (n.id === 'dona_binter' && !save.flags.hm_binter) ||
          (n.id === 'operario_adeje' && !save.flags.romeria_done) ||
          (n.id === 'crema_fp50' && !save.flags.has_crema_fp50) ||
          (n.id === 'guiri_dave' && !save.flags.hm_salto_pastor) ||
          (n.id === 'surfero_borja' && !save.flags.hm_pukas);
        if (showAlert) {
          const isRepeat = !!(tid && TRAINERS[tid]?.repeatable);
          const blink = Math.floor(g.frame / (isRepeat ? 26 : 20)) % 2 === 0;
          if (blink) {
            const ex = s.x * TILE + 6 - g.camX;
            const ey = s.y * TILE - 9 - g.camY + bob;
            if (isRepeat) {
              ctx.fillStyle = PAL[3];
              ctx.fillRect(ex - 2, ey, 8, 9);
              ctx.fillStyle = PAL[0];
              ctx.fillRect(ex - 1, ey + 1, 2, 4); ctx.fillRect(ex - 1, ey + 6, 2, 2);
              ctx.fillRect(ex + 3, ey + 1, 2, 4); ctx.fillRect(ex + 3, ey + 6, 2, 2);
            } else {
              ctx.fillStyle = PAL[3]; ctx.fillRect(ex, ey, 4, 7); ctx.fillRect(ex, ey + 8, 4, 2);
              ctx.fillStyle = PAL[0]; ctx.fillRect(ex + 1, ey + 1, 2, 5); ctx.fillRect(ex + 1, ey + 8, 2, 1);
            }
          }
        }
      }
      const playerScreenX = g.px * TILE + g.ox - g.camX;
      const playerScreenY = g.py * TILE + g.oy - g.camY;
      if (!g.hidden) {
        const spr = g.dir === 'up' ? SPRITES.player_up : g.dir === 'down' ? SPRITES.player_down : SPRITES.player_right;
        const bob = g.moving && Math.floor(g.frame / 4) % 2 ? -1 : 0;
        if(save.flags.pukas_out){ctx.fillStyle=PAL[0];ctx.fillRect(playerScreenX-2,playerScreenY+14,21,3);ctx.fillStyle=PAL[2];ctx.fillRect(playerScreenX,playerScreenY+15,16,1);}
        const carSpr = g.dir === 'up' ? CAR_SPRITES.up : g.dir === 'down' ? CAR_SPRITES.down : CAR_SPRITES.right;
        drawSprite(ctx, carOut() ? carSpr : spr, playerScreenX, playerScreenY + bob, g.dir === 'left');
      }
      // Capa superior (cota 1): tablero del Puente de Taco + tranvia SOBRE el Toyota en el paso inferior
      if (m.id === 'calle' && onTf5Underpass()) {
        drawCalleTf5BridgeOverpass(ctx, g.camX, g.camY, g.frame, { x: playerScreenX, y: playerScreenY });
        if (g.tramVisible) {
          drawTram(ctx, Math.round(g.tramX * TILE) - g.camX, TRAM_Y - g.camY, g.frame);
        }
      }
      // TF-5: pasarela elevada de Padre Anchieta, lluvia permanente de Tacoronte y fogonazo de radar en El Sauzal
      if (m.id === 'tf5') {
        drawAnchietaBridge(ctx, g.camX, g.camY);
        drawTacoronteRain(ctx, g.camX, g.camY, g.frame, inTacoronteRain(g.px, g.py));
        if (radarFlash > 0 && radarFlash % 3 !== 0) {
          ctx.fillStyle = PAL[0];
          ctx.fillRect(0, 0, VIEW_W, 5);
          ctx.fillRect(0, VIEW_H - 5, VIEW_W, 5);
          ctx.fillRect(0, 0, 5, VIEW_H);
          ctx.fillRect(VIEW_W - 5, 0, 5, VIEW_H);
        }
      }
      if (!g.dialogue && !g.moving && !g.hidden && !g.anim) {
        const [dx, dy] = DV[g.dir];
        const fx = g.px + dx, fy = g.py + dy;
        const under = onTf5Underpass();
        const t = !under && m.triggers.find((tt) => tt.kind === 'interact' && tt.x === fx && tt.y === fy);
        const across = !under && tileAt(fx, fy) === 'counter' ? npcHere(fx + dx, fy + dy) : null;
        const special = under
          ? !!tacoUnderpassVehicleAt(fx, fy)
          : (tileAt(fx, fy) === 'gtable' || kdoorBlocks(fx, fy) || truckBlocks(fx, fy) ||
            cayucoBlocks(fx, fy) || olsenBlocks(fx, fy) ||
            (g.mapId === 'tf1' && !!tf1VehicleAt(fx, fy)) ||
            (g.mapId === 'tf5' && !!tf5VehicleAt(fx, fy)));
        if ((t || (!under && npcHere(fx, fy)) || across || special) && Math.floor(g.frame / 20) % 2) {
          const bx = g.px * TILE + 6 - g.camX, by = g.py * TILE - 6 - g.camY;
          ctx.fillStyle = PAL[3]; ctx.fillRect(bx, by, 4, 2); ctx.fillRect(bx + 1, by + 2, 2, 2);
        }
      }
      ctx.restore();
    };

    // Noche cerrada en la TF-134: al Landcruiser le fallan y parpadean los faros
    const drawNight = () => {
      if (!map().night || g.mapId === 'veronicas') return; // Ciudad Fucsia uses a fixed violet palette at night.
      const cx = (g.px * TILE + g.ox + 8 - g.camX) * 2;
      const cy = (g.py * TILE + g.oy + 8 - g.camY) * 2;
      const [dx, dy] = DV[g.dir];
      const flicker = g.frame % 67 < 4 ? 0.62 : g.frame % 29 < 2 ? 0.8 : 1;
      const r = (carOut() ? 56 : 30) * flicker;
      const fx = cx + (carOut() ? dx * 18 : 0);
      const fy = cy + (carOut() ? dy * 18 : 0);
      const grad = ctx.createRadialGradient(fx, fy, r * 0.22, fx, fy, r);
      grad.addColorStop(0, 'rgba(6,12,6,0.05)');
      grad.addColorStop(0.65, 'rgba(6,14,6,0.88)');
      grad.addColorStop(1, 'rgba(4,10,4,0.985)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      if (carOut() && flicker > 0.7) {
        ctx.fillStyle = 'rgba(210,235,110,0.14)';
        ctx.beginPath();
        ctx.arc(fx + dx * 12, fy + dy * 12, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    const drawHUD = () => {
      if (!save.flags.starterChosen || g.cardView || g.slots || g.title || g.chapter > 0 || g.cayuco || g.romeria) return;
      if (g.mapId === 'veronicas' || g.mapId === 'papagayos') {
        const place = g.mapId === 'papagayos' ? 'PAPAGAYOS · GYM 05'
          : g.py < GOMERA_SEA_START ? coastLocation(g.px, g.py)
          : tileAt(g.px, g.py) === 'deck' ? 'SAN SEBASTIÁN' : 'CANAL DE LA GOMERA';
        ctx.fillStyle = PAL[3]; ctx.fillRect(5,5,place.length*8+14,16);
        ctx.fillStyle = PAL[0];ctx.fillText(place,12,9);return;
      }
      const boliches = RUTA.filter((r) => save.flags['boliche_' + r.n]).length;
      const line1 = `${save.duros}D · BOL ${boliches}/8`;
      const line2 = `MAZO ${save.deck.length}/${MAX_DECK}`;
      const bw = Math.max(line1.length, line2.length) * 8 + 14;
      ctx.fillStyle = PAL[3]; ctx.fillRect(4, 4, bw, 26);
      ctx.fillStyle = PAL[0]; ctx.fillRect(6, 6, bw - 4, 22);
      text(line1, 10, 9, 3);
      text(line2, 10, 19, 2);
    };

    const drawBanner = () => {
      if (!g.banner || g.dialogue || g.cardView || g.slots || g.cayuco || g.romeria) return;
      const s = g.banner.name;
      const bw = s.length * 8 + 16;
      const slide = g.banner.t > 138 ? (150 - g.banner.t) * 2 - 24 : g.banner.t < 12 ? g.banner.t * 2 - 24 : 0;
      const bx = Math.max(4, W - bw - 6), by = 6 + slide;
      ctx.fillStyle = PAL[3]; ctx.fillRect(bx, by, bw, 20);
      ctx.fillStyle = PAL[0]; ctx.fillRect(bx + 2, by + 2, bw - 4, 16);
      text(s, bx + 8, by + 6, 3);
    };

    const drawDialogue = () => {
      const d = g.dialogue!;
      box(0, H - 64, W, 64);
      const pg = d.pages[d.page];
      let rem = d.chars;
      pg.forEach((line, i) => {
        const seg = line.slice(0, Math.max(0, rem));
        rem -= line.length + 1;
        text(seg, 14, H - 64 + 16 + i * 16);
      });
      const full = pg.join('\n').length;
      if (d.chars >= full) {
        if (d.choice && d.page === d.pages.length - 1) {
          const ch = d.choice;
          const maxLen = Math.max(...ch.options.map((o) => o.length));
          const bw = Math.min(W - 16, Math.max(128, (maxLen + 1) * 8 + 18));
          const bh = ch.options.length * 16 + 16;
          box(W - bw - 8, H - 64 - bh, bw, bh);
          ch.options.forEach((o, i) => text((ch.sel === i ? '>' : ' ') + o, W - bw + 2, H - 64 - bh + 10 + i * 16));
        } else if (Math.floor(g.frame / 20) % 2) {
          ctx.fillStyle = PAL[3];
          ctx.fillRect(W - 20, H - 16, 8, 2); ctx.fillRect(W - 18, H - 14, 4, 2); ctx.fillRect(W - 17, H - 12, 2, 2);
        }
      }
    };

    const drawCardView = () => {
      const id = g.cardView!;
      const c = CARDS[id];
      const info = STARTER_INFO[id];
      ctx.fillStyle = PAL[1]; ctx.fillRect(0, 0, W, H);
      box(32, 4, 256, 280);
      ctx.fillStyle = PAL[3]; ctx.fillRect(40, 12, 240, 14);
      text(c.name.toUpperCase(), 44, 15, 0);
      const manaStr = formatMana(c.mana, true);
      const mw = manaStr.length * 8 + 6;
      ctx.fillStyle = PAL[0]; ctx.fillRect(278 - mw, 13, mw, 12);
      text(manaStr, 281 - mw, 15, 3);

      ctx.fillStyle = PAL[3]; ctx.fillRect(52, 30, 216, 132);
      ctx.fillStyle = PAL[1]; ctx.fillRect(54, 32, 212, 128);
      ctx.fillStyle = PAL[2];
      for (let i = 0; i < 12; i++) ctx.fillRect(58 + i * 17, 152, 12, 2);
      drawCreature(ctx, id, 100, 36, 5);
      if (Math.floor(g.frame / 16) % 2 === 0) {
        ctx.fillStyle = PAL[0];
        ctx.fillRect(66, 42, 4, 4); ctx.fillRect(68, 40, 1, 8); ctx.fillRect(65, 44, 8, 1);
        ctx.fillRect(246, 142, 3, 3);
      }

      ctx.fillStyle = PAL[2]; ctx.fillRect(40, 166, 240, 14);
      text(`${c.atk}/${c.hp} ${info.role}`, 44, 169, 0);
      let y = 184;
      for (const k of c.keywords ?? []) { for (const l of wrap(KEYWORD_TEXT[k], 29)) { text(l, 44, y); y += 10; } }
      y += 2;
      for (const l of wrap(info.deckStyle, 29)) { if (y < 254) { text(l, 44, y, 2); y += 10; } }
      ctx.fillStyle = PAL[3]; ctx.fillRect(40, 264, 240, 12);
      text('A: ELEGIR    B: VOLVER', 72, 266, 0);
    };

    const drawChapter = () => {
      ctx.fillStyle = PAL[3]; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = PAL[1]; ctx.fillRect(14, 14, W - 28, H - 28);
      ctx.fillStyle = PAL[3]; ctx.fillRect(18, 18, W - 36, H - 36);
      ctx.fillStyle = PAL[0]; ctx.fillRect(22, 22, W - 44, H - 44);
      text('CAPITULO 1', 120, 48, 3);
      text('LA LITURGIA DE', 104, 76, 3);
      text('RAMON Y CAJAL', 108, 92, 3);
      text('Vuelve a WEYLER (este) y', 64, 122, 2);
      text('tira TO TIESO PARRIBA (norte)', 44, 136, 2);
      text('hasta el Guachinche-Truck', 60, 150, 2);
      text('del Campus Central ULL!', 68, 164, 2);
      ctx.fillStyle = PAL[2]; ctx.fillRect(40, 188, W - 80, 2);
      if (Math.floor(g.frame / 20) % 2) text('PULSA A', 132, 206, 3);
      text('8 BOLICHES -> ALTO MANDO', 64, 232, 2);
    };

    const drawTitle = () => {
      ctx.fillStyle = PAL[0]; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.scale(2, 2);
      for (let x = 0; x < 10; x++) {
        drawTile(ctx, 'sea', x * 16, 128, Math.floor(g.frame / 15));
        drawTile(ctx, x % 3 === 1 ? 'palm' : 'sidewalk', x * 16, 112, 0);
      }
      drawCreature(ctx, 'cabra', 12, 86, 1); drawCreature(ctx, 'angelote', 68, 86, 1); drawCreature(ctx, 'pinzon', 124, 86, 1);
      drawSprite(ctx, SPRITES.player_down, 72, 60);
      ctx.restore();
      ctx.fillStyle = PAL[3]; ctx.fillRect(20, 20, 280, 50);
      const centered = (s: string, y: number, shade: number) => text(s, Math.round((W - ctx.measureText(s).width) / 2), y, shade);
      centered('MAGOMON', 28, 0); centered('CRONICAS DEL GUIRUFO', 46, 0);
      centered('un juego y medio', 78, 2);
      centered('mitad cartas - mitad autobattler', 90, 2);
      if (Math.floor(g.frame / 30) % 2) centered(hasProgress ? 'PULSA A PARA CONTINUAR' : 'PULSA A/Z O TOCA', 230, 3);
      centered('TENERIFE  2026', 262, 2);
    };

    let raf = 0;
    const loop = (now: number) => {
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textBaseline = 'top';
      if (g.mapId === 'veronicas' && !g.moving && g.fade?.dir !== 1) {
        // Hold the tide through each step and never raise a reef underneath the player.
        borondonVisible = borondonAboveWater(now) && (borondonVisible || !borondonBankAt(g.px, g.py));
      }
      update();
      // Expose readable location/dialogue to assistive technology and keyboard-only navigation tests.
      const where = `${g.px},${g.py}`;
      if (canvas.dataset.map !== g.mapId) { canvas.dataset.map = g.mapId; canvas.setAttribute('aria-label', `Mapa jugable: ${map().name}. Muévete con las flechas; Z para interactuar.`); }
      if (canvas.dataset.position !== where) canvas.dataset.position = where;
      const elev = onTf5Underpass() ? 'under' : 'upper';
      if (canvas.dataset.elevation !== elev) canvas.dataset.elevation = elev;
      const utterance = g.dialogue ? g.dialogue.pages[g.dialogue.page].join(' ') : '';
      const d = g.dialogue;
      const choice = d?.choice && d.page === d.pages.length - 1 && d.chars >= d.pages[d.page].join('\n').length ? d.choice.options[d.choice.sel] : '';
      if (canvas.dataset.dialogue !== utterance || canvas.dataset.choice !== choice) {
        canvas.dataset.dialogue = utterance; canvas.dataset.choice = choice;
        if (liveDialogue.current) liveDialogue.current.textContent = choice ? `${utterance} Opción: ${choice}` : utterance;
      }
      const phase = g.title ? 'título' : g.fade ? 'transición' : g.dialogue ? 'diálogo' : g.rally ? 'cutscene' : 'exploración';
      if (canvas.dataset.phase !== phase) canvas.dataset.phase = phase;
      updateCam();
      const palette = !g.title && !g.cayuco && !g.romeria && FUCSIA_MAPS.includes(g.mapId) ? FUCSIA_PALETTE : GAME_BOY_PALETTE;
      for (let i = 0; i < PAL.length; i++) PAL[i] = palette[i];
      if (g.title) drawTitle();
      else if (g.cayuco) {
        drawCayucoFeverDream(ctx, W, H, g.cayuco.stage, g.cayuco.t);
        if (g.dialogue) drawDialogue();
      } else if (g.romeria) {
        drawRomeriaCutscene(ctx, W, H, g.romeria.stage, g.romeria.t);
        if (g.dialogue) drawDialogue();
      } else if (g.rally) {
        drawOrotavaRally(ctx, W, H, g.rally.stage, g.rally.t);
        if (g.dialogue) drawDialogue();
      } else {
        drawWorld();
        drawNight();
        drawHUD();
        drawBanner();
        if (g.cardView) drawCardView();
        if (g.slots) drawSlotMachine(ctx, W, H, g.slots);
        if (g.dialogue) drawDialogue();
        if (g.chapter > 0) drawChapter();
      }
      if (g.fade) {
        ctx.fillStyle = PAL[3];
        ctx.globalAlpha = clamp(g.fade.t, 0, 1);
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      for (let i = 0; i < PAL.length; i++) PAL[i] = GAME_BOY_PALETTE[i];
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onSayEvent = (e: Event) => {
      const lines = (e as CustomEvent<string[]>).detail;
      if (Array.isArray(lines) && lines.length > 0 && !g.title) say(lines);
    };

    const onFlyEvent = (e: Event) => {
      const d = (e as CustomEvent<import('./binterDestinations').BinterDestination>).detail;
      if (!d || g.title) return;
      // Aeropuertos sin centro parrandero (TFN) aterrizan directamente en su terminal/carretera.
      const landing = d.airport
        ? { mapId: d.airport.mapId as MapId, x: d.airport.x, y: d.airport.y, dir: d.airport.dir }
        : PARRANDEROS[(d.parrandero ?? d.id) as ParranderoId]?.outside;
      if (!landing) return;
      if (d.parrandero) save.lastCenter = d.parrandero;
      save.flags.car_out = false;
      save.flags.tf5_underpass = false;
      touchSave();
      beep('fanfare');
      enterMap(landing.mapId, landing.x, landing.y, landing.dir, () => {
        showZone(`✈️ ${d.label.toUpperCase()}`);
        say(STORY.binter_fly(d.label));
      });
    };
    const onBucioEvent = () => {
      if (g.title) return;
      beep('bucio');
      if (g.mapId === 'tf1' && g.px <= 18) {
        startRomeriaCutscene();
      } else {
        say([
          '🐚 BOOOOOOO-UUUUU!! Soplas el Bucio de Las Teresitas a pleno pulmon.',
          g.mapId === 'tf1'
            ? 'El eco retumba por toda la autopista. ¡Acercate al final de la TF-1 (a la entrada cortada de ADEJE, al oeste) y tocalo frente a la ROMERIA para colarte en la fiesta!'
            : 'Suena como una romeria bajando del monte. Si te encuentras una ROMERIA cortando la entrada a ADEJE al final de la TF-1, tocalo ahi mismo!',
        ]);
      }
    };
    const fieldBusy=()=>!!(g.title||g.moving||g.dialogue||g.fade||g.romeria||g.cayuco||g.slots||hop);
    const onPukasEvent = () => {
      if(!save.flags.hm_pukas||fieldBusy()) return;
      if(carOut()){say(['Primero aparca el Toyota. La tabla no lleva enganche de remolque.']);return;}
      if(save.flags.pukas_out){say(['Ya estás sobre la Pukas. Rema hacia la orilla para bajarte.']);return;}
      const [dx,dy]=DV[g.dir],x=g.px+dx,y=g.py+dy;
      if(!water(x,y)||npcHere(x,y)||tf1PropBlocks(x,y)){say(['Necesitas estar en la orilla mirando al agua: prueba en la piscina de olas, Troya, San Andrés o la orilla de Candelaria. No se surfea en el acuario.']);return;}
      save.flags.pukas_out=true;g.moving=true;touchSave();beep('open');showZone('PUKAS · SURF');
    };
    const onSaltoPastorEvent = () => {
      if(!save.flags.hm_salto_pastor||fieldBusy())return;
      const [dx,dy]=DV[g.dir],x=g.px+dx*2,y=g.py+dy*2;
      if(carOut()||save.flags.pukas_out||!vaultable(g.mapId,tileAt(g.px+dx,g.py+dy))||solid(x,y)||map().triggers.some(t=>t.kind==='step'&&t.x===x&&t.y===y)){
        say(['A pie, mira a un risco bajo con suelo libre al otro lado. No puedes saltar una valla ni un edificio.']);return;
      }
      beep('open');hop={dx,dy,t:0};showZone('SALTO DEL PASTOR');
    };
    window.addEventListener('magomon:say', onSayEvent);
    window.addEventListener('magomon:fly', onFlyEvent);
    window.addEventListener('magomon:bucio', onBucioEvent);
    window.addEventListener('magomon:pukas', onPukasEvent);
    window.addEventListener('magomon:salto_pastor', onSaltoPastorEvent);
    return () => {
      cancelAnimationFrame(raf); ui.worldActive=false; input.held.clear(); input.consumeA();input.consumeB();
      window.removeEventListener('magomon:say', onSayEvent);
      window.removeEventListener('magomon:fly', onFlyEvent);
      window.removeEventListener('magomon:bucio', onBucioEvent);
      window.removeEventListener('magomon:pukas', onPukasEvent);
      window.removeEventListener('magomon:salto_pastor', onSaltoPastorEvent);
    };
  }, [resume, afterBattle, blackoutLines, postWinLines]);

  return (
    <>
      <canvas ref={canvasRef} role="application" tabIndex={0}
        aria-label="Mapa de Magomon. Flechas para moverse; Z para interactuar."
        onPointerDown={(e) => { e.preventDefault(); input.tapA(); }}
        width={W} height={H} className="w-full h-full block"
        style={{ imageRendering: 'pixelated', touchAction: 'none' }}
      />
      <span ref={liveDialogue} className="sr-only" role="status" aria-live="polite" aria-atomic="true" />
    </>
  );
}
