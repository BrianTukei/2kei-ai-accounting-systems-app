/**
 * Admin Demo alerts — reads the same `demo_bookings` table that
 * /book-demo (edge function book-demo) writes to.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Bell, Loader2, RefreshCw } from 'lucide-react';

type DemoBooking = {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
  company?: string;
  company_name?: string;
  phone?: string;
  preferred_date?: string;
  preferred_time?: string;
  message?: string;
  status: string;
  source?: string;
  created_at: string;
};

function displayName(d: DemoBooking) {
  return d.name || d.full_name || 'Unknown';
}

function displayCompany(d: DemoBooking) {
  return d.company || d.company_name || '';
}

export default function AdminDemoNotifications() {
  const [loading, setLoading] = useState(true);
  const [demos, setDemos] = useState<DemoBooking[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('demo_bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setDemos((data as DemoBooking[]) || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load demo bookings');
      setDemos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('demo_bookings_admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demo_bookings' },
        () => load()
      )
      .subscribe();

    const t = setInterval(load, 60_000);
    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, [load]);

  const pending = demos.filter(
    (d) => !d.status || d.status === 'pending' || d.status === 'new'
  ).length;

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('demo_bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error(error.message);
      return;
    }
    setDemos((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
    toast.success(`Marked ${status}`);
  };

  return (
    <div className="space-y-4 p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Demo requests</h2>
          {pending > 0 && (
            <Badge variant="destructive">{pending} pending</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Same bookings as submitted on <code className="text-xs">/book-demo</code>.
      </p>

      {loading && demos.length === 0 && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && demos.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No demo bookings found in <code className="text-xs">demo_bookings</code>.
          If you just booked, tap refresh — or check Admin → Demo Bookings tab.
        </p>
      )}

      <div className="space-y-3">
        {demos.map((d) => (
          <div key={d.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div>
                <p className="font-medium">{displayName(d)}</p>
                <p className="text-sm text-muted-foreground">
                  {d.email}
                  {displayCompany(d) ? ` · ${displayCompany(d)}` : ''}
                  {d.phone ? ` · ${d.phone}` : ''}
                </p>
              </div>
              <Badge>{d.status || 'pending'}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {d.preferred_date && (
                <>
                  Preferred: {d.preferred_date}
                  {d.preferred_time ? ` ${String(d.preferred_time).slice(0, 5)}` : ''}
                  <br />
                </>
              )}
              {d.message}
            </p>
            <p className="text-xs text-muted-foreground">
              Booked {new Date(d.created_at).toLocaleString()}
              {d.source ? ` · ${d.source}` : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              {['pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="outline"
                  disabled={(d.status || 'pending') === s}
                  onClick={() => setStatus(d.id, s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
