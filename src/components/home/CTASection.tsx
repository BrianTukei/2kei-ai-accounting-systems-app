
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
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
  );
};

export default CTASection;
