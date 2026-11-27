import type { ParranderoId } from './maps';
import type { SaveState } from './save';

/** Destino Binter: aeropuertos y centros parranderos de ciudades/rutas ya visitadas. */
export interface BinterDestination {
  id: string;
  code: string;
  label: string;
  /** Flag de visita que lo desbloquea (un centro parrandero o un aeropuerto). */
  visited: string;
  /** Centros parranderos de la isla de La Gomera solo se pueden usar si se ha llegado allí. */
  parrandero?: ParranderoId;
  /** Aeropuertos sin centro parrandero propio: playa de llegada al mapa. */
  airport?: { mapId: string; x: number; y: number; dir: 'up' | 'down' | 'left' | 'right' };
}

/**
 * Tarifa Plana Binter: vas descubriendo destinos al pasar por ellos.
 * TFS y TFN son aeropuertos (no tienen centro parrandero), pero por coherencia también entran en la red.
 */
export const BINTER_DESTINATIONS: readonly BinterDestination[] = [
  { id: 'weyler', code: 'WEY', label: 'Santa Cruz · Plaza Weyler', visited: 'visited_calle', parrandero: 'weyler' },
  { id: 'muelle', code: 'SCZ', label: 'Santa Cruz · Av. Anaga / Muelle', visited: 'visited_santacruz_sur', parrandero: 'muelle' },
  { id: 'candelaria', code: 'CND', label: 'La Candelaria · Plaza de la Patrona', visited: 'visited_hospital', parrandero: 'candelaria' },
  { id: 'ull', code: 'TFN-ULL', label: 'La Laguna · Campus ULL / Guajara', visited: 'visited_subida', parrandero: 'ull' },
  { id: 'cuesta', code: 'CUE', label: 'La Cuesta · Carretera General', visited: 'visited_subida', parrandero: 'cuesta' },
  { id: 'sanbenito', code: 'SBN', label: 'San Benito · La Laguna', visited: 'visited_anaga', parrandero: 'sanbenito' },
  { id: 'taganana', code: 'ANG', label: 'Taganana · Costa de Anaga', visited: 'visited_anaga', parrandero: 'taganana' },
  { id: 'tfn', code: 'TFN', label: 'Aeropuerto Tenerife Norte · Los Rodeos', visited: 'visited_tf5', airport: { mapId: 'tf5', x: 104, y: 12, dir: 'down' } },
  { id: 'santa_ursula', code: 'STU', label: 'Santa Úrsula · Carretera General', visited: 'visited_santa_ursula', parrandero: 'santa_ursula' },
  { id: 'galdar', code: 'LPA', label: 'Gran Canaria · Muelle de Gáldar', visited: 'visited_galdar', parrandero: 'galdar' },
  { id: 'aeropuerto', code: 'TFS', label: 'Aeropuerto Tenerife Sur · Reina Sofía', visited: 'visited_tf1', parrandero: 'aeropuerto' },
  { id: 'rosario', code: 'ROS', label: 'El Rosario · La Esperanza', visited: 'visited_el_rosario', parrandero: 'rosario' },
  { id: 'troya', code: 'ADJ', label: 'Adeje · Monkey Beach / Troya', visited: 'visited_veronicas', parrandero: 'troya' },
  { id: 'gomera', code: 'GMZ', label: 'San Sebastián de La Gomera', visited: 'visited_san_sebastian', parrandero: 'gomera' },
  { id: 'refugio', code: 'TEI', label: 'Montaña Blanca · Refugio del Teide', visited: 'visited_montana_blanca', parrandero: 'refugio' },
];

/** Partidas antiguas: si el centro ya se usó como lastCenter, se considera visitado. */
export function isBinterUnlocked(dest: BinterDestination, s: Pick<SaveState, 'flags' | 'lastCenter'>): boolean {
  if (s.flags[dest.visited]) return true;
  if (dest.parrandero && s.lastCenter === dest.parrandero) return true;
  return false;
}

/** Sincroniza todos los destinos con las visitas ya registradas en la partida (llamado al importar). */
export function syncBinterVisits(s: SaveState): void {
  for (const d of BINTER_DESTINATIONS) if (isBinterUnlocked(d, s)) s.flags[d.visited] = true;
}
