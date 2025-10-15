
import { forwardRef } from 'react';
import { CreditCard, BarChart3, DollarSign, Lock, Smartphone, Zap } from 'lucide-react';
import featuresBg from '@/assets/features-bg.jpg';

const features = [
  {
    icon: CreditCard,
    title: "Transaction Management",
    description: "Record and categorize income and expenses with detailed transaction tracking."
  },
  {
    icon: BarChart3,
    title: "Visual Reports",
    description: "Generate beautiful charts and reports to visualize your financial health."
  },
  {
    icon: DollarSign,
    title: "Cash Flow Monitoring",
    description: "Keep track of your cash flow with real-time updates and projections."
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description: "Access your finances on any device with our responsive design."
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Your financial data is encrypted and secured with enterprise-grade protection."
  },
  {
    icon: Zap,
    title: "Fast & Efficient",
    description: "Optimized performance ensures quick access to your financial information."
  }
];

const FeaturesSection = forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <section id="features" ref={ref} className="py-20 relative overflow-hidden">
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
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-on-scroll opacity-0">
            Why <span className="gradient-text">Smart Businesses Choose</span> 2KÉI Ledgerly
          </h2>
          <p className="text-lg text-muted-foreground animate-on-scroll opacity-0">
            While others waste time with complicated software, you'll have everything you need in one powerful, intuitive platform. <span className="font-semibold text-primary">This is why we're the industry leader.</span>
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
      </div>
    </section>
  );
});

FeaturesSection.displayName = 'FeaturesSection';

export default FeaturesSection;
