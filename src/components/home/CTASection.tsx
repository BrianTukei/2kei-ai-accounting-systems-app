
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { LiveImage, LIVE_IMAGES } from '@/components/ui/LiveImage';

const benefits = [
  '\u26a1 Set up in 60 seconds — no credit card, no contracts',
  '\ud83e\udde0 AI assistant that answers any accounting question instantly',
  '\ud83d\udd12 Bank-level 256-bit encryption protects every transaction',
  '\ud83d\ude80 Unlimited team members on Pro — scale without limits',
  '\ud83d\udcca Real-time dashboards your accountant wishes they had',
];

const CTASection = () => {
  return (
    <section className="py-16 lg:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-mesh opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Content */}
          <div className="text-center lg:text-left animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 dark:bg-primary/10 border border-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-6">
              \ud83d\udd25 LIMITED TIME — START FREE TODAY
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
              Your Business Deserves{' '}
              <span className="gradient-text-hero">Better Than Spreadsheets</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed max-w-lg mx-auto lg:mx-0">
              <span className="font-semibold text-foreground">Every minute you spend on manual accounting is money left on the table.</span> 2K AI Accounting Systems automates everything — so you can focus on what actually grows your business.
            </p>
            <p className="text-base md:text-lg text-primary font-semibold mb-8 max-w-lg mx-auto lg:mx-0">
              Subscribe now and see results in your first week. Guaranteed.
            </p>
            
            {/* Benefits list */}
            <ul className="space-y-3 mb-8 max-w-lg mx-auto lg:mx-0">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button asChild size="lg" className="rounded-full px-8 py-6 text-base font-semibold hero-glow bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 border-0 shadow-elegant transition-all duration-400 hover:shadow-float hover:scale-[1.02]">
                <Link to="/auth?action=signup">
                  🚀 Subscribe to 2K AI Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 py-6 text-base font-medium border-border/60 hover:border-primary/30 transition-all duration-400">
                <Link to="/auth?action=signin">
                  Already a Member? Sign In
                </Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4 max-w-sm mx-auto lg:mx-0">
              ✅ No credit card required · Cancel anytime · 14-day Pro trial included
            </p>
          </div>
          
          {/* Illustration */}
          <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <div className="relative">
              <LiveImage
                src={LIVE_IMAGES.businessMeeting}
                alt="Professional team collaborating on financial analytics"
                aspectRatio="4/3"
                overlay="primary"
                rounded="2xl"
                className="shadow-float"
              />
              
              {/* Floating stats card */}
              <div className="absolute -bottom-4 -left-4 lg:-left-6 bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-xl p-4 shadow-card-hover border border-border/30 animate-slide-up-fade" style={{ animationDelay: '0.4s' }}>
                <p className="text-xs text-muted-foreground font-medium mb-1">Time Saved Monthly</p>
                <p className="text-2xl font-bold gradient-text counter-value">40+ hrs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
