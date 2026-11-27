import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { cn } from "../utils/cn";

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
  format,
  disabled = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  disabled?: boolean;
}) {
  return (
    <label className={cn("slider-control", disabled && "is-disabled")}>
      <span className="slider-label">
        <span>{label}</span>
        <span className="slider-value">
          {format ? format(value) : value}
          <small>{suffix}</small>
        </span>
      </span>
      <input
        className="morse-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        style={
          {
            "--range-progress": `${((value - min) / (max - min)) * 100}%`,
          } as CSSProperties
        }
      />
    </label>
  );
}

export function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="toggle-control"
    >
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <span className={cn("toggle-track", on && "is-on")}>
        <span />
      </span>
    </button>
  );
}

export function Btn({
  children,
  variant = "ghost",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
}) {
  return (
    <button
      type="button"
      className={cn("btn", `btn-${variant}`, className)}
      {...props}
    >
      {children}
    </button>
  );
}
