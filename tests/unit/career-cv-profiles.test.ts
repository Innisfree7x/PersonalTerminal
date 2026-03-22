import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/auth/server';
import { fetchCareerCvProfile, upsertCareerCvProfile } from '@/lib/supabase/careerCvProfiles';

const mockedCreateClient = vi.mocked(createClient);

function makeResolvedQuery<T>(result: T) {
  const query = Promise.resolve(result) as Promise<T> & Record<string, any>;
  const methods = ['upsert', 'select', 'single', 'eq', 'maybeSingle'];
  for (const method of methods) {
    query[method] = vi.fn(() => query);
  }
  return query;
}

describe('career CV profiles repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists a normalized CV analysis profile', async () => {
    const profileRow = {
      id: 'profile-1',
      user_id: 'user-1',
      cv_text: 'CV text',
      cv_rank: 74,
      rank_tier: 'strong',
      strengths: ['Modeling'],
      gaps: ['Live deals'],
      skills: ['Excel'],
      target_tracks: ['m&a'],
      updated_at: '2026-03-21T10:00:00.000Z',
      created_at: '2026-03-21T10:00:00.000Z',
    };

    const upsertQuery = makeResolvedQuery({ data: profileRow, error: null });
    mockedCreateClient.mockReturnValue({
      from: vi.fn(() => upsertQuery),
    } as any);

    const result = await upsertCareerCvProfile('user-1', 'CV text', {
      cvRank: 74,
      rankTier: 'strong',
      topStrengths: ['Modeling'],
      topGaps: ['Live deals'],
      detectedSkills: ['Excel'],
      targetTracks: ['m&a'],
    } as any);

    expect(result).toEqual({
      profile: profileRow,
      persisted: true,
    });
    expect(upsertQuery.upsert).toHaveBeenCalledWith(
      {
        user_id: 'user-1',
        cv_text: 'CV text',
        cv_rank: 74,
        rank_tier: 'strong',
        strengths: ['Modeling'],
        gaps: ['Live deals'],
        skills: ['Excel'],
        target_tracks: ['m&a'],
      },
      { onConflict: 'user_id' }
    );
  });

  it('gracefully skips persistence when the table is not yet migrated', async () => {
    mockedCreateClient.mockReturnValue({
      from: vi.fn(() =>
        makeResolvedQuery({
          data: null,
          error: { code: '42P01', message: 'relation career_cv_profiles does not exist' },
        })
      ),
    } as any);

    await expect(
      upsertCareerCvProfile('user-1', 'CV text', {
        cvRank: 60,
        rankTier: 'developing',
        topStrengths: [],
        topGaps: [],
        detectedSkills: [],
        targetTracks: [],
      } as any)
    ).resolves.toEqual({
      profile: null,
      persisted: false,
    });
  });

  it('returns null for missing table reads and returns the stored profile otherwise', async () => {
    const maybeSingleQuery = makeResolvedQuery({
      data: {
        id: 'profile-2',
        user_id: 'user-2',
        cv_text: 'Stored CV',
        cv_rank: 68,
        rank_tier: 'developing',
        strengths: ['Accounting'],
        gaps: ['Bloomberg'],
        skills: ['Excel'],
        target_tracks: ['audit'],
        updated_at: '2026-03-21T10:00:00.000Z',
        created_at: '2026-03-21T10:00:00.000Z',
      },
      error: null,
    });

    mockedCreateClient
      .mockReturnValueOnce({
        from: vi.fn(() =>
          makeResolvedQuery({
            data: null,
            error: { code: '42P01', message: 'career_cv_profiles missing' },
          })
        ),
      } as any)
      .mockReturnValueOnce({
        from: vi.fn(() => maybeSingleQuery),
      } as any);

    await expect(fetchCareerCvProfile('user-1')).resolves.toBeNull();
    await expect(fetchCareerCvProfile('user-2')).resolves.toEqual(
      expect.objectContaining({
        user_id: 'user-2',
        cv_rank: 68,
      })
    );
  });
});
