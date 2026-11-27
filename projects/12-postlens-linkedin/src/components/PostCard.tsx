import { useState } from "react";
import { formatPct, groupRows } from "../lib/analytics";
import { postTextState } from "../lib/provenance";
import { POST_CHIP_KEYS, type Post } from "../lib/types";
import { Badge, TrashIcon } from "./ui";

export default function PostCard({
  post,
  onDelete,
  onEdit,
  onRetryTitle,
  retryingTitle = false,
}: {
  post: Post;
  onDelete: () => void;
  onEdit: () => void;
  onRetryTitle?: () => void;
  retryingTitle?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const state = postTextState(post);
  const groups = groupRows(post.rows);
  const chips = POST_CHIP_KEYS.map((c) => ({
    ...c,
    metric: post.metrics?.find((m) => m.key === c.key),
  })).filter((c) => c.metric?.num !== null && c.metric);
  const origin =
    state === "missing"
      ? "Sin texto"
      : state === "unverified"
        ? "Origen sin verificar"
        : post.provenance?.kind === "demo"
          ? "Demo"
          : post.provenance?.kind === "manual"
            ? "Confirmado por ti"
            : post.provenance?.activityId
              ? `ID ${post.provenance.postId} ↔ ${post.provenance.activityId}`
              : `ID coincidente · ${post.provenance?.postId}`;
  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-sm font-semibold text-white">
            {post.title || "Publicación pendiente de texto"}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge tone={state === "usable" ? "slate" : "amber"}>
              {origin}
            </Badge>
            {state === "usable" && post.titleError && post.titleSource === "auto" && (
              <Badge tone="amber">Sin título LLM</Badge>
            )}
            <span className="text-[10px] text-slate-500">
              {post.fecha} {post.hora}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            {post.titleSource === "ai"
              ? `Título LLM: ${post.titleEngine}`
              : post.titleSource === "user"
                ? "Título escrito por ti"
                : "Título provisional: primera línea, no IA"}
          </p>
          {state !== "usable" && post.importError && (
            <p className="mt-1 text-[11px] leading-snug text-amber-200/90">
              Aviso importación: {post.importError}
            </p>
          )}
          {state === "usable" && post.titleError && post.titleSource === "auto" && (
            <p className="mt-1 text-[11px] leading-snug text-amber-200/90">
              Aviso título: {post.titleError}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {state === "usable" &&
            post.titleSource !== "ai" &&
            post.titleSource !== "user" &&
            onRetryTitle && (
              <button
                disabled={retryingTitle}
                onClick={onRetryTitle}
                className="min-h-10 rounded-lg border border-amber-500/30 px-2.5 text-xs text-amber-200 hover:bg-amber-500/10 disabled:opacity-40"
              >
                {retryingTitle ? "Titulando..." : "Titular con LLM"}
              </button>
            )}
          <button
            onClick={onEdit}
            className="min-h-10 rounded-lg border border-blue-500/25 px-3 text-xs text-blue-300"
          >
            {state === "usable" ? "Texto / origen" : "Revisar texto"}
          </button>
          <button
            onClick={onDelete}
            aria-label={`Eliminar ${post.title}`}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-300"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] tabular-nums text-slate-400">
        {chips.map((c) => (
          <span key={c.key}>
            {c.label}:{" "}
            <b className="font-medium text-slate-300">
              {c.metric!.num!.toLocaleString("es-ES")}
            </b>
          </span>
        ))}
      </div>
      <button
        onClick={() => setOpen(!open)}
        className="mt-1 min-h-9 text-xs text-slate-400 underline"
      >
        {open ? "Ocultar audiencia de este post" : "Ver audiencia de este post"}
      </button>
      {open && (
        <div className="grid gap-3 border-t border-white/5 pt-2 sm:grid-cols-2">
          {groups.map((g) => (
            <div key={g.categoria}>
              <h4 className="text-[11px] font-semibold text-slate-400">
                {g.categoria}
              </h4>
              {g.items.slice(0, 4).map((row, i) => (
                <div
                  key={`${row.valor}-${i}`}
                  className="mt-1 flex justify-between gap-3 text-xs"
                >
                  <span>{row.valor}</span>
                  <span className="shrink-0 text-slate-500">
                    {formatPct(row.pct)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
