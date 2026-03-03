'use client';

import { motion } from 'framer-motion';

interface ToggleSwitchProps {
    /** Whether the toggle is currently on */
    enabled: boolean;
    /** Callback when the toggle is clicked */
    onChange: (next: boolean) => void;
    /** Accessible label describing what this toggle controls */
    ariaLabel: string;
    /** Optional: disable the toggle */
    disabled?: boolean;
}

/**
 * Reusable animated toggle switch.
 * Replaces the copy-pasted toggle pattern used throughout Settings.
 */
export function ToggleSwitch({ enabled, onChange, ariaLabel, disabled }: ToggleSwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={() => onChange(!enabled)}
            className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${enabled ? 'bg-primary' : 'bg-surface-hover'
                }`}
        >
            <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow ${enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
            />
        </button>
    );
}
