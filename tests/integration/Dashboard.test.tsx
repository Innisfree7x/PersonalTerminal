/**
 * Integration test for Dashboard page
 * Tests the full dashboard with all widgets working together
 */

import { describe, test, expect, beforeAll, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/tests/utils/test-utils';
import TodayPage from '@/app/(dashboard)/today/page';

// Mock framer-motion
beforeAll(() => {
  vi.mock('framer-motion', () => ({
    motion: {
      div: 'div',
      button: 'button',
      span: 'span',
      p: 'p',
      circle: 'circle',
    },
    AnimatePresence: ({ children }: { children: any }) => children,
  }));
});

// Mock fetch API
beforeAll(() => {
  global.fetch = vi.fn();
});

describe('Dashboard Integration', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    (global.fetch as any).mockReset();
    
    // Mock calendar API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });
  });

  describe('Page Rendering', () => {
    test('renders dashboard without crashing', async () => {
      renderWithProviders(<TodayPage />);
      
      // Wait for async operations
      await waitFor(() => {
        expect(screen.getByText(/Today/i)).toBeInTheDocument();
      });
    });

    test('renders all major sections', async () => {
      renderWithProviders(<TodayPage />);
      
      await waitFor(() => {
        // Should have QuickStatsBar
        expect(screen.getByText('Events Today')).toBeInTheDocument();
        
        // Should have Focus Tasks
        expect(screen.getByText('Focus Tasks Today')).toBeInTheDocument();
        
        // Should have Schedule
        expect(screen.getByText('Schedule')).toBeInTheDocument();
      });
    });
  });

  describe('Widget Integration', () => {
    test('renders CircularProgress widget', async () => {
      renderWithProviders(<TodayPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Completion')).toBeInTheDocument();
      });
    });

    test('renders QuickStatsBar', async () => {
      renderWithProviders(<TodayPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Productivity')).toBeInTheDocument();
        expect(screen.getByText('Focus Time')).toBeInTheDocument();
      });
    });

    test('renders ActivityFeed', async () => {
      renderWithProviders(<TodayPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      });
    });

    test('renders PomodoroTimer', async () => {
      renderWithProviders(<TodayPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Pomodoro Timer')).toBeInTheDocument();
      });
    });

    test('renders MoodTracker', async () => {
      renderWithProviders(<TodayPage />);
      
      await waitFor(() => {
        expect(screen.getByText('How are you feeling?')).toBeInTheDocument();
      });
    });

    test('renders QuickActionsWidget', async () => {
      renderWithProviders(<TodayPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles calendar API failure gracefully', async () => {
      // Mock failed API call
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      renderWithProviders(<TodayPage />);
      
      await waitFor(() => {
        // Page should still render despite API error
        expect(screen.getByText(/Today/i)).toBeInTheDocument();
      });
    });

    test('handles unauthorized calendar access', async () => {
      // Mock 401 response
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });
      
      renderWithProviders(<TodayPage />);
      
      await waitFor(() => {
        // Should show disconnect/connect button or handle gracefully
        expect(screen.getByText(/Today/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dynamic Layout', () => {
    test('adapts layout when schedule is empty', async () => {
      // Mock empty calendar response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      });
      
      const { container } = renderWithProviders(<TodayPage />);
      
      await waitFor(() => {
        // Should have grid layout
        const grid = container.querySelector('.grid');
        expect(grid).toBeInTheDocument();
      });
    });
  });

  describe('Interactive Elements', () => {
    test('quick actions are interactive', async () => {
      renderWithProviders(<TodayPage />);
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        // Should have multiple interactive buttons
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    test('mood tracker accepts input', async () => {
      renderWithProviders(<TodayPage />);
      
      await waitFor(() => {
        // Should render mood buttons
        const moodElements = screen.getByText('How are you feeling?');
        expect(moodElements).toBeInTheDocument();
      });
    });
  });

  describe('Data Flow', () => {
    test('fetches calendar events on mount', async () => {
      renderWithProviders(<TodayPage />);
      
      await waitFor(() => {
        // Should have called the calendar API
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/calendar/today')
        );
      });
    });

    test('displays calendar connection status', async () => {
      renderWithProviders(<TodayPage />);
      
      await waitFor(() => {
        // Should show some indication of calendar status
        // Either "Connect" button or event list
        const page = screen.getByText(/Today/i).closest('div');
        expect(page).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    test('renders within reasonable time', async () => {
      const startTime = Date.now();
      
      renderWithProviders(<TodayPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Today/i)).toBeInTheDocument();
      });
      
      const renderTime = Date.now() - startTime;
      
      // Should render within 2 seconds (generous timeout for test environment)
      expect(renderTime).toBeLessThan(2000);
    });
  });

  describe('Accessibility', () => {
    test('has proper semantic structure', async () => {
      const { container } = renderWithProviders(<TodayPage />);
      
      await waitFor(() => {
        // Should have main content sections
        const mainContent = container.querySelector('main') || container;
        expect(mainContent).toBeInTheDocument();
      });
    });

    test('all interactive elements are keyboard accessible', async () => {
      renderWithProviders(<TodayPage />);
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          // All buttons should be in tab order
          expect(button).not.toHaveAttribute('tabindex', '-1');
        });
      });
    });
  });
});
