
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

// High-quality Unsplash image - Professional team analyzing financial data
const ctaIllustration = 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80&auto=format&fit=crop';

const CTASection = () => {
  return (
    <section className="py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-on-scroll opacity-0">
              Don't Let Poor <span className="gradient-text">Financial Management</span> Kill Your Business
            </h2>
            <p className="text-lg text-muted-foreground mb-8 animate-on-scroll opacity-0">
              Every day you delay is money lost. While competitors struggle with outdated tools, smart business owners choose 2K AI Accounting Systems. <span className="font-semibold text-primary">Your future self will thank you.</span>
            </p>
            <Button asChild size="lg" className="rounded-full px-8 py-6 text-base animate-on-scroll opacity-0 hero-glow bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 border-0 shadow-elegant">
              <Link to="/auth?action=signup">
                Secure Your Competitive Edge Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          
          {/* Illustration */}
          <div className="animate-on-scroll opacity-0" style={{ animationDelay: '0.2s' }}>
            <div className="glass-card overflow-hidden floating-animation">
              <img
                src={ctaIllustration}
                alt="Professional team collaborating on financial analytics"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
