/**
 * Admin panel: demo requests + notification list
 * Loads via API first; falls back to direct Supabase if API returns 401/403.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Bell, Check, Loader2, RefreshCw } from 'lucide-react';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

type DemoRequest = {
  id: string;
  full_name: string;
  email: string;
  company?: string;
  phone?: string;
  preferred_date?: string;
  preferred_time?: string;
  message?: string;
  status: string;
  created_at: string;
};

type AdminNotification = {
  id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  read_at?: string | null;
  created_at: string;
};

export default function AdminDemoNotifications() {
  const [tab, setTab] = useState<'alerts' | 'demos'>('alerts');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [demos, setDemos] = useState<DemoRequest[]>([]);

  const loadFromSupabase = async () => {
    const [nRes, dRes] = await Promise.all([
      supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('demo_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
    ]);
    if (nRes.error) throw nRes.error;
    if (dRes.error) throw dRes.error;
    setNotifications((nRes.data as AdminNotification[]) || []);
    setDemos((dRes.data as DemoRequest[]) || []);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await authHeaders();
      if (!headers) {
        // No session token — try Supabase client session
        await loadFromSupabase();
        return;
      }

      const [nRes, dRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/notifications`, { headers }),
        fetch(`${API_BASE}/api/demo-requests`, { headers }),
      ]);

      if (nRes.status === 401 || nRes.status === 403 || dRes.status === 401 || dRes.status === 403) {
        // API auth failed — fall back to direct Supabase (RLS)
        await loadFromSupabase();
        return;
      }

      const nJson = await nRes.json();
      const dJson = await dRes.json();
      if (!nRes.ok) throw new Error(nJson.error || nJson.message || 'Failed to load notifications');
      if (!dRes.ok) throw new Error(dJson.error || dJson.message || 'Failed to load demos');
      setNotifications(nJson.data || []);
      setDemos(dJson.data || []);
    } catch (err: any) {
      console.error(err);
      try {
        await loadFromSupabase();
      } catch (e2: any) {
        toast.error(e2.message || err.message || 'Load failed');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const unread = notifications.filter((n) => !n.read_at).length;

  const markRead = async (id: string) => {
    const headers = await authHeaders();
    if (headers) {
      await fetch(`${API_BASE}/api/admin/notifications/${id}/read`, {
        method: 'POST',
        headers,
      });
    }
    await supabase
      .from('admin_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
  };

  const markAll = async () => {
    const headers = await authHeaders();
    if (headers) {
      await fetch(`${API_BASE}/api/admin/notifications/read-all`, {
        method: 'POST',
        headers,
      });
    }
    await supabase
      .from('admin_notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
    toast.success('All marked read');
  };

  const setStatus = async (id: string, status: string) => {
    const headers = await authHeaders();
    let ok = false;
    if (headers) {
      const res = await fetch(`${API_BASE}/api/demo-requests/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      });
      ok = res.ok;
    }
    if (!ok) {
      const { error } = await supabase
        .from('demo_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) {
        toast.error(error.message);
        return;
      }
    }
    setDemos((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
    toast.success(`Marked ${status}`);
  };

  return (
    <div className="space-y-4 p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Demo alerts</h2>
          {unread > 0 && <Badge variant="destructive">{unread} new</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={tab === 'alerts' ? 'default' : 'outline'}
          onClick={() => setTab('alerts')}
        >
          Notifications
        </Button>
        <Button
          size="sm"
          variant={tab === 'demos' ? 'default' : 'outline'}
          onClick={() => setTab('demos')}
        >
          Demo requests ({demos.length})
        </Button>
      </div>

      {tab === 'alerts' && (
        <div className="space-y-2">
          {unread > 0 && (
            <Button size="sm" variant="ghost" onClick={markAll}>
              <Check className="h-4 w-4 mr-1" /> Mark all read
            </Button>
          )}
          {notifications.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No notifications yet. Submit a test from /book-demo.
            </p>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg border p-3 ${
                n.read_at ? 'opacity-60' : 'border-primary/40 bg-primary/5'
              }`}
            >
              <div className="flex justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{n.title}</p>
                  {n.body && (
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap mt-1 font-sans">
                      {n.body}
                    </pre>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                {!n.read_at && (
                  <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                    Mark read
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'demos' && (
        <div className="space-y-3">
          {demos.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No demo requests yet. Public form: /book-demo
            </p>
          )}
          {demos.map((d) => (
            <div key={d.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div>
                  <p className="font-medium">{d.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {d.email}
                    {d.company ? ` · ${d.company}` : ''}
                  </p>
                </div>
                <Badge>{d.status}</Badge>
              </div>
              {(d.preferred_date || d.message) && (
                <p className="text-sm text-muted-foreground">
                  {d.preferred_date && (
                    <>
                      Preferred: {d.preferred_date} {d.preferred_time || ''}
                      <br />
                    </>
                  )}
                  {d.message}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {['contacted', 'scheduled', 'completed', 'cancelled'].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant="outline"
                    disabled={d.status === s}
                    onClick={() => setStatus(d.id, s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
