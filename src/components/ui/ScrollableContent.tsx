/**
 * ScrollableContent.tsx
 * ─────────────────────
 * A scrollable container with visible up/down arrow buttons
 * that appear when content overflows. The buttons smoothly
 * scroll the content and auto-hide when at the top/bottom.
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollableContentProps {
  children: React.ReactNode;
  className?: string;
  /** Height CSS value, defaults to calc(100vh - 200px) */
  maxHeight?: string;
}

export function ScrollableContent({
  children,
  className,
  maxHeight = 'calc(100vh - 200px)',
}: ScrollableContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 20);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 20);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, [checkScroll]);

  // Re-check when children change
  useEffect(() => {
    const t = setTimeout(checkScroll, 100);
    return () => clearTimeout(t);
  }, [children, checkScroll]);

  const scroll = (direction: 'up' | 'down') => {
    const el = containerRef.current;
    if (!el) return;
    const amount = el.clientHeight * 0.6;
    el.scrollBy({ top: direction === 'up' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* Scroll Up button */}
      <button
        onClick={() => scroll('up')}
        className={cn(
          'absolute top-1 left-1/2 -translate-x-1/2 z-20',
          'flex items-center justify-center w-9 h-9 rounded-full',
          'bg-white/90 dark:bg-slate-800/90 shadow-lg border border-slate-200 dark:border-slate-600',
          'text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40',
          'hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300',
          'transition-all duration-200',
          canScrollUp ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none',
        )}
        aria-label="Scroll up"
      >
        <ChevronUp className="w-5 h-5" />
      </button>

      {/* Scrollable area */}
      <div
        ref={containerRef}
        className={cn('overflow-y-auto pr-1', className)}
        style={{ maxHeight }}
      >
        {children}
      </div>

      {/* Scroll Down button */}
      <button
        onClick={() => scroll('down')}
        className={cn(
          'absolute bottom-1 left-1/2 -translate-x-1/2 z-20',
          'flex items-center justify-center w-9 h-9 rounded-full',
          'bg-white/90 dark:bg-slate-800/90 shadow-lg border border-slate-200 dark:border-slate-600',
          'text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40',
          'hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300',
          'transition-all duration-200',
          canScrollDown ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none',
        )}
        aria-label="Scroll down"
      >
        <ChevronDown className="w-5 h-5" />
      </button>
    </div>
  );
}

export default ScrollableContent;
