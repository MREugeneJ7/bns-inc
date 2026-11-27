import type { MapId } from './maps';
import type { TileId } from './sprites';
import { GOMERA_SEA_START } from './mapsGomera';

/** Only open, swimmable water; never the sea-lion enclosure, shark tank, or a map boundary. */
export function boardWater(id:MapId,tile:TileId,x:number,y:number) {
  if(id==='siam_park')return tile==='wavepool';
  if(id==='veronicas'&&y>=GOMERA_SEA_START)return tile==='sea';
  if(tile!=='sea'&&tile!=='surf')return false;
  return id==='tf1'||id==='veronicas'||id==='san_andres'||id==='cueva_magec'||(id==='anaga'&&x>=54&&y<=3);
}
/** A single low ledge, with firm ground beyond. No vaults through doors, trainers or puzzles. */
export function vaultable(id:MapId, tile:TileId) {
  if(id==='san_borondon'||id==='montana_blanca'||id==='cueva_magec')return tile==='ravine';
  return (id==='siam_park'||id==='anaga'||id==='tf1') && (tile==='redrock'||tile==='ravine');
}
export const WAVE_PERIOD=480;
export const waveActive=(tick:number)=>tick%WAVE_PERIOD>=300;
export const LOOSE_PUKAS=[
  '................','................','................','................','................',
  '...........ddd..','.......ddddaad..','....dddaaaabcd..','..ddaaabbbddd...',
  '.daabbbddd......','.dddddd.........','................','................','................','................','................',
];
