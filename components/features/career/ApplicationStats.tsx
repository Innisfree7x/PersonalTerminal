'use client';

import { Application } from '@/lib/schemas/application.schema';
import { motion } from 'framer-motion';
import { TrendingUp, Briefcase, CheckCircle, BarChart3 } from 'lucide-react';

interface ApplicationStatsProps {
  applications: Application[];
}

export default function ApplicationStats({ applications }: ApplicationStatsProps) {
  const stats = {
    total: applications.length,
    applied: applications.filter((a) => a.status === 'applied').length,
    interview: applications.filter((a) => a.status === 'interview').length,
    offer: applications.filter((a) => a.status === 'offer').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  // const responseRate =
  //   stats.total > 0
  //     ? Math.round(
  //         ((stats.interview + stats.offer + stats.rejected) / stats.total) * 100
  //       )
  //     : 0;

  const offerRate =
    stats.total > 0
      ? Math.round((stats.offer / stats.total) * 100)
      : 0;

  const statCards = [
    {
      label: 'Total Applications',
      value: stats.total,
      icon: BarChart3,
      gradient: 'from-info/20 to-info/10',
      color: 'text-info',
      borderColor: 'border-info/30',
    },
    {
      label: 'Active Interviews',
      value: stats.interview,
      icon: Briefcase,
      gradient: 'from-warning/20 to-warning/10',
      color: 'text-warning',
      borderColor: 'border-warning/30',
    },
    {
      label: 'Offers Received',
      value: stats.offer,
      icon: CheckCircle,
      gradient: 'from-success/20 to-success/10',
      color: 'text-success',
      borderColor: 'border-success/30',
    },
    {
      label: 'Success Rate',
      value: `${offerRate}%`,
      icon: TrendingUp,
      gradient: 'from-primary/20 to-primary/10',
      color: 'text-primary',
      borderColor: 'border-primary/30',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} backdrop-blur-sm border ${stat.borderColor} rounded-lg p-6 group`}
            whileHover={{ y: -2 }}
          >
            {/* Animated background glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded-lg ${stat.gradient} border ${stat.borderColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              
              <div>
                <div className={`text-3xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-sm text-text-tertiary">
                  {stat.label}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
