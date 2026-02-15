'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface DailyData {
  date: string;
  totalMinutes: number;
  sessions: number;
}

interface DailyFocusChartProps {
  data: DailyData[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-text-tertiary mb-1">
        {format(parseISO(label), 'EEE, MMM d')}
      </p>
      <p className="text-sm font-medium text-text-primary">
        {payload[0].value} min
      </p>
      <p className="text-xs text-text-tertiary">
        {payload[0].payload.sessions} sessions
      </p>
    </div>
  );
}

const DailyFocusChart = memo(function DailyFocusChart({ data }: DailyFocusChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card-surface rounded-xl p-5"
    >
      <h3 className="text-sm font-medium text-text-primary mb-4">Daily Focus Time</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#282837" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(val) => format(parseISO(val), 'd')}
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
            <Area
              type="monotone"
              dataKey="totalMinutes"
              stroke="#8B5CF6"
              strokeWidth={2}
              fill="url(#focusGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
});

export default DailyFocusChart;
