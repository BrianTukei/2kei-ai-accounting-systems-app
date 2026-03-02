import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, BarChart3 } from 'lucide-react';

export default function WelcomeHero() {
  return (
    <section className="mb-6 animate-fade-up">
      <div className="container mx-auto px-4">
        <div className="relative rounded-2xl overflow-hidden">
          {/* Mesh gradient background */}
          <div className="absolute inset-0 bg-mesh" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/3 to-primary/5" />
          
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 dark:bg-primary/15 border border-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Welcome back
              </div>

              <h2 className="text-xl md:text-2xl font-bold mb-2 tracking-tight">
                Focus on growth. We handle the numbers.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                Your dashboard surfaces the most important insights: cash flow, activity, and quick actions to keep your books current.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Button asChild variant="outline" size="default" className="rounded-full px-5 border-border/60 hover:border-primary/30 transition-all duration-300">
                <Link to="/transactions">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Transactions
                </Link>
              </Button>
              <Button asChild size="default" className="rounded-full px-5 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 border-0 shadow-elegant transition-all duration-400 hover:shadow-float hover:scale-[1.02]">
                <Link to="/reports">
                  View Reports
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
