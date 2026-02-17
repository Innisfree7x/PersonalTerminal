'use client';

import { Application, ApplicationStatus } from '@/lib/schemas/application.schema';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Trash2, MapPin, Calendar, DollarSign, ExternalLink } from 'lucide-react';

interface ApplicationCardProps {
  application: Application;
  onClick?: () => void;
  onDelete?: (applicationId: string) => void;
  compact?: boolean;
}

const statusConfig: Record<ApplicationStatus, { color: string; bgColor: string }> = {
  applied: { color: 'text-info', bgColor: 'bg-info/10' },
  interview: { color: 'text-warning', bgColor: 'bg-warning/10' },
  offer: { color: 'text-success', bgColor: 'bg-success/10' },
  rejected: { color: 'text-error', bgColor: 'bg-error/10' },
};

export default function ApplicationCard({
  application,
  onClick,
  onDelete,
  compact = false,
}: ApplicationCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(application.id);
    }
  };

  const config = statusConfig[application.status];
  const daysSinceApplication = Math.floor(
    (new Date().getTime() - application.applicationDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (compact) {
    // Compact Kanban Card
    return (
      <motion.div
        onClick={onClick}
        data-interactive="application"
        data-item-id={application.id}
        data-item-title={application.position}
        className="group relative bg-surface border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-all card-hover-glow"
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Company Logo Placeholder */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary-dark/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
            <span className="text-lg font-bold text-primary">
              {application.company.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-text-primary text-sm truncate mb-1">
              {application.position}
            </h4>
            <p className="text-xs text-text-secondary truncate">
              {application.company}
            </p>
          </div>

          {/* Delete Button */}
          {onDelete && (
            <motion.button
              onClick={handleDelete}
              className="p-1 text-text-tertiary hover:text-error hover:bg-error/10 rounded transition-colors opacity-0 group-hover:opacity-100"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </motion.button>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2 text-xs">
          {application.location && (
            <div className="flex items-center gap-1.5 text-text-tertiary">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{application.location}</span>
            </div>
          )}

          {application.interviewDate && (
            <div className="flex items-center gap-1.5 text-warning">
              <Calendar className="w-3 h-3" />
              <span>
                {format(application.interviewDate, 'MMM d')}
              </span>
            </div>
          )}

          {application.salaryRange && (
            <div className="flex items-center gap-1.5 text-success">
              <DollarSign className="w-3 h-3" />
              <span>{application.salaryRange}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-text-tertiary">
          <span>{daysSinceApplication}d ago</span>
          {application.jobUrl && (
            <a
              href={application.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-primary hover:text-primary-hover transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </motion.div>
    );
  }

  // Full Card (for list view if needed later)
  return (
    <motion.div
      onClick={onClick}
      data-interactive="application"
      data-item-id={application.id}
      data-item-title={application.position}
      className="group relative gradient-card p-6 cursor-pointer"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Animated glow */}
      <div className={`absolute inset-0 ${config.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            {/* Company Logo */}
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary-dark/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
              <span className="text-xl font-bold text-primary">
                {application.company.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                {application.position}
              </h3>
              <p className="text-sm text-text-secondary mb-2">
                {application.company}
              </p>
              {application.location && (
                <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                  <MapPin className="w-3 h-3" />
                  {application.location}
                </div>
              )}
            </div>
          </div>

          {/* Delete Button */}
          {onDelete && (
            <motion.button
              onClick={handleDelete}
              className="p-2 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Delete application"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Dates & Info */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
            <Calendar className="w-3 h-3" />
            <span>Applied {format(application.applicationDate, 'MMM dd')}</span>
          </div>

          {application.interviewDate && (
            <Badge variant="warning" size="sm">
              Interview {format(application.interviewDate, 'MMM dd')}
            </Badge>
          )}

          {application.salaryRange && (
            <div className="flex items-center gap-1.5 text-xs text-success">
              <DollarSign className="w-3 h-3" />
              {application.salaryRange}
            </div>
          )}
        </div>

        {/* Notes */}
        {application.notes && (
          <p className="text-sm text-text-secondary mb-4 line-clamp-2">
            {application.notes}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          {application.jobUrl && (
            <a
              href={application.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              View Job
            </a>
          )}
          <span className="text-xs text-text-tertiary ml-auto">
            {daysSinceApplication} days ago
          </span>
        </div>
      </div>
    </motion.div>
  );
}
