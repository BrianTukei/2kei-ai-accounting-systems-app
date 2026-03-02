
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowRight, Sparkles, TrendingUp, ChevronDown, BarChart, CreditCard, FileText, Calculator, PieChart, Target, Shield, Play } from 'lucide-react';
import HeroImageSlider from '@/components/home/HeroImageSlider';

interface HeroSectionProps {
  featuresRef: React.RefObject<HTMLDivElement>;
}

const HeroSection = ({ featuresRef }: HeroSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const features = [
    {
      name: "Financial Dashboard",
      description: "Real-time insights and analytics",
      icon: BarChart,
      link: "/dashboard"
    },
    {
      name: "Transaction Management",
      description: "Track income and expenses effortlessly",
      icon: CreditCard,
      link: "/transactions"
    },
    {
      name: "Financial Forecast",
      description: "AI-powered predictions and trends",
      icon: TrendingUp,
      link: "/forecast"
    },
    {
      name: "Advanced Reports",
      description: "Comprehensive financial statements",
      icon: FileText,
      link: "/reports"
    },
    {
      name: "Payroll Management",
      description: "Streamlined employee payments",
      icon: Calculator,
      link: "/payroll"
    },
    {
      name: "Expense Analytics",
      description: "Category breakdowns and insights",
      icon: PieChart,
      link: "/forecast"
    }
  ];

  const trustBadges = [
    { icon: Shield, label: 'Bank-Level 256-bit Security' },
    { icon: TrendingUp, label: '50,000+ Businesses & Growing' },
    { icon: Sparkles, label: 'AI That Never Sleeps' },
  ];

  return (
    <section className="relative pt-24 pb-16 lg:pb-24 overflow-hidden">
      {/* Animated mesh background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-primary/8 rounded-full blur-3xl floating-animation" />
        <div className="absolute top-40 right-[15%] w-64 h-64 bg-accent/6 rounded-full blur-3xl floating-animation" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-[30%] w-56 h-56 bg-info/5 rounded-full blur-3xl floating-animation" style={{ animationDelay: '4s' }} />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.015]" 
          style={{ backgroundImage: 'radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
        />
      </div>
      
      <div className="container mx-auto px-4 pt-12 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <Link
            to="/auth?action=signup"
            className="inline-flex items-center gap-2 rounded-full bg-primary/5 dark:bg-primary/10 backdrop-blur-sm border border-primary/15 px-5 py-2.5 text-sm font-medium text-primary mb-8 animate-fade-up hover:bg-primary/15 hover:scale-105 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>🔥 Trusted by 50,000+ Businesses — Join Them Today</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-[1.1] animate-fade-up" style={{ animationDelay: '0.05s' }}>
            Stop <span className="gradient-text-hero">Losing Money</span> to{" "}
            <br className="hidden sm:block" />
            Bad Accounting.{" "}
            <br className="hidden sm:block" />
            <span className="gradient-text-hero">Start Growing</span> Today.
          </h1>
          
          {/* Subhead */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: '0.1s' }}>
            2K AI Accounting Systems turns chaos into clarity — AI that does your bookkeeping, forecasts your cash flow, and saves you <span className="font-semibold text-foreground">40+ hours every month</span>. Your competitors are already using it.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <Button asChild size="lg" className="rounded-full px-8 py-6 text-base font-semibold hero-glow bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 border-0 shadow-elegant transition-all duration-400 hover:shadow-float hover:scale-[1.02]">
              <Link to="/auth?action=signup">
                🚀 Subscribe Now — It's Free to Start
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 py-6 text-base font-medium bg-background/60 backdrop-blur-md border-border/60 hover:bg-background/80 hover:border-primary/30 transition-all duration-400 group"
                >
                  <Play className="mr-2 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                  Explore Features
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[420px] p-0 bg-background/95 backdrop-blur-xl border-border/50 shadow-float animate-scale-in rounded-2xl" 
                align="center"
                sideOffset={12}
              >
                <div className="p-6">
                  <div className="flex items-center mb-5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mr-3">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">Key Features</h3>
                      <p className="text-xs text-muted-foreground">Everything you need in one platform</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 stagger-children">
                    {features.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <Link
                          key={feature.name}
                          to={feature.link}
                          className="group p-3 rounded-xl hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-300"
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/8 dark:bg-primary/15 group-hover:bg-primary/15 dark:group-hover:bg-primary/25 flex items-center justify-center transition-colors duration-300">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                                {feature.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {feature.description}
                              </p>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button
                      asChild
                      variant="ghost"
                      className="w-full text-sm hover:bg-primary/5 rounded-xl"
                      onClick={() => {
                        setIsOpen(false);
                        featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <a href="#features">
                        View All Features
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 animate-fade-up" style={{ animationDelay: '0.25s' }}>
            {trustBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div key={badge.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="w-4 h-4 text-primary/70" />
                  <span>{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Hero Image Slider with floating UI cards */}
        <div className="mt-16 lg:mt-20 max-w-5xl mx-auto animate-fade-up relative" style={{ animationDelay: '0.3s' }}>
          {/* Auto-sliding hero carousel */}
          <HeroImageSlider />

          {/* Floating decoration cards */}
          <div className="absolute -top-4 -right-4 lg:-right-8 bg-white/90 dark:bg-card/90 backdrop-blur-md rounded-xl p-3 shadow-card-hover border border-border/30 floating-animation hidden lg:block" style={{ animationDelay: '1s' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-xs font-medium">Cash Flow</p>
                <p className="text-xs text-success font-semibold">+42% ↑</p>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-4 -left-4 lg:-left-8 bg-white/90 dark:bg-card/90 backdrop-blur-md rounded-xl p-3 shadow-card-hover border border-border/30 floating-animation hidden lg:block" style={{ animationDelay: '1.5s' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium">AI Analysis</p>
                <p className="text-xs text-primary font-semibold">Real-time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
