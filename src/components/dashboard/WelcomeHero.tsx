import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, BarChart3, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function WelcomeHero() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [userName, setUserName] = useState('');
  const [adminMessage, setAdminMessage] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get user's name from metadata or email
  useEffect(() => {
    const getName = async () => {
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(' ')[0]);
      } else if (user?.email) {
        setUserName(user.email.split('@')[0]);
      }
    };
    getName();
  }, [user]);

  // Fetch latest admin message for this user
  useEffect(() => {
    const fetchAdminMessage = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('admin_messages')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data && !error) {
          setAdminMessage(data);
        }
      } catch (error) {
        // No message available
      }
    };

    fetchAdminMessage();
    const interval = setInterval(fetchAdminMessage, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  // Update time for greeting
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '🌅 Good morning';
    if (hour < 18) return '☀️ Good afternoon';
    return '🌙 Good evening';
  };

  return (
    <section className="mb-6 animate-fade-up space-y-4">
      {/* Admin Message Banner */}
      {adminMessage && (
        <div className="container mx-auto px-4">
          <div className="rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">{adminMessage.title}</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">{adminMessage.message}</p>
                {adminMessage.link && (
                  <Link to={adminMessage.link} className="text-sm font-semibold text-blue-600 dark:text-blue-300 hover:underline mt-2 inline-block">
                    Learn more →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personalized Welcome */}
      <div className="container mx-auto px-4">
        <div className="relative rounded-2xl overflow-hidden">
          {/* Mesh gradient background */}
          <div className="absolute inset-0 bg-mesh" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/3 to-primary/5" />
          
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 dark:bg-primary/15 border border-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                {getGreeting()}, {userName || 'there'}!
              </div>

              <h2 className="text-xl md:text-2xl font-bold mb-2 tracking-tight">
                {organization?.name ? `Welcome to ${organization.name}` : 'Focus on growth. We handle the numbers.'}
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
