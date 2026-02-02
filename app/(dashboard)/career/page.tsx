'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Application, CreateApplicationInput, ApplicationStatus } from '@/lib/schemas/application.schema';
import {
  fetchApplications,
  createApplication,
  updateApplication,
  deleteApplication,
} from '@/lib/api/applications';
import CvUpload from '@/components/features/career/CvUpload';
import ApplicationCard from '@/components/features/career/ApplicationCard';
import ApplicationStats from '@/components/features/career/ApplicationStats';
import ApplicationModal from '@/components/features/career/ApplicationModal';

type FilterOption = ApplicationStatus | 'all';

function applicationToCreateInput(application: Application): CreateApplicationInput {
  return {
    company: application.company,
    position: application.position,
    status: application.status,
    applicationDate: application.applicationDate,
    interviewDate: application.interviewDate,
    notes: application.notes,
    salaryRange: application.salaryRange,
    location: application.location,
    jobUrl: application.jobUrl,
  };
}

export default function CareerPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Fetch applications with React Query
  const {
    data: applications = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['applications'],
    queryFn: fetchApplications,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setIsModalOpen(false);
      setEditingApplication(null);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ applicationId, data }: { applicationId: string; data: CreateApplicationInput }) =>
      updateApplication(applicationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setIsModalOpen(false);
      setEditingApplication(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const handleAddApplication = (data: CreateApplicationInput) => {
    createMutation.mutate(data);
  };

  const handleEditApplication = (data: CreateApplicationInput) => {
    if (!editingApplication) return;
    updateMutation.mutate({ applicationId: editingApplication.id, data });
  };

  const handleDeleteApplication = (applicationId: string) => {
    if (confirm('Are you sure you want to delete this application?')) {
      deleteMutation.mutate(applicationId);
    }
  };

  const handleApplicationClick = (application: Application) => {
    setEditingApplication(application);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingApplication(null);
  };

  // Filter applications
  const filteredApplications = useMemo(() => {
    let filtered = applications;

    if (filterBy !== 'all') {
      filtered = filtered.filter((app) => app.status === filterBy);
    }

    // Sort by application date (most recent first)
    return [...filtered].sort(
      (a, b) => b.applicationDate.getTime() - a.applicationDate.getTime()
    );
  }, [applications, filterBy]);

  const isEditMode = editingApplication !== null;
  const initialData = editingApplication ? applicationToCreateInput(editingApplication) : undefined;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-400">Loading applications...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
        Error loading applications: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Career</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your job applications and manage your CV.
        </p>
      </div>

      {/* Job Applications Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Job Applications
          </h2>
          <button
            onClick={() => {
              setEditingApplication(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Application
          </button>
        </div>

        {/* Stats Dashboard */}
        <ApplicationStats applications={applications} />

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          {(['all', 'applied', 'interview', 'offer', 'rejected'] as FilterOption[]).map(
            (filter) => (
              <button
                key={filter}
                onClick={() => setFilterBy(filter)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  filterBy === filter
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            )
          )}
        </div>

        {/* Applications Grid */}
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            {filterBy === 'all'
              ? 'No applications yet. Click "Add Application" to get started.'
              : `No ${filterBy} applications.`}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onClick={() => handleApplicationClick(application)}
                onDelete={handleDeleteApplication}
              />
            ))}
          </div>
        )}
      </div>

      {/* CV Upload Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          CV Upload & Extract
        </h2>
        <div className="max-w-3xl">
          <CvUpload />
        </div>
      </div>

      {/* Modal */}
      <ApplicationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={isEditMode ? handleEditApplication : handleAddApplication}
        initialData={initialData}
        isEdit={isEditMode}
        submitDisabled={createMutation.isPending || updateMutation.isPending}
        error={
          createMutation.error?.message ||
          updateMutation.error?.message ||
          (createMutation.error || updateMutation.error ? 'Failed to save application' : null)
        }
      />
    </div>
  );
}
