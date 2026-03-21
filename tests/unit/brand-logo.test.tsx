import React from 'react';
import { describe, expect, test } from 'vitest';
import { render, screen } from '@/tests/utils/test-utils';
import { BrandLockup, BrandMark } from '@/components/shared/BrandLogo';

describe('BrandLogo', () => {
  test('rendert die INNIS-Wordmark im Lockup', () => {
    render(<BrandLockup />);
    expect(screen.getByText('INNIS')).toBeInTheDocument();
  });

  test('rendert die BrandMark als aria-hidden', () => {
    const { container } = render(<BrandMark />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
