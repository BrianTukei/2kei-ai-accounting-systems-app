/**
 * SystemHealthMonitor.tsx
 * ──────────────────────
 * Live system health monitoring panel.
 * Checks Supabase DB, Edge Functions, Auth, Storage, and RLS.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, Wifi, Clock } from 'lucide-react';
import { AdminHealthAPI, type SystemHealthStatus } from '@/services/adminService';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  operational: {
    icon: CheckCircle2,
    label: 'Operational',
    color: 'text-green-600',
    bg: 'bg-green-100',
    badge: 'bg-green-100 text-green-700',
    dot: 'bg-green-500',
  },
  degraded: {
    icon: AlertTriangle,
    label: 'Degraded',
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  down: {
    icon: XCircle,
    label: 'Down',
    color: 'text-red-600',
    bg: 'bg-red-100',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
};

interface SystemHealthMonitorProps {
  autoCheck?: boolean;
  autoCheckInterval?: number;
}

export default function SystemHealthMonitor({
  autoCheck = true,
  autoCheckInterval = 60000,
}: SystemHealthMonitorProps) {
  const [services, setServices] = useState<SystemHealthStatus[]>([]);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const runHealthCheck = useCallback(async () => {
    setChecking(true);
    try {
      const results = await AdminHealthAPI.checkAllServices();
      setServices(results);
      setLastChecked(new Date());
    } catch (err) {
      console.error('Health check failed:', err);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  useEffect(() => {
    if (!autoCheck) return;
    const interval = setInterval(runHealthCheck, autoCheckInterval);
    return () => clearInterval(interval);
  }, [autoCheck, autoCheckInterval, runHealthCheck]);

  const allOperational = services.length > 0 && services.every(s => s.status === 'operational');
  const hasDown = services.some(s => s.status === 'down');
  const hasDegraded = services.some(s => s.status === 'degraded');

  const overallStatus = hasDown ? 'down' : hasDegraded ? 'degraded' : 'operational';
  const overallConfig = STATUS_CONFIG[overallStatus];

  const avgLatency = services.length > 0
    ? Math.round(services.reduce((sum, s) => sum + s.latencyMs, 0) / services.length)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              System Health
            </CardTitle>
            <CardDescription>
              {lastChecked
                ? `Last checked: ${lastChecked.toLocaleTimeString()}`
                : 'Checking services...'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {services.length > 0 && (
              <Badge className={cn('text-xs', overallConfig.badge)}>
                <overallConfig.icon className="w-3 h-3 mr-1" />
                {allOperational ? 'All Systems Operational' : overallConfig.label}
              </Badge>
            )}
            <Button variant="outline" size="sm" disabled={checking} onClick={runHealthCheck}>
              <RefreshCw className={cn('w-3.5 h-3.5', checking && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {services.length === 0 && checking ? (
          <div className="text-center py-6 text-slate-400">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
            Running health checks...
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => {
              const config = STATUS_CONFIG[service.status];
              const Icon = config.icon;
              return (
                <div
                  key={service.service}
                  className="flex items-center justify-between py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('w-2 h-2 rounded-full', config.dot,
                      service.status === 'operational' && 'animate-pulse')} />
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {service.service}
                      </span>
                      {service.details && (
                        <p className="text-xs text-slate-400 mt-0.5">{service.details}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {service.latencyMs}ms
                    </div>
                    <Badge variant="secondary" className={cn('text-xs', config.badge)}>
                      <Icon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </div>
              );
            })}

            {/* Summary */}
            {services.length > 0 && (
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400">
                  {services.length} services checked
                </span>
                <span className="text-xs text-slate-400">
                  Avg latency: {avgLatency}ms
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
