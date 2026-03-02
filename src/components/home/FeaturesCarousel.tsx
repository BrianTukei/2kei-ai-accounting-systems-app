import { forwardRef } from 'react';
import { CreditCard, BarChart3, DollarSign, Lock, Smartphone, Zap } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';

const features = [
  {
    icon: CreditCard,
    title: "Transaction Management",
    description: "Record and categorize income and expenses with detailed transaction tracking. Organize your finances with smart categorization and powerful search capabilities.",
    color: 'from-blue-500/10 to-indigo-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: BarChart3,
    title: "Visual Reports",
    description: "Generate beautiful charts and reports to visualize your financial health. Interactive dashboards show trends, patterns, and insights at a glance.",
    color: 'from-violet-500/10 to-purple-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    icon: DollarSign,
    title: "Cash Flow Monitoring",
    description: "Keep track of your cash flow with real-time updates and projections. Forecast future cash positions and identify potential issues before they arise.",
    color: 'from-emerald-500/10 to-green-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description: "Access your finances on any device with our responsive design. Full functionality on desktop, tablet, and mobile with seamless synchronization.",
    color: 'from-cyan-500/10 to-sky-500/10',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Your financial data is encrypted and secured with enterprise-grade protection. Bank-level security ensures your information stays private and safe.",
    color: 'from-amber-500/10 to-orange-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    icon: Zap,
    title: "Fast & Efficient",
    description: "Optimized performance ensures quick access to your financial information. Lightning-fast loading times and smooth navigation keep you productive.",
    color: 'from-rose-500/10 to-pink-500/10',
    iconColor: 'text-rose-600 dark:text-rose-400',
  }
];

const FeaturesCarousel = forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <section id="features" ref={ref} className="py-16 lg:py-24 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 z-0 bg-mesh opacity-50" />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-background via-transparent to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 dark:bg-primary/10 border border-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-6 animate-fade-up">
            PLATFORM FEATURES
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 tracking-tight animate-fade-up" style={{ animationDelay: '0.05s' }}>
            Why <span className="gradient-text">50,000+ Businesses</span> Trust Us
          </h2>
          <p className="text-base md:text-lg text-muted-foreground animate-fade-up max-w-2xl mx-auto leading-relaxed" style={{ animationDelay: '0.1s' }}>
            Every feature is designed to put money back in your pocket. No bloat, no complexity — just results.
          </p>
        </div>
        
        {/* Desktop Grid Layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 mb-8 stagger-children">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            
            return (
              <div 
                key={index} 
                className="fintech-card p-7 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-400`}>
                  <Icon className={`h-5 w-5 ${feature.iconColor} transition-colors duration-300`} />
                </div>
                <h3 className="text-lg font-semibold mb-2.5 text-foreground group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Mobile/Tablet Carousel Layout */}
        <div className="lg:hidden">
          <Carousel 
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-4xl mx-auto"
          >
            <CarouselContent>
              {features.map((feature, index) => {
                const Icon = feature.icon;
                
                return (
                  <CarouselItem key={index} className="md:basis-1/2">
                    <div className="p-2">
                      <div className="fintech-card p-6 group h-full">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-400`}>
                          <Icon className={`h-5 w-5 ${feature.iconColor} transition-colors duration-300`} />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </div>

        {/* Feature Indicators */}
        <div className="flex justify-center mt-8 lg:hidden">
          <div className="flex space-x-2">
            {features.map((_, index) => (
              <div key={index} className="w-2 h-2 rounded-full bg-primary/20"></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

FeaturesCarousel.displayName = 'FeaturesCarousel';

export default FeaturesCarousel;