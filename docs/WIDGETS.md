# 🧩 Dashboard Widgets Documentation

Complete reference for all 8 dashboard widgets in INNIS.

---

## 📊 Widget Overview

| Widget | Purpose | Data Source | Props |
|--------|---------|-------------|-------|
| QuickStatsBar | Key metrics overview | API + Props | 6 stat values |
| CircularProgress | Completion visualization | Props | percentage |
| QuickActionsWidget | Fast shortcuts | Static | none |
| PomodoroTimer | Focus timer | Local state | durations (optional) |
| MoodTracker | Energy tracking | Callback | onMoodSelect |
| ActivityFeed | Recent actions | API (`/api/activity/recent`) | activities (optional) |
| TimeBlockVisualizer | Focus time blocks | API (`/api/dashboard/focus-time`) | progress values (optional) |
| WeekOverview | Mini calendar | API (`/api/dashboard/week-events`) | events (optional) |

---

## 1️⃣ QuickStatsBar

**Horizontal stats bar with 6 key metrics.**

### Props

```typescript
interface QuickStatsBarProps {
  eventsToday: number;                    // Number of events today
  productivity: number;                    // Productivity % (0-100)
  focusTime: number;                       // Focus hours today
  streak: number;                          // Consecutive days streak
  goalsThisWeek: {                         // Goals progress
    completed: number;
    total: number;
  };
  exercisesThisWeek: number;               // Completed exercises
  isLoading?: boolean;                     // Show skeleton (default: false)
}
```

### Usage

```tsx
import QuickStatsBar from '@/components/features/dashboard/QuickStatsBar';

<QuickStatsBar
  eventsToday={5}
  productivity={85}
  focusTime={6}
  streak={7}
  goalsThisWeek={{ completed: 2, total: 5 }}
  exercisesThisWeek={12}
/>
```

### Features
- ✅ Purple gradient background
- ✅ Streak highlighting (when > 0)
- ✅ Loading skeleton support
- ✅ Responsive grid (6 columns → 3 on mobile)

---

## 2️⃣ CircularProgress

**Apple Watch-style animated progress ring.**

### Props

```typescript
interface CircularProgressProps {
  percentage: number;                      // Completion % (0-100)
  size?: number;                           // Diameter in px (default: 120)
  strokeWidth?: number;                    // Ring thickness (default: 8)
  label?: string;                          // Text below ring (default: "Completion")
  showPercentage?: boolean;                // Show number in center (default: true)
  isLoading?: boolean;                     // Show skeleton (default: false)
}
```

### Usage

```tsx
import CircularProgress from '@/components/features/dashboard/CircularProgress';

<CircularProgress 
  percentage={85} 
  label="Today's Progress"
  size={140}
/>
```

### Features
- ✅ Color-coded by percentage (success/info/warning/error)
- ✅ Animated counting up effect
- ✅ Drop shadow glow based on progress
- ✅ ARIA progressbar role

---

## 3️⃣ QuickActionsWidget

**5 quick action buttons for common tasks.**

### Props

```typescript
interface QuickActionsWidgetProps {
  isLoading?: boolean;                     // Show skeleton (default: false)
}
```

### Usage

```tsx
import QuickActionsWidget from '@/components/features/dashboard/QuickActionsWidget';

<QuickActionsWidget />
```

### Actions
1. **Add Task** - Opens task creation dialog
2. **New Goal** - Opens goal creation modal
3. **Job App** - Opens application form
4. **Course** - Opens course creation modal
5. **Event** - Opens calendar event dialog

### Features
- ✅ Error handling with try/catch
- ✅ Animated hover effects
- ✅ Stagger animation on mount
- ✅ Color-coded by action type

---

## 4️⃣ PomodoroTimer

**Focus timer with work/break cycles.**

### Props

```typescript
interface PomodoroTimerProps {
  workDuration?: number;                   // Work minutes (default: 25, min: 1, max: 60)
  breakDuration?: number;                  // Break minutes (default: 5, min: 1, max: 30)
  isLoading?: boolean;                     // Show skeleton (default: false)
}
```

### Usage

```tsx
import PomodoroTimer from '@/components/features/dashboard/PomodoroTimer';

<PomodoroTimer 
  workDuration={25}
  breakDuration={5}
/>
```

### Features
- ✅ Play/Pause/Reset controls
- ✅ Work/Break mode toggle
- ✅ Circular progress visualization
- ✅ Session counter (🍅 up to 4)
- ✅ Input validation (clamps to min/max)
- ✅ Auto-switch on completion

---

## 5️⃣ MoodTracker

**Energy level tracker with 5 mood options.**

### Props

```typescript
interface MoodTrackerProps {
  onMoodSelect?: (mood: Mood) => void;     // Callback when mood selected
  isLoading?: boolean;                     // Show skeleton (default: false)
}

type Mood = 'exhausted' | 'tired' | 'okay' | 'good' | 'energized';
```

### Usage

```tsx
import MoodTracker from '@/components/features/dashboard/MoodTracker';

<MoodTracker 
  onMoodSelect={(mood) => console.log('Selected:', mood)}
/>
```

### Moods
| Emoji | Mood | Feedback |
|-------|------|----------|
| 😴 | Exhausted | "Time for a proper rest!" |
| 💤 | Tired | "Consider a coffee break or walk!" |
| 😐 | Okay | "Not bad. Maybe take a short break?" |
| 😊 | Good | "Great! You're doing well today!" |
| 🚀 | Energized | "Amazing! Keep that momentum going!" |

### Features
- ✅ Radio group accessibility (role="radiogroup")
- ✅ Animated selection feedback
- ✅ Contextual motivational messages
- ✅ Hover effects

---

## 6️⃣ ActivityFeed

**Recent user activity timeline.**

### Props

```typescript
interface ActivityFeedProps {
  activities?: ActivityItem[];             // Optional activities array
  maxItems?: number;                       // Max items to display (default: 5)
  isLoading?: boolean;                     // Show skeleton (default: false)
}

interface ActivityItem {
  id: string;
  type: 'task' | 'goal' | 'exercise' | 'application' | 'note';
  action: string;                          // Description of action
  timestamp: Date;
}
```

### Usage

```tsx
import ActivityFeed from '@/components/features/dashboard/ActivityFeed';

// Auto-fetch from API
<ActivityFeed maxItems={5} />

// Or provide activities
<ActivityFeed 
  activities={[
    { id: '1', type: 'task', action: 'Completed task: Review PRs', timestamp: new Date() }
  ]}
/>
```

### API Endpoint

**GET** `/api/activity/recent?limit=10`

**Response:**
```json
{
  "activities": [
    {
      "id": "task-123",
      "type": "task",
      "action": "Completed task: Review PRs",
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 156,
  "limit": 10
}
```

### Features
- ✅ Auto-fetches from API if no props provided
- ✅ Fallback to mock data on error
- ✅ Color-coded icons by type
- ✅ Relative timestamps ("2 hours ago")
- ✅ Stagger animation

---

## 7️⃣ TimeBlockVisualizer

**Focus time progress by time of day.**

### Props

```typescript
interface TimeBlockVisualizerProps {
  morningProgress?: number;                // Morning % (0-100)
  afternoonProgress?: number;              // Afternoon % (0-100)
  eveningProgress?: number;                // Evening % (0-100)
  isLoading?: boolean;                     // Show skeleton (default: false)
}
```

### Usage

```tsx
import TimeBlockVisualizer from '@/components/features/dashboard/TimeBlockVisualizer';

// Auto-fetch from API
<TimeBlockVisualizer />

// Or provide progress values
<TimeBlockVisualizer 
  morningProgress={75}
  afternoonProgress={30}
  eveningProgress={0}
/>
```

### API Endpoint

**GET** `/api/dashboard/focus-time?date=2024-01-15`

**Response:**
```json
{
  "morning": 75,
  "afternoon": 30,
  "evening": 0,
  "totalMinutes": 180,
  "tasksCompleted": 5,
  "breakdown": {
    "morning": 135,
    "afternoon": 45,
    "evening": 0
  }
}
```

### Time Blocks
| Period | Hours | Icon | Color |
|--------|-------|------|-------|
| Morning | 6AM - 12PM | 🌅 Sunrise | Warning (Orange) |
| Afternoon | 12PM - 6PM | ☀️ Sun | Calendar (Orange) |
| Evening | 6PM - 12AM | 🌙 Moon | Info (Blue) |

### Features
- ✅ "NOW" indicator for current period
- ✅ Progress bars with animations
- ✅ Total focus time summary
- ✅ ARIA progressbar roles

---

## 8️⃣ WeekOverview

**Mini calendar with event density visualization.**

### Props

```typescript
interface WeekOverviewProps {
  events?: DayEvent[];                     // Optional events array
  isLoading?: boolean;                     // Show skeleton (default: false)
}

interface DayEvent {
  date: Date;
  count: number;                           // Number of events
  type: 'none' | 'low' | 'medium' | 'high';
}
```

### Usage

```tsx
import WeekOverview from '@/components/features/dashboard/WeekOverview';

// Auto-fetch from API
<WeekOverview />

// Or provide events
<WeekOverview 
  events={[
    { date: new Date(), count: 3, type: 'high' }
  ]}
/>
```

### API Endpoint

**GET** `/api/dashboard/week-events?offset=0`

**Response:**
```json
{
  "events": [
    {
      "date": "2024-01-15T00:00:00Z",
      "count": 3,
      "type": "high"
    }
  ],
  "weekStart": "2024-01-15T00:00:00Z",
  "weekEnd": "2024-01-21T00:00:00Z",
  "totalEvents": 12
}
```

### Event Density

| Type | Count | Color | Emoji |
|------|-------|-------|-------|
| None | 0 | Gray | - |
| Low | 1 | Green | ✓ |
| Medium | 2 | Orange | ⚠ |
| High | 3+ | Red | 🔥 |

### Features
- ✅ Week navigation (prev/next buttons)
- ✅ "Today" highlight with pulsing indicator
- ✅ Event density color coding
- ✅ Hover tooltips with event count
- ✅ ARIA list/listitem roles

---

## 🎨 Design System

All widgets follow the same design principles:

### Colors
- **Primary:** Purple (`#7c3aed`)
- **Success:** Green (`#10b981`)
- **Warning:** Orange (`#f59e0b`)
- **Error:** Red (`#ef4444`)
- **Info:** Blue (`#3b82f6`)

### Spacing
- **8px grid system** for consistent spacing
- **Gap-4** (16px) between widgets
- **Padding-4** (16px) inside widgets

### Border Radius
- **rounded-xl** (12px) for widgets
- **rounded-lg** (8px) for cards
- **rounded-full** for circular elements

### Shadows
- **Subtle border** (`border-border`)
- **Backdrop blur** (`backdrop-blur-sm`)
- **Hover glow** on interactive elements

---

## ♿ Accessibility

All widgets are **WCAG 2.1 Level AA compliant**:

- ✅ **ARIA labels** on all interactive elements
- ✅ **Keyboard navigation** (Tab, Enter, Space, Arrows)
- ✅ **Focus indicators** (2px purple ring)
- ✅ **Screen reader support** (NVDA, JAWS, VoiceOver)
- ✅ **Loading states** with skeleton screens
- ✅ **Error boundaries** for graceful degradation

See [`KEYBOARD_NAVIGATION.md`](../KEYBOARD_NAVIGATION.md) for full keyboard shortcuts.

---

## 🚀 Performance

All widgets are optimized for performance:

- ✅ **React.memo** to prevent unnecessary re-renders
- ✅ **useMemo** for expensive calculations
- ✅ **useCallback** for event handlers
- ✅ **Lazy loading** for heavy components
- ✅ **Framer Motion** for GPU-accelerated animations

---

## 🧪 Testing

All widgets have comprehensive test coverage:

```bash
# Run all widget tests
npm test

# Run specific widget test
npm test CircularProgress
npm test PomodoroTimer
npm test ActivityFeed
```

Test files location: `tests/unit/`

---

## 📝 Adding a New Widget

1. **Create component** in `components/features/dashboard/`
2. **Add TypeScript types** for props
3. **Implement loading state** with skeleton
4. **Add ARIA labels** for accessibility
5. **Memoize with React.memo**
6. **Write unit tests** in `tests/unit/`
7. **Add to this documentation**

Template:

```tsx
'use client';

import { memo } from 'react';
import { Skeleton } from '@/components/ui';

interface MyWidgetProps {
  data: string;
  isLoading?: boolean;
}

const MyWidget = memo(function MyWidget({ data, isLoading = false }: MyWidgetProps) {
  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }

  return (
    <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-4">
      <h3 className="text-base font-semibold text-text-primary mb-4">
        My Widget
      </h3>
      <p className="text-text-secondary">{data}</p>
    </div>
  );
});

export default MyWidget;
```

---

**Last Updated:** Session 9 (Data Connections & Documentation)
**Status:** 100% Production Ready ✅
