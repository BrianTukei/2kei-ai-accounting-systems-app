
import { useRef } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
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
      <HeroSection featuresRef={featuresRef} />
      <FeaturesSection ref={featuresRef} />
      <CTASection />
      <Footer />
    </div>
  );
}
