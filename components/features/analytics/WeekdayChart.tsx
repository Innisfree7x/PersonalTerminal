'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipContentProps,
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface WeekdayData {
  day: number;
  totalMinutes: number;
  sessions: number;
}

interface WeekdayChartProps {
  data: WeekdayData[];
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function CustomTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;

  const firstPayload = payload[0];
  const dayIndex = typeof label === 'number' ? label : Number.parseInt(String(label), 10);

  if (!firstPayload || !Number.isFinite(dayIndex)) return null;

  const sessions =
    typeof firstPayload.payload === 'object' &&
    firstPayload.payload !== null &&
    'sessions' in firstPayload.payload
      ? Number(firstPayload.payload.sessions)
      : 0;

  const minutes = typeof firstPayload.value === 'number'
    ? firstPayload.value
    : Number(firstPayload.value ?? 0);

  return (
    <div className="rounded-xl border border-white/[0.12] bg-zinc-950/90 px-3 py-2 shadow-2xl backdrop-blur-md">
      <p className="text-[10px] text-zinc-500 mb-0.5">{DAY_LABELS[dayIndex]}</p>
      <p className="text-xs font-semibold text-text-primary">{minutes} min</p>
      <p className="text-[10px] text-zinc-500">{sessions} sessions</p>
    </div>
  );
}

const WeekdayChart = memo(function WeekdayChart({ data }: WeekdayChartProps) {
  // Reorder: Mon-Sun instead of Sun-Sat
  const reordered = [...data.slice(1), data[0]!].map((d, i) => ({
    ...d,
    dayLabel: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="card-warm rounded-xl p-5"
    >
      <h3 className="text-sm font-medium text-text-primary mb-4">Weekday Pattern</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={reordered} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#282837" vertical={false} />
            <XAxis
              dataKey="dayLabel"
              stroke="#646787"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#646787"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}m`}
            />
            <Tooltip
              content={(tooltipProps) => <CustomTooltip {...tooltipProps} />}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar
              dataKey="totalMinutes"
              fill="#EAB308"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              opacity={0.8}
              isAnimationActive={true}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
});

export default WeekdayChart;
