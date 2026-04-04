import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/tests/utils/test-utils';
import { useAchievements } from '@/lib/hooks/useAchievements';

function AchievementsProbe() {
  const { unlockedKeys, isLoading } = useAchievements();

  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="keys">{unlockedKeys.join(',')}</span>
    </div>
  );
}

describe('useAchievements', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to an empty achievements list for unrelated payloads', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        stats: { tasksToday: 3 },
      }),
    } as Response);

    renderWithProviders(<AchievementsProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('keys')).toHaveTextContent('');
  });

  it('keeps only valid achievement records', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        achievements: [
          { key: 'first-focus', unlocked_at: '2026-04-04T10:00:00.000Z' },
          { key: 'broken-entry' },
          null,
        ],
      }),
    } as Response);

    renderWithProviders(<AchievementsProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('keys')).toHaveTextContent('first-focus');
  });
});
