'use client';

import GoalForm from './GoalForm';
import { CreateGoalInput } from '@/lib/schemas/goal.schema';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGoalInput) => void;
  initialData?: CreateGoalInput | undefined;
  isEdit?: boolean;
  errorMessage?: string | null | undefined;
  isSaving?: boolean;
  layoutId?: string;
}

export default function GoalModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
  errorMessage,
  isSaving = false,
  layoutId,
}: GoalModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              {...(layoutId ? { layoutId } : {})}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-surface/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <h2 className="text-2xl font-bold text-text-primary">
                  {isEdit ? 'Edit Goal' : 'Create New Goal'}
                </h2>
                <motion.button
                  onClick={onClose}
                  className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
                >
                  {errorMessage}
                </motion.div>
              )}

              {/* Form */}
              <GoalForm
                onSubmit={onSubmit}
                onCancel={onClose}
                initialData={initialData}
                isEdit={isEdit}
                submitDisabled={isSaving}
              />
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
