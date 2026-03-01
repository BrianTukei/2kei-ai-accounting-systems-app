/**
 * DevAdminCharts.tsx
 * ══════════════════
 * Interactive charts for the Developer Admin Dashboard
 * Uses Recharts for professional visualizations
 */

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface ChartDataPoint {
  month: string;
  value: number;
  [key: string]: string | number;
}

interface UserGrowthData {
  month: string;
  count: number;
}

interface RevenueData {
  month: string;
  revenue: number;
}

interface PlanDistributionData {
  plan: string;
  count: number;
  percentage: number;
}

// ─────────────────────────────────────────
// Color Constants
// ─────────────────────────────────────────

const CHART_COLORS = {
  primary: '#ef4444', // Red-500 (brand color)
  secondary: '#3b82f6', // Blue-500
  tertiary: '#10b981', // Emerald-500
  quaternary: '#8b5cf6', // Violet-500
  muted: '#64748b', // Slate-500
};

const PLAN_COLORS: Record<string, string> = {
  free: '#64748b', // Slate
  pro: '#3b82f6', // Blue
  enterprise: '#8b5cf6', // Purple
};

// ─────────────────────────────────────────
// User Growth Area Chart
// ─────────────────────────────────────────

interface UserGrowthChartProps {
  data: UserGrowthData[];
  isLoading?: boolean;
}

export function UserGrowthAreaChart({ data, isLoading }: UserGrowthChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Generate placeholder data
      return Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return {
          month: d.toLocaleDateString('en-US', { month: 'short' }),
          count: 0,
        };
      });
    }
    return data;
  }, [data]);

  const totalUsers = chartData.reduce((sum, d) => sum + d.count, 0);
  const currentMonth = chartData[chartData.length - 1]?.count ?? 0;
  const prevMonth = chartData[chartData.length - 2]?.count ?? 0;
  const growth = prevMonth > 0 ? ((currentMonth - prevMonth) / prevMonth) * 100 : 0;

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-base">User Growth</CardTitle>
            <CardDescription className="text-slate-400">Monthly registrations</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{totalUsers}</div>
            <div className={cn(
              'text-xs font-medium',
              growth >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}>
              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}% vs last month
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              Loading chart data...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  axisLine={{ stroke: '#475569' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  fill="url(#userGrowthGradient)"
                  name="New Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Revenue Line Chart
// ─────────────────────────────────────────

interface RevenueChartProps {
  data: RevenueData[];
  isLoading?: boolean;
}

export function RevenueLineChart({ data, isLoading }: RevenueChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return {
          month: d.toLocaleDateString('en-US', { month: 'short' }),
          revenue: 0,
        };
      });
    }
    return data;
  }, [data]);

  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const avgRevenue = chartData.length > 0 ? totalRevenue / chartData.length : 0;

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-base">Revenue Trend</CardTitle>
            <CardDescription className="text-slate-400">Monthly revenue breakdown</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              ${avgRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-slate-400">avg/month</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              Loading chart data...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.tertiary}
                  strokeWidth={3}
                  dot={{ fill: CHART_COLORS.tertiary, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: CHART_COLORS.tertiary }}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Plan Distribution Pie Chart
// ─────────────────────────────────────────

interface PlanDistributionChartProps {
  data: PlanDistributionData[];
  isLoading?: boolean;
}

export function PlanDistributionPieChart({ data, isLoading }: PlanDistributionChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [
        { plan: 'free', count: 0, percentage: 0 },
        { plan: 'pro', count: 0, percentage: 0 },
        { plan: 'enterprise', count: 0, percentage: 0 },
      ];
    }
    return data;
  }, [data]);

  const totalUsers = chartData.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-base">Plan Distribution</CardTitle>
        <CardDescription className="text-slate-400">Users by subscription plan</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center">
          {isLoading ? (
            <div className="w-full text-center text-slate-500">Loading...</div>
          ) : totalUsers === 0 ? (
            <div className="w-full text-center text-slate-500">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="plan"
                >
                  {chartData.map((entry) => (
                    <Cell 
                      key={entry.plan} 
                      fill={PLAN_COLORS[entry.plan] || CHART_COLORS.muted}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} users (${chartData.find(d => d.plan === name)?.percentage || 0}%)`,
                    name.charAt(0).toUpperCase() + name.slice(1),
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-slate-300 capitalize">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        {/* Legend with counts */}
        <div className="flex justify-center gap-6 mt-2">
          {chartData.map((d) => (
            <div key={d.plan} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: PLAN_COLORS[d.plan] || CHART_COLORS.muted }}
              />
              <span className="text-sm text-slate-400 capitalize">{d.plan}</span>
              <span className="text-sm font-medium text-white">{d.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// AI Usage Bar Chart
// ─────────────────────────────────────────

interface AIUsageData {
  day: string;
  tokens: number;
  conversations: number;
}

interface AIUsageChartProps {
  data: AIUsageData[];
  isLoading?: boolean;
}

export function AIUsageBarChart({ data, isLoading }: AIUsageChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Last 7 days placeholder
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          day: d.toLocaleDateString('en-US', { weekday: 'short' }),
          tokens: 0,
          conversations: 0,
        };
      });
    }
    return data;
  }, [data]);

  const totalTokens = chartData.reduce((sum, d) => sum + d.tokens, 0);
  const totalConversations = chartData.reduce((sum, d) => sum + d.conversations, 0);

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-base">AI Usage (Last 7 Days)</CardTitle>
            <CardDescription className="text-slate-400">Tokens and conversations</CardDescription>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <div className="text-lg font-bold text-purple-400">{totalTokens.toLocaleString()}</div>
              <div className="text-xs text-slate-400">tokens</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-400">{totalConversations}</div>
              <div className="text-xs text-slate-400">conversations</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              Loading...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                  }}
                />
                <Bar
                  dataKey="conversations"
                  fill={CHART_COLORS.secondary}
                  radius={[4, 4, 0, 0]}
                  name="Conversations"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// System Health Status Visualization
// ─────────────────────────────────────────

interface ServiceHealth {
  service_name: string;
  status: 'healthy' | 'degraded' | 'down' | 'maintenance';
  latency_ms?: number;
  last_check_at?: string;
}

interface SystemHealthVizProps {
  services: ServiceHealth[];
  isLoading?: boolean;
}

export function SystemHealthVisualization({ services, isLoading }: SystemHealthVizProps) {
  const healthStats = useMemo(() => {
    const total = services.length;
    const healthy = services.filter(s => s.status === 'healthy').length;
    const degraded = services.filter(s => s.status === 'degraded').length;
    const down = services.filter(s => s.status === 'down').length;
    
    return {
      total,
      healthy,
      degraded,
      down,
      uptime: total > 0 ? ((healthy / total) * 100).toFixed(1) : '0',
    };
  }, [services]);

  const STATUS_COLORS = {
    healthy: '#10b981',
    degraded: '#f59e0b',
    down: '#ef4444',
    maintenance: '#3b82f6',
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-base">System Status</CardTitle>
            <CardDescription className="text-slate-400">Service health overview</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-400">{healthStats.uptime}%</div>
            <div className="text-xs text-slate-400">uptime</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-slate-500">
            Loading...
          </div>
        ) : (
          <>
            {/* Status summary bar */}
            <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-4">
              {healthStats.healthy > 0 && (
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${(healthStats.healthy / healthStats.total) * 100}%` }}
                />
              )}
              {healthStats.degraded > 0 && (
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${(healthStats.degraded / healthStats.total) * 100}%` }}
                />
              )}
              {healthStats.down > 0 && (
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${(healthStats.down / healthStats.total) * 100}%` }}
                />
              )}
            </div>

            {/* Service grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {services.map((service) => (
                <div
                  key={service.service_name}
                  className={cn(
                    'p-3 rounded-lg border flex items-center gap-2',
                    service.status === 'healthy' && 'bg-emerald-500/10 border-emerald-500/30',
                    service.status === 'degraded' && 'bg-amber-500/10 border-amber-500/30',
                    service.status === 'down' && 'bg-red-500/10 border-red-500/30',
                    service.status === 'maintenance' && 'bg-blue-500/10 border-blue-500/30'
                  )}
                >
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: STATUS_COLORS[service.status] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {service.service_name}
                    </p>
                    {service.latency_ms && (
                      <p className="text-xs text-slate-400">{service.latency_ms}ms</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default {
  UserGrowthAreaChart,
  RevenueLineChart,
  PlanDistributionPieChart,
  AIUsageBarChart,
  SystemHealthVisualization,
};
