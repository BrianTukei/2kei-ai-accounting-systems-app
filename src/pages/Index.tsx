
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, CreditCard, DollarSign, Lock, Smartphone, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function Index() {
  const featuresRef = useRef<HTMLDivElement>(null);

  // Animation for elements as they come into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-up');
            entry.target.classList.remove('opacity-0');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-radial from-blue-50 to-transparent opacity-70" />
        </div>
        
        <div className="container mx-auto px-4 pt-12 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 mb-8 animate-fade-in">
              Simplified Cash Management
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight animate-fade-up">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
                Smart Accounting
              </span>{" "}
              for Your Business
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Ledgerly streamlines your financial workflow with intuitive tools for tracking income, expenses, and generating reports—all in one beautifully designed platform.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <Button asChild size="lg" className="rounded-full px-8 py-6 text-base">
                <Link to="/auth?action=signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full px-8 py-6 text-base"
                onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
              >
                <a href="#features">Explore Features</a>
              </Button>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="mt-16 max-w-5xl mx-auto animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="glass-card overflow-hidden">
              <img
                src="https://placehold.co/1200x675/f8fafc/a3a3a3?text=Dashboard+Preview"
                alt="Ledgerly Dashboard"
                className="w-full h-auto rounded-lg shadow-glass-lg"
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" ref={featuresRef} className="py-20 bg-white">
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
            {[
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
            ].map((feature, index) => (
              <div 
                key={index} 
                className="glass-card p-6 hover-lift animate-on-scroll opacity-0"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-on-scroll opacity-0">
              Ready to simplify your accounting?
            </h2>
            <p className="text-lg text-slate-600 mb-8 animate-on-scroll opacity-0">
              Join thousands of businesses that use Ledgerly to manage their finances effortlessly.
            </p>
            <Button asChild size="lg" className="rounded-full px-8 py-6 text-base animate-on-scroll opacity-0">
              <Link to="/auth?action=signup">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-white py-12 border-t border-slate-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <span className="font-semibold text-lg">Ledgerly</span>
              </Link>
              <p className="text-sm text-slate-500 mt-2">
                © {new Date().getFullYear()} Ledgerly. All rights reserved.
              </p>
            </div>
            
            <div className="flex space-x-8">
              <Link to="#" className="text-slate-600 hover:text-primary text-sm">
                Terms
              </Link>
              <Link to="#" className="text-slate-600 hover:text-primary text-sm">
                Privacy
              </Link>
              <Link to="#" className="text-slate-600 hover:text-primary text-sm">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
