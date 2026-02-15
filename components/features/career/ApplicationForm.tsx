'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createApplicationSchema,
  CreateApplicationInput,
} from '@/lib/schemas/application.schema';

interface ApplicationFormProps {
  onSubmit: (data: CreateApplicationInput) => void;
  onCancel: () => void;
  initialData?: CreateApplicationInput | undefined;
  isEdit?: boolean;
  submitDisabled?: boolean;
}

export default function ApplicationForm({
  onSubmit,
  onCancel,
  initialData,
  isEdit = false,
  submitDisabled = false,
}: ApplicationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateApplicationInput>({
    resolver: zodResolver(createApplicationSchema),
    defaultValues: {
      company: '',
      position: '',
      status: 'applied',
      applicationDate: new Date(),
      interviewDate: undefined,
      notes: '',
      salaryRange: '',
      location: '',
      jobUrl: '',
    },
  });

  const defaultFormValues: CreateApplicationInput = {
    company: '',
    position: '',
    status: 'applied',
    applicationDate: new Date(),
    interviewDate: undefined,
    notes: '',
    salaryRange: '',
    location: '',
    jobUrl: '',
  };

  // Reset form when initialData changes (edit → add or switching between items)
  useEffect(() => {
    reset(initialData ?? defaultFormValues);
  }, [initialData, reset]);

  const onSubmitForm = (data: CreateApplicationInput) => {
    const applicationDate =
      data.applicationDate instanceof Date ? data.applicationDate : new Date(data.applicationDate);
    const interviewDate = data.interviewDate
      ? data.interviewDate instanceof Date
        ? data.interviewDate
        : new Date(data.interviewDate)
      : undefined;

    onSubmit({
      ...data,
      applicationDate,
      interviewDate,
      jobUrl: data.jobUrl || undefined,
      notes: data.notes || undefined,
      salaryRange: data.salaryRange || undefined,
      location: data.location || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* Company */}
      <div>
        <label
          htmlFor="company"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Company <span className="text-red-500">*</span>
        </label>
        <input
          id="company"
          type="text"
          {...register('company')}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 ${
            errors.company ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter company name"
        />
        {errors.company && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.company.message}</p>
        )}
      </div>

      {/* Position */}
      <div>
        <label
          htmlFor="position"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Position <span className="text-red-500">*</span>
        </label>
        <input
          id="position"
          type="text"
          {...register('position')}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 ${
            errors.position ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter position title"
        />
        {errors.position && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.position.message}</p>
        )}
      </div>

      {/* Status */}
      <div>
        <label
          htmlFor="status"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Status <span className="text-red-500">*</span>
        </label>
        <select
          id="status"
          {...register('status')}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 ${
            errors.status ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="applied">Applied</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
        </select>
        {errors.status && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status.message}</p>
        )}
      </div>

      {/* Application Date */}
      <div>
        <label
          htmlFor="applicationDate"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Application Date <span className="text-red-500">*</span>
        </label>
        <input
          id="applicationDate"
          type="date"
          {...register('applicationDate', {
            valueAsDate: true,
          })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 ${
            errors.applicationDate ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.applicationDate && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.applicationDate.message}
          </p>
        )}
      </div>

      {/* Interview Date */}
      <div>
        <label
          htmlFor="interviewDate"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Interview Date
        </label>
        <input
          id="interviewDate"
          type="date"
          {...register('interviewDate', {
            valueAsDate: true,
            setValueAs: (value) => (value === '' ? undefined : new Date(value)),
          })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 ${
            errors.interviewDate ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.interviewDate && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.interviewDate.message}
          </p>
        )}
      </div>

      {/* Location */}
      <div>
        <label
          htmlFor="location"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Location
        </label>
        <input
          id="location"
          type="text"
          {...register('location')}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
          placeholder="e.g., San Francisco, CA"
        />
      </div>

      {/* Salary Range */}
      <div>
        <label
          htmlFor="salaryRange"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Salary Range
        </label>
        <input
          id="salaryRange"
          type="text"
          {...register('salaryRange')}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
          placeholder="e.g., $100k - $150k"
        />
      </div>

      {/* Job URL */}
      <div>
        <label
          htmlFor="jobUrl"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Job URL
        </label>
        <input
          id="jobUrl"
          type="url"
          {...register('jobUrl')}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
          placeholder="https://..."
        />
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Notes
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
          placeholder="Additional notes..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || submitDisabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
