'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

interface AnalyticsStatCardProps {
  title: string;
  value: string;
  numericValue?: number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  delay?: number;
}

const AnalyticsStatCard = memo(function AnalyticsStatCard({
  title,
  value,
  numericValue,
  subtitle,
  icon: Icon,
  color = 'text-primary',
  delay = 0,
}: AnalyticsStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="card-surface rounded-xl p-4"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-text-tertiary font-medium">{title}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="text-2xl font-bold text-text-primary">
        {numericValue !== undefined ? (
          <AnimatedCounter to={numericValue} suffix={value.replace(/[0-9]/g, '')} />
        ) : (
          value
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-text-tertiary mt-0.5">{subtitle}</p>
      )}
    </motion.div>
  );
});

export default AnalyticsStatCard;
