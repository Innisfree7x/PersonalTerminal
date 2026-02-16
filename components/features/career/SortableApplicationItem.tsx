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
    focused?: boolean;
    onFocusHover?: () => void;
}

export default function SortableApplicationItem({
    application,
    onClick,
    onDelete,
    compact,
    focused = false,
    onFocusHover,
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
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            data-list-nav-id={application.id}
            data-focused={focused ? 'true' : 'false'}
            data-testid={`career-card-${application.id}`}
            className={`touch-none relative rounded-lg ${focused ? 'ring-1 ring-primary/40 border border-primary/60' : ''}`}
            onMouseEnter={onFocusHover}
        >
            {focused && (
                <div className="absolute -left-3 top-2 text-primary/80 text-xs font-mono z-10">▶</div>
            )}
            <ApplicationCard
                application={application}
                onClick={onClick}
                onDelete={onDelete}
                compact={compact ?? false}
            />
        </div>
    );
}
