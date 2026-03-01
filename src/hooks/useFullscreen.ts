import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to toggle browser fullscreen mode.
 * Returns the current state and a toggle function.
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync state when fullscreen changes via Escape key or other means
  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (err) {
      console.warn('[useFullscreen] Could not toggle fullscreen:', err);
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}
