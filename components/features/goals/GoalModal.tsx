'use client';

import GoalForm from './GoalForm';
import { CreateGoalInput } from '@/lib/schemas/goal.schema';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGoalInput) => void;
  initialData?: CreateGoalInput;
  isEdit?: boolean;
  errorMessage?: string | null;
  isSaving?: boolean;
}

export default function GoalModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
  errorMessage,
  isSaving = false,
}: GoalModalProps) {
  if (!isOpen) return null;

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
              {isEdit ? 'Edit Goal' : 'Create New Goal'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {errorMessage ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {/* Form */}
          <GoalForm
            onSubmit={onSubmit}
            onCancel={onClose}
            initialData={initialData}
            isEdit={isEdit}
            submitDisabled={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
