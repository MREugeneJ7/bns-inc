/** Similitud del coseno entre dos vectores numéricos. */
export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Matriz simétrica de similitud del coseno (diagonal = 1). */
export function simMatrix(embs: number[][]): number[][] {
  const n = embs.length;
  const m = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    m[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      const s = cosine(embs[i], embs[j]);
      m[i][j] = s;
      m[j][i] = s;
    }
  }
  return m;
}

/** Clustering aglomerativo con average linkage sobre la matriz de coseno. */
export function clusterByCosine(
  embs: number[][],
  threshold: number,
): number[][] {
  const n = embs.length;
  if (!n) return [];
  const sim = simMatrix(embs);
  const clusters: number[][] = embs.map((_, i) => [i]);
  const avg = (A: number[], B: number[]) => {
    let s = 0;
    for (const a of A) for (const b of B) s += sim[a][b];
    return s / (A.length * B.length);
  };
  for (;;) {
    let best = -Infinity;
    let bi = -1;
    let bj = -1;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const s = avg(clusters[i], clusters[j]);
        if (s > best) {
          best = s;
          bi = i;
          bj = j;
        }
      }
    }
    if (best < threshold || bi < 0) break;
    clusters[bi] = clusters[bi].concat(clusters[bj]);
    clusters.splice(bj, 1);
  }
  clusters.sort((a, b) => b.length - a.length || a[0] - b[0]);
  return clusters.map((c) => c.sort((a, b) => a - b));
}

/** Similitud de cada miembro con el resto del cluster (centroide implícito). */
export function centroidSim(
  sim: number[][],
  members: number[],
): { per: number[]; avg: number } {
  const per = members.map((m) => {
    if (members.length === 1) return 1;
    const others = members.filter((o) => o !== m);
    const s = others.reduce((acc, o) => acc + sim[m][o], 0) / others.length;
    return s;
  });
  return { per, avg: per.reduce((a, b) => a + b, 0) / (per.length || 1) };
}
