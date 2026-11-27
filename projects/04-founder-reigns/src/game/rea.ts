/** La banda REA es deliberadamente invisible: el jugador deduce el punto medio. */
export const REA_ORIGINALITY_LOW = 28;
export const REA_ORIGINALITY_HIGH = 78;

export type ReaVerdict = "copied" | "accused" | "middle";

export function reaVerdict(soul: number): ReaVerdict {
  if (soul > REA_ORIGINALITY_HIGH) return "copied";
  if (soul < REA_ORIGINALITY_LOW) return "accused";
  return "middle";
}

export const REA_VERDICTS: Record<ReaVerdict, { title: string; text: string }> = {
  copied: {
    title: "TE COPIARON CON REA",
    text: "Un competidor usó REA para estudiar el comportamiento del producto compilado y reconstruir sus funciones clave. No recuperó tu código fuente, pero consiguió algo que el mercado considera suficiente: una alternativa casi indistinguible, seis semanas después y a mitad de precio. Tu equipo original sigue teniendo la autoría. El mercado ha elegido el clon.",
  },
  accused: {
    title: "ACUSACIÓN DE COPIA",
    text: "Un competidor presenta una comparación asistida por REA entre el comportamiento de tu app y el suyo. La herramienta no puede decidir quién copió a quién; el hilo viral ya tiene capturas, hashes y una cronología que nadie de tu equipo puede explicar. El original publica su repo; tu abogado pide tiempo. El mercado no espera.",
  },
  middle: {
    title: "NO HAY UN CLON NI UN ORIGINAL FANTASMA",
    text: "El informe encuentra interfaces compatibles, dependencias declaradas y decisiones de producto que podéis demostrar como propias. No eres tan singular que una réplica te borre ni tan parecido que una acusación resulte obvia. Tu counsel archiva el informe. Por una vez, el punto medio te deja seguir.",
  },
};

export const MOTIVATION_DURATION_FALLBACK = 3;