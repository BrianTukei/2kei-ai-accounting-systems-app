import { useEffect, useCallback } from 'react';

interface UseKeyboardNavigationProps {
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onEscape?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  disabled?: boolean;
}

export function useKeyboardNavigation({
  onArrowLeft,
  onArrowRight,
  onArrowUp,
  onArrowDown,
  onEscape,
  onHome,
  onEnd,
  disabled = false,
}: UseKeyboardNavigationProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;
      
      // Don't interfere with form inputs
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' || 
         activeElement.tagName === 'TEXTAREA' || 
         (activeElement as HTMLElement).contentEditable === 'true')
      ) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          if (onArrowLeft) {
            event.preventDefault();
            onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (onArrowRight) {
            event.preventDefault();
            onArrowRight();
          }
          break;
        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault();
            onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault();
            onArrowDown();
          }
          break;
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case 'Home':
          if (onHome) {
            event.preventDefault();
            onHome();
          }
          break;
        case 'End':
          if (onEnd) {
            event.preventDefault();
            onEnd();
          }
          break;
      }
    },
    [onArrowLeft, onArrowRight, onArrowUp, onArrowDown, onEscape, onHome, onEnd, disabled]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export default useKeyboardNavigation;