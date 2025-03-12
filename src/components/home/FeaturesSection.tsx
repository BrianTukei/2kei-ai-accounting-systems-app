
import { forwardRef } from 'react';
import { CreditCard, BarChart3, DollarSign, Lock, Smartphone, Zap } from 'lucide-react';

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
    <section id="features" ref={ref} className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-on-scroll opacity-0">
            Designed for Financial Clarity
          </h2>
          <p className="text-lg text-slate-600 animate-on-scroll opacity-0">
            Everything you need to manage your business finances, organized in one clean interface.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            
            return (
              <div 
                key={index} 
                className="glass-card p-6 hover-lift animate-on-scroll opacity-0"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
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
