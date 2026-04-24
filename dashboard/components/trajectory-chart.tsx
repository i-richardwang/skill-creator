"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TrajectoryDatum = {
  iteration: number;
  withSkill: number | null;
  withSkillBandLow: number | null;
  withSkillBandHigh: number | null;
  withoutSkill: number | null;
  withoutSkillBandLow: number | null;
  withoutSkillBandHigh: number | null;
};

type Props = {
  data: TrajectoryDatum[];
};

const C_WITH = "oklch(0.62 0.14 150)";
const C_WITHOUT = "oklch(0.60 0.11 55)";

export function TrajectoryChart({ data }: Props) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 16, right: 16, bottom: 8, left: -8 }}
        >
          <defs>
            <linearGradient id="band-with" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C_WITH} stopOpacity={0.18} />
              <stop offset="100%" stopColor={C_WITH} stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="band-without" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C_WITHOUT} stopOpacity={0.18} />
              <stop offset="100%" stopColor={C_WITHOUT} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="2 4"
            vertical={false}
          />
          <XAxis
            dataKey="iteration"
            type="number"
            domain={["dataMin", "dataMax"]}
            allowDecimals={false}
            stroke="var(--muted-foreground)"
            fontSize={10}
            fontFamily="var(--font-mono)"
            tickFormatter={(v) => `#${v}`}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            domain={[0, 1]}
            stroke="var(--muted-foreground)"
            fontSize={10}
            fontFamily="var(--font-mono)"
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />

          <Area
            type="monotone"
            dataKey="withSkillBandHigh"
            stroke="none"
            fill="url(#band-with)"
            activeDot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="withSkillBandLow"
            stroke="none"
            fill="var(--background)"
            activeDot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="withoutSkillBandHigh"
            stroke="none"
            fill="url(#band-without)"
            activeDot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="withoutSkillBandLow"
            stroke="none"
            fill="var(--background)"
            activeDot={false}
            isAnimationActive={false}
          />

          <Line
            name="without_skill"
            type="monotone"
            dataKey="withoutSkill"
            stroke={C_WITHOUT}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={{ r: 3, fill: C_WITHOUT, strokeWidth: 0 }}
            activeDot={{ r: 5, stroke: "var(--background)", strokeWidth: 2 }}
            isAnimationActive={false}
            connectNulls
          />
          <Line
            name="with_skill"
            type="monotone"
            dataKey="withSkill"
            stroke={C_WITH}
            strokeWidth={2}
            dot={{ r: 3.5, fill: C_WITH, strokeWidth: 0 }}
            activeDot={{ r: 5.5, stroke: "var(--background)", strokeWidth: 2 }}
            isAnimationActive={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

type TooltipPayloadEntry = {
  dataKey?: string;
  value?: number | null;
  payload?: TrajectoryDatum;
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;

  const row = (
    name: string,
    value: number | null,
    color: string,
    stddevLow?: number | null,
    stddevHigh?: number | null,
  ) => (
    <div className="flex items-baseline justify-between gap-4 tabular-nums">
      <span className="text-muted-foreground flex items-center gap-2 text-[10px] tracking-widest uppercase">
        <span
          aria-hidden
          className="inline-block h-2 w-2"
          style={{ background: color }}
        />
        {name}
      </span>
      <span className="font-mono">
        {value === null ? "—" : `${(value * 100).toFixed(1)}%`}
        {stddevLow !== null &&
        stddevLow !== undefined &&
        stddevHigh !== null &&
        stddevHigh !== undefined &&
        value !== null ? (
          <span className="text-muted-foreground ml-1 text-[10px]">
            ±{((stddevHigh - stddevLow) / 2 * 100).toFixed(1)}
          </span>
        ) : null}
      </span>
    </div>
  );

  return (
    <div className="border-border bg-background min-w-48 border px-3 py-2 shadow-sm">
      <div className="text-muted-foreground border-border mb-2 border-b pb-1 font-mono text-[10px] tracking-widest uppercase">
        iteration #{label}
      </div>
      <div className="space-y-1 text-sm">
        {row(
          "with_skill",
          datum.withSkill,
          C_WITH,
          datum.withSkillBandLow,
          datum.withSkillBandHigh,
        )}
        {row(
          "without_skill",
          datum.withoutSkill,
          C_WITHOUT,
          datum.withoutSkillBandLow,
          datum.withoutSkillBandHigh,
        )}
      </div>
    </div>
  );
}
