import assert from 'node:assert/strict';
import { CARDS, EVO_CHAINS, EVO_NEXT, KEYWORD_TEXT } from '../src/battle/cards';
import { createBattle, step, type Minion } from '../src/battle/engine';
import { CREATURES } from '../src/game/creatureArt';
import { NIGHT_TALKS } from '../src/game/nightRoute';
import { RUTA } from '../src/game/ruta';
import { TRAINERS } from '../src/game/trainers';

function minion(id: string, uid: number): Minion {
  const def = CARDS[id];
  return { uid, def, atk: def.atk!, hp: def.hp!, maxHp: def.hp!, shine: 0,
    canAttack: true, attacksLeft: 1, stealthed: false };
}

assert.equal(RUTA[4].type, 'VENENO');
assert.equal(TRAINERS.gym_papagayos.gym, 5);
assert.equal(TRAINERS.gym_papagayos.ace, 'bidon_toxico');
assert.ok(TRAINERS.gym_papagayos.deck.filter(id => CARDS[id].keywords?.includes('veneno')).length >= 8);
assert.ok(TRAINERS.gym_papagayos.taunt.join(' ').toLowerCase().includes('garrafón'));
assert.ok(KEYWORD_TEXT.veneno.includes('al final'));
assert.deepEqual(EVO_CHAINS.garrafon, ['chupito_garrafon', 'cubata_garrafon', 'bidon_toxico']);
assert.equal(EVO_NEXT.cubata_garrafon, 'bidon_toxico');
for (const id of EVO_CHAINS.garrafon) {
  assert.ok(CREATURES[id] && CREATURES[id].length === 16 && CREATURES[id].every(row => row.length === 16));
}
console.log('ok - Papagayos es tipo veneno y usa la cadena del garrafón');

const battle = createBattle({ name: 'TU', deck: ['tierra_malpais'] }, { name: 'YESSICA', deck: ['tierra_malpais'] });
battle.phase = 'attack';
battle.players[0].board = [minion('chupito_garrafon', 1)];
battle.players[1].board = [minion('lapa_acorazada', 2)];
const collision = step(battle);
assert.equal(collision.players[1].board[0].poisoned, true, 'la criatura atacada queda envenenada');
assert.equal(battle.players[1].board[0].poisoned, undefined, 'step no muta el estado anterior');
collision.active = 1;
collision.phase = 'end';
const afterTurn = step(collision);
assert.equal(afterTurn.players[1].board[0].hp, 7, 'recibe 1 de daño de veneno tras regenerarse');
assert.ok(afterTurn.log.some(s => s.includes('veneno hace 1')));

const direct = createBattle({ name: 'TU', deck: ['tierra_malpais'] }, { name: 'YESSICA', deck: ['tierra_malpais'] });
direct.phase = 'attack';
direct.players[0].board = [minion('cubata_garrafon', 3)];
const hit = step(direct);
assert.equal(hit.players[1].poisoned, true, 'un ataque directo puede envenenar al entrenador');
hit.active = 1;
hit.phase = 'end';
const tick = step(hit);
assert.equal(tick.players[1].life, hit.players[1].life - 1);
assert.ok(tick.log.some(s => s.includes('veneno hace 1')));
const lethal = { ...tick, active: 1 as const, phase: 'end' as const, players: [{...tick.players[0]}, {...tick.players[1], life: 1}] as typeof tick.players };
assert.equal(step(lethal).winner, 0, 'el veneno puede terminar el duelo');
console.log('ok - el veneno se aplica en combate, persiste y hace daño real al final del turno');

assert.ok(NIGHT_TALKS.malick.join(' ').includes('¿Quieres algo?') || NIGHT_TALKS.malick.join(' ').includes('¿Quieres algo,'));
assert.ok(NIGHT_TALKS.malick.join(' ').includes('Hierba'));
assert.ok(NIGHT_TALKS.ibrahima.join(' ').includes('aguantar hasta que amanezca'));
assert.ok(!NIGHT_TALKS.ibrahima.join(' ').includes('fundas'));
console.log('ok - el ¿quieres algo? de Las Verónicas apunta al ambiente que pidió el jugador');