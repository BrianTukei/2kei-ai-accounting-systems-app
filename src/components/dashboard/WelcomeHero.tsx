import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function WelcomeHero() {
  return (
    <section className="mb-8 animate-fade-up">
      <div className="container mx-auto px-4">
        <div className="rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-3">
              <Sparkles className="w-4 h-4" /> Welcome back — great to see you!
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Focus on growth — we handle the numbers.
            </h2>
            <p className="text-sm text-muted-foreground">
              Your dashboard now surfaces the most important insights: cash flow, recent activity, and quick actions to keep your books up-to-date. Let’s make smarter financial decisions together.
            </p>
          </div>

          <div className="flex-shrink-0">
            <Button asChild size="lg" className="rounded-full px-6 py-3 bg-gradient-primary shadow-elegant">
              <Link to="/reports">
                View Reports
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
