/**
 * AdminAnalyticsCharts.tsx
 * ────────────────────────
 * Revenue, growth, and distribution charts for the admin dashboard.
 * Uses Recharts (already available via OverviewChart dependency).
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { PlatformUser, OrgRow } from '@/services/adminService';
import { PLANS } from '@/lib/plans';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ─────────────────────────────────────────
// User Growth Chart (bar chart using CSS)
// ─────────────────────────────────────────

interface UserGrowthChartProps {
  users: PlatformUser[];
  months?: number;
}

export function UserGrowthChart({ users, months = 6 }: UserGrowthChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const data: { month: string; count: number; label: string }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const count = users.filter(u => {
        const created = new Date(u.created_at);
        return created >= d && created <= monthEnd;
      }).length;

      data.push({ month: key, count, label });
    }
    return data;
  }, [users, months]);

  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  const currentMonth = chartData[chartData.length - 1]?.count ?? 0;
  const prevMonth = chartData[chartData.length - 2]?.count ?? 0;
  const growthPct = prevMonth > 0
    ? Math.round(((currentMonth - prevMonth) / prevMonth) * 100)
    : currentMonth > 0 ? 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">User Growth</CardTitle>
            <CardDescription>New signups per month</CardDescription>
          </div>
          <div className="flex items-center gap-1 text-sm">
            {growthPct > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : growthPct < 0 ? (
              <TrendingDown className="w-4 h-4 text-red-500" />
            ) : (
              <Minus className="w-4 h-4 text-slate-400" />
            )}
            <span className={cn(
              'font-semibold',
              growthPct > 0 ? 'text-green-600' : growthPct < 0 ? 'text-red-600' : 'text-slate-500'
            )}>
              {growthPct > 0 ? '+' : ''}{growthPct}%
            </span>
            <span className="text-xs text-slate-400 ml-1">vs last month</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-40 mt-2">
          {chartData.map((d) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{d.count}</span>
              <div className="w-full relative bg-slate-100 dark:bg-slate-800 rounded-t-md overflow-hidden"
                   style={{ height: '100%' }}>
                <div
                  className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-t-md transition-all duration-500"
                  style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }}
                />
              </div>
              <span className="text-[10px] text-slate-400">{d.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Revenue Breakdown Chart
// ─────────────────────────────────────────

interface RevenueBreakdownProps {
  orgs: OrgRow[];
}

const MRR_BY_PLAN: Record<string, number> = { free: 0, pro: 29, enterprise: 79 };

export function RevenueBreakdownChart({ orgs }: RevenueBreakdownProps) {
  const breakdown = useMemo(() => {
    const plans = ['free', 'pro', 'enterprise'] as const;
    return plans.map(planId => {
      const activeOrgs = orgs.filter(o =>
        o.plan_id === planId && ['active', 'trialing'].includes(o.sub_status)
      );
      return {
        plan: planId,
        name: PLANS[planId]?.name ?? planId,
        count: activeOrgs.length,
        mrr: activeOrgs.length * (MRR_BY_PLAN[planId] ?? 0),
        color: planId === 'free' ? 'bg-slate-400' : planId === 'pro' ? 'bg-indigo-500' : 'bg-purple-500',
        textColor: planId === 'free' ? 'text-slate-600' : planId === 'pro' ? 'text-indigo-600' : 'text-purple-600',
      };
    });
  }, [orgs]);

  const totalMRR = breakdown.reduce((sum, b) => sum + b.mrr, 0);
  const totalOrgs = breakdown.reduce((sum, b) => sum + b.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Revenue Breakdown</CardTitle>
        <CardDescription>Monthly recurring revenue by plan</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          ${totalMRR.toLocaleString()}<span className="text-sm font-normal text-slate-400">/mo</span>
        </div>

        {/* Stacked bar */}
        <div className="h-4 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 mb-4">
          {breakdown.map(b => {
            const pct = totalOrgs > 0 ? (b.count / totalOrgs) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={b.plan}
                className={cn('h-full transition-all', b.color)}
                style={{ width: `${pct}%` }}
                title={`${b.name}: ${b.count} orgs ($${b.mrr}/mo)`}
              />
            );
          })}
        </div>

        <div className="space-y-3">
          {breakdown.map(b => (
            <div key={b.plan} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded-full', b.color)} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{b.name}</span>
                <span className="text-xs text-slate-400">({b.count} orgs)</span>
              </div>
              <span className={cn('text-sm font-semibold', b.textColor)}>
                ${b.mrr.toLocaleString()}/mo
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Subscription Status Distribution
// ─────────────────────────────────────────

interface SubStatusChartProps {
  statusCounts: Record<string, number>;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-green-500', text: 'text-green-700' },
  trialing: { bg: 'bg-blue-500', text: 'text-blue-700' },
  past_due: { bg: 'bg-red-500', text: 'text-red-700' },
  canceled: { bg: 'bg-slate-400', text: 'text-slate-600' },
  paused: { bg: 'bg-amber-500', text: 'text-amber-700' },
  suspended: { bg: 'bg-red-600', text: 'text-red-800' },
};

export function SubscriptionStatusChart({ statusCounts }: SubStatusChartProps) {
  const entries = Object.entries(statusCounts).sort(([, a], [, b]) => b - a);
  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Subscription Status</CardTitle>
        <CardDescription>Distribution across all organizations</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Donut-style horizontal bars */}
        <div className="space-y-3">
          {entries.map(([status, count]) => {
            const pct = Math.round((count / total) * 100);
            const colors = STATUS_COLORS[status] ?? { bg: 'bg-slate-300', text: 'text-slate-600' };
            return (
              <div key={status}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm capitalize text-slate-700 dark:text-slate-300">{status.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-semibold', colors.text)}>{count}</span>
                    <span className="text-xs text-slate-400">({pct}%)</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', colors.bg)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Activity Timeline
// ─────────────────────────────────────────

interface ActivityTimelineProps {
  users: PlatformUser[];
}

export function ActivityTimeline({ users }: ActivityTimelineProps) {
  const hourlyActivity = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, signups: 0, logins: 0 }));
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    users.forEach(u => {
      const created = new Date(u.created_at);
      if (created >= dayStart) {
        hours[created.getHours()].signups++;
      }
      if (u.last_sign_in_at) {
        const login = new Date(u.last_sign_in_at);
        if (login >= dayStart) {
          hours[login.getHours()].logins++;
        }
      }
    });

    return hours;
  }, [users]);

  const maxActivity = Math.max(
    ...hourlyActivity.map(h => h.signups + h.logins),
    1,
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Today's Activity</CardTitle>
        <CardDescription>Signups and logins by hour (UTC)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-[2px] h-24">
          {hourlyActivity.map((h) => {
            const total = h.signups + h.logins;
            const height = (total / maxActivity) * 100;
            const signupPct = total > 0 ? (h.signups / total) * 100 : 0;
            return (
              <div
                key={h.hour}
                className="flex-1 relative rounded-t-sm overflow-hidden cursor-default"
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${String(h.hour).padStart(2, '0')}:00 — ${h.signups} signups, ${h.logins} logins`}
              >
                <div className="absolute bottom-0 left-0 right-0 bg-green-400" style={{ height: `${signupPct}%` }} />
                <div className="absolute top-0 left-0 right-0 bg-blue-400" style={{ height: `${100 - signupPct}%` }} />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-slate-400">00:00</span>
          <span className="text-[10px] text-slate-400">12:00</span>
          <span className="text-[10px] text-slate-400">23:00</span>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-green-400" /> Signups
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-blue-400" /> Logins
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Verification Rate Gauge
// ─────────────────────────────────────────

interface VerificationGaugeProps {
  verified: number;
  total: number;
}

export function VerificationGauge({ verified, total }: VerificationGaugeProps) {
  const pct = total > 0 ? Math.round((verified / total) * 100) : 0;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Email Verification</CardTitle>
        <CardDescription>Proportion of verified accounts</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor"
              className="text-slate-100 dark:text-slate-800" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none"
              className="text-green-500" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{pct}%</span>
            <span className="text-[10px] text-slate-400">verified</span>
          </div>
        </div>
        <div className="ml-4 space-y-1">
          <div className="text-sm"><span className="font-semibold text-green-600">{verified}</span> <span className="text-slate-400">verified</span></div>
          <div className="text-sm"><span className="font-semibold text-red-500">{total - verified}</span> <span className="text-slate-400">pending</span></div>
          <div className="text-sm"><span className="font-semibold text-slate-700 dark:text-slate-300">{total}</span> <span className="text-slate-400">total</span></div>
        </div>
      </CardContent>
    </Card>
  );
}
