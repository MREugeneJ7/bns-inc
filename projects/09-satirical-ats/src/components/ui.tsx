import { useRef, useState, type ReactNode } from "react";
import type { ChoiceQuestion, MultiQuestion, SelectQuestion, TextQuestion } from "../lib/types";
import { countWords } from "../lib/scoring";
import { cn } from "../utils/cn";

/* ── Icons ─────────────────────────────────────────────────────── */

type IconProps = { className?: string };
const base = "h-4 w-4";

export function ArrowRight({ className }: IconProps) {
  return (
    <svg className={cn(base, className)} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.35" />
    </svg>
  );
}

export function ArrowLeft({ className }: IconProps) {
  return (
    <svg className={cn(base, className)} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M14 8H3M7 4 3 8l4 4" stroke="currentColor" strokeWidth="1.35" />
    </svg>
  );
}

export function ArrowUpRight({ className }: IconProps) {
  return (
    <svg className={cn(base, className)} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 12 12 4M5 4h7v7" stroke="currentColor" strokeWidth="1.35" />
    </svg>
  );
}

export function ChevronDown({ className }: IconProps) {
  return (
    <svg className={cn(base, className)} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m3 6 5 5 5-5" stroke="currentColor" strokeWidth="1.35" />
    </svg>
  );
}

export function Close({ className }: IconProps) {
  return (
    <svg className={cn(base, className)} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m3 3 10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.35" />
    </svg>
  );
}

export function Check({ className }: IconProps) {
  return (
    <svg className={cn(base, className)} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m2.5 8.5 3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function Alert({ className }: IconProps) {
  return (
    <svg className={cn(base, className)} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2v7M8 12.5v.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="6.7" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

export function Lock({ className }: IconProps) {
  return (
    <svg className={cn(base, className)} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="6.5" width="11" height="8" stroke="currentColor" strokeWidth="1.1" />
      <path d="M5 6.5V4.5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

export function FileIcon({ className }: IconProps) {
  return (
    <svg className={cn(base, className)} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 1.5h6l3 3v10h-9v-13Z" stroke="currentColor" strokeWidth="1.1" />
      <path d="M9.5 1.5v3h3M5.5 8h5M5.5 10.5h5" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

export function Upload({ className }: IconProps) {
  return (
    <svg className={cn(base, className)} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 11V2M4.5 5.5 8 2l3.5 3.5M2.5 13.5h11" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function Print({ className }: IconProps) {
  return (
    <svg className={cn(base, className)} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4.5 6V1.5h7V6M4.5 11.5h-3v-5h13v5h-3M4.5 9.5h7v5h-7v-5Z" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

/* ── Brand ─────────────────────────────────────────────────────── */

export function Brand({
  dark = false,
  compact = false,
  onClick,
}: {
  dark?: boolean;
  compact?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2.5 text-left"
      aria-label="Deskjockey for Life — inicio"
    >
      <span
        className={cn(
          "relative flex h-8 w-8 shrink-0 items-center justify-center",
          dark ? "bg-paper" : "bg-ink",
        )}
      >
        <span
          className={cn(
            "font-mono text-[13px] font-semibold leading-none tracking-[-0.08em]",
            dark ? "text-ink" : "text-paper-light",
          )}
        >
          DJ
        </span>
        <span className="absolute inset-x-0 bottom-0 h-[3px] bg-accent" />
      </span>
      <span className="flex flex-col">
        <span
          className={cn(
            "text-[16px] font-semibold leading-[1.05] tracking-[-0.04em]",
            dark ? "text-paper-light" : "text-ink",
          )}
        >
          Deskjockey
        </span>
        <span
          className={cn(
            "font-mono text-[8px] uppercase leading-[1.2] tracking-[0.22em]",
            dark ? "text-paper/55" : "text-ink-faint",
          )}
        >
          {compact ? "for life" : "for life · talent"}
        </span>
      </span>
    </button>
  );
}

/* ── Miscellaneous ────────────────────────────────────────────── */

export function Eyebrow({
  children,
  className,
  dot = false,
}: {
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <p className={cn("eyebrow flex items-center gap-2 text-ink-soft", className)}>
      {dot && <span className="inline-block h-1.5 w-1.5 bg-accent" aria-hidden="true" />}
      {children}
    </p>
  );
}

export function Rule({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-line", className)} aria-hidden="true" />;
}

export function Disclosure({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("border border-line bg-paper-light", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <span className="text-[13px] font-semibold tracking-[-0.01em]">{title}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 text-ink-faint transition-transform", open && "rotate-180")}
        />
      </button>
      {open && <div className="border-t border-line px-4 py-4">{children}</div>}
    </div>
  );
}

/* ── Form fields ──────────────────────────────────────────────── */

function FieldLabel({
  field,
  htmlFor,
  current,
}: {
  field: { label: string; required?: boolean; recommendation?: string };
  htmlFor: string;
  current?: number;
}) {
  return (
    <label htmlFor={htmlFor} className="field-label">
      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {field.label}
        {field.required && (
          <span className="text-accent" aria-hidden="true">
            *
          </span>
        )}
        {field.recommendation && (
          <span className="font-mono text-[9px] font-normal uppercase tracking-[0.06em] text-ink-faint">
            {field.recommendation}
          </span>
        )}
      </span>
      {typeof current === "number" && (
        <span className="shrink-0 font-mono text-[10px] font-normal text-ink-faint">
          {current} palabras
        </span>
      )}
    </label>
  );
}

export function TextField({
  field,
  value,
  onChange,
  error,
  showWordCount = false,
  className,
}: {
  field: TextQuestion;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  showWordCount?: boolean;
  className?: string;
}) {
  const id = `field-${field.id}`;
  const long = Boolean(field.rows);
  const words = showWordCount && value ? countWords(value) : null;

  return (
    <div className={cn("min-w-0", className)}>
      <FieldLabel field={field} htmlFor={id} current={words ?? undefined} />
      <div className="relative">
        {long ? (
          <textarea
            id={id}
            name={field.id}
            rows={field.rows}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder}
            className="field-input"
            aria-invalid={Boolean(error)}
            aria-required={field.required}
          />
        ) : (
          <input
            id={id}
            name={field.id}
            type={field.type ?? "text"}
            value={value}
            min={field.min}
            max={field.max}
            inputMode={field.type === "number" ? "numeric" : undefined}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder}
            autoComplete={field.autoComplete}
            className={cn("field-input", field.suffix && "pr-16")}
            aria-invalid={Boolean(error)}
            aria-required={field.required}
          />
        )}
        {field.suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase text-ink-faint">
            {field.suffix}
          </span>
        )}
      </div>
      {field.helper && !error && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-faint">{field.helper}</p>
      )}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-accent-deep">
      <Alert className="mt-[1px] h-3 w-3 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function SelectField({
  field,
  value,
  onChange,
  error,
  className,
}: {
  field: SelectQuestion;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}) {
  const id = `field-${field.id}`;
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="field-label">
        <span>
          {field.label}
          {field.required && <span className="ml-1 text-accent">*</span>}
        </span>
      </label>
      <div className="relative">
        <select
          id={id}
          name={field.id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="field-input appearance-none pr-10"
          aria-invalid={Boolean(error)}
          aria-required={field.required}
        >
          <option value="">{field.placeholder ?? "Seleccione una opción"}</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
      </div>
      {field.helper && !error && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-faint">{field.helper}</p>
      )}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

export function ChoiceField({
  field,
  value,
  onSelect,
  error,
  index,
}: {
  field: ChoiceQuestion;
  value: string;
  onSelect: (value: string) => void;
  error?: string;
  index?: number;
}) {
  const split = field.layout === "split";
  return (
    <fieldset className="min-w-0">
      <legend className="field-label mb-0 block w-full">
        <span className="flex items-start gap-2">
          {typeof index === "number" && (
            <span className="mt-[1px] shrink-0 font-mono text-[10px] font-normal tracking-[0.04em] text-ink-faint">
              {String(index).padStart(2, "0")}
            </span>
          )}
          <span>
            {field.label}
            <span className="ml-1 text-accent" aria-hidden="true">*</span>
          </span>
        </span>
      </legend>
      {field.helper && (
        <p id={`${field.id}-helper`} className="mb-3 mt-1.5 max-w-2xl text-[11px] leading-relaxed text-ink-faint">
          {field.helper}
        </p>
      )}
      <div className={cn(split ? "grid gap-2 sm:grid-cols-2" : "divide-y divide-line border-y border-line")}>
        {field.options.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "option-row",
                split && "border border-line",
                selected && "is-selected",
              )}
            >
              <input
                type="radio"
                name={field.id}
                value={option.value}
                checked={selected}
                onChange={() => onSelect(option.value)}
                className="sr-only"
              />
              <span className="radio-mark" aria-hidden="true" />
              <span className="text-[13px] leading-[1.45] text-ink">{option.label}</span>
            </label>
          );
        })}
      </div>
      {error && <FieldError>{error}</FieldError>}
    </fieldset>
  );
}

export function MultiField({
  field,
  value,
  onToggle,
  error,
}: {
  field: MultiQuestion;
  value: string[];
  onToggle: (value: string) => void;
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="field-label mb-0 block w-full">
        <span>
          {field.label}
          <span className="ml-1 text-accent" aria-hidden="true">*</span>
        </span>
      </legend>
      {field.helper && <p className="mb-3 mt-1.5 text-[11px] leading-relaxed text-ink-faint">{field.helper}</p>}
      <div className="grid gap-x-4 sm:grid-cols-2">
        {field.options.map((option) => {
          const selected = value.includes(option.value);
          return (
            <label
              key={option.value}
              className={cn(
                "option-row border-b border-line",
                selected && "is-selected border-x-0 border-b-line",
              )}
            >
              <input
                type="checkbox"
                name={`${field.id}-${option.value}`}
                checked={selected}
                onChange={() => onToggle(option.value)}
                className="sr-only"
              />
              <span className="check-mark" aria-hidden="true" />
              <span className="text-[13px] leading-[1.45] text-ink">{option.label}</span>
            </label>
          );
        })}
      </div>
      {error && <FieldError>{error}</FieldError>}
    </fieldset>
  );
}

export function ConsentField({
  item,
  checked,
  onChange,
  error,
}: {
  item: { id: string; label: string };
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}) {
  return (
    <div>
      <label className={cn("option-row items-start border border-line", checked && "is-selected")}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
          aria-invalid={Boolean(error)}
        />
        <span className="check-mark" aria-hidden="true" />
        <span className="text-[12px] leading-relaxed text-ink-soft">{item.label}</span>
      </label>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

export function FileDrop({
  fileName,
  fileSizeLabel,
  characters,
  error,
  onFile,
  onRemove,
}: {
  fileName?: string;
  fileSizeLabel?: string;
  characters?: number;
  error?: string;
  onFile: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div>
      <div className="field-label">
        <span>
          Currículum vitae <span className="text-accent">*</span>
        </span>
        <span className="font-mono text-[9px] font-normal uppercase tracking-[0.05em] text-ink-faint">
          PDF · Máx. 10 MB
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
      {fileName ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border border-ink bg-paper-light p-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-line-dark bg-paper">
              <FileIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">{fileName}</p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.02em] text-ink-faint">
                {fileSizeLabel ?? "PDF"} · {characters ?? 0} caracteres indexados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-secondary !min-h-9 !px-3 !text-[11px]" onClick={() => inputRef.current?.click()}>
              Sustituir
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center border border-line-dark text-ink-faint transition-colors hover:border-ink hover:text-ink"
              onClick={onRemove}
              aria-label="Retirar currículum"
            >
              <Close className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) onFile(file);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 border border-dashed px-6 py-10 text-center transition-colors",
            dragging ? "border-accent bg-accent-soft/30" : "border-line-dark bg-paper-light hover:border-ink",
          )}
        >
          <span className="flex h-10 w-10 items-center justify-center border border-line-dark bg-paper">
            <Upload className="h-4 w-4" />
          </span>
          <span className="text-[13px] font-semibold">Adjuntar currículum en PDF</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-ink-faint">
            Arrastre el archivo o pulse para seleccionarlo
          </span>
        </button>
      )}
      {error ? (
        <FieldError>{error}</FieldError>
      ) : (
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-faint">
          El documento se procesa localmente para estimar su similitud vectorial con la descripción de la
          posición. No se transmite ni se conserva fuera de este dispositivo.
        </p>
      )}
    </div>
  );
}

/* ── Shared layout fragments ──────────────────────────────────── */

export function ReviewRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line py-2.5 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-faint">{label}</span>
      <span className="text-right text-[12px] leading-relaxed text-ink-soft">{value || "No informado"}</span>
    </div>
  );
}

export function StepIndex({ index }: { index: string }) {
  return (
    <span className="font-mono text-[10px] font-normal uppercase tracking-[0.1em] text-ink-faint">{index}</span>
  );
}
