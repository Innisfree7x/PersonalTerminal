import { beforeEach, describe, expect, test, vi } from 'vitest';

function installStorageMock() {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, String(value)),
      removeItem: (key: string) => void store.delete(key),
      clear: () => void store.clear(),
    },
  });
}
import { userEvent } from '@/tests/utils/test-utils';
import { render, screen, waitFor } from '@/tests/utils/test-utils';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import type { Application, CreateApplicationInput } from '@/lib/schemas/application.schema';

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useOptimistic:
      actual.useOptimistic ??
      ((state: unknown) => [state, vi.fn()] as const),
  };
});

import CareerBoard from '@/components/features/career/CareerBoard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, whileTap, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PointerSensor: function PointerSensor() {},
  KeyboardSensor: function KeyboardSensor() {},
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
  closestCorners: vi.fn(),
  defaultDropAnimationSideEffects: vi.fn(),
  useDroppable: vi.fn(() => ({ setNodeRef: vi.fn() })),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: {},
  sortableKeyboardCoordinates: vi.fn(),
}));

vi.mock('@/components/features/career/CvUpload', () => ({
  default: () => <div>CV Upload Mock</div>,
}));

vi.mock('@/components/features/career/ApplicationStats', () => ({
  default: () => <div>Stats Mock</div>,
}));

vi.mock('@/components/features/career/SortableApplicationItem', () => ({
  default: () => <div>Sortable Application Mock</div>,
}));

vi.mock('@/components/features/career/ApplicationCard', () => ({
  default: () => <div>Application Card Mock</div>,
}));

vi.mock('@/components/shared/ConfirmModal', () => ({
  ConfirmModal: () => null,
}));

vi.mock('@/components/features/career/OpportunityRadar', () => ({
  default: ({ onAdoptToPipeline }: { onAdoptToPipeline: (data: CreateApplicationInput) => void }) => (
    <button
      type="button"
      onClick={() =>
        onAdoptToPipeline({
          company: 'Rothenstein Partners',
          position: 'Intern M&A Advisory',
          status: 'applied',
          applicationDate: new Date('2026-03-21T10:00:00.000Z'),
          location: 'Frankfurt, DE',
          jobUrl: 'https://example.com/m-a',
          notes: 'Top Gap: Case speed',
        })
      }
    >
      Opportunity übernehmen
    </button>
  ),
}));

vi.mock('@/components/features/career/ApplicationModal', () => ({
  default: ({ isOpen, initialData }: { isOpen: boolean; initialData?: CreateApplicationInput }) =>
    isOpen ? (
      <div>
        <div>Application Modal Mock</div>
        <div data-testid="prefill-company">{initialData?.company ?? ''}</div>
        <div data-testid="prefill-position">{initialData?.position ?? ''}</div>
        <div data-testid="prefill-location">{initialData?.location ?? ''}</div>
        <div data-testid="prefill-job-url">{initialData?.jobUrl ?? ''}</div>
        <div data-testid="prefill-notes">{initialData?.notes ?? ''}</div>
      </div>
    ) : null,
}));

const initialApplications: Application[] = [
  {
    id: 'app-1',
    company: 'Existing Corp',
    position: 'Working Student',
    status: 'applied',
    applicationDate: new Date('2026-03-20T10:00:00.000Z'),
    interviewDate: undefined,
    notes: undefined,
    salaryRange: undefined,
    location: 'Berlin',
    jobUrl: undefined,
    createdAt: new Date('2026-03-20T10:00:00.000Z'),
    updatedAt: new Date('2026-03-20T10:00:00.000Z'),
  },
];

describe('Career radar bridge integration', () => {
  beforeEach(() => {
    installStorageMock();
    window.localStorage.setItem('innis:app-language:v1', 'de');
  });

  test('opens the application modal with radar-prefilled data when an opportunity is adopted into the pipeline', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <CareerBoard initialApplications={initialApplications} />
      </LanguageProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Opportunity übernehmen' }));

    await waitFor(() => {
      expect(screen.getByText('Application Modal Mock')).toBeInTheDocument();
    });

    expect(screen.getByTestId('prefill-company')).toHaveTextContent('Rothenstein Partners');
    expect(screen.getByTestId('prefill-position')).toHaveTextContent('Intern M&A Advisory');
    expect(screen.getByTestId('prefill-location')).toHaveTextContent('Frankfurt, DE');
    expect(screen.getByTestId('prefill-job-url')).toHaveTextContent('https://example.com/m-a');
    expect(screen.getByTestId('prefill-notes')).toHaveTextContent('Top Gap: Case speed');
  });
});
