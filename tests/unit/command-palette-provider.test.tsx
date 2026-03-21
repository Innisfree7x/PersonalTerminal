import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, userEvent } from '@/tests/utils/test-utils';

vi.mock('@/lib/command/executor', () => ({
  useIntentExecutor: vi.fn(),
}));

vi.mock('@/components/shared/CommandPalette', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <div>
      <span>{isOpen ? 'palette-open' : 'palette-closed'}</span>
      <button onClick={onClose}>close-palette</button>
    </div>
  ),
}));

import CommandPaletteProvider, { useCommandPalette } from '@/components/shared/CommandPaletteProvider';

function Probe() {
  const { isOpen, open, close, toggle } = useCommandPalette();
  return (
    <div>
      <span>{isOpen ? 'state-open' : 'state-closed'}</span>
      <button onClick={open}>open</button>
      <button onClick={close}>close</button>
      <button onClick={toggle}>toggle</button>
    </div>
  );
}

describe('CommandPaletteProvider', () => {
  test('oeffnet, schliesst und toggelt den Command-Palette-State', async () => {
    const user = userEvent.setup();

    render(
      <CommandPaletteProvider>
        <Probe />
      </CommandPaletteProvider>,
    );

    expect(screen.getByText('state-closed')).toBeInTheDocument();
    expect(screen.getByText('palette-closed')).toBeInTheDocument();

    await user.click(screen.getByText('open'));
    expect(screen.getByText('state-open')).toBeInTheDocument();
    expect(screen.getByText('palette-open')).toBeInTheDocument();

    await user.click(screen.getByText('close'));
    expect(screen.getByText('state-closed')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(screen.getByText('state-open')).toBeInTheDocument();

    await user.click(screen.getByText('close-palette'));
    expect(screen.getByText('state-closed')).toBeInTheDocument();
  });
});
