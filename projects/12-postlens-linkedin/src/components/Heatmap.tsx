import type { Post } from '../lib/types';
import { Card, SectionTitle } from './ui';

function cellColor(s: number, low: number, high: number): string {
  const c0 = [15, 23, 42]; // slate-900
  const c1 = [59, 130, 246]; // blue-500
  const span = Math.max(0.05, high - low);
  const t = Math.max(0, Math.min(1, (s - low) / span));
  const c = c0.map((v, i) => Math.round(v + (c1[i] - v) * t));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

export default function Heatmap({ posts, sims }: { posts: Post[]; sims: number[][] | null }) {
  if (!sims || posts.length < 2) {
    return (
      <Card className="p-5 text-center text-sm text-slate-500">
        Añade al menos 2 publicaciones con texto admitido para ver el mapa semántico de coseno.
      </Card>
    );
  }
  const n = posts.length;
  let minOff = 1;
  let maxOff = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const v = sims[i]?.[j] ?? 0;
      if (v < minOff) minOff = v;
      if (v > maxOff) maxOff = v;
    }
  }
  const low = Math.max(0, Math.min(minOff, 0.95));
  const high = Math.max(low + 0.05, Math.min(1, maxOff));
  return (
    <div className="space-y-4">
      <SectionTitle
        icon="🕸️"
        title="Mapa de similitud de coseno"
        subtitle="Coseno de embeddings multilingual-e5-small: 1 = vectores equivalentes; valores menores indican menor afinidad semántica."
      />
      <Card className="overflow-x-auto p-5">
        <table className="border-separate" style={{ borderSpacing: 3 }}>
          <thead>
            <tr>
              <th className="w-24" />
              {posts.map((p) => (
                <th key={p.id} className="h-28 w-10 align-bottom">
                  <span
                    className="block truncate text-[10px] font-medium text-slate-400 [writing-mode:vertical-rl] rotate-180"
                    title={p.title}
                  >
                    {p.title}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.map((p, i) => (
              <tr key={p.id}>
                <th className="w-24 pr-2 text-right">
                  <span className="block truncate text-[10px] font-medium text-slate-400" title={p.title}>
                    {p.title}
                  </span>
                </th>
                {Array.from({ length: n }, (_, j) => {
                  const s = sims[i][j];
                  const diag = i === j;
                  return (
                    <td key={j}>
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-md text-[9px] font-semibold tabular-nums text-white/90 ring-1 ring-white/10"
                        style={{ background: diag ? 'rgba(255,255,255,0.08)' : cellColor(s, low, high) }}
                        title={`${p.title}  ↔  ${posts[j].title}\ncoseno: ${s.toFixed(3)} · distancia: ${(1 - s).toFixed(3)}`}
                      >
                        {diag ? '—' : s.toFixed(2)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex items-center gap-2 text-[10px] tabular-nums text-slate-500">
          <span>{low.toFixed(2)} (menor afinidad)</span>
          <div
            className="h-2 flex-1 rounded-full"
            style={{ background: 'linear-gradient(to right, rgb(15 23 42), rgb(59 130 246))' }}
          />
          <span>{high.toFixed(2)} (mayor afinidad · máx. 1,00)</span>
        </div>
      </Card>
    </div>
  );
}
