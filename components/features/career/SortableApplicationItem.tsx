'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Application } from '@/lib/schemas/application.schema';
import ApplicationCard from './ApplicationCard';

interface SortableApplicationItemProps {
    application: Application;
    onClick: () => void;
    onDelete: (id: string) => void;
    compact?: boolean;
}

export default function SortableApplicationItem({
    application,
    onClick,
    onDelete,
    compact
}: SortableApplicationItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: application.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
            <ApplicationCard
                application={application}
                onClick={onClick}
                onDelete={onDelete}
                compact={compact ?? false}
            />
        </div>
    );
}
