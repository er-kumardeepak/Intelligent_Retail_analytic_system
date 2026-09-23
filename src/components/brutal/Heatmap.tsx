import { cn } from '@/lib/utils';

/** Five discrete steps. A gradient would read as decoration; steps read as data. */
const LEVELS = [
  'bg-ink/[0.07]',
  'bg-blue',
  'bg-lime',
  'bg-yellow',
  'bg-coral',
] as const;

const LEVEL_LABELS = ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'PEAK'];

function levelOf(value: number) {
  if (value <= 0) return 0;
  return Math.min(4, Math.ceil(value / 25));
}

export interface HeatmapProps {
  /** Row labels, top to bottom. */
  rows: string[];
  /** Column labels, left to right. */
  cols: string[];
  /** values[rowIndex][colIndex], 0–100 */
  values: number[][];
  className?: string;
  unit?: string;
}

export function Heatmap({ rows, cols, values, className, unit = '%' }: HeatmapProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[640px]">
          {/* Column headers */}
          <div className="flex items-end gap-[3px]">
            <div className="w-[124px] shrink-0" />
            {cols.map((c) => (
              <div
                key={c}
                className="flex-1 border-b-3 border-ink pb-1 text-center font-mono text-[9px] font-bold uppercase tracking-wider text-muted"
              >
                {c}
              </div>
            ))}
          </div>

          {/* Rows */}
          {rows.map((row, r) => (
            <div key={row} className="mt-[3px] flex items-center gap-[3px]">
              <div className="w-[124px] shrink-0 pr-2 text-right">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider">
                  {row}
                </span>
              </div>
              {cols.map((c, ci) => {
                const v = values[r]?.[ci] ?? 0;
                return (
                  <div
                    key={`${row}-${c}`}
                    title={`${row} · ${c} · ${v}${unit}`}
                    className={cn(
                      'group relative h-8 flex-1 border-2 border-ink transition-transform duration-100 hover:z-10 hover:-translate-y-[2px] hover:shadow-brutal-xs',
                      LEVELS[levelOf(v)],
                    )}
                  >
                    <span className="absolute inset-0 hidden items-center justify-center font-mono text-[9px] font-bold text-ink group-hover:flex">
                      {v}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Stepped legend */}
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {LEVELS.map((lvl, i) => (
          <li key={lvl} className="flex items-center gap-2">
            <span className={cn('h-3.5 w-6 border-2 border-ink', lvl)} />
            <span className="font-mono text-[9px] uppercase tracking-mega text-muted">
              {LEVEL_LABELS[i]}
            </span>
          </li>
        ))}
        <li className="font-mono text-[9px] uppercase tracking-mega text-muted">
          SCALE 0 — 100{unit}
        </li>
      </ul>
    </div>
  );
}
