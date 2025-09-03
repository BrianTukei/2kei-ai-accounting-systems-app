
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import ctaIllustration from '@/assets/cta-illustration.jpg';

const CTASection = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-on-scroll opacity-0">
              Ready to <span className="gradient-text">simplify</span> your accounting?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 animate-on-scroll opacity-0">
              Join thousands of businesses that use 2KÈI Ledgery Accounting to manage their finances effortlessly.
            </p>
            <Button asChild size="lg" className="rounded-full px-8 py-6 text-base animate-on-scroll opacity-0 hero-glow bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 border-0 shadow-elegant">
              <Link to="/auth?action=signup">
                Start Your Free Trial
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
