import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const CONTROL =
  'w-full rounded-brutal border-3 border-ink bg-surface px-3 py-2.5 text-[12px] font-medium text-ink placeholder:text-muted/70 focus:outline-none focus-visible:bg-yellow/20';

export function Field({
  label,
  hint,
  children,
  className,
  required,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="font-mono text-[10px] font-bold uppercase tracking-mega text-muted">
        {label}
        {required && <span className="ml-1 text-coral">*</span>}
      </span>
      {children}
      {hint && <span className="font-mono text-[9px] uppercase tracking-wider text-muted">{hint}</span>}
    </label>
  );
}

export function TextInput({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, className)} {...rest} />;
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CONTROL, 'appearance-none pr-8', className)} {...rest}>
      {children}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  detail,
  tone = 'lime',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  detail?: string;
  tone?: 'lime' | 'coral' | 'blue' | 'purple' | 'yellow';
}) {
  const KNOB: Record<string, string> = {
    lime: 'bg-lime',
    coral: 'bg-coral',
    blue: 'bg-blue',
    purple: 'bg-purple',
    yellow: 'bg-yellow',
  };
  return (
    <div className="flex items-start justify-between gap-4 border-b-3 border-ink/15 py-3 last:border-b-0">
      <span className="min-w-0">
        <span className="block text-[12px] font-bold uppercase tracking-wide">{label}</span>
        {detail && (
          <span className="mt-0.5 block font-mono text-[10px] leading-relaxed text-muted">
            {detail}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn('toggle-track shrink-0', checked && KNOB[tone])}
      >
        <span
          className={cn(
            'toggle-knob',
            checked ? 'left-0 ' + KNOB[tone] : 'right-0 bg-surface',
          )}
        />
      </button>
    </div>
  );
}

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  unit = '%',
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  label: string;
  unit?: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-b-3 border-ink/15 py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold uppercase tracking-wide">{label}</span>
        <span className="border-3 border-ink bg-ink px-2 py-0.5 font-mono text-[11px] font-bold text-paper tnum">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="h-3 w-full cursor-pointer appearance-none border-3 border-ink bg-surface accent-ink"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgb(17 17 17 / 0.14) 0 2px, transparent 2px 20px)',
        }}
      />
    </div>
  );
}
