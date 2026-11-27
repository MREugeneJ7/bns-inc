import { BOLICHES_TOTAL, RUTA } from './ruta';
import type { SaveState } from './save';

export const DIABLITO_TRAINER = 'gym_diablito';

export function discoverDiablito(state: Pick<SaveState, 'flags'>): boolean {
  if (state.flags.diablito_discovered) return false;
  state.flags.diablito_discovered = true;
  state.flags.ruta = true;
  return true;
}

export const DIABLITO_DISCOVERY = [
  'Al pasar junto a una casa con las persianas medio bajadas te llega un aroma a ajo, albahaca y masa recién horneada. Comida italiana.',
  'Miras el cartel: EL DIABLITO. Todavía cuelga un letrero de CERRADO, torcido sobre la puerta. Ese nombre te trae un recuerdo...',
  'Sacas la RUTA DEL BUEN YANTAR de Bencomo y repasas la última entrada: «8. EL DIABLITO · SANTA ÚRSULA · EL COCO».',
  'TU: ¡Es el último gimnasio! Pero... ¿no estaba cerrado?',
  'Desde dentro llega una voz conocida: «O sole mio...».',
];

export const DIABLITO_SINGING = [
  'EL COCO, amasando junto al horno: «O sole mio... sta \'nfronte a te!»',
  'Don Michi duerme sobre un saco de harina. El Coco se aparta el delantal y deja ver un boliche detrás del mostrador.',
];

export const DIABLITO_FIRST = [
  'EL COCO: «O sole...». ¡TÚ OTRA VEZ! Primero el Meridiano, después Magos de la Costa... ¡y ahora en mi propia cocina!',
  'EL COCO: Había cerrado El Diablito porque estaba hasta las narices de niñatos como tú viniendo a robarme boliches.',
  'EL COCO: Pero me jodiste mis nuevas empresas. El negocio de Meridiano, los contratos de Magos... sí, negocios criminales, no pongas esa cara. Me dejaste sin ingresos, capisci?',
  'EL COCO: Así que me vi forzado a reabrir y volver a hacer pizzas. Y ya que estás aquí, te reto: tú y yo en la mesa. Si me ganas, te llevas el ÚLTIMO BOLICHE.',
];

export const DIABLITO_RETRY = [
  'EL COCO: «O sole mio...». Ah, volviste. El horno sigue caliente y tu último boliche sigue detrás del mostrador.',
  'EL COCO: Esta vez no hay probadores secretos ni llaves magnéticas. Solo tú, yo y el duelo de El Diablito. ¿Vamos?',
];

export const DIABLITO_AFTER = [
  'EL COCO: El Boliche del Diablito ya es tuyo. Meridiano, Magos y ahora mi guachinche... tres visitas y ni una reseña buena.',
  'EL COCO: Al menos pide una pizza antes de irte. «O sole mio...»',
];

export function diablitoPostVictory(flags: Record<string, boolean>): string[] {
  const boliches = RUTA.filter(g => flags['boliche_' + g.n]).length;
  return [
    'EL COCO: Te di el boliche por ganar un duelo limpio. Esta vez no me lleves también el horno, ragazzo.',
    boliches === BOLICHES_TOTAL
      ? 'Repasas la Ruta del Buen Yantar: ¡OCHO DE OCHO BOLICHES! La ruta está completa. Ya cumples el requisito para el Alto Mando.'
      : `Guardas el último boliche de la lista. Llevas ${boliches}/${BOLICHES_TOTAL}; aún tienes guachinches pendientes en la Ruta del Buen Yantar.`,
    'El Coco vuelve a cantar O sole mio. La puerta del restaurante sigue al sur.',
  ];
}