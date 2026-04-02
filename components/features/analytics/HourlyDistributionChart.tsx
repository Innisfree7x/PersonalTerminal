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
    <div className="rounded-xl border border-white/[0.12] bg-zinc-950/90 px-3 py-2 shadow-2xl backdrop-blur-md">
      <p className="text-[10px] text-zinc-500 mb-0.5">
        {hour.toString().padStart(2, '0')}:00–{((hour + 1) % 24).toString().padStart(2, '0')}:00
      </p>
      <p className="text-xs font-semibold text-text-primary">
        {payload[0].value} min
      </p>
      <p className="text-[10px] text-zinc-500">
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
      className="card-warm rounded-xl p-5"
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="totalMinutes" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={true} animationBegin={0} animationDuration={800} animationEasing="ease-out">
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={`rgba(234, 179, 8, ${0.2 + (entry.totalMinutes / maxMinutes) * 0.8})`}
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
