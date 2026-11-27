import { useEffect, useState } from "react";
import { ArrowRight, Brand, Close, Lock } from "./ui";
import { cn } from "../utils/cn";

export const DISCLAIMER =
  "Disclaimer: esta posición no existe, este portal tampoco y tus datos no están siendo mandados a ningún lugar.";

export function SiteHeader({
  mode,
  onHome,
  onApply,
  onExit,
  onSection,
  saved = false,
}: {
  mode: "landing" | "application" | "result" | "profiler";
  onHome: () => void;
  onApply: () => void;
  onExit?: () => void;
  onSection?: (id: string) => void;
  saved?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="no-print bg-ink text-paper/65">
        <div className="mx-auto flex h-8 max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="h-1 w-1 shrink-0 bg-accent" aria-hidden="true" />
            <span className="truncate font-mono text-[8px] uppercase tracking-[0.15em] sm:text-[9px]">
              Talent Acquisition ·{" "}
              {mode === "landing"
                ? "Requisición abierta"
                : mode === "application"
                  ? "Expediente en curso"
                  : mode === "profiler"
                    ? "Instrumento DCAI-5 · acceso privado"
                    : "Resolución emitida"}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-4 font-mono text-[8px] uppercase tracking-[0.13em] sm:text-[9px]">
            <span className="hidden sm:inline">SYN-001</span>
            <span className="text-paper/30">/</span>
            <span>ES</span>
          </div>
        </div>
      </div>

      <header className="no-print sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex h-[62px] max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8">
          <div className="flex items-center gap-8">
            <Brand onClick={onHome} compact />
            {mode === "landing" && (
              <nav className="hidden items-center gap-6 lg:flex" aria-label="Navegación principal">
                {[
                  ["posicion", "La posición"],
                  ["cultura", "Cultura"],
                  ["proceso", "Proceso"],
                  ["preguntas", "Preguntas"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSection?.(id)}
                    className="text-[12px] font-medium text-ink-soft transition-colors hover:text-ink"
                  >
                    {label}
                  </button>
                ))}
              </nav>
            )}
          </div>

          <div className="hidden items-center gap-4 sm:flex">
            {mode === "landing" ? (
              <>
                <span className="hidden font-mono text-[9px] uppercase tracking-[0.08em] text-ink-faint md:block">
                  1 posición abierta
                </span>
                <button type="button" onClick={onApply} className="btn btn-primary !min-h-9 !px-4 !text-[11px]">
                  Iniciar candidatura
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </>
            ) : mode === "application" ? (
              <>
                <span className="hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[0.06em] text-ink-faint md:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-moss" aria-hidden="true" />
                  {saved ? "Borrador guardado en este dispositivo" : "Procesando localmente"}
                </span>
                <button type="button" onClick={onExit} className="btn btn-secondary !min-h-9 !px-3.5 !text-[11px]">
                  Guardar y salir
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onHome}
                className="font-mono text-[9px] uppercase tracking-[0.06em] text-ink-soft transition-colors hover:text-ink"
              >
                Volver a la posición
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex h-9 w-9 items-center justify-center border border-line-dark sm:hidden"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <Close className="h-4 w-4" />
            ) : (
              <span className="space-y-[4px]">
                <span className="block h-px w-4 bg-ink" />
                <span className="block h-px w-4 bg-ink" />
                <span className="block h-px w-4 bg-ink" />
              </span>
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-line bg-paper px-5 pb-5 pt-3 sm:hidden">
            {mode === "landing" ? (
              <div className="flex flex-col">
                {[
                  ["posicion", "La posición"],
                  ["cultura", "Cultura"],
                  ["proceso", "Proceso"],
                  ["preguntas", "Preguntas"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onSection?.(id);
                      setMenuOpen(false);
                    }}
                    className="border-b border-line py-3 text-left text-[13px] font-medium"
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={onExit ?? onHome}
                className="border-b border-line py-3 text-left text-[13px] font-medium"
              >
                {mode === "application" ? "Guardar y salir" : "Volver a la posición"}
              </button>
            )}
            <button
              type="button"
              onClick={onApply}
              className="btn btn-primary mt-4 w-full !text-[12px]"
            >
              Iniciar candidatura
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </header>
    </>
  );
}

export function DisclaimerBand({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <div
      id="disclaimer"
      className={cn(
        "border-y px-5 py-5 sm:px-8",
        tone === "light" ? "border-line-dark bg-paper-deep" : "border-paper/15 bg-[#211f1b]",
      )}
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-2 sm:flex-row sm:items-start sm:gap-5">
        <span className="shrink-0 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-accent">
          Disclaimer
        </span>
        <p
          className={cn(
            "max-w-3xl text-[12px] leading-relaxed",
            tone === "light" ? "text-ink-soft" : "text-paper/65",
          )}
        >
          {DISCLAIMER}
        </p>
      </div>
    </div>
  );
}

export function SiteFooter({
  onApply,
  onHome,
  onInternal,
  onSection,
}: {
  onApply: () => void;
  onHome: () => void;
  onInternal: () => void;
  onSection: (id: string) => void;
}) {
  return (
    <footer className="no-print bg-ink text-paper">
      <div className="mx-auto max-w-[1440px] px-5 pb-10 pt-14 sm:px-8 sm:pt-16">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Brand dark onClick={onHome} />
            <p className="mt-5 max-w-[260px] text-[13px] leading-relaxed text-paper/55">
              La capa operativa que permite a los equipos distribuidos convertir la complejidad en
              resultados auditables.
            </p>
            <div className="mt-6 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.08em] text-paper/40">
              <span className="h-1.5 w-1.5 bg-accent" aria-hidden="true" />
              Madrid · Remoto* · 3 husos horarios
            </div>
          </div>

          <FooterColumn title="La requisición">
            <FooterButton onClick={() => onSection("posicion")}>Descripción del puesto</FooterButton>
            <FooterButton onClick={() => onSection("proceso")}>Proceso de selección</FooterButton>
            <FooterButton onClick={() => onSection("preguntas")}>Preguntas frecuentes</FooterButton>
            <FooterButton onClick={onApply}>Iniciar candidatura</FooterButton>
          </FooterColumn>

          <FooterColumn title="Gobernanza">
            <FooterButton onClick={() => onSection("preguntas")}>Privacidad y datos</FooterButton>
            <FooterButton onClick={() => onSection("preguntas")}>Metodología de evaluación</FooterButton>
            <FooterButton onClick={() => onSection("cultura")}>Cultura y valores</FooterButton>
            <FooterButton onClick={() => onSection("proceso")}>Fases del proceso</FooterButton>
          </FooterColumn>

          <FooterColumn title="Acceso interno">
            <FooterButton onClick={onInternal}>Comité de evaluación</FooterButton>
            <FooterButton onClick={onInternal}>Expedientes de referencia</FooterButton>
            <FooterButton onClick={onInternal}>Repositorio psicométrico</FooterButton>
            <span className="flex items-center gap-1.5 pt-1 font-mono text-[9px] uppercase tracking-[0.06em] text-paper/30">
              <Lock className="h-3 w-3" />
              Acceso reservado
            </span>
          </FooterColumn>
        </div>

        <div className="mt-12 border-t border-paper/15 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-12">
            <p className="max-w-2xl text-[11px] leading-relaxed text-paper/55">{DISCLAIMER}</p>
            <p className="shrink-0 font-mono text-[9px] uppercase tracking-[0.06em] text-paper/30">
              Procesado en su navegador
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-paper/10 pt-5 font-mono text-[8px] uppercase tracking-[0.07em] text-paper/30 sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 Deskjockey for Life, S.L. Todos los derechos reservados.</span>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <span>Aviso legal</span>
              <span>Privacidad</span>
              <span>Cookies (todas activas)</span>
              <span>Accesibilidad</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-paper/35">{title}</p>
      <div className="mt-4 flex flex-col items-start gap-2.5">{children}</div>
    </div>
  );
}

function FooterButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left text-[12px] leading-relaxed text-paper/65 transition-colors hover:text-paper"
    >
      {children}
    </button>
  );
}

export function CommitteeModal({
  open,
  onClose,
  onReference,
  onProfiler,
}: {
  open: boolean;
  onClose: () => void;
  onReference: (kind: "high" | "low") => void;
  onProfiler: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-ink/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="committee-title"
        className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto border border-line bg-paper p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-accent">Control de calidad / acceso interno</p>
            <h2 id="committee-title" className="mt-3 text-[28px] font-medium leading-none tracking-[-0.04em]">
              Comité de evaluación
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center border border-line-dark transition-colors hover:border-ink"
            aria-label="Cerrar panel"
          >
            <Close className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="mt-5 text-[12px] leading-relaxed text-ink-soft">
          Este panel reproduce expedientes de referencia para verificar el comportamiento del modelo de
          alineación. Las candidaturas generadas no están asociadas a ninguna persona y no se remiten a
          ningún sistema.
        </p>

        <div className="mt-6 divide-y divide-line border-y border-line">
          <ReferenceRow
            code="REF-01"
            title="Candidatura de referencia alineada"
            detail="Puntuación interna 96,4 %. Supera el umbral de 95,0 %."
            onClick={() => onReference("high")}
          />
          <ReferenceRow
            code="REF-02"
            title="Candidatura de control"
            detail="Puntuación interna 41,0 %. No supera el umbral."
            onClick={() => onReference("low")}
          />
          <ReferenceRow
            code="DCAI-5"
            title="Instrumento de Alineación Cultural"
            detail="Cinco dimensiones. Análisis arquetípico. Informe no recurrible."
            onClick={onProfiler}
          />
        </div>

        <p className="mt-5 font-mono text-[9px] uppercase leading-relaxed tracking-[0.05em] text-ink-faint">
          Los expedientes de referencia utilizan datos sintéticos. No contienen información personal.
        </p>
      </div>
    </div>
  );
}

function ReferenceRow({
  code,
  title,
  detail,
  onClick,
}: {
  code: string;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-start gap-4 py-4 text-left transition-colors hover:bg-paper-light"
    >
      <span className="mt-0.5 w-12 shrink-0 font-mono text-[9px] uppercase tracking-[0.04em] text-accent">
        {code}
      </span>
      <span className="flex-1">
        <span className="block text-[13px] font-semibold">{title}</span>
        <span className="mt-1 block text-[11px] leading-relaxed text-ink-faint">{detail}</span>
      </span>
      <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
    </button>
  );
}
