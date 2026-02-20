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
} from 'recharts';

interface WeekdayData {
  day: number;
  totalMinutes: number;
  sessions: number;
}

interface WeekdayChartProps {
  data: WeekdayData[];
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-text-tertiary mb-1">{DAY_LABELS[parseInt(label)]}</p>
      <p className="text-sm font-medium text-text-primary">{payload[0].value} min</p>
      <p className="text-xs text-text-tertiary">{payload[0].payload.sessions} sessions</p>
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
      className="card-surface rounded-xl p-5"
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
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="totalMinutes"
              fill="#EAB308"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              opacity={0.8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
});

export default WeekdayChart;
