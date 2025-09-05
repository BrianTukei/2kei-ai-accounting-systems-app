
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowRight, Sparkles, TrendingUp, ChevronDown, BarChart, CreditCard, FileText, Calculator, PieChart, Target } from 'lucide-react';
import dashboardHero from '@/assets/dashboard-hero.jpg';

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
            
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 py-6 text-base bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300"
                >
                  Explore Features
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-96 p-0 glass-card border-white/20 shadow-elegant animate-scale-in" 
                align="center"
                sideOffset={12}
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <Target className="h-5 w-5 text-primary mr-2" />
                    <h3 className="font-semibold text-lg gradient-text">Key Features</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {features.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <Link
                          key={feature.name}
                          to={feature.link}
                          className="group p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 hover-lift"
                          onClick={() => setIsOpen(false)}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                {feature.name}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {feature.description}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button
                      asChild
                      variant="ghost"
                      className="w-full text-sm hover:bg-primary/10"
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
