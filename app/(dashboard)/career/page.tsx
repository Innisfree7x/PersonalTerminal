'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Briefcase, Upload } from 'lucide-react';

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

const KANBAN_COLUMNS: { status: ApplicationStatus; label: string; icon: string; color: string }[] = [
  { status: 'applied', label: 'Applied', icon: '📝', color: 'info' },
  { status: 'interview', label: 'Interview', icon: '💼', color: 'warning' },
  { status: 'offer', label: 'Offer', icon: '✅', color: 'success' },
  { status: 'rejected', label: 'Rejected', icon: '❌', color: 'error' },
];

export default function CareerPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCvUploadOpen, setIsCvUploadOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);

  // Fetch applications with React Query
  const {
    data: applications = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const response = await fetchApplications();
      return response.applications; // Extract applications array from response
    },
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

  // Group applications by status for Kanban
  const kanbanData = useMemo(() => {
    const grouped: Record<ApplicationStatus, Application[]> = {
      applied: [],
      interview: [],
      offer: [],
      rejected: [],
    };

    applications.forEach((app) => {
      grouped[app.status].push(app);
    });

    // Sort each column by application date (most recent first)
    Object.keys(grouped).forEach((status) => {
      grouped[status as ApplicationStatus].sort(
        (a, b) => b.applicationDate.getTime() - a.applicationDate.getTime()
      );
    });

    return grouped;
  }, [applications]);

  const isEditMode = editingApplication !== null;
  const initialData = editingApplication ? applicationToCreateInput(editingApplication) : undefined;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface rounded w-1/4" />
          <div className="h-20 bg-surface rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-surface rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-lg border border-error/30 bg-error/10 px-6 py-4 text-error"
      >
        Error loading applications: {error instanceof Error ? error.message : 'Unknown error'}
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3 mb-2">
            <Briefcase className="w-8 h-8 text-career-accent" />
            Career
          </h1>
          <p className="text-text-secondary">
            Track your job applications and manage your CV
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCvUploadOpen(!isCvUploadOpen)}
            variant="secondary"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload CV
          </Button>
          <Button
            onClick={() => {
              setEditingApplication(null);
              setIsModalOpen(true);
            }}
            variant="primary"
            className="shadow-glow"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Application
          </Button>
        </div>
      </motion.div>

      {/* Stats Dashboard */}
      <ApplicationStats applications={applications} />

      {/* CV Upload Section (Collapsible) */}
      <AnimatePresence>
        {isCvUploadOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Upload & Extract CV</h3>
              <CvUpload />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban Board */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text-primary">Application Pipeline</h2>
        
        {applications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-surface/50 backdrop-blur-sm border border-border rounded-lg"
          >
            <div className="text-6xl mb-4">💼</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No applications yet
            </h3>
            <p className="text-text-tertiary mb-6">
              Start tracking your job applications to see your pipeline
            </p>
            <Button
              onClick={() => {
                setEditingApplication(null);
                setIsModalOpen(true);
              }}
              variant="primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Application
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {KANBAN_COLUMNS.map((column) => {
              const columnApps = kanbanData[column.status];
              
              return (
                <motion.div
                  key={column.status}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col"
                >
                  {/* Column Header */}
                  <div className="bg-surface border border-border rounded-t-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{column.icon}</span>
                        <h3 className="font-semibold text-text-primary">{column.label}</h3>
                      </div>
                      <Badge variant="default" size="sm">
                        {columnApps.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Column Content */}
                  <div className="flex-1 bg-surface/30 border-x border-b border-border rounded-b-lg p-3 space-y-3 min-h-[200px]">
                    <AnimatePresence mode="popLayout">
                      {columnApps.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center py-8 text-text-tertiary text-sm"
                        >
                          No applications
                        </motion.div>
                      ) : (
                        columnApps.map((application, index) => (
                          <motion.div
                            key={application.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                            layout
                          >
                            <ApplicationCard
                              application={application}
                              onClick={() => handleApplicationClick(application)}
                              onDelete={handleDeleteApplication}
                              compact
                            />
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
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
