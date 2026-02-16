'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface CategoryData {
  category: string;
  totalMinutes: number;
  sessions: number;
}

interface CategoryBreakdownProps {
  data: CategoryData[];
}

const CATEGORY_COLORS: Record<string, string> = {
  study: '#8B5CF6',
  work: '#0EA5E9',
  exercise: '#EC4899',
  reading: '#10B981',
  other: '#F59E0B',
};

const CATEGORY_LABELS: Record<string, string> = {
  study: 'Study',
  work: 'Work',
  exercise: 'Exercise',
  reading: 'Reading',
  other: 'Other',
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-text-primary">
        {CATEGORY_LABELS[data.category] || data.category}
      </p>
      <p className="text-xs text-text-tertiary">
        {data.totalMinutes} min · {data.sessions} sessions
      </p>
    </div>
  );
}

const CategoryBreakdown = memo(function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const totalMinutes = data.reduce((sum, d) => sum + d.totalMinutes, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="card-surface rounded-xl p-5"
    >
      <h3 className="text-sm font-medium text-text-primary mb-4">Category Breakdown</h3>
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-text-tertiary text-sm">
          No sessions yet
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <div className="h-48 w-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="totalMinutes"
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={CATEGORY_COLORS[entry.category] || '#646787'}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {data.map((item) => {
              const percent = totalMinutes > 0 ? Math.round((item.totalMinutes / totalMinutes) * 100) : 0;
              return (
                <div key={item.category} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#646787' }}
                  />
                  <span className="text-xs text-text-secondary flex-1">
                    {CATEGORY_LABELS[item.category] || item.category}
                  </span>
                  <span className="text-xs font-medium text-text-primary">{percent}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
});

export default CategoryBreakdown;
