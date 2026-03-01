/**
 * DevAdminLoginAudit.tsx
 * ═════════════════════
 * Login audit history for Developer Admin Dashboard
 * Features:
 *   - View login/logout events
 *   - Filter by user, event type, date range
 *   - Geolocation info
 *   - Device/browser info
 *   - Export audit log
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LogIn,
  LogOut,
  UserPlus,
  RefreshCw,
  Shield,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Globe,
  Monitor,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface AuthEvent {
  id: string;
  user_id: string;
  user_email?: string;
  event_type: 'login' | 'logout' | 'signup' | 'password_reset' | 'failed_login' | 'token_refresh';
  ip_address?: string;
  user_agent?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

// ─────────────────────────────────────────
// Audit Service
// ─────────────────────────────────────────

const AuditService = {
  async getAuthEvents(params: {
    search?: string;
    eventType?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{ events: AuthEvent[]; total: number }> {
    const limit = params.limit || 50;
    const offset = ((params.page || 1) - 1) * limit;

    const sb = supabase as any;
    let query = sb
      .from('auth_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (params.eventType && params.eventType !== 'all') {
      query = query.eq('event_type', params.eventType);
    }

    if (params.startDate) {
      query = query.gte('created_at', params.startDate);
    }

    if (params.endDate) {
      query = query.lte('created_at', params.endDate);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching auth events:', error);
      return { events: [], total: 0 };
    }

    let events = data || [];

    // Apply search filter client-side (for email)
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      events = events.filter(
        (e: AuthEvent) =>
          e.user_email?.toLowerCase().includes(searchLower) ||
          e.user_id?.toLowerCase().includes(searchLower) ||
          e.ip_address?.includes(params.search!)
      );
    }

    return {
      events,
      total: count || 0,
    };
  },

  parseUserAgent(ua?: string): { device: string; browser: string; os: string } {
    if (!ua) return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' };

    // Simple UA parser
    let device = 'desktop';
    let browser = 'Unknown';
    let os = 'Unknown';

    // Device detection
    if (/mobile/i.test(ua)) device = 'mobile';
    else if (/tablet|ipad/i.test(ua)) device = 'tablet';

    // Browser detection
    if (/chrome/i.test(ua)) browser = 'Chrome';
    else if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua)) browser = 'Safari';
    else if (/edge/i.test(ua)) browser = 'Edge';
    else if (/opera|opr/i.test(ua)) browser = 'Opera';

    // OS detection
    if (/windows/i.test(ua)) os = 'Windows';
    else if (/mac os/i.test(ua)) os = 'macOS';
    else if (/linux/i.test(ua)) os = 'Linux';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/ios|iphone|ipad/i.test(ua)) os = 'iOS';

    return { device, browser, os };
  },

  exportEvents(events: AuthEvent[]): void {
    const headers = ['Time', 'Event', 'User Email', 'IP Address', 'Browser', 'OS', 'Location'];
    const rows = events.map((e) => {
      const ua = this.parseUserAgent(e.user_agent);
      return [
        new Date(e.created_at).toISOString(),
        e.event_type,
        e.user_email || e.user_id,
        e.ip_address || 'N/A',
        ua.browser,
        ua.os,
        e.city && e.country ? `${e.city}, ${e.country}` : 'N/A',
      ];
    });

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auth-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────

const EVENT_CONFIG: Record<string, { icon: typeof LogIn; color: string; label: string }> = {
  login: { icon: LogIn, color: 'bg-emerald-500/20 text-emerald-400', label: 'Login' },
  logout: { icon: LogOut, color: 'bg-slate-500/20 text-slate-400', label: 'Logout' },
  signup: { icon: UserPlus, color: 'bg-blue-500/20 text-blue-400', label: 'Sign Up' },
  password_reset: { icon: Shield, color: 'bg-amber-500/20 text-amber-400', label: 'Password Reset' },
  failed_login: { icon: AlertTriangle, color: 'bg-red-500/20 text-red-400', label: 'Failed Login' },
  token_refresh: { icon: RefreshCw, color: 'bg-purple-500/20 text-purple-400', label: 'Token Refresh' },
};

const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Monitor,
};

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export function DevAdminLoginAudit() {
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('all');
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  const limit = 50;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'auth-events', search, eventType, page, dateRange],
    queryFn: () =>
      AuditService.getAuthEvents({
        search,
        eventType,
        page,
        limit,
        startDate: dateRange.start,
        endDate: dateRange.end,
      }),
    staleTime: 30 * 1000,
  });

  const stats = useMemo(() => {
    const events = data?.events || [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisHour = new Date(now.getTime() - 60 * 60 * 1000);

    const todayEvents = events.filter((e) => new Date(e.created_at) >= today);
    const recentEvents = events.filter((e) => new Date(e.created_at) >= thisHour);

    return {
      total: data?.total || 0,
      today: todayEvents.length,
      lastHour: recentEvents.length,
      failedLogins: events.filter((e) => e.event_type === 'failed_login').length,
    };
  }, [data]);

  const totalPages = Math.ceil((data?.total || 0) / limit);

  const handleExport = () => {
    if (data?.events) {
      AuditService.exportEvents(data.events);
    }
  };

  const getTimeAgo = (dateStr: string): string => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Login Audit History</h2>
          <p className="text-sm text-slate-400">Track user authentication events</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Total Events</p>
            <p className="text-2xl font-bold text-white">{stats.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Today</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.today}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Last Hour</p>
            <p className="text-2xl font-bold text-blue-400">{stats.lastHour}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Failed Logins</p>
            <p className="text-2xl font-bold text-red-400">{stats.failedLogins}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by email or IP..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={eventType} onValueChange={(v) => { setEventType(v); setPage(1); }}>
              <SelectTrigger className="w-[160px] bg-slate-800/50 border-slate-700 text-slate-300">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="login">Logins</SelectItem>
                <SelectItem value="logout">Logouts</SelectItem>
                <SelectItem value="signup">Sign Ups</SelectItem>
                <SelectItem value="failed_login">Failed Logins</SelectItem>
                <SelectItem value="password_reset">Password Resets</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        {/* Events Table */}
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Event</TableHead>
                <TableHead className="text-slate-400">User</TableHead>
                <TableHead className="text-slate-400">IP Address</TableHead>
                <TableHead className="text-slate-400">Device</TableHead>
                <TableHead className="text-slate-400">Location</TableHead>
                <TableHead className="text-slate-400">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Loading events...
                  </TableCell>
                </TableRow>
              ) : data?.events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No auth events found
                  </TableCell>
                </TableRow>
              ) : (
                data?.events.map((event) => {
                  const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.login;
                  const EventIcon = config.icon;
                  const ua = AuditService.parseUserAgent(event.user_agent);
                  const DeviceIcon = DEVICE_ICONS[ua.device as keyof typeof DEVICE_ICONS] || Monitor;

                  return (
                    <TableRow key={event.id} className="border-slate-800">
                      <TableCell>
                        <Badge className={cn('gap-1', config.color)}>
                          <EventIcon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                              {(event.user_email?.[0] || 'U').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-slate-200 text-sm truncate max-w-[180px]">
                            {event.user_email || event.user_id.slice(0, 8)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400 font-mono text-sm">
                        {event.ip_address || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <DeviceIcon className="w-4 h-4" />
                          <span>{ua.browser}</span>
                          <span className="text-slate-600">/</span>
                          <span>{ua.os}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.city || event.country ? (
                          <div className="flex items-center gap-1 text-slate-400 text-sm">
                            <MapPin className="w-3 h-3" />
                            {[event.city, event.country].filter(Boolean).join(', ')}
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-slate-400 text-sm">
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(event.created_at)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
              <p className="text-sm text-slate-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="border-slate-700 text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="border-slate-700 text-slate-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Feed (Compact) */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-400" />
            Live Activity Feed
          </CardTitle>
          <CardDescription className="text-slate-400">
            Most recent authentication events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {data?.events.slice(0, 15).map((event) => {
                const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.login;
                const EventIcon = config.icon;

                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50"
                  >
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', config.color)}>
                      <EventIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">
                        {event.user_email || event.user_id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {config.label} • {event.ip_address || 'Unknown IP'}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {getTimeAgo(event.created_at)}
                    </span>
                  </div>
                );
              })}
              {(!data?.events || data.events.length === 0) && (
                <p className="text-center text-slate-500 py-4">No recent activity</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default DevAdminLoginAudit;
