/**
 * useAdminData.ts
 * ───────────────
 * Custom hook for admin dashboard data management.
 * Provides:
 *   - Centralized data loading with edge function + fallback
 *   - Computed platform stats (KPIs)
 *   - Auto-refresh with configurable intervals
 *   - Loading / error / data-source state
 *   - Export helpers
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import {
  AdminDashboardAPI,
  AdminExportAPI,
  type PlatformUser,
  type PlatformStats,
  type OrgRow,
} from '@/services/adminService';

const MRR_BY_PLAN: Record<string, number> = { free: 0, pro: 29, enterprise: 79 };

interface UseAdminDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // ms
}

interface UseAdminDataReturn {
  // Data
  users: PlatformUser[];
  orgs: OrgRow[];
  stats: PlatformStats | null;

  // State
  loading: boolean;
  refreshing: boolean;
  dataSource: 'edge' | 'direct' | '';
  loadError: string | null;

  // Actions
  refresh: () => void;
  exportUsers: () => void;
  exportOrgs: () => void;

  // Derived
  filteredUsers: (search: string) => PlatformUser[];
  filteredOrgs: (search: string) => OrgRow[];
  recentSignups: PlatformUser[];
  recentLogins: PlatformUser[];
}

export function useAdminData(options?: UseAdminDataOptions): UseAdminDataReturn {
  const { autoRefresh = false, refreshInterval = 60000 } = options ?? {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [dataSource, setDataSource] = useState<'edge' | 'direct' | ''>('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const loadData = useCallback(async () => {
    setLoadError(null);

    try {
      // Fetch users and orgs in parallel
      const [usersResult, orgRows] = await Promise.all([
        AdminDashboardAPI.fetchPlatformUsers(),
        AdminDashboardAPI.fetchOrganizations(),
      ]);

      if (!mountedRef.current) return;

      const platformUsers = usersResult.users;
      setUsers(platformUsers);
      setOrgs(orgRows);
      setDataSource(usersResult.source);

      // Compute stats
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const planCounts: Record<string, number> = { free: 0, pro: 0, enterprise: 0 };
      const statusCounts: Record<string, number> = {};
      let mrr = 0;

      orgRows.forEach(o => {
        planCounts[o.plan_id] = (planCounts[o.plan_id] ?? 0) + 1;
        statusCounts[o.sub_status] = (statusCounts[o.sub_status] ?? 0) + 1;
        if (['active', 'trialing'].includes(o.sub_status)) {
          mrr += MRR_BY_PLAN[o.plan_id] ?? 0;
        }
      });

      const verifiedUsers = platformUsers.filter(u => u.confirmed).length;

      setStats({
        totalUsers: platformUsers.length,
        newUsersToday: platformUsers.filter(u => new Date(u.created_at) >= todayStart).length,
        newUsersThisWeek: platformUsers.filter(u => new Date(u.created_at) >= weekStart).length,
        newUsersThisMonth: platformUsers.filter(u => new Date(u.created_at) >= monthStart).length,
        verifiedUsers,
        unverifiedUsers: platformUsers.length - verifiedUsers,
        totalOrgs: orgRows.length,
        activeOrgs: orgRows.filter(o => o.sub_status === 'active').length,
        mrr,
        planCounts,
        statusCounts,
        recentLogins: platformUsers.filter(u =>
          u.last_sign_in_at && new Date(u.last_sign_in_at) >= weekStart
        ).length,
      });
    } catch (err) {
      console.error('Admin data load error:', err);
      if (mountedRef.current) {
        setLoadError('Failed to load admin data. Check console for details.');
        toast.error('Failed to load admin data');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => { mountedRef.current = false; };
  }, [loadData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      if (mountedRef.current) {
        setRefreshing(true);
        loadData();
      }
    }, refreshInterval);
    return () => clearInterval(id);
  }, [autoRefresh, refreshInterval, loadData]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Derived data
  const filteredUsers = useCallback((search: string) => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.email.toLowerCase().includes(q)
      || u.first_name.toLowerCase().includes(q)
      || u.last_name.toLowerCase().includes(q)
    );
  }, [users]);

  const filteredOrgs = useCallback((search: string) => {
    if (!search) return orgs;
    const q = search.toLowerCase();
    return orgs.filter(o =>
      o.name.toLowerCase().includes(q)
      || o.slug.toLowerCase().includes(q)
    );
  }, [orgs]);

  const recentSignups = useMemo(() => 
    [...users]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 30),
    [users]
  );

  const recentLogins = useMemo(() => 
    users
      .filter(u => u.last_sign_in_at)
      .sort((a, b) => new Date(b.last_sign_in_at!).getTime() - new Date(a.last_sign_in_at!).getTime())
      .slice(0, 30),
    [users]
  );

  // Export
  const exportUsers = useCallback(() => {
    AdminExportAPI.exportUsers(users);
    toast.success(`Exported ${users.length} users to CSV`);
  }, [users]);

  const exportOrgs = useCallback(() => {
    AdminExportAPI.exportOrganizations(orgs);
    toast.success(`Exported ${orgs.length} organizations to CSV`);
  }, [orgs]);

  return {
    users, orgs, stats,
    loading, refreshing, dataSource, loadError,
    refresh, exportUsers, exportOrgs,
    filteredUsers, filteredOrgs, recentSignups, recentLogins,
  };
}
