import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LiveImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: 'auto' | 'square' | 'video' | '4/3' | '3/2';
  overlay?: 'none' | 'gradient' | 'dark' | 'primary';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  objectFit?: 'cover' | 'contain' | 'fill';
  lazy?: boolean;
  onLoad?: () => void;
  children?: React.ReactNode;
}

// Curated high-quality images for accounting/fintech contexts
export const LIVE_IMAGES = {
  // Hero & Landing
  heroFinance: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80&auto=format&fit=crop',
  heroAnalytics: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&q=80&auto=format&fit=crop',
  heroDashboard: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1600&q=80&auto=format&fit=crop',
  
  // Auth & Onboarding
  authTeam: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80&auto=format&fit=crop',
  authOffice: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80&auto=format&fit=crop',
  authFintech: 'https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=1200&q=80&auto=format&fit=crop',
  
  // Business & Accounting
  businessMeeting: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&q=80&auto=format&fit=crop',
  accounting: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80&auto=format&fit=crop',
  invoicing: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80&auto=format&fit=crop',
  
  // Data & Analytics
  dataVisualization: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1600&q=80&auto=format&fit=crop',
  analytics: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80&auto=format&fit=crop',
  charts: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80&auto=format&fit=crop',
  
  // Technology
  techAbstract: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80&auto=format&fit=crop',
  aiTech: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80&auto=format&fit=crop',
  
  // Growth & Success
  growth: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&q=80&auto=format&fit=crop',
  success: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80&auto=format&fit=crop',
} as const;

// Gradient SVG placeholder (inline, zero network cost)
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%236366f1' stop-opacity='0.08'/%3E%3Cstop offset='100%25' stop-color='%23a855f7' stop-opacity='0.08'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='400' height='300'/%3E%3C/svg%3E`;

const aspectRatioClasses = {
  auto: '',
  square: 'aspect-square',
  video: 'aspect-video',
  '4/3': 'aspect-[4/3]',
  '3/2': 'aspect-[3/2]',
};

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};

const overlayClasses = {
  none: '',
  gradient: 'bg-gradient-to-t from-black/60 via-black/20 to-transparent',
  dark: 'bg-black/40',
  primary: 'bg-gradient-to-br from-primary/40 to-accent/30',
};

export const LiveImage: React.FC<LiveImageProps> = ({
  src,
  alt,
  fallbackSrc = PLACEHOLDER_SVG,
  className,
  containerClassName,
  aspectRatio = 'auto',
  overlay = 'none',
  rounded = '2xl',
  objectFit = 'cover',
  lazy = true,
  onLoad,
  children,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Reset state if src changes
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    if (imgRef.current && fallbackSrc) {
      imgRef.current.src = fallbackSrc;
    }
  };

  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
  }[objectFit];

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        aspectRatioClasses[aspectRatio],
        roundedClasses[rounded],
        containerClassName
      )}
    >
      {/* Placeholder / skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 skeleton" />
      )}

      {/* Image */}
      <img
        ref={imgRef}
        src={hasError ? fallbackSrc : src}
        alt={alt}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-full transition-opacity duration-500',
          objectFitClass,
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
      />

      {/* Overlay */}
      {overlay !== 'none' && (
        <div className={cn('absolute inset-0', overlayClasses[overlay])} />
      )}

      {/* Children (for text overlays etc.) */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};

export default LiveImage;
