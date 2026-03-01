import { forwardRef } from 'react';
import { CreditCard, BarChart3, DollarSign, Lock, Smartphone, Zap } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';

// High-quality Unsplash image - Abstract data visualization
const featuresBg = 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1600&q=80&auto=format&fit=crop';

const features = [
  {
    icon: CreditCard,
    title: "Transaction Management",
    description: "Record and categorize income and expenses with detailed transaction tracking. Organize your finances with smart categorization and powerful search capabilities."
  },
  {
    icon: BarChart3,
    title: "Visual Reports",
    description: "Generate beautiful charts and reports to visualize your financial health. Interactive dashboards show trends, patterns, and insights at a glance."
  },
  {
    icon: DollarSign,
    title: "Cash Flow Monitoring",
    description: "Keep track of your cash flow with real-time updates and projections. Forecast future cash positions and identify potential issues before they arise."
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description: "Access your finances on any device with our responsive design. Full functionality on desktop, tablet, and mobile with seamless synchronization."
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Your financial data is encrypted and secured with enterprise-grade protection. Bank-level security ensures your information stays private and safe."
  },
  {
    icon: Zap,
    title: "Fast & Efficient",
    description: "Optimized performance ensures quick access to your financial information. Lightning-fast loading times and smooth navigation keep you productive."
  }
];

const FeaturesCarousel = forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <section id="features" ref={ref} className="py-10 relative overflow-hidden">
      {/* Background with image overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={featuresBg} 
          alt="Financial data visualization background" 
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-on-scroll opacity-0">
            Why <span className="gradient-text">Smart Businesses Choose</span> 2K AI Accounting Systems
          </h2>
          <p className="text-lg text-muted-foreground animate-on-scroll opacity-0 mb-8">
            While others waste time with complicated software, you'll have everything you need in one powerful, intuitive platform. <span className="font-semibold text-primary">This is why we're the industry leader.</span>
          </p>
          <p className="text-sm text-muted-foreground/80 animate-on-scroll opacity-0 flex items-center justify-center gap-2">
            <kbd className="px-2 py-1 text-xs bg-muted rounded">←</kbd>
            <span>Use arrow keys or buttons to navigate features</span>
            <kbd className="px-2 py-1 text-xs bg-muted rounded">→</kbd>
          </p>
        </div>
        
        {/* Desktop Grid Layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8 mb-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            
            return (
              <div 
                key={index} 
                className="glass-card glass-card-hover p-6 hover-lift animate-on-scroll opacity-0 group"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="h-6 w-6 text-primary group-hover:text-accent transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
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
                      <div className="glass-card glass-card-hover p-6 hover-lift group h-full">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                          <Icon className="h-6 w-6 text-primary group-hover:text-accent transition-colors duration-300" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
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