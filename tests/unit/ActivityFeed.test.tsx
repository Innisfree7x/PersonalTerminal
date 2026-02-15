import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/tests/utils/test-utils';
import ActivityFeed from '@/components/features/dashboard/ActivityFeed';

describe('ActivityFeed', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ activities: [] }),
    } as Response);
  });

  test('renders title', () => {
    render(<ActivityFeed activities={[]} />);
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  test('renders provided activities', () => {
    render(
      <ActivityFeed
        activities={[
          {
            id: '1',
            type: 'task',
            action: 'Completed task: Review PRs',
            timestamp: new Date(),
          },
        ]}
      />
    );

    expect(screen.getByText('Completed task: Review PRs')).toBeInTheDocument();
  });

  test('shows empty state when provided activities are empty', async () => {
    render(<ActivityFeed activities={[]} />);
    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });
  });

  test('shows loading skeleton', () => {
    const { container } = render(<ActivityFeed isLoading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  test('falls back to local activities when API fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ActivityFeed />);

    await waitFor(() => {
      expect(screen.getByText(/Completed Exercise 3/i)).toBeInTheDocument();
    });
    consoleSpy.mockRestore();
  });
});
