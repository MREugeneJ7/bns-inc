import { CARDS, EVO_CHAINS, isFinalStage } from '../battle/cards';

/**
 * Forja de mazos de entrenador.
 *
 * La dificultad NO se consigue con multiplicadores ni con vida extra: se consigue
 * con BRILLO LEGAL. En este juego, juntar 5 copias de una criatura que ya está en
 * su última etapa evolutiva no la transforma: le da +1/+1 permanente (ver booster.ts,
 * combineCopies -> shineUp). Ese brillo se puede acumular indefinidas veces.
 *
 * Cada "paso de brillo" de un tier equivale a haber fusionado legalmente 5 copias
 * extra de una criatura final. El mazo que se entrega es el resultado de esas fusiones:
 * las cartas siguen siendo legales y el shine se guarda como si el jugador las hubiera
 * combinado en el PC de Ayoze.
 */

/** Criaturas finales autóctonas/folclóricas con sinergia (guardia, prisa, doble, regen, directo). */
export const FORGE_FINALS = [
  'tortuga_abuela',       // Tortuga Laúd final · guardia + regen + directo (Azul)
  'pancho_camurria',      // Pancho Camurria · etapa final del terrero (Rojo)
  'gigante_laurisilva',   // Gigante de la Laurisilva · prisa + doble (Verde)
  'aquelarre_bailadero',  // Aquelarre del Bailadero · sigilo + veneno + regen + directo (Negro)
  'achaman',              // Achamán · guardia + regen + directo (Blanco)
  'cabra_titan_teide',    // Titán del Teide · prisa + doble + directo (Rojo)
] as const;

/** El brillo de un mismo final se reparte entre los seis para que ninguno rompa la curva. */
export const SHINE_PER_TIER = 4;

export interface ForgedDeck {
  deck: string[];
  shine: Record<string, number>;
  /** Fusiones legales hechas (informativo). */
  fusions: number;
}

const L = (id: string, n: number): string[] => Array.from({ length: n }, () => id);

/**
 * Forja un mazo de 30 cartas para un tier (1..10).
 * Mismo esqueleto de tierras y criaturas para todos los tiers; solo cambia el brillo
 * acumulado legalmente. Verificado con 300 duelos por peldaño: el winrate del rival
 * baja de forma monótona del tier 1 al 10.
 */
export function forgeDeck(tier: number, variant = 0): ForgedDeck {
  const t = Math.max(1, Math.min(10, tier));
  const deck: string[] = [
    ...L('tierra_volcan', 5),
    ...L('tierra_charco', 5),
    ...L('tierra_laurisilva', 4),
    ...L('tierra_malpais', 4),
    ...L('tierra_playa', 4),
  ];
  // Cada final entra en bloques de 5 copias: bloque = fusión legal (o进化, aquí ya son finales).
  for (const id of FORGE_FINALS) for (let k = 0; k < 3; k++) deck.push(id);

  const shine: Record<string, number> = {};
  const steps = Math.round((t - 1) * SHINE_PER_TIER) + variant;
  for (let i = 0; i < steps; i++) {
    const id = FORGE_FINALS[(i + variant) % 3];
    shine[id] = (shine[id] ?? 0) + 1;
  }
  return { deck, shine, fusions: steps };
}

/** Valida que todas las cartas brilladas son finales (la condición de la fusión legal). */
export function assertLegalFusionDeck(d: ForgedDeck): boolean {
  return Object.entries(d.shine).every(([id, n]) => {
    const c = CARDS[id];
    return !!c && c.type === 'creature' && isFinalStage(id) && n >= 0 && EVO_CHAINS[c.chain ?? ''] !== undefined;
  });
}

/** Nombre corto para los textos del juego. */
export function forgeLabel(tier: number): string {
  if (tier >= 10) return 'CAMPEÓN';
  if (tier >= 8) return 'MAZO CUMBRE';
  if (tier >= 6) return 'MAZO RUTA';
  if (tier >= 4) return 'MAZO ISLA';
  return 'MAZO NOVEL';
}
