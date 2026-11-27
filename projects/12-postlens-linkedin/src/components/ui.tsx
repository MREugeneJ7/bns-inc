import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm', className)}>
      {children}
    </div>
  );
}

export function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-xl ring-1 ring-white/10">
        {icon}
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-white">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = 'slate',
}: {
  children: ReactNode;
  tone?: 'slate' | 'sky' | 'emerald' | 'amber' | 'fuchsia';
}) {
  const tones: Record<string, string> = {
    slate: 'bg-white/5 text-slate-400 ring-white/10',
    sky: 'bg-sky-400/10 text-sky-300 ring-sky-400/20',
    emerald: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
    amber: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
    fuchsia: 'bg-blue-400/10 text-blue-300 ring-blue-400/20',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1',
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-white/5', className)}>
      <div
        className="h-full rounded-full bg-blue-500 transition-all duration-300"
        style={{ width: `${Math.max(2, Math.min(100, value * 100))}%` }}
      />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      viewBox="0 0 24 24"
      fill="none"
      width="16"
      height="16"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l2.9 6.26 6.86.83-5.07 4.7 1.35 6.77L12 17.1l-6.04 3.46 1.35-6.77-5.07-4.7 6.86-.83L12 2z" />
    </svg>
  );
}

export function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}
