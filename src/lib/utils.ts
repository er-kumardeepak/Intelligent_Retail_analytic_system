export type ClassValue = string | false | null | undefined | ClassValue[];

/** Tiny dependency-free class name joiner. */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const walk = (v: ClassValue) => {
    if (!v) return;
    if (Array.isArray(v)) v.forEach(walk);
    else out.push(v);
  };
  inputs.forEach(walk);
  return out.join(' ');
}

/** 1280 -> "1.28K", 128 -> "128" */
export function compact(n: number): string {
  if (Math.abs(n) >= 1000) {
    const v = n / 1000;
    return `${Number.isInteger(v) ? v : v.toFixed(2)}K`;
  }
  return `${Math.round(n)}`;
}

/** Signed percentage, e.g. +12% / -40% */
export function signed(n: number, digits = 1): string {
  const s = n > 0 ? '+' : n < 0 ? '' : '';
  return `${s}${n.toFixed(digits)}%`;
}

/** "3m ago" style relative timestamps. */
export function relativeTime(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins}M AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}H AGO`;
  return `${Math.floor(hrs / 24)}D AGO`;
}

/** HH:MM in 24h form. */
export function clock(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** Clamp a number into [min, max]. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Random helper for the live simulation. */
export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
