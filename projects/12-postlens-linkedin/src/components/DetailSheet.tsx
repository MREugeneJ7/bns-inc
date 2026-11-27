import { useEffect, useId, useRef, type ReactNode } from "react";

interface Props {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

/** Hoja de detalle: modal centrado en escritorio y anclado abajo en móvil (siempre accesible con el pulgar). */
export default function DetailSheet({
  open,
  title,
  subtitle,
  onClose,
  children,
}: Props) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
      if (e.key !== "Tab") return;
      const controls = panel.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]),input:not([disabled]),textarea,select,a[href]",
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === panel.current)
      ) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        ref={panel}
        tabIndex={-1}
        className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-t-2xl border border-white/10 bg-[#11151d] p-4 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              id={titleId}
              className="font-display text-sm font-bold text-white"
            >
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/10"
          >
            Cerrar ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
