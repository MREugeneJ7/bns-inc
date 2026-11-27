export type ImplantDecision = "unseen" | "accepted" | "rejected";

export const IMPLANT_CHARACTER_ID = "anomaly-neuralink";

export function rememberImplantChoice(
  previous: ImplantDecision,
  characterId: string,
  side: "left" | "right",
): ImplantDecision {
  // Declining a later visit cannot uninstall a chip already accepted.
  if (characterId !== IMPLANT_CHARACTER_ID || previous === "accepted") return previous;
  return side === "left" ? "accepted" : "rejected";
}

export function shouldShowDeprecated({
  screen,
  year,
  reaResolved,
  hasFatalCondition,
  eraIndex,
  terminalEra,
}: {
  screen: string;
  year: number;
  reaResolved: boolean;
  hasFatalCondition: boolean;
  eraIndex?: number;
  terminalEra?: number | null;
}): boolean {
  // Green motivational bars are not proof of survival. Check the real state.
  // La muerte no cae al entrar en 2027: cae en el mes terminal sorteado,
  // tras un mínimo de dos meses completos de agonía (FEB y MAR 2027).
  const reachedTerminalMonth = terminalEra == null || (eraIndex !== undefined && eraIndex >= terminalEra);
  return screen === "playing" && year >= 2027 && reaResolved && reachedTerminalMonth && !hasFatalCondition;
}

export const ZERO_CLICK_MESSAGE =
  "La industria est\u00e1 muerta. El zero-click ha ganado. La gente ya no sale de la interfaz de la IA. Felicidades: has sido declarado @Deprecated.";

export interface DeprecationEpilogue {
  heading: string;
  narrative: string;
}

export const DEPRECATION_EPILOGUES: Record<ImplantDecision, DeprecationEpilogue> = {
  accepted: {
    heading: "Ahora t\u00fa tambi\u00e9n eres un agente",
    narrative:
      "Aceptaste el chip. Ahora t\u00fa tambi\u00e9n eres un agente. Ya no tienes una startup: eres un proceso dentro de la interfaz de la IA. El horario es 24/7. El equity sigue pendiente.",
  },
  rejected: {
    heading: "Deber\u00edas haber aceptado el chip",
    narrative:
      "Rechazaste el chip. Deber\u00edas haberlo aceptado. La IA se qued\u00f3 con tus clientes; t\u00fa te quedaste con el dominio, un pitch deck y un cuerpo que todav\u00eda necesita dormir.",
  },
  unseen: {
    heading: "Pr\u00f3xima parada: mar de Bering",
    narrative:
      "El evangelista del aumento ni siquiera apareci\u00f3. Te est\u00e1s enrolando para pescar cangrejo rey en el mar de Bering. Tu nuevo jefe tambi\u00e9n habla de captaci\u00f3n, pero esta vez lleva botas de agua.",
  },
};