import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@/tests/utils/test-utils';

vi.mock('framer-motion', () => ({
  motion: {
    span: ({ children, layout, transition, ...props }: any) => <span {...props}>{children}</span>,
  },
}));

import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

describe('ToggleSwitch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('toggles to the opposite state on click', () => {
    const onChange = vi.fn();
    render(<ToggleSwitch enabled={false} onChange={onChange} ariaLabel="Ton aktivieren" />);

    const toggle = screen.getByRole('switch', { name: 'Ton aktivieren' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    toggle.click();

    expect(onChange).toHaveBeenCalledWith(true);
  });
});
