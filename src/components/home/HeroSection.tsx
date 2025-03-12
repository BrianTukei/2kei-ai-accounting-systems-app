
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  featuresRef: React.RefObject<HTMLDivElement>;
}

const HeroSection = ({ featuresRef }: HeroSectionProps) => {
  return (
    <section className="relative pt-20 pb-24 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-radial from-blue-50 to-transparent opacity-70" />
      </div>
      
      <div className="container mx-auto px-4 pt-12 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 mb-8 animate-fade-in">
            Simplified Cash Management
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight animate-fade-up">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
              Smart Accounting
            </span>{" "}
            for Your Business
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Ledgerly streamlines your financial workflow with intuitive tools for tracking income, expenses, and generating reports—all in one beautifully designed platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <Button asChild size="lg" className="rounded-full px-8 py-6 text-base">
              <Link to="/auth?action=signup">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-6 text-base"
              onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              <a href="#features">Explore Features</a>
            </Button>
          </div>
        </div>
        
        {/* Hero Image */}
        <div className="mt-16 max-w-5xl mx-auto animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <div className="glass-card overflow-hidden">
            <img
              src="https://placehold.co/1200x675/f8fafc/a3a3a3?text=Dashboard+Preview"
              alt="Ledgerly Dashboard"
              className="w-full h-auto rounded-lg shadow-glass-lg"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
