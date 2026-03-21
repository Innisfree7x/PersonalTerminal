import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent } from '@/tests/utils/test-utils';

const mocks = vi.hoisted(() => ({
  playMock: vi.fn(),
  toastErrorMock: vi.fn(() => 'error-toast'),
  toastSuccessMock: vi.fn(() => 'success-toast'),
}));

vi.mock('@/lib/hooks/useAppSound', () => ({
  useAppSound: () => ({ play: mocks.playMock }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: mocks.toastErrorMock,
    success: mocks.toastSuccessMock,
  },
}));

import { useSoundToast } from '@/lib/hooks/useSoundToast';

function Probe() {
  const soundToast = useSoundToast();
  return (
    <div>
      <button onClick={() => soundToast.success('Erfolg')}>success</button>
      <button onClick={() => soundToast.error('Fehler')}>error</button>
    </div>
  );
}

describe('useSoundToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('spielt Pop-Sound und feuert Success-Toast', async () => {
    const user = userEvent.setup();
    render(<Probe />);

    await user.click(screen.getByText('success'));

    expect(mocks.playMock).toHaveBeenCalledWith('pop');
    expect(mocks.toastSuccessMock).toHaveBeenCalledWith('Erfolg', undefined);
  });

  test('spielt Error-Sound und feuert Error-Toast', async () => {
    const user = userEvent.setup();
    render(<Probe />);

    await user.click(screen.getByText('error'));

    expect(mocks.playMock).toHaveBeenCalledWith('error');
    expect(mocks.toastErrorMock).toHaveBeenCalledWith('Fehler', undefined);
  });
});
