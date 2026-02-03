'use client';

import ApplicationForm from './ApplicationForm';
import { CreateApplicationInput } from '@/lib/schemas/application.schema';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateApplicationInput) => void;
  initialData?: CreateApplicationInput | undefined;
  isEdit?: boolean;
  submitDisabled?: boolean;
  error?: string | null;
}

export default function ApplicationModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
  submitDisabled = false,
  error = null,
}: ApplicationModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (data: CreateApplicationInput) => {
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isEdit ? 'Edit Application' : 'New Application'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Form */}
          <ApplicationForm
            onSubmit={handleSubmit}
            onCancel={onClose}
            initialData={initialData}
            isEdit={isEdit}
            submitDisabled={submitDisabled}
          />
        </div>
      </div>
    </div>
  );
}
