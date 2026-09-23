import type { ChartPalette } from '@/lib/tone';

export const MONO = '"IBM Plex Mono", monospace';

/** Black axes, thick lines, no tick marks — the chart equivalent of a 3px border. */
export function axisProps(p: ChartPalette, opts: { angle?: number; height?: number } = {}) {
  return {
    stroke: p.ink,
    strokeWidth: 3,
    tick: {
      fill: p.ink,
      fontSize: 10.5,
      fontFamily: MONO,
      letterSpacing: 0.8,
      angle: opts.angle ?? 0,
      textAnchor: (opts.angle ? 'end' : 'middle') as 'end' | 'middle',
    },
    tickLine: false,
    axisLine: { stroke: p.ink, strokeWidth: 3 },
    height: opts.height,
  };
}

/** Strong but flat grid — solid hairlines, never dashed or glossy. */
export function gridProps(p: ChartPalette, vertical = false) {
  return {
    stroke: p.ink,
    strokeOpacity: 0.16,
    strokeWidth: 1.5,
    vertical,
    horizontal: true,
  };
}

export function yAxisProps(p: ChartPalette, width = 40) {
  return {
    ...axisProps(p),
    width,
    axisLine: { stroke: p.ink, strokeWidth: 3 },
  };
}
