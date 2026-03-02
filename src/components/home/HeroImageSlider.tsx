import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideData {
  src: string;
  alt: string;
  caption: string;
  description: string;
  stat: string;
  statLabel: string;
}

const SLIDES: SlideData[] = [
  {
    src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&q=80&auto=format&fit=crop',
    alt: 'Real-time financial analytics dashboard with live data',
    caption: 'Real-Time Analytics',
    description: 'Track every dollar in real-time with beautiful dashboards',
    stat: '$2.4M+',
    statLabel: 'Revenue tracked daily',
  },
  {
    src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80&auto=format&fit=crop',
    alt: 'AI-powered data visualization and financial charts',
    caption: 'AI-Powered Insights',
    description: 'Our AI predicts trends before they happen',
    stat: '98.7%',
    statLabel: 'Prediction accuracy',
  },
  {
    src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&q=80&auto=format&fit=crop',
    alt: 'Diverse team collaborating around laptop celebrating business success',
    caption: 'Automated Bookkeeping',
    description: 'Stop wasting hours on manual data entry',
    stat: '40+ hrs',
    statLabel: 'Saved every month',
  },
  {
    src: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1600&q=80&auto=format&fit=crop',
    alt: 'Team collaborating on financial reports and strategy',
    caption: 'Team Collaboration',
    description: 'Your whole team, one financial platform',
    stat: '50,000+',
    statLabel: 'Businesses trust us',
  },
  {
    src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1600&q=80&auto=format&fit=crop',
    alt: 'Modern office using cloud accounting software on multiple devices',
    caption: 'Any Device, Anywhere',
    description: 'Desktop, tablet, or phone — always in sync',
    stat: '99.9%',
    statLabel: 'Uptime guaranteed',
  },
];

const SLIDE_INTERVAL = 5000;

const HeroImageSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressRef = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-advance
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, activeIndex]);

  // Preload all images on mount
  useEffect(() => {
    SLIDES.forEach((s) => {
      const img = new window.Image();
      img.src = s.src;
    });
  }, []);

  // Force re-render after mount to ensure first paint
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const goTo = (i: number) => setActiveIndex(i);
  const goPrev = () => setActiveIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  const goNext = () => setActiveIndex((prev) => (prev + 1) % SLIDES.length);

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-border/30 shadow-float group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Image stack — proper crossfade: all images layered, only active one visible */}
      <div className="relative aspect-video overflow-hidden bg-black" style={{ minHeight: '300px' }}>
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className={cn(
              'absolute inset-0 transition-opacity duration-1000 ease-in-out',
              i === activeIndex ? 'opacity-100 z-[2]' : 'opacity-0 z-[1]'
            )}
          >
            <img
              src={s.src}
              alt={s.alt}
              loading={i < 2 ? 'eager' : 'lazy'}
              decoding="async"
              className={cn(
                'w-full h-full object-cover',
                i === activeIndex ? 'animate-ken-burns' : 'scale-100'
              )}
            />
          </div>
        ))}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 z-10" />

        {/* Slide content overlay */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-5 sm:p-8 md:p-10">
          <div key={activeIndex} className="animate-slide-up-fade">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
              <div className="max-w-md">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">
                  {String(activeIndex + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
                </p>
                <h3 className="text-white text-2xl md:text-3xl font-bold mb-1">
                  {SLIDES[activeIndex].caption}
                </h3>
                <p className="text-white/80 text-sm md:text-base">
                  {SLIDES[activeIndex].description}
                </p>
              </div>

              {/* Stat card */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl px-5 py-3 border border-white/20 min-w-[120px] text-center">
                <p className="text-white text-2xl md:text-3xl font-extrabold leading-none">
                  {SLIDES[activeIndex].stat}
                </p>
                <p className="text-white/70 text-xs font-medium mt-1">
                  {SLIDES[activeIndex].statLabel}
                </p>
              </div>
            </div>

            {/* CTA inside slider */}
            <Link
              to="/auth?action=signup"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold transition-all duration-300 hover:scale-[1.02] group/cta"
            >
              Subscribe Free — See It Live
              <ArrowRight className="w-4 h-4 group-hover/cta:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={goPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Progress bars */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex gap-1.5 px-5 sm:px-8 md:px-10 pb-3">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="relative flex-1 h-1.5 rounded-full overflow-hidden bg-white/20 cursor-pointer hover:bg-white/30 transition-colors"
            aria-label={`Go to slide ${i + 1}`}
          >
            <div
              ref={(el) => { progressRef.current[i] = el; }}
              className={cn(
                'absolute inset-y-0 left-0 rounded-full bg-white',
                i < activeIndex ? 'w-full' : i > activeIndex ? 'w-0' : ''
              )}
              style={
                i === activeIndex
                  ? {
                      width: '0%',
                      animation: isPaused
                        ? 'none'
                        : `progress-fill ${SLIDE_INTERVAL}ms linear forwards`,
                    }
                  : undefined
              }
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeroImageSlider;
