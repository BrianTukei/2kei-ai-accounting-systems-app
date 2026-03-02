import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface SlideData {
  src: string;
  alt: string;
  caption: string;
  stat: string;
  statLabel: string;
}

const SLIDES: SlideData[] = [
  {
    src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&q=80&auto=format&fit=crop',
    alt: 'Real-time financial analytics dashboard with live data',
    caption: 'Real-Time Analytics Dashboard',
    stat: '$2.4M+',
    statLabel: 'Revenue tracked daily',
  },
  {
    src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80&auto=format&fit=crop',
    alt: 'AI-powered data visualization and financial charts',
    caption: 'AI-Powered Financial Insights',
    stat: '98.7%',
    statLabel: 'Prediction accuracy',
  },
  {
    src: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1600&q=80&auto=format&fit=crop',
    alt: 'Professional accountant working with automated bookkeeping',
    caption: 'Automated Bookkeeping',
    stat: '40+ hrs',
    statLabel: 'Saved every month',
  },
  {
    src: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1600&q=80&auto=format&fit=crop',
    alt: 'Team collaborating on financial reports and strategy',
    caption: 'Team Collaboration & Reports',
    stat: '50,000+',
    statLabel: 'Businesses trust us',
  },
  {
    src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1600&q=80&auto=format&fit=crop',
    alt: 'Modern office using cloud accounting software on multiple devices',
    caption: 'Cloud-First, Any Device',
    stat: '99.9%',
    statLabel: 'Uptime guaranteed',
  },
];

const SLIDE_INTERVAL = 4500; // 4.5 seconds per slide

const HeroImageSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));
  const [isPaused, setIsPaused] = useState(false);

  // Preload next image
  const preloadImage = useCallback((index: number) => {
    if (loadedImages.has(index)) return;
    const img = new Image();
    img.src = SLIDES[index].src;
    img.onload = () => {
      setLoadedImages((prev) => new Set(prev).add(index));
    };
  }, [loadedImages]);

  // Auto-advance slides
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
        setIsTransitioning(false);
      }, 500); // matches CSS transition duration
    }, SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, [isPaused]);

  // Preload the next 2 images ahead
  useEffect(() => {
    const next1 = (currentSlide + 1) % SLIDES.length;
    const next2 = (currentSlide + 2) % SLIDES.length;
    preloadImage(next1);
    preloadImage(next2);
  }, [currentSlide, preloadImage]);

  const goToSlide = (index: number) => {
    if (index === currentSlide) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsTransitioning(false);
    }, 400);
  };

  const slide = SLIDES[currentSlide];

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-border/30 shadow-float group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides container */}
      <div className="relative aspect-video overflow-hidden">
        {/* All slides rendered, only current one visible */}
        {SLIDES.map((s, i) => (
          <img
            key={i}
            src={s.src}
            alt={s.alt}
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className={cn(
              'absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out',
              i === currentSlide && !isTransitioning
                ? 'opacity-100 scale-100'
                : i === currentSlide && isTransitioning
                  ? 'opacity-0 scale-105'
                  : 'opacity-0 scale-105'
            )}
          />
        ))}

        {/* Gradient overlay — always visible */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />

        {/* Slide caption & stat */}
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 p-6 md:p-10 z-20 transition-all duration-500',
            isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          )}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            {/* Caption */}
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">
                {String(currentSlide + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
              </p>
              <h3 className="text-white text-xl md:text-2xl font-bold">
                {slide.caption}
              </h3>
            </div>

            {/* Stat card */}
            <div className="bg-white/15 backdrop-blur-md rounded-xl px-5 py-3 border border-white/20">
              <p className="text-white text-2xl md:text-3xl font-bold leading-none">
                {slide.stat}
              </p>
              <p className="text-white/70 text-xs font-medium mt-1">
                {slide.statLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar indicators */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex gap-1.5 px-6 md:px-10 pb-3">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className="relative flex-1 h-1 rounded-full overflow-hidden bg-white/20 cursor-pointer group/dot"
            aria-label={`Go to slide ${i + 1}`}
          >
            {/* Fill animation */}
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full transition-all',
                i === currentSlide
                  ? 'bg-white animate-progress-fill'
                  : i < currentSlide
                    ? 'bg-white/60 w-full'
                    : 'bg-transparent w-0'
              )}
              style={
                i === currentSlide && !isPaused
                  ? { animation: `progress-fill ${SLIDE_INTERVAL}ms linear forwards` }
                  : i === currentSlide && isPaused
                    ? { width: '50%', background: 'white' }
                    : undefined
              }
            />
            {/* Hover highlight */}
            <div className="absolute inset-0 bg-white/0 group-hover/dot:bg-white/30 transition-colors rounded-full" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeroImageSlider;
