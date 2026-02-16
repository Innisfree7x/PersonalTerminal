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
  Cell,
} from 'recharts';

interface HourlyData {
  hour: number;
  totalMinutes: number;
  sessions: number;
}

interface HourlyDistributionChartProps {
  data: HourlyData[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const hour = parseInt(label);
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-text-tertiary mb-1">
        {hour.toString().padStart(2, '0')}:00 - {((hour + 1) % 24).toString().padStart(2, '0')}:00
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

const HourlyDistributionChart = memo(function HourlyDistributionChart({
  data,
}: HourlyDistributionChartProps) {
  const maxMinutes = Math.max(...data.map((d) => d.totalMinutes), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="card-surface rounded-xl p-5"
    >
      <h3 className="text-sm font-medium text-text-primary mb-4">Peak Hours</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#282837" vertical={false} />
            <XAxis
              dataKey="hour"
              stroke="#646787"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}h`}
            />
            <YAxis
              stroke="#646787"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}m`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalMinutes" radius={[4, 4, 0, 0]} maxBarSize={24}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={`rgba(139, 92, 246, ${0.2 + (entry.totalMinutes / maxMinutes) * 0.8})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
});

export default HourlyDistributionChart;
