
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import dashboardHero from '@/assets/dashboard-hero.jpg';

interface HeroSectionProps {
  featuresRef: React.RefObject<HTMLDivElement>;
}

const HeroSection = ({ featuresRef }: HeroSectionProps) => {
  return (
    <section className="relative pt-20 pb-24 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%, hsl(var(--primary)/0.1), transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%, hsl(var(--accent)/0.1), transparent_50%)]" />
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl floating-animation" />
        <div className="absolute top-40 right-20 w-16 h-16 bg-accent/10 rounded-full blur-xl floating-animation" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-40 left-1/4 w-12 h-12 bg-primary/5 rounded-full blur-xl floating-animation" style={{ animationDelay: '4s' }} />
      </div>
      
      <div className="container mx-auto px-4 pt-12 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm border border-primary/20 px-4 py-2 text-sm font-medium text-primary mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            Simplified Cash Management
            <TrendingUp className="w-4 h-4" />
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight animate-fade-up">
            <span className="gradient-text">
              Smart Accounting
            </span>{" "}
            for Your Business
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Ledgerly streamlines your financial workflow with intuitive tools for tracking income, expenses, and generating reports—all in one beautifully designed platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <Button asChild size="lg" className="rounded-full px-8 py-6 text-base hero-glow bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 border-0 shadow-elegant">
              <Link to="/auth?action=signup">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-6 text-base bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 hover:border-white/30"
              onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              <a href="#features">Explore Features</a>
            </Button>
          </div>
        </div>
        
        {/* Hero Image */}
        <div className="mt-16 max-w-5xl mx-auto animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <div className="glass-card overflow-hidden hero-glow">
            <div className="relative">
              <img
                src={dashboardHero}
                alt="2KÈI Ledgery Accounting Dashboard - Modern financial management interface"
                className="w-full h-auto rounded-lg shadow-glass-lg"
                style={{ objectFit: 'cover' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
