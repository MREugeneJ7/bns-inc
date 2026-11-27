import assert from 'node:assert/strict';
import { MAPS, nearestParrandero, type MapId } from '../src/game/maps';
import { stickyAt } from '../src/game/nightRoute';
import { SOLID, DRIVABLE_TILES } from '../src/game/sprites';
import { AMER_CARRETA_POS, AMER_GUAGUA_POS } from '../src/game/mapsTf1';
import { save, loadPreset, importSaveJSON, exportSaveJSON, blackoutToNearestCenter } from '../src/game/save';
import { TRAINERS } from '../src/game/trainers';
import { CARDS } from '../src/battle/cards';
import { createBattle, step } from '../src/battle/engine';
import { grantTrainerVictory, claimBoosterReward } from '../src/game/rewards';
import { RUTA } from '../src/game/ruta';

type Pt=[number,number];
function walk(id:MapId, from:Pt, wonMago=true, cleaned=false) {
  const m=MAPS[id];
  const stops = new Set(m.triggers.filter(t=>t.kind==='step'&& (t.action.type==='warp'||t.action.type==='enterParrandero')).map(t=>`${t.x},${t.y}`));
  const blocks = new Set(m.npcs.filter(n=>!n.hidden).map(n=>n.id==='mago_americas'&&wonMago?'5,7':`${n.x},${n.y}`));
  if(id==='las_americas') {
    for(const p of [AMER_CARRETA_POS,AMER_GUAGUA_POS])for(let y=p.y;y<p.y+p.h;y++)for(let x=p.x;x<p.x+p.w;x++)blocks.add(`${x},${y}`);
    if(!wonMago)for(const t of m.triggers)if(t.action.type==='gate')blocks.add(`${t.x},${t.y}`);
  }
  const can=(x:number,y:number)=>x>=0&&y>=0&&x<m.rows[0].length&&y<m.rows.length&&!SOLID[m.legend[m.rows[y][x]]]&&!blocks.has(`${x},${y}`)&&!(id==='papagayos'&&stickyAt(x,y,cleaned));
  assert.ok(can(...from), `${id}: invalid spawn ${from}`);
  const dist=new Map<string,number>([[from.join(','),0]]),q:Pt[]=[from];
  for(let i=0;i<q.length;i++){
    const [x,y]=q[i],k=`${x},${y}`;if(i>0&&stops.has(k)) continue;
    for(const [dx,dy] of [[-1,0],[1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,n=`${a},${b}`;
      if(can(a,b)&&!dist.has(n)){dist.set(n,dist.get(k)!+1);q.push([a,b]);}}
  }
  return dist;
}
const affected:MapId[]=['las_americas','puente_magma','siam_park','veronicas','papagayos'];
for(const id of affected){const m=MAPS[id];const triggers=new Set<string>();
  for(const row of m.rows){assert.equal(row.length,m.rows[0].length);for(const c of row)assert.ok(m.legend[c],`${id} missing ${c}`);}
  for(const t of m.triggers){
    if(t.action.type==='warp') {
      assert.equal(SOLID[m.legend[m.rows[t.y][t.x]]],false,`${id}: solid warp at ${t.x},${t.y}`);
      const d=MAPS[t.action.to];assert.equal(SOLID[d.legend[d.rows[t.action.y][t.action.x]]],false,`${id}: blocked landing in ${d.id}`);
      assert.ok(!d.npcs.some(n=>n.x===t.action.x&&n.y===t.action.y&&!n.hidden),'landing on NPC');
      assert.ok(!d.triggers.some(u=>u.kind==='step'&&u.x===t.action.x&&u.y===t.action.y&&u.action.type==='warp'),'landing on return warp');
      const k=`${t.x},${t.y}`;assert.ok(!triggers.has(k),'double warp');triggers.add(k);
    }
  }
}
console.log('ok - salidas y llegadas transitables en plaza, puente, parque, paseo y gimnasio');
const before=walk('las_americas',[9,9],false), after=walk('las_americas',[9,9]);
assert.ok(before.has('16,0'));assert.ok(before.has('27,9'));assert.equal(before.has('0,9'),false);assert.ok(after.has('0,9'));
const west = MAPS.las_americas.triggers.find(t=>t.x===0&&t.y===9&&t.kind==='step');
const east = MAPS.las_americas.triggers.find(t=>t.x===27&&t.y===9&&t.kind==='step');
const north = MAPS.las_americas.triggers.find(t=>t.x===16&&t.y===0&&t.kind==='step');
assert.ok(west?.action.type==='warp'&&west.action.to==='veronicas'&&west.action.dir==='left');
assert.ok(east?.action.type==='warp'&&east.action.to==='tf1'&&east.action.dir==='right');
assert.ok(north?.action.type==='warp'&&north.action.to==='puente_magma');
for(const x of [10,11,12]){const go=walk('puente_magma',[x,18]),back=walk('puente_magma',[x,1]);assert.ok(go.has(`${x},0`));assert.ok(back.has(`${x},19`));}
const park=walk('siam_park',[48,22]);assert.ok(park.has('48,23'));for(const id of ['guiri_dave','surfero_borja','crema_fp50','cola_dragon','cola_torre_poder']){
  const n=MAPS.siam_park.npcs.find(a=>a.id===id)!;assert.ok([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>park.has(`${n.x+dx},${n.y+dy}`)),`Siam: ${id} unreachable`);
}
console.log('ok - estación → Magma → puente sobre la TF-1 → Siam; oeste abierto tras Don Servando y TF-1 al este');
const coast=walk('veronicas',[41,8]);
for(const s of ['32,8','19,8','11,10','14,13','18,17','23,19','41,19','57,20','73,16','35,16','42,8'])assert.ok(coast.has(s),`falta ${s}`);
// Directions are tested per segment, not just by reachability of the final door.
const routeMap=MAPS.veronicas;
const stop=(key:string)=>routeMap.triggers.find(t=>t.action.type==='coastStop' && t.action.key===key)!;
const hotel=stop('h10'), alley=stop('callejuela'), monkey=stop('monkeys');
assert.ok(west?.action.type==='warp' && west.action.x>stop('san_eugenio').x && stop('san_eugenio').x>hotel.x);
assert.ok(monkey.x>alley.x && monkey.y>alley.y, 'Monkey is southeast of the descending alley');
assert.ok(73>stop('veronicas').x && stop('veronicas').x>stop('troya').x && stop('troya').x>monkey.x, 'the promenade runs east');
for(let y=11;y<=16;y++) {
  const step=routeMap.rows[y].indexOf(y===12||y===15?'s':'p');
  assert.equal(step,y, 'alley goes one tile east for each tile south');
}
const returnPath=walk('veronicas',[73,17]); assert.ok(returnPath.has('42,8'),'walking back from the club reaches the station');
assert.ok(MAPS.veronicas.night);for(const row of MAPS.veronicas.rows)for(const ch of row)assert.ok(!DRIVABLE_TILES.has(MAPS.veronicas.legend[ch]));
assert.equal(nearestParrandero('papagayos',9,3),'troya');
console.log('ok - ruta peatonal continua H10 → callejuela → Monkeys → Troya → Las Verónicas → Papagayos');
const maze=walk('papagayos',[9,18]),clean=walk('papagayos',[9,18],true,true);
assert.ok(maze.has('9,3'));assert.ok(maze.get('9,3')! > 40,'la cabina requiere recorrer el laberinto');assert.ok(clean.get('9,3')!<18);
assert.ok(maze.has('9,20'),'siempre se puede salir');assert.equal(maze.has('8,15'),false);assert.equal(stickyAt(9,16),false);assert.equal(stickyAt(8,16),true);
assert.equal(MAPS.papagayos.rows[16][9],MAPS.papagayos.rows[16][8],'no cambia el dibujo de la baldosa');
assert.ok(!maze.has('9,2'),'líder ocupa la cabina');
console.log('ok - máscara invisible sin atajos: ruta seca de '+maze.get('9,3')+' pasos; salida no bloqueada');
loadPreset('papagayos','angelote');for(const tid of ['barry_troya','sarah_karaoke','gym_papagayos']){
  const t=TRAINERS[tid];assert.ok(t.deck.every(c=>CARDS[c]));let b=createBattle({name:'TÚ',deck:save.deck},{name:t.name,deck:t.deck});for(let i=0;i<1300&&b.winner===null;i++)b=step(b);assert.notEqual(b.winner,null);
}
assert.equal(RUTA[4].name,'Guachinche Papagayos');assert.equal(RUTA[4].type,'VENENO');
assert.ok(TRAINERS.gym_papagayos.deck.some(id=>CARDS[id].keywords?.includes('veneno')));
const prize=grantTrainerVictory(save,'gym_papagayos');assert.equal(prize?.gym,5);assert.equal(save.flags.boliche_5,true);
assert.equal(claimBoosterReward(save,0,'pc').ok,true);assert.equal(grantTrainerVictory(save,'gym_papagayos'),null);
const json=exportSaveJSON();loadPreset('inicio');assert.ok(importSaveJSON(json));assert.equal(save.mapId,'papagayos');assert.ok(save.flags.boliche_5);
blackoutToNearestCenter(2);assert.equal(save.lastCenter,'troya');console.log('ok - duelos jugables, quinto boliche único, guardado y recuperación en Troya');

// Guardados de la versión anterior: conservar el lugar relativo al invertir el mapa.
loadPreset('noche','angelote');
const previous=JSON.parse(exportSaveJSON());
previous.version=8;previous.playerPos={x:13,y:8,dir:'right'};
previous.flags.hm_pukas=true;previous.duros=371;
assert.ok(importSaveJSON(JSON.stringify(previous)));
assert.deepEqual(save.playerPos,{x:14,y:8,dir:'left'});
assert.equal(save.flags.hm_pukas,true);assert.equal(save.duros,371);
previous.mapId='veronicas';previous.playerPos={x:21,y:13,dir:'right'};
assert.ok(importSaveJSON(JSON.stringify(previous)));
assert.deepEqual(save.playerPos,{x:14,y:13,dir:'left'});
const migrated=exportSaveJSON();assert.ok(importSaveJSON(migrated));
assert.deepEqual(save.playerPos,{x:14,y:13,dir:'left'},'una carga posterior no refleja el mapa dos veces');
console.log('ok - los guardados anteriores conservan su posición relativa y progreso');

// A v9 save by the club stays by the club, including deck and rewards.
const v9=JSON.parse(migrated);v9.version=9;v9.playerPos={x:9,y:17,dir:'left'};
assert.ok(importSaveJSON(JSON.stringify(v9)));assert.deepEqual(save.playerPos,{x:73,y:17,dir:'right'});
assert.deepEqual(save.deck,v9.deck);assert.equal(save.duros,v9.duros);assert.deepEqual(save.flags,v9.flags);
console.log('ok - three independent headings, round trip and v8/v9/v10 save compatibility');
