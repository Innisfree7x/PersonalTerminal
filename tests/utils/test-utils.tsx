/**
 * Custom render utilities for testing React components
 * Provides common wrappers and helpers for consistent test setup
 * 
 * @module tests/utils/test-utils
 */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Create a new QueryClient for testing
 * Disables retries and caching for faster, more predictable tests
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry failed queries in tests
        cacheTime: 0, // Don't cache query results
        staleTime: 0, // Consider all queries stale immediately
      },
      mutations: {
        retry: false, // Don't retry failed mutations in tests
      },
    },
  });
}

/**
 * Wrapper component that provides all necessary context providers
 * Use this for components that need QueryClient or other providers
 */
interface AllProvidersProps {
  children: ReactNode;
}

function AllProviders({ children }: AllProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Custom render function that wraps components with providers
 * Use this instead of @testing-library/react's render for components that need context
 * 
 * @param ui - The component to render
 * @param options - Optional render options
 * @returns Render result with all testing-library utilities
 * 
 * @example
 * import { renderWithProviders } from '@/tests/utils/test-utils';
 * 
 * test('my component', () => {
 *   const { getByText } = renderWithProviders(<MyComponent />);
 *   expect(getByText('Hello')).toBeInTheDocument();
 * });
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Mock Framer Motion animations for testing
 * Disables all animations to make tests faster and more predictable
 * 
 * Call this in your test setup or individual test files
 * 
 * @example
 * import { mockFramerMotion } from '@/tests/utils/test-utils';
 * 
 * beforeAll(() => {
 *   mockFramerMotion();
 * });
 */
export function mockFramerMotion() {
  // Mock framer-motion to disable animations
  vi.mock('framer-motion', () => ({
    motion: {
      div: 'div',
      aside: 'aside',
      header: 'header',
      main: 'main',
      button: 'button',
      span: 'span',
      p: 'p',
      circle: 'circle',
    },
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
  }));
}

/**
 * Create mock date for testing time-sensitive components
 * 
 * @param dateString - ISO date string (e.g., '2024-01-15T10:00:00Z')
 * @returns Original Date constructor (to restore later)
 * 
 * @example
 * const restoreDate = mockDate('2024-01-15T10:00:00Z');
 * // Run tests...
 * restoreDate(); // Restore real Date
 */
export function mockDate(dateString: string) {
  const mockNow = new Date(dateString);
  const OriginalDate = Date;
  
  global.Date = class extends OriginalDate {
    constructor() {
      super();
      return mockNow;
    }
    static now() {
      return mockNow.getTime();
    }
  } as any;

  return () => {
    global.Date = OriginalDate;
  };
}

/**
 * Wait for async operations to complete
 * Useful for testing components with useEffect or async data fetching
 * 
 * @param ms - Milliseconds to wait (default: 0)
 * 
 * @example
 * await waitFor(async () => {
 *   await flushPromises();
 *   expect(getByText('Loaded!')).toBeInTheDocument();
 * });
 */
export function flushPromises(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock console methods to prevent noisy test output
 * Returns functions to restore original console methods
 * 
 * @example
 * const { restoreConsole } = mockConsole();
 * // Run tests that log errors...
 * restoreConsole(); // Restore original console
 */
export function mockConsole() {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();

  return {
    restoreConsole: () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    },
  };
}

// Re-export everything from testing-library for convenience
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
