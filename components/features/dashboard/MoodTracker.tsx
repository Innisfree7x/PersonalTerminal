'use client';

import { motion } from 'framer-motion';
import { Smile, Battery } from 'lucide-react';
import { useState, memo, useCallback } from 'react';
import { Skeleton } from '@/components/ui';

/**
 * Available mood/energy levels
 */
type Mood = 'exhausted' | 'tired' | 'okay' | 'good' | 'energized';

/**
 * Mood option configuration
 */
interface MoodOption {
  value: Mood;
  emoji: string;
  label: string;
  color: string;
}

/**
 * Energy level tracker with emoji selection
 * Helps users track their daily energy and provides contextual feedback
 * 
 * @component
 * @example
 * <MoodTracker 
 *   onMoodSelect={(mood) => console.log('Selected:', mood)}
 * />
 */
interface MoodTrackerProps {
  /** Callback when a mood is selected */
  onMoodSelect?: (mood: Mood) => void;
  /** Show loading skeleton (default: false) */
  isLoading?: boolean;
}

const MoodTracker = memo(function MoodTracker({ onMoodSelect, isLoading = false }: MoodTrackerProps) {
  // Hooks MUST be called before any conditional returns!
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);

  const moods: MoodOption[] = [
    { value: 'exhausted', emoji: '😴', label: 'Exhausted', color: 'hover:bg-error/20 hover:border-error' },
    { value: 'tired', emoji: '💤', label: 'Tired', color: 'hover:bg-warning/20 hover:border-warning' },
    { value: 'okay', emoji: '😐', label: 'Okay', color: 'hover:bg-text-secondary/20 hover:border-text-secondary' },
    { value: 'good', emoji: '😊', label: 'Good', color: 'hover:bg-info/20 hover:border-info' },
    { value: 'energized', emoji: '🚀', label: 'Energized', color: 'hover:bg-success/20 hover:border-success' },
  ];

  // Memoized event handler
  const handleMoodClick = useCallback((mood: Mood) => {
    setSelectedMood(mood);
    if (onMoodSelect) {
      onMoodSelect(mood);
    }
  }, [onMoodSelect]);

  // Loading state - conditional RENDERING, not early return!
  if (isLoading) {
    return (
      <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Battery className="w-5 h-5 text-success" />
          <h3 className="text-base font-semibold text-text-primary">Energy Level</h3>
        </div>
        <Skeleton className="h-4 w-48 mb-4" />
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Battery className="w-5 h-5 text-success" />
        <h3 className="text-base font-semibold text-text-primary">Energy Level</h3>
      </div>

      <p className="text-sm text-text-secondary mb-4" id="mood-tracker-description">
        How are you feeling right now?
      </p>

      {/* Mood selector */}
      <div 
        className="grid grid-cols-5 gap-2 mb-4"
        role="radiogroup"
        aria-labelledby="mood-tracker-description"
        aria-label="Select your current energy level"
      >
        {moods.map((mood, index) => (
          <motion.button
            key={mood.value}
            onClick={() => handleMoodClick(mood.value)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
              selectedMood === mood.value
                ? 'border-primary bg-primary/10 scale-105'
                : 'border-border bg-surface-hover'
            } ${mood.color}`}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            role="radio"
            aria-checked={selectedMood === mood.value}
            aria-label={`${mood.label} - ${mood.emoji}`}
          >
            <span className="text-2xl">{mood.emoji}</span>
            <span className="text-[10px] font-medium text-text-secondary">{mood.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Feedback message */}
      {selectedMood && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-sm text-text-secondary">
            {selectedMood === 'energized' && '🔥 Amazing! Keep that momentum going!'}
            {selectedMood === 'good' && '💪 Great! You\'re doing well today!'}
            {selectedMood === 'okay' && '👍 Not bad. Maybe take a short break?'}
            {selectedMood === 'tired' && '☕ Consider a coffee break or walk!'}
            {selectedMood === 'exhausted' && '😴 Time for a proper rest!'}
          </p>
        </motion.div>
      )}
    </div>
  );
});

export default MoodTracker;
