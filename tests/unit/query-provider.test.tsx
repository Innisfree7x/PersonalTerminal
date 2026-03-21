import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@/tests/utils/test-utils';
import { useQueryClient } from '@tanstack/react-query';

vi.mock('next/dynamic', () => ({
  default: () => () => null,
}));

import QueryProvider from '@/components/providers/QueryProvider';

function Probe() {
  const queryClient = useQueryClient();
  const defaults = queryClient.getDefaultOptions();

  return (
    <div>
      <span>retry:{String(defaults.queries?.retry)}</span>
      <span>focus:{String(defaults.queries?.refetchOnWindowFocus)}</span>
    </div>
  );
}

describe('QueryProvider', () => {
  test('provides a configured react-query client', () => {
    render(
      <QueryProvider>
        <Probe />
      </QueryProvider>
    );

    expect(screen.getByText('retry:1')).toBeInTheDocument();
    expect(screen.getByText('focus:false')).toBeInTheDocument();
  });
});
