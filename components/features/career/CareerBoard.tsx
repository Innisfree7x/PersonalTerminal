'use client';

import { useOptimistic, useState, useTransition, useMemo } from 'react';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Application, CreateApplicationInput, ApplicationStatus } from '@/lib/schemas/application.schema';
import {
    createApplicationAction,
    updateApplicationAction,
    deleteApplicationAction
} from '@/app/actions/career';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragEndEvent,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import toast from 'react-hot-toast';
import CvUpload from '@/components/features/career/CvUpload';
import ApplicationCard from '@/components/features/career/ApplicationCard';
import SortableApplicationItem from '@/components/features/career/SortableApplicationItem';
import ApplicationStats from '@/components/features/career/ApplicationStats';
import ApplicationModal from '@/components/features/career/ApplicationModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Briefcase, Upload } from 'lucide-react';
import { useAppSound } from '@/lib/hooks/useAppSound';
import { usePrismCommandAction } from '@/lib/hooks/useCommandActions';
import { useListNavigation } from '@/lib/hooks/useListNavigation';

// --- Helper Functions ---

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

function KanbanColumn({
    column,
    applications,
    onApplicationClick,
    onDelete,
    focusedApplicationId,
    onApplicationFocus,
}: {
    column: typeof KANBAN_COLUMNS[0];
    applications: Application[];
    onApplicationClick: (app: Application) => void;
    onDelete: (id: string) => void;
    focusedApplicationId: string | null;
    onApplicationFocus: (id: string) => void;
}) {
    const { setNodeRef } = useDroppable({
        id: column.status,
    });

    return (
        <div className="flex flex-col h-full">
            {/* Column Header */}
            <div className="bg-surface border border-border rounded-t-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{column.icon}</span>
                        <h3 className="font-semibold text-text-primary">{column.label}</h3>
                    </div>
                    <Badge variant="default" size="sm">
                        {applications.length}
                    </Badge>
                </div>
            </div>

            {/* Column Content */}
            <div
                ref={setNodeRef}
                data-testid={`career-column-${column.status}`}
                className="flex-1 bg-surface/30 border-x border-b border-border rounded-b-lg p-3 space-y-3 min-h-[200px]"
            >
                <SortableContext
                    items={applications.map(app => app.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {applications.length === 0 ? (
                        <div className="text-center py-8 text-text-tertiary text-sm">
                            No applications
                        </div>
                    ) : (
                        applications.map((application) => (
                            <SortableApplicationItem
                                key={application.id}
                                application={application}
                                onClick={() => onApplicationClick(application)}
                                onDelete={onDelete}
                                compact
                                focused={focusedApplicationId === application.id}
                                onFocusHover={() => onApplicationFocus(application.id)}
                            />
                        ))
                    )}
                </SortableContext>
            </div>
        </div>
    );
}

// --- Main Component ---

interface CareerBoardProps {
    initialApplications: Application[];
    openCreateOnLoad?: boolean;
}

export default function CareerBoard({ initialApplications, openCreateOnLoad = false }: CareerBoardProps) {
    const router = useRouter();
    const pathname = usePathname();
    // Optimistic State
    // Action: { type: 'upsert', app: Application } | { type: 'delete', id: string }
    const [applications, dispatchOptimistic] = useOptimistic(
        initialApplications,
        (
            state: Application[],
            action:
                | { type: 'upsert'; app: Application }
                | { type: 'delete'; id: string }
                | { type: 'replace'; apps: Application[] }
        ) => {
            if (action.type === 'replace') {
                return action.apps;
            }
            if (action.type === 'delete') {
                return state.filter((app) => app.id !== action.id);
            }
            if (action.type === 'upsert') {
                const exists = state.find((app) => app.id === action.app.id);
                if (exists) {
                    return state.map((app) => (app.id === action.app.id ? action.app : app));
                }
                return [...state, action.app];
            }
            return state;
        }
    );


    const [isPending, startTransition] = useTransition();

    const { play } = useAppSound();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCvUploadOpen, setIsCvUploadOpen] = useState(false);
    const [editingApplication, setEditingApplication] = useState<Application | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        if (!openCreateOnLoad) return;
        setEditingApplication(null);
        setIsModalOpen(true);
        router.replace(pathname);
    }, [openCreateOnLoad, pathname, router]);

    usePrismCommandAction('open-new-application', () => {
        setEditingApplication(null);
        setIsModalOpen(true);
    });

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Grouping for Kanban
    const kanbanData = useMemo(() => {
        const grouped: Record<ApplicationStatus, Application[]> = {
            applied: [], interview: [], offer: [], rejected: [],
        };
        applications.forEach((app) => {
            if (grouped[app.status]) {
                grouped[app.status].push(app);
            }
        });
        // Sort
        Object.keys(grouped).forEach((status) => {
            grouped[status as ApplicationStatus].sort(
                (a, b) => b.applicationDate.getTime() - a.applicationDate.getTime()
            );
        });
        return grouped;
    }, [applications]);


    // Handlers
    const handleAddApplication = async (data: CreateApplicationInput) => {
        setIsModalOpen(false);
        const previousApplications = applications;

        // Create optimistic ID
        const tempId = crypto.randomUUID();
        const tempApp: Application = {
            id: tempId,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        startTransition(() => {
            dispatchOptimistic({ type: 'upsert', app: tempApp });
        });

        try {
            const createdApplication = await createApplicationAction(data);
            startTransition(() => {
                dispatchOptimistic({ type: 'delete', id: tempId });
                dispatchOptimistic({ type: 'upsert', app: createdApplication });
            });
            play('swoosh');
            toast.success('Application added!');
        } catch (e) {
            startTransition(() => {
                dispatchOptimistic({ type: 'replace', apps: previousApplications });
            });
            toast.error('Failed to create application');
        }
    };

    const handleEditApplication = async (data: CreateApplicationInput) => {
        if (!editingApplication) return;
        setIsModalOpen(false);
        const previousApplications = applications;

        const updatedApp: Application = {
            ...editingApplication,
            ...data,
            updatedAt: new Date(),
        };

        startTransition(() => {
            dispatchOptimistic({ type: 'upsert', app: updatedApp });
        });

        try {
            const persistedApp = await updateApplicationAction(editingApplication.id, data);
            startTransition(() => {
                dispatchOptimistic({ type: 'upsert', app: persistedApp });
            });
            toast.success('Application updated!');
        } catch (e) {
            startTransition(() => {
                dispatchOptimistic({ type: 'replace', apps: previousApplications });
            });
            toast.error('Failed to update application');
        }
        setEditingApplication(null);
    };

    const handleDeleteApplication = async (applicationId: string) => {
        if (!confirm('Are you sure you want to delete this application?')) return;
        const previousApplications = applications;

        startTransition(() => {
            dispatchOptimistic({ type: 'delete', id: applicationId });
        });

        try {
            await deleteApplicationAction(applicationId);
            toast.success('Application deleted');
        } catch (e) {
            startTransition(() => {
                dispatchOptimistic({ type: 'replace', apps: previousApplications });
            });
            toast.error('Failed to delete application');
        }
    };

    // Drag Handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeApp = applications.find(app => app.id === active.id);
        if (!activeApp) return;

        let newStatus: ApplicationStatus | null = null;

        if (KANBAN_COLUMNS.some(col => col.status === over.id)) {
            newStatus = over.id as ApplicationStatus;
        } else {
            const overApp = applications.find(app => app.id === over.id);
            if (overApp) {
                newStatus = overApp.status;
            }
        }

        if (newStatus && newStatus !== activeApp.status) {
            const previousApplications = applications;
            const updatedApp = { ...activeApp, status: newStatus };

            startTransition(() => {
                dispatchOptimistic({ type: 'upsert', app: updatedApp });
            });

            // Server update
            try {
                const persistedApp = await updateApplicationAction(
                    activeApp.id,
                    applicationToCreateInput(updatedApp)
                );
                startTransition(() => {
                    dispatchOptimistic({ type: 'upsert', app: persistedApp });
                });
                play('swoosh');
                toast.success(`Moved to ${newStatus}`);
            } catch (e) {
                startTransition(() => {
                    dispatchOptimistic({ type: 'replace', apps: previousApplications });
                });
                toast.error('Failed to move application');
            }
        }
    };


    const activeApplication = activeId ? applications.find(app => app.id === activeId) : null;
    const isEditMode = editingApplication !== null;
    const initialModalData = editingApplication ? applicationToCreateInput(editingApplication) : undefined;
    const listNavigationItems = useMemo(() => {
        const sorted = [...applications];
        sorted.sort((a, b) => b.applicationDate.getTime() - a.applicationDate.getTime());
        return sorted;
    }, [applications]);

    const { focusedId: focusedApplicationId, setFocusedId: setFocusedApplicationId } = useListNavigation<Application>({
        items: listNavigationItems,
        getId: (app) => app.id,
        enabled: listNavigationItems.length > 0 && !isModalOpen && !isCvUploadOpen,
        onEnter: (app) => {
            setEditingApplication(app);
            setIsModalOpen(true);
        },
    });

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
                        data-testid="add-application-button"
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
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                            {KANBAN_COLUMNS.map((column) => (
                                <KanbanColumn
                                    key={column.status}
                                    column={column}
                                    applications={kanbanData[column.status]}
                                    onApplicationClick={(app) => {
                                        setEditingApplication(app);
                                        setIsModalOpen(true);
                                    }}
                                    onDelete={handleDeleteApplication}
                                    focusedApplicationId={focusedApplicationId}
                                    onApplicationFocus={setFocusedApplicationId}
                                />
                            ))}
                        </div>

                        <DragOverlay dropAnimation={{
                            sideEffects: defaultDropAnimationSideEffects({
                                styles: {
                                    active: {
                                        opacity: '0.5',
                                    },
                                },
                            }),
                        }}>
                            {activeApplication ? (
                                <ApplicationCard
                                    application={activeApplication}
                                    compact
                                />
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                )}
            </div>

            {/* Modal */}
            <ApplicationModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingApplication(null);
                }}
                onSubmit={isEditMode ? handleEditApplication : handleAddApplication}
                initialData={initialModalData}
                isEdit={isEditMode}
                submitDisabled={isPending} // Disable while server action processes
                error={null} // We rely on toast for errors now
            />
        </div>
    );
}
