import { useState } from 'react';
import { fmtNum, fmtPct, weightLabel, type AudienceReport } from '../lib/aggregate';
import type { CrossInsight } from '../lib/analyst';
import { cn } from '../utils/cn';
import DetailSheet from './DetailSheet';
import { Badge, Card } from './ui';

interface Props {
  report: AudienceReport;
  crossInsights: CrossInsight[];
}

interface SheetData {
  title: string;
  subtitle?: string;
  body: string;
  values?: { label: string; pct?: number; extra?: string }[];
  categoria?: string;
}

export default function AudienceDashboard({ report, crossInsights }: Props) {
  const cats = report.categories;
  const [activeCat, setActiveCat] = useState<string>(() => cats[0]?.categoria ?? 'Cargo');
  const [viewAll, setViewAll] = useState<boolean>(false);
  const [sheet, setSheet] = useState<SheetData | null>(null);

  const current = cats.find((c) => c.categoria === activeCat) ?? cats[0];

  if (!cats.length) {
    return (
      <Card className="p-4 text-center text-xs text-slate-500">
        No hay desglose demográfico en las publicaciones cargadas.
      </Card>
    );
  }

  const openCategory = (categoria: string, data?: Partial<SheetData>) => {
    const cat = cats.find((c) => c.categoria === categoria);
    if (!cat) return;
    setSheet({
      title: data?.title ?? `${cat.icon} ${cat.shortLabel}`,
      subtitle: data?.subtitle ?? `${cat.postCount} publicaciones · ponderado por ${weightLabel(report.weightUsed)}`,
      body: data?.body ?? '',
      categoria,
      values: cat.values.map((v) => ({
        label: v.valor,
        pct: v.pct,
        extra: `${v.posts}/${cat.postCount} posts${v.estPeople > 0 ? ` · ~${fmtNum(v.estPeople)} pers.` : ''}`,
      })),
    });
  };

  return (
    <div className="space-y-3">
      {/* Cruces clave en 1 vistazo — con detalle accesible en móvil */}
      {crossInsights.length > 0 && (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {crossInsights.map((ci) => (
            <Card key={ci.tag} className="flex flex-col px-3 py-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-blue-400">{ci.tag}</div>
              <div className="mt-0.5 line-clamp-2 text-xs font-bold leading-snug text-white">{ci.title}</div>
              <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-400">{ci.detail}</div>
              <button
                onClick={() =>
                  openCategory(ci.categoria ?? cats[0].categoria, {
                    title: ci.tag,
                    subtitle: ci.title,
                    body: ci.detail,
                  })
                }
                className="mt-1.5 self-start rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-300 hover:bg-blue-500/20"
              >
                Ver detalle →
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Selector de dimensión con el pulgar (cero scroll) */}
      <Card className="p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
          <div className="flex flex-wrap gap-1">
            {cats.map((c) => {
              const active = !viewAll && current?.categoria === c.categoria;
              return (
                <button
                  key={c.categoria}
                  onClick={() => {
                    setViewAll(false);
                    setActiveCat(c.categoria);
                  }}
                  className={cn(
                    'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
                    active ? 'bg-blue-600 text-white' : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                  )}
                >
                  <span className="mr-1">{c.icon}</span>
                  {c.shortLabel}
                </button>
              );
            })}
            <button
              onClick={() => setViewAll((v) => !v)}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
                viewAll
                  ? 'bg-blue-600 text-white'
                  : 'border border-white/10 bg-transparent text-slate-400 hover:text-slate-200'
              )}
              title="Ver las 6 dimensiones en cuadrícula compacta"
            >
              ⊞ {viewAll ? 'Vista detalle' : 'Ver las 6'}
            </button>
          </div>
          <span className="text-[10px] text-slate-500">
            Ponderado por <b className="text-slate-300">{weightLabel(report.weightUsed)}</b> ({report.totals.posts} posts)
          </span>
        </div>

        {/* Vista de 1 dimensión detallada (sin scroll) */}
        {!viewAll && current && (
          <div className="mt-3 space-y-3">
            {current.buckets.length > 0 && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {current.buckets.map((b) => (
                  <button
                    key={b.label}
                    onClick={() =>
                      openCategory(current.categoria, {
                        title: `${current.icon} ${b.label}`,
                        subtitle: `${fmtPct(b.pct)} de tu audiencia · ~${fmtNum(b.estPeople)} personas estimadas`,
                        body: `${b.hint}. Los valores individuales que componen este macro-segmento están abajo.`,
                      })
                    }
                    className="rounded-xl border border-white/5 bg-black/30 px-3 py-2 text-left transition hover:border-blue-500/40"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-200">{b.label}</span>
                      <span className="font-display text-sm font-bold tabular-nums text-blue-400">{fmtPct(b.pct)}</span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="truncate pr-2">{b.hint}</span>
                      {b.estPeople > 0 && (
                        <span className="shrink-0 tabular-nums text-slate-400">~{fmtNum(b.estPeople)} pers.</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-x-5 gap-y-2 sm:grid-cols-2">
              {current.values.slice(0, 10).map((v, idx) => {
                const max = Math.max(1, current.values[0]?.pct ?? 1);
                return (
                  <div key={v.valor}>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="truncate font-medium text-slate-200" title={v.valor}>
                        <span className="mr-1.5 text-[10px] tabular-nums text-slate-500">{idx + 1}.</span>
                        {v.valor}
                      </span>
                      <div className="flex shrink-0 items-baseline gap-2 tabular-nums">
                        {v.estPeople > 0 && (
                          <span className="text-[10px] text-slate-500" title="Personas estimadas del alcance">
                            ~{fmtNum(v.estPeople)}
                          </span>
                        )}
                        <span className="font-semibold text-white">{fmtPct(v.pct)}</span>
                      </div>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${Math.max(4, (v.pct / max) * 100)}%` }}
                      />
                    </div>
                    {v.peakPostTitle && v.peakPct !== undefined && current.postCount > 1 && (
                      <div className="mt-0.5 truncate text-[10px] text-slate-600" title={v.peakPostTitle}>
                        pico {fmtPct(v.peakPct)} en «{v.peakPostTitle}»
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => openCategory(current.categoria)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-white/[0.07] sm:w-auto sm:px-3"
            >
              Ver detalle de {current.shortLabel.toLowerCase()} ({current.values.length} valores)
            </button>
          </div>
        )}

        {/* Vista de las 6 dimensiones a la vez */}
        {viewAll && (
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {cats.map((c) => {
              const top = c.values.slice(0, 5);
              const max = Math.max(1, top[0]?.pct ?? 1);
              return (
                <div key={c.categoria} className="rounded-xl border border-white/5 bg-black/25 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setActiveCat(c.categoria);
                        setViewAll(false);
                      }}
                      className="text-xs font-bold text-white hover:text-blue-300"
                    >
                      {c.icon} {c.shortLabel}
                    </button>
                    <Badge tone="slate">{c.values.length} ítems</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {top.map((v) => (
                      <div key={v.valor}>
                        <div className="flex justify-between gap-2 text-[11px]">
                          <span className="truncate text-slate-300">{v.valor}</span>
                          <span className="shrink-0 tabular-nums text-slate-400">{fmtPct(v.pct)}</span>
                        </div>
                        <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${Math.max(4, (v.pct / max) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => openCategory(c.categoria)}
                    className="mt-2 w-full rounded-md border border-white/10 py-1 text-[10px] font-semibold text-blue-300 hover:bg-white/5"
                  >
                    Ver los {c.values.length} valores →
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Hoja de detalle (móvil-friendly) */}
      <DetailSheet
        open={!!sheet}
        title={sheet?.title ?? ''}
        subtitle={sheet?.subtitle}
        onClose={() => setSheet(null)}
      >
        {sheet?.body && <p className="mb-3 text-[12px] leading-relaxed text-slate-300">{sheet.body}</p>}
        {sheet?.values && sheet.values.length > 0 && (
          <div className="space-y-1.5">
            {sheet.values.map((v) => (
              <div key={v.label} className="rounded-lg border border-white/5 bg-black/30 px-2.5 py-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12px] font-medium text-slate-200">{v.label}</span>
                  {v.pct !== undefined && (
                    <span className="shrink-0 text-[12px] font-bold tabular-nums text-blue-400">{fmtPct(v.pct)}</span>
                  )}
                </div>
                {v.extra && <div className="text-[10px] text-slate-500">{v.extra}</div>}
              </div>
            ))}
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
