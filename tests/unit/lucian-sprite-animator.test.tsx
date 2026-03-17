import { describe, expect, test, vi } from 'vitest';
import { render } from '@/tests/utils/test-utils';
import { LucianSpriteAnimator } from '@/components/features/lucian/LucianSpriteAnimator';
import { CHAMPION_CONFIG } from '@/lib/champion/config';

vi.mock('framer-motion', () => ({
  useReducedMotion: () => false,
}));

describe('Lucian sprite V3', () => {
  test('animator points to the V3 spritesheet with 72px default size', () => {
    const { container } = render(<LucianSpriteAnimator animation="idle" />);
    const sprite = container.firstChild as HTMLElement | null;

    expect(sprite).not.toBeNull();
    expect(sprite?.style.backgroundImage).toContain('/sprites/lucian-sprites-v3.svg');
    expect(sprite?.style.width).toBe('72px');
    expect(sprite?.style.height).toBe('72px');
    expect(sprite?.style.imageRendering).toBe('pixelated');
  });

  test('champion config uses Lucian V3 sheet and 64px frames', () => {
    expect(CHAMPION_CONFIG.lucian.spriteSheet).toBe('/sprites/lucian-sprites-v3.svg');
    expect(CHAMPION_CONFIG.lucian.frameSize).toBe(64);
  });
});
