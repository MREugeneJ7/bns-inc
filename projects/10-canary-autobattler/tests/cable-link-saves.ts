// Genera las partidas de las dos "máquinas" para tests/cable-link-browser.mjs.
// Se empaqueta con esbuild igual que el resto de tests y escribe en CABLE_SAVES (por defecto /tmp/pw/saves).
import fs from 'node:fs';
import { exportSaveJSON, importSaveJSON, loadPreset, save } from '../src/game/save';
import { CARDS } from '../src/battle/cards';
import { tradeable, validateLinkDeck, deckCounts } from '../src/link/club';
const DIR = process.env.CABLE_SAVES || '/tmp/pw/saves';
fs.mkdirSync(DIR, { recursive: true });
const out: Record<string, unknown> = {};
function make(name: string, preset: 'cueva_magec' | 'montana_blanca', starter: 'cabra' | 'angelote', mapId: string, x: number, y: number, extraPc: string[] = []) {
  loadPreset(preset, starter);
  save.mapId = mapId as never;
  save.playerPos = { x, y, dir: 'up' };
  save.lastCenter = 'weyler';
  save.flags.cable_club_intro = true;
  save.pc.push(...extraPc);
  const json = exportSaveJSON();
  if (!importSaveJSON(json)) throw new Error('la partida ' + name + ' no se deja importar');
  if (save.mapId !== mapId || save.playerPos.x !== x || save.playerPos.y !== y) throw new Error(`import movió al jugador: ${save.mapId} ${JSON.stringify(save.playerPos)}`);
  fs.writeFileSync(`${DIR}/${name}.json`, json);
  out[name] = { deck: save.deck.length, pc: save.pc.length, deckOk: validateLinkDeck(deckCounts(save.deck)), creatures: tradeable(save).slice(0, 6).map((c) => `${c.id}=${CARDS[c.id].name}x${c.owned}`), champion: !!save.flags.campeon_teide };
}
make('tradeA', 'cueva_magec', 'cabra', 'parrandero_2', 3, 4, ['cabra_titan_teide']);
make('tradeB', 'cueva_magec', 'angelote', 'parrandero_2', 3, 4, ['leviatan_bajamar']);
make('battleA', 'cueva_magec', 'cabra', 'parrandero_2', 10, 4);
make('battleB', 'cueva_magec', 'angelote', 'parrandero_2', 10, 4);
make('stairsChampion', 'cueva_magec', 'cabra', 'parrandero', 5, 1);
make('stairsRookie', 'montana_blanca', 'cabra', 'parrandero', 5, 1);
console.log(JSON.stringify(out, null, 1));
