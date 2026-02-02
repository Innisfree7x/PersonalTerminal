'use client';

import { Application, ApplicationStatus } from '@/lib/schemas/application.schema';
import { format } from 'date-fns';

interface ApplicationCardProps {
  application: Application;
  onClick?: () => void;
  onDelete?: (applicationId: string) => void;
}

const statusColors: Record<ApplicationStatus, string> = {
  applied: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  interview: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  offer: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

const statusLabels: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

export default function ApplicationCard({
  application,
  onClick,
  onDelete,
}: ApplicationCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(application.id);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer relative group ${
        onClick ? 'hover:border-gray-300 dark:hover:border-gray-600' : ''
      }`}
    >
      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Delete application"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {application.position}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {application.company}
          </p>
          {application.location && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              📍 {application.location}
            </p>
          )}
        </div>
        <span
          className={`inline-block px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${statusColors[application.status]}`}
        >
          {statusLabels[application.status]}
        </span>
      </div>

      {/* Dates */}
      <div className="flex flex-col gap-1 mb-4 text-xs text-gray-600 dark:text-gray-400">
        <div>
          <span className="font-medium">Applied:</span>{' '}
          {format(application.applicationDate, 'MMM dd, yyyy')}
        </div>
        {application.interviewDate && (
          <div>
            <span className="font-medium">Interview:</span>{' '}
            {format(application.interviewDate, 'MMM dd, yyyy')}
          </div>
        )}
        {application.salaryRange && (
          <div>
            <span className="font-medium">Salary:</span> {application.salaryRange}
          </div>
        )}
      </div>

      {/* Notes Preview */}
      {application.notes && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {application.notes}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
        {application.jobUrl && (
          <a
            href={application.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Job →
          </a>
        )}
        <span className="ml-auto">
          Updated {format(application.updatedAt, 'MMM dd')}
        </span>
      </div>
    </div>
  );
}
