import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAppSound } from '@/lib/hooks/useAppSound';

/**
 * Drop-in replacement for react-hot-toast that plays sound effects.
 * Usage: const soundToast = useSoundToast();
 *        soundToast.error('Something went wrong');
 *        soundToast.success('Done!');
 */
export function useSoundToast() {
  const { play } = useAppSound();

  const error = useCallback(
    (message: string, options?: Parameters<typeof toast.error>[1]) => {
      play('error');
      return toast.error(message, options);
    },
    [play]
  );

  const success = useCallback(
    (message: string, options?: Parameters<typeof toast.success>[1]) => {
      play('pop');
      return toast.success(message, options);
    },
    [play]
  );

  return { error, success, plain: toast };
}
