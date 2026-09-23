import type { AlertLevel, Priority, RiskLevel, ShelfStatus, Tone } from './types';

/** Solid fill + the text colour that stays legible on it. */
export const TONE_BG: Record<Tone, string> = {
  ink: 'bg-ink text-paper',
  blue: 'bg-blue text-white',
  lime: 'bg-lime text-ink',
  yellow: 'bg-yellow text-ink',
  coral: 'bg-coral text-ink',
  purple: 'bg-purple text-white',
};

export const TONE_SOLID: Record<Tone, string> = {
  ink: 'bg-ink',
  blue: 'bg-blue',
  lime: 'bg-lime',
  yellow: 'bg-yellow',
  coral: 'bg-coral',
  purple: 'bg-purple',
};

export const TONE_TEXT: Record<Tone, string> = {
  ink: 'text-ink',
  blue: 'text-blue',
  lime: 'text-lime',
  yellow: 'text-yellow',
  coral: 'text-coral',
  purple: 'text-purple',
};

export const TONE_BORDER: Record<Tone, string> = {
  ink: 'border-ink',
  blue: 'border-blue',
  lime: 'border-lime',
  yellow: 'border-yellow',
  coral: 'border-coral',
  purple: 'border-purple',
};

/** Soft tint used behind text blocks. Kept low-opacity so it never reads as glass. */
export const TONE_WASH: Record<Tone, string> = {
  ink: 'bg-ink/10',
  blue: 'bg-blue/15',
  lime: 'bg-lime/25',
  yellow: 'bg-yellow/25',
  coral: 'bg-coral/20',
  purple: 'bg-purple/15',
};

export const LEVEL_TONE: Record<AlertLevel, Tone> = {
  critical: 'coral',
  warning: 'yellow',
  info: 'blue',
  resolved: 'lime',
};

export const LEVEL_LABEL: Record<AlertLevel, string> = {
  critical: 'CRITICAL',
  warning: 'WARNING',
  info: 'INFO',
  resolved: 'RESOLVED',
};

export const PRIORITY_TONE: Record<Priority, Tone> = {
  critical: 'coral',
  high: 'yellow',
  medium: 'blue',
  low: 'lime',
};

export const RISK_TONE: Record<RiskLevel, Tone> = {
  high: 'coral',
  medium: 'yellow',
  low: 'lime',
};

export const SHELF_TONE: Record<ShelfStatus, Tone> = {
  empty: 'coral',
  critical: 'coral',
  low: 'yellow',
  healthy: 'lime',
};

export const SHELF_LABEL: Record<ShelfStatus, string> = {
  empty: 'EMPTY',
  critical: 'CRITICAL',
  low: 'LOW',
  healthy: 'HEALTHY',
};

export const CAMERA_TONE = {
  online: 'lime',
  warning: 'yellow',
  offline: 'coral',
} as const;

/* ============================================================
   CHART PALETTE
   Recharts writes SVG presentation attributes, which cannot resolve
   `var()`. So chart internals get literal hex values, kept in step with
   the CSS tokens in index.css.
   ============================================================ */
export interface ChartPalette {
  ink: string;
  paper: string;
  surface: string;
  muted: string;
  blue: string;
  lime: string;
  yellow: string;
  coral: string;
  purple: string;
}

export const CHART_PALETTE: ChartPalette = {
  ink: '#111111',
  paper: '#F5F1E8',
  surface: '#FFFFFF',
  muted: '#686868',
  blue: '#2563EB',
  lime: '#A3E635',
  yellow: '#FACC15',
  coral: '#FF5A5F',
  purple: '#8B5CF6',
};

/** Rough icon glyph per metric zone, avoids a shadcn dependency for simple cases. */
export function toneFromFill(fill: number): Tone {
  if (fill < 45) return 'coral';
  if (fill < 70) return 'yellow';
  if (fill < 85) return 'blue';
  return 'lime';
}
