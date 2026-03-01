
import { useRef } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/home/HeroSection';
import FeaturesCarousel from '@/components/home/FeaturesCarousel';
import PricingSection from '@/components/home/PricingSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import CTASection from '@/components/home/CTASection';
import Footer from '@/components/home/Footer';
import useScrollAnimation from '@/hooks/useScrollAnimation';

export default function Index() {
  const featuresRef = useRef<HTMLDivElement>(null);
  
  // Initialize scroll animation
  useScrollAnimation();

  return (
    <div className="min-h-screen">
      <Navbar />
      <div>
        <HeroSection featuresRef={featuresRef} />
        <FeaturesCarousel ref={featuresRef} />
        <PricingSection />
        <TestimonialsSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
}
