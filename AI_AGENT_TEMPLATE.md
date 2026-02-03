# 🤖 Template for New AI Agent Chat

Copy this template when starting a new chat with an AI agent!

---

# PROJECT: Personal Terminal (Dashboard App)

## CURRENT TASK:
**[DESCRIBE YOUR TASK HERE]**

Example: "Implement AI-powered daily task suggestions based on user's goals and deadlines"

---

## TECH STACK:
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** Supabase (PostgreSQL)
- **State:** TanStack Query v5
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Validation:** Zod schemas
- **Testing:** Vitest + React Testing Library

---

## PROJECT STRUCTURE:
```
bloomberg-personal/
├── app/
│   ├── (dashboard)/        # Dashboard pages
│   │   ├── calendar/
│   │   ├── career/
│   │   ├── goals/
│   │   └── university/
│   └── api/                # API routes
│       ├── goals/
│       ├── applications/
│       ├── courses/
│       └── daily-tasks/
├── components/
│   ├── features/           # Feature-specific components
│   │   ├── dashboard/
│   │   ├── goals/
│   │   ├── career/
│   │   └── university/
│   ├── ui/                 # Reusable UI components
│   └── layout/             # Layout components
├── lib/
│   ├── supabase/           # DB functions
│   ├── schemas/            # Zod schemas
│   ├── api/                # API helpers
│   └── utils/              # Utilities
└── tests/
    ├── unit/               # Unit tests
    └── integration/        # Integration tests
```

---

## DATABASE SCHEMA:
```sql
-- Goals
CREATE TABLE goals (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,  -- 'in-progress' | 'completed' | 'archived'
  target_date DATE,
  metrics JSONB,         -- { current: number, target: number, unit: string }
  created_at TIMESTAMP
);

-- Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  ects INTEGER,
  num_exercises INTEGER,
  exam_date DATE,
  semester TEXT,
  created_at TIMESTAMP
);

-- Exercise Progress
CREATE TABLE exercise_progress (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  exercise_number INTEGER,
  completed BOOLEAN,
  completed_at TIMESTAMP,
  created_at TIMESTAMP
);

-- Job Applications
CREATE TABLE job_applications (
  id UUID PRIMARY KEY,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  status TEXT NOT NULL,  -- 'applied' | 'interview' | 'offer' | 'rejected'
  application_date DATE,
  interview_date DATE,
  response_date DATE,
  notes TEXT,
  created_at TIMESTAMP
);

-- Daily Tasks
CREATE TABLE daily_tasks (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  completed BOOLEAN,
  time_estimate TEXT,
  source TEXT,           -- 'manual' | 'goal' | 'study' | 'interview'
  source_id UUID,
  created_at TIMESTAMP
);
```

---

## CURRENT STATE:

### ✅ What Works:
- Dashboard with multiple widgets (Pomodoro, Mood Tracker, Stats)
- Goals CRUD (create, read, update, delete)
- Job Applications tracking
- University courses with exercise tracking
- Daily tasks management
- Calendar view
- Basic navigation and routing

### ❌ Known Issues:
- Some API routes have `user_id` column errors (not critical, no auth yet)
- Study tasks sync was removed (too buggy, will revisit later)
- Git push has certificate errors (works locally)

### 🎨 Design System:
- Colors: Primary (blue), Success (green), Error (red), Warning (orange)
- Typography: System fonts, clear hierarchy
- Components: All in `components/ui/` (Button, Card, Checkbox, etc.)
- Animation: Smooth transitions with Framer Motion

---

## REQUIREMENTS FOR THIS TASK:

1. **[Specific requirement 1]**
2. **[Specific requirement 2]**
3. **[Specific requirement 3]**

### Expected Behavior:
- [What should happen when...]
- [What should the UI look like...]
- [What should the API return...]

### Edge Cases to Handle:
- [ ] Empty states
- [ ] Error states
- [ ] Loading states
- [ ] Invalid input
- [ ] Network failures

---

## DEVELOPMENT CONSTRAINTS:

### Must Follow:
- ✅ **TDD:** Write tests FIRST, then implement
- ✅ **Type Safety:** No `any` types, proper TypeScript
- ✅ **Small Changes:** Incremental commits, easy to review
- ✅ **Error Handling:** Try/catch for all async operations
- ✅ **Validation:** Zod schemas for all data

### Code Quality Standards:
```typescript
// ✅ GOOD: Type-safe, validated, error-handled
async function fetchGoals(): Promise<Goal[]> {
  try {
    const response = await fetch('/api/goals');
    if (!response.ok) throw new Error('Failed to fetch goals');
    const data = await response.json();
    return goalArraySchema.parse(data); // Zod validation
  } catch (error) {
    console.error('Error fetching goals:', error);
    throw error;
  }
}

// ❌ BAD: No types, no validation, no error handling
async function fetchGoals() {
  const res = await fetch('/api/goals');
  return res.json();
}
```

---

## TESTING REQUIREMENTS:

### Must Have Tests For:
- [ ] Happy path (normal usage)
- [ ] Error cases (API failures)
- [ ] Edge cases (empty data, invalid input)
- [ ] User interactions (clicks, form submissions)

### Test Example:
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('MyFeature', () => {
  it('should handle user interaction correctly', async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MyFeature />
      </QueryClientProvider>
    );
    
    const button = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });
});
```

---

## DEFINITION OF DONE:

This task is complete when:
- [ ] All tests pass (`npm run test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] Manually tested in browser
- [ ] Edge cases handled
- [ ] Error states handled
- [ ] Loading states handled
- [ ] Code reviewed by me
- [ ] Committed with clear commit message

---

## ADDITIONAL CONTEXT:

**API Patterns We Use:**
```typescript
// API Route Pattern
export async function GET(request: NextRequest) {
  try {
    const data = await fetchFromDB();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { message: 'Error message' },
      { status: 500 }
    );
  }
}
```

**React Query Pattern:**
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', id],
  queryFn: () => fetchResource(id),
});

const mutation = useMutation({
  mutationFn: updateResource,
  onSuccess: () => {
    queryClient.refetchQueries({ queryKey: ['resource'] });
  },
});
```

---

## QUESTIONS FOR AI AGENT:

1. Do you understand the tech stack and constraints?
2. Do you have suggestions for the implementation approach?
3. What tests should we write first?
4. Any potential issues or edge cases I'm missing?

---

## LET'S BUILD! 🚀

Remember: Small changes, test everything, review all AI code!
