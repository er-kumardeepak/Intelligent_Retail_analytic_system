import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_PALETTE } from '@/lib/tone';
import type { Tone } from '@/lib/types';
import { BrutalTooltip } from '@/components/brutal';
import { axisProps, gridProps, yAxisProps } from './helpers';

/** Square data points. Circles would break the visual language. */
export function SquareDot(props: {
  cx?: number;
  cy?: number;
  fill?: string;
  stroke?: string;
}) {
  const { cx = 0, cy = 0, fill = '#000', stroke = '#000' } = props;
  const s = 4;
  return (
    <rect x={cx - s} y={cy - s} width={s * 2} height={s * 2} fill={fill} stroke={stroke} strokeWidth={2} />
  );
}

export interface SeriesDef {
  key: string;
  name: string;
  tone: Tone;
  type?: 'line' | 'bar' | 'area';
  dashed?: boolean;
  fillOpacity?: number;
  barSize?: number;
  hideDot?: boolean;
  yAxisId?: 'left' | 'right';
}

export interface BrutalChartProps {
  data: Record<string, unknown>[];
  series: SeriesDef[];
  xKey?: string;
  height?: number;
  unit?: string;
  showGrid?: boolean;
  xAngle?: number;
  yWidth?: number;
  rightYAxis?: boolean;
  rightUnit?: string;
  /** Vertical marker, e.g. "now". */
  referenceX?: string;
  referenceLabel?: string;
  /** Padding between bar series groups, in px. */
  barGap?: number;
}

export function BrutalChart({
  data,
  series,
  xKey = 't',
  height = 280,
  unit = '',
  showGrid = true,
  xAngle = 0,
  yWidth = 42,
  rightYAxis = false,
  rightUnit = '',
  referenceX,
  referenceLabel,
  barGap = 3,
}: BrutalChartProps) {
  const p = CHART_PALETTE;
  const color = (tone: Tone) => p[tone];

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          barGap={barGap}
          margin={{ top: 14, right: rightYAxis ? 16 : 10, bottom: xAngle ? 22 : 4, left: 0 }}
        >
          {showGrid && <CartesianGrid {...gridProps(p)} />}

          <XAxis dataKey={xKey} {...axisProps(p, { angle: xAngle })} />
          <YAxis yAxisId="left" {...yAxisProps(p, yWidth)} />
          {rightYAxis && (
            <YAxis yAxisId="right" orientation="right" {...yAxisProps(p, yWidth)} unit={rightUnit} />
          )}

          <Tooltip
            cursor={{ stroke: p.ink, strokeWidth: 2, strokeOpacity: 0.4 }}
            content={<BrutalTooltip palette={p} unit={unit} />}
          />

          {referenceX && (
            <ReferenceLine
              x={referenceX}
              yAxisId="left"
              stroke={p.coral}
              strokeWidth={3}
              strokeDasharray="6 4"
              label={{
                value: referenceLabel ?? 'NOW',
                position: 'insideTopRight',
                fill: p.coral,
                fontSize: 10,
                fontFamily: '"IBM Plex Mono", monospace',
                fontWeight: 700,
              }}
            />
          )}

          {series.map((s) => {
            const stroke = color(s.tone);
            if (s.type === 'bar') {
              return (
                <Bar
                  key={s.key}
                  yAxisId={s.yAxisId ?? 'left'}
                  dataKey={s.key}
                  name={s.name}
                  fill={stroke}
                  stroke={p.ink}
                  strokeWidth={2.5}
                  barSize={s.barSize ?? 26}
                  radius={0}
                  isAnimationActive
                  animationDuration={650}
                />
              );
            }
            if (s.type === 'area') {
              return (
                <Area
                  key={s.key}
                  yAxisId={s.yAxisId ?? 'left'}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  fill={stroke}
                  fillOpacity={s.fillOpacity ?? 0.22}
                  stroke={s.dashed ? p.ink : stroke}
                  strokeWidth={2.5}
                  strokeDasharray={s.dashed ? '7 5' : undefined}
                  isAnimationActive
                  animationDuration={650}
                  dot={false}
                  activeDot={<SquareDot fill={stroke} stroke={p.ink} />}
                  connectNulls
                />
              );
            }
            return (
              <Line
                key={s.key}
                yAxisId={s.yAxisId ?? 'left'}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={stroke}
                strokeWidth={3.5}
                strokeDasharray={s.dashed ? '8 5' : undefined}
                isAnimationActive
                animationDuration={700}
                dot={s.hideDot ? false : <SquareDot fill={stroke} stroke={p.ink} />}
                activeDot={<SquareDot fill={stroke} stroke={p.ink} />}
                connectNulls
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal bar breakdown — used for category and zone comparisons. */
export function HorizontalBars({
  data,
  height = 280,
  unit = '',
  labelWidth = 118,
  name = 'value',
}: {
  data: { label: string; value: number; tone: Tone }[];
  height?: number;
  unit?: string;
  labelWidth?: number;
  name?: string;
}) {
  const p = CHART_PALETTE;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} layout="vertical" margin={{ top: 8, right: 28, bottom: 4, left: 6 }}>
          <CartesianGrid {...gridProps(p)} vertical horizontal={false} />
          <XAxis type="number" {...axisProps(p)} />
          <YAxis type="category" dataKey="label" {...yAxisProps(p, labelWidth)} />
          <Tooltip
            cursor={{ fill: p.ink, fillOpacity: 0.06 }}
            content={<BrutalTooltip palette={p} unit={unit} />}
          />
          <Bar
            dataKey="value"
            name={name}
            barSize={22}
            stroke={p.ink}
            strokeWidth={2.5}
            isAnimationActive
            animationDuration={650}
          >
            {data.map((d) => (
              <Cell key={d.label} fill={p[d.tone]} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
