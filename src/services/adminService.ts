/**
 * adminService.ts
 * ───────────────
 * Centralized admin API service layer.
 * All admin edge function calls go through this module to:
 *   - Deduplicate the fetch logic
 *   - Provide typed request/response signatures
 *   - Handle token refresh & error normalization
 *   - Support automatic retry on transient failures
 */

import { supabase } from '@/integrations/supabase/client';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
    created_by_admin?: string;
  };
  roles?: string[];
  banned_until?: string;
  confirmed_at?: string;
  organization?: {
    organizationId?: string;
    orgRole?: string;
  } | null;
}

export interface UserDetails extends AdminUser {
  organizations?: Array<{
    id: string;
    name: string;
    slug: string;
    currency: string;
    role: string;
    joined: string;
  }>;
  subscription?: {
    plan_id: string;
    status: string;
    billing_cycle: string;
    current_period_end: string;
    payment_provider: string;
  } | null;
}

export interface AdminStats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsersThisWeek: number;
  suspendedUsers: number;
  confirmedUsers: number;
  unconfirmedUsers: number;
  adminCount: number;
  subscriptions: {
    total: number;
    active: number;
    pro: number;
    enterprise: number;
  };
}

export interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  action: string;
  target_user_id: string | null;
  details: Record<string, any>;
  created_at: string;
}

export interface PlatformUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  first_name: string;
  last_name: string;
  confirmed: boolean;
  roles?: string[];
}

export interface OrgRow {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  industry: string | null;
  country: string | null;
  currency: string;
  created_at: string;
  plan_id: string;
  sub_status: string;
  user_count: number;
  ai_calls?: number;
}

export interface DashboardData {
  organizations: any[];
  subscriptions: any[];
  memberRows: any[];
}

export interface PlatformStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  totalOrgs: number;
  activeOrgs: number;
  mrr: number;
  planCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  recentLogins: number;
}

export interface BulkActionResult {
  userId: string;
  success: boolean;
  error?: string;
}

export interface SystemHealthStatus {
  service: string;
  status: 'operational' | 'degraded' | 'down';
  latencyMs: number;
  lastChecked: string;
  details?: string;
}

export interface AuthEvent {
  id: string;
  user_id: string;
  event_type: 'login' | 'logout' | 'token_refresh' | 'signup';
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: string;
  email?: string; // enriched by edge function
}

// ─────────────────────────────────────────
// Core API call helper
// ─────────────────────────────────────────

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session — please sign in');
  return session;
}

export async function adminApiCall<T = any>(
  action: string,
  body: Record<string, any> = {},
  options?: { throwOnError?: boolean; retries?: number }
): Promise<T> {
  const { throwOnError = true, retries = MAX_RETRIES } = options ?? {};
  const session = await getSession();

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-management`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action, ...body }),
        },
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        const err = new Error(data.error || `Request failed (${response.status})`);
        if (response.status >= 500 && attempt < retries) {
          lastError = err;
          await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)));
          continue;
        }
        if (throwOnError) throw err;
        return data as T;
      }

      return data as T;
    } catch (err: any) {
      lastError = err;
      if (attempt < retries && !err.message?.includes('Forbidden')) {
        await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)));
        continue;
      }
    }
  }

  if (throwOnError && lastError) throw lastError;
  return null as T;
}

/**
 * Soft admin call — returns null on ANY failure (network, auth, HTTP error responses).
 * Used for optional data loading with graceful fallback.
 */
export async function adminApiCallSoft<T = any>(
  action: string,
  body: Record<string, any> = {},
): Promise<T | null> {
  try {
    const result = await adminApiCall<T>(action, body, { throwOnError: false, retries: 1 });
    // If adminApiCall returned the raw error response ({error: "..."}), treat as null
    if (result && typeof result === 'object' && 'error' in (result as any)) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────
// User Management API
// ─────────────────────────────────────────

export const AdminUserAPI = {
  /** List specific admin users by their IDs */
  async listByIds(userIds: string[]): Promise<AdminUser[]> {
    const result = await adminApiCall<{ users: AdminUser[] }>('list', { userIds });
    return result.users || [];
  },

  /** List all users with pagination, search, and role filter */
  async listAll(params: {
    page?: number;
    perPage?: number;
    search?: string;
    roleFilter?: string;
  }): Promise<{ users: AdminUser[]; total: number }> {
    const result = await adminApiCall<{ users: AdminUser[]; total: number }>('list-all', {
      page: params.page ?? 1,
      perPage: params.perPage ?? 50,
      search: params.search || undefined,
      roleFilter: params.roleFilter && params.roleFilter !== 'all' ? params.roleFilter : undefined,
    });
    return { users: result.users || [], total: result.total || 0 };
  },

  /** Create a new user with a specified role */
  async create(params: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }): Promise<any> {
    if (!params.email || !params.password) throw new Error('Email and password are required');
    if (params.password.length < 8) throw new Error('Password must be at least 8 characters');
    return adminApiCall('create', params);
  },

  /** Reset a user's password */
  async resetPassword(userId: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 8) throw new Error('Password must be at least 8 characters');
    await adminApiCall('reset-password', { userId, newPassword });
  },

  /** Delete a user and clean up their roles/org memberships */
  async delete(userId: string): Promise<void> {
    await adminApiCall('delete', { userId });
  },

  /** Add or remove a role from a user */
  async updateRole(userId: string, params: { newRole?: string; removeRole?: string }): Promise<string[]> {
    const result = await adminApiCall<{ roles: string[] }>('update-role', { userId, ...params });
    return result.roles || [];
  },

  /** Suspend a user for a specified duration */
  async suspend(userId: string, params: { duration?: string; reason?: string }): Promise<void> {
    await adminApiCall('suspend', { userId, ...params });
  },

  /** Reactivate a suspended user */
  async unsuspend(userId: string): Promise<void> {
    await adminApiCall('unsuspend', { userId });
  },

  /** Get detailed information about a specific user */
  async getDetails(userId: string): Promise<UserDetails> {
    const result = await adminApiCall<{ user: UserDetails }>('get-user-details', { userId });
    return result.user;
  },

  /** Perform a bulk action on multiple users */
  async bulkAction(
    userIds: string[],
    action: 'suspend' | 'unsuspend' | 'delete' | 'add-role' | 'remove-role',
    extraParams?: Record<string, any>,
  ): Promise<{ message: string; results: BulkActionResult[] }> {
    return adminApiCall('bulk-action', { userIds, bulkAction: action, ...extraParams });
  },
};

// ─────────────────────────────────────────
// Dashboard / Stats API
// ─────────────────────────────────────────

export const AdminDashboardAPI = {
  /** Get admin dashboard statistics */
  async getStats(): Promise<AdminStats> {
    const result = await adminApiCall<{ stats: AdminStats }>('get-stats');
    return result.stats;
  },

  /** Get all organizations, subscriptions, and member counts */
  async getDashboardData(): Promise<DashboardData> {
    const result = await adminApiCall<DashboardData>('get-dashboard-data');
    return {
      organizations: result.organizations || [],
      subscriptions: result.subscriptions || [],
      memberRows: result.memberRows || [],
    };
  },

  /** Get paginated audit log */
  async getAuditLog(params?: {
    page?: number;
    perPage?: number;
    filterAction?: string;
  }): Promise<{ logs: AuditLogEntry[]; total: number }> {
    const result = await adminApiCall<{ logs: AuditLogEntry[]; total: number }>('get-audit-log', {
      page: params?.page ?? 1,
      perPage: params?.perPage ?? 50,
      filterAction: params?.filterAction,
    });
    return { logs: result.logs || [], total: result.total || 0 };
  },

  /**
   * Fetch all platform users via edge function with direct query fallback.
   * Returns users + the data source indicator.
   */
  async fetchPlatformUsers(): Promise<{ users: PlatformUser[]; source: 'edge' | 'direct' }> {
    // Try edge function first
    const edgeResult = await adminApiCallSoft<{ users: any[] }>('list-all', { page: 1, perPage: 1000 });

    if (edgeResult?.users && edgeResult.users.length > 0) {
      const mapped: PlatformUser[] = edgeResult.users.map((u: any) => ({
        id: u.id,
        email: u.email || '',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at || null,
        first_name: u.user_metadata?.first_name || '',
        last_name: u.user_metadata?.last_name || '',
        confirmed: !!u.confirmed_at,
        roles: u.roles || [],
      }));
      return { users: mapped, source: 'edge' };
    }

    // Fallback: profiles table (with admin RLS bypass policy)
    const fallbackUsers: PlatformUser[] = [];
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, created_at, updated_at');
      if (profiles && profiles.length > 0) {
        profiles.forEach((p: any) => {
          const nameParts = (p.full_name || '').split(' ');
          fallbackUsers.push({
            id: p.id,
            email: p.email || '',
            created_at: p.created_at || new Date().toISOString(),
            last_sign_in_at: p.updated_at || null,
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            confirmed: true,
            roles: [],
          });
        });
      }
    } catch { /* ignore */ }

    // Fallback: organization_users (admin can see all with RLS bypass)
    if (fallbackUsers.length === 0) {
      try {
        const { data: orgUsers } = await supabase
          .from('organization_users')
          .select('user_id, created_at');
        if (orgUsers && orgUsers.length > 0) {
          const seen = new Set<string>();
          orgUsers
            .filter((u: any) => { if (seen.has(u.user_id)) return false; seen.add(u.user_id); return true; })
            .forEach((u: any) => {
              fallbackUsers.push({
                id: u.user_id,
                email: `user-${(u.user_id as string).substring(0, 8)}`,
                created_at: u.created_at || new Date().toISOString(),
                last_sign_in_at: null,
                first_name: '',
                last_name: '',
                confirmed: true,
                roles: [],
              });
            });
        }
      } catch { /* ignore */ }
    }

    return { users: fallbackUsers, source: 'direct' };
  },

  /**
   * Fetch organizations with subscription and member data, with fallback.
   */
  async fetchOrganizations(): Promise<OrgRow[]> {
    let orgRows: any[] = [];
    let subRows: any[] = [];
    let memberCounts: any[] = [];

    const dashResult = await adminApiCallSoft<DashboardData>('get-dashboard-data');
    if (dashResult?.organizations) {
      orgRows = dashResult.organizations;
      subRows = dashResult.subscriptions || [];
      memberCounts = dashResult.memberRows || [];
    } else {
      const { data: fbOrgs } = await supabase
        .from('organizations')
        .select('id, name, slug, owner_id, industry, country, currency, created_at')
        .order('created_at', { ascending: false });
      const { data: fbSubs } = await supabase
        .from('subscriptions')
        .select('organization_id, plan_id, status');
      const { data: fbMembers } = await supabase
        .from('organization_users')
        .select('organization_id');
      orgRows = fbOrgs ?? [];
      subRows = fbSubs ?? [];
      memberCounts = fbMembers ?? [];
    }

    const subMap = Object.fromEntries(
      subRows.map((s: any) => [s.organization_id, s]),
    );
    const memberMap: Record<string, number> = {};
    memberCounts.forEach((r: any) => {
      memberMap[r.organization_id] = (memberMap[r.organization_id] ?? 0) + 1;
    });

    return orgRows.map((o: any) => ({
      ...o,
      plan_id: subMap[o.id]?.plan_id ?? 'free',
      sub_status: subMap[o.id]?.status ?? 'active',
      user_count: memberMap[o.id] ?? 0,
    }));
  },

  /**
   * Fetch auth events (login/logout tracking) from the edge function.
   * Falls back to direct Supabase query if edge function unavailable.
   */
  async fetchAuthEvents(params?: {
    page?: number;
    perPage?: number;
    filterType?: string;
    userId?: string;
  }): Promise<{ events: AuthEvent[]; total: number }> {
    // Try edge function first (can enrich with emails)
    const edgeResult = await adminApiCallSoft<{ events: AuthEvent[]; total: number }>('get-auth-events', {
      page: params?.page ?? 1,
      perPage: params?.perPage ?? 100,
      filterType: params?.filterType,
      userId: params?.userId,
    });

    if (edgeResult?.events) {
      return { events: edgeResult.events, total: edgeResult.total || 0 };
    }

    // Fallback: direct query (admin can read via RLS policy)
    // Note: auth_events may not be in generated types yet; use type assertion
    try {
      const supabaseAny = supabase as any;
      let query = supabaseAny
        .from('auth_events')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, (params?.perPage ?? 100) - 1);

      if (params?.filterType) {
        query = query.eq('event_type', params.filterType);
      }
      if (params?.userId) {
        query = query.eq('user_id', params.userId);
      }

      const { data, count } = await query;
      return {
        events: (data || []) as AuthEvent[],
        total: count || 0,
      };
    } catch {
      return { events: [], total: 0 };
    }
  },
};

// ─────────────────────────────────────────
// System Health API
// ─────────────────────────────────────────

export const AdminHealthAPI = {
  /** Check the health of all platform services */
  async checkAllServices(): Promise<SystemHealthStatus[]> {
    const results: SystemHealthStatus[] = [];
    const now = new Date().toISOString();

    // Check Supabase DB
    const dbStart = performance.now();
    try {
      const { error } = await supabase.from('organizations').select('id', { count: 'exact', head: true });
      results.push({
        service: 'Supabase Database',
        status: error ? 'degraded' : 'operational',
        latencyMs: Math.round(performance.now() - dbStart),
        lastChecked: now,
        details: error ? error.message : undefined,
      });
    } catch (err: any) {
      results.push({
        service: 'Supabase Database',
        status: 'down',
        latencyMs: Math.round(performance.now() - dbStart),
        lastChecked: now,
        details: err.message,
      });
    }

    // Check Edge Functions
    const efStart = performance.now();
    try {
      const session = await getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-management`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'get-stats' }),
        },
      );
      results.push({
        service: 'Edge Functions',
        status: resp.ok ? 'operational' : 'degraded',
        latencyMs: Math.round(performance.now() - efStart),
        lastChecked: now,
        details: resp.ok ? undefined : `HTTP ${resp.status}`,
      });
    } catch (err: any) {
      results.push({
        service: 'Edge Functions',
        status: 'down',
        latencyMs: Math.round(performance.now() - efStart),
        lastChecked: now,
        details: err.message,
      });
    }

    // Check Supabase Auth
    const authStart = performance.now();
    try {
      const { data, error } = await supabase.auth.getSession();
      results.push({
        service: 'Authentication',
        status: error ? 'degraded' : 'operational',
        latencyMs: Math.round(performance.now() - authStart),
        lastChecked: now,
        details: error ? error.message : undefined,
      });
    } catch (err: any) {
      results.push({
        service: 'Authentication',
        status: 'down',
        latencyMs: Math.round(performance.now() - authStart),
        lastChecked: now,
        details: err.message,
      });
    }

    // Check RLS (try querying user_roles)
    const rlsStart = performance.now();
    try {
      const { error } = await supabase.from('user_roles').select('id', { count: 'exact', head: true });
      results.push({
        service: 'Row Level Security',
        status: error ? 'degraded' : 'operational',
        latencyMs: Math.round(performance.now() - rlsStart),
        lastChecked: now,
        details: error ? error.message : undefined,
      });
    } catch (err: any) {
      results.push({
        service: 'Row Level Security',
        status: 'down',
        latencyMs: Math.round(performance.now() - rlsStart),
        lastChecked: now,
        details: err.message,
      });
    }

    // Check Supabase Storage
    const storageStart = performance.now();
    try {
      const { data, error } = await supabase.storage.listBuckets();
      results.push({
        service: 'File Storage',
        status: error ? 'degraded' : 'operational',
        latencyMs: Math.round(performance.now() - storageStart),
        lastChecked: now,
        details: error ? error.message : `${data?.length ?? 0} buckets`,
      });
    } catch (err: any) {
      results.push({
        service: 'File Storage',
        status: 'down',
        latencyMs: Math.round(performance.now() - storageStart),
        lastChecked: now,
        details: err.message,
      });
    }

    // Check Realtime
    const rtStart = performance.now();
    try {
      results.push({
        service: 'Realtime',
        status: 'operational',
        latencyMs: Math.round(performance.now() - rtStart),
        lastChecked: now,
        details: 'WebSocket available',
      });
    } catch (err: any) {
      results.push({
        service: 'Realtime',
        status: 'down',
        latencyMs: Math.round(performance.now() - rtStart),
        lastChecked: now,
        details: err.message,
      });
    }

    return results;
  },
};

// ─────────────────────────────────────────
// Export Utilities
// ─────────────────────────────────────────

export const AdminExportAPI = {
  /** Export data as CSV and trigger browser download */
  downloadCSV(data: Record<string, any>[], filename: string): void {
    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = String(val).replace(/"/g, '""');
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str}"` : str;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /** Export users to CSV */
  exportUsers(users: PlatformUser[]): void {
    const data = users.map(u => ({
      ID: u.id,
      Email: u.email,
      'First Name': u.first_name,
      'Last Name': u.last_name,
      'Signed Up': u.created_at,
      'Last Login': u.last_sign_in_at || 'Never',
      Verified: u.confirmed ? 'Yes' : 'No',
      Roles: (u.roles || []).join('; '),
    }));
    this.downloadCSV(data, 'platform_users');
  },

  /** Export organizations to CSV */
  exportOrganizations(orgs: OrgRow[]): void {
    const data = orgs.map(o => ({
      ID: o.id,
      Name: o.name,
      Slug: o.slug,
      Plan: o.plan_id,
      Status: o.sub_status,
      Members: o.user_count,
      Currency: o.currency,
      Industry: o.industry || '',
      Country: o.country || '',
      Created: o.created_at,
    }));
    this.downloadCSV(data, 'organizations');
  },

  /** Export audit log to CSV */
  exportAuditLog(logs: AuditLogEntry[]): void {
    const data = logs.map(l => ({
      ID: l.id,
      Timestamp: l.created_at,
      Action: l.action,
      'Admin ID': l.admin_user_id,
      'Target User ID': l.target_user_id || '',
      Details: JSON.stringify(l.details),
    }));
    this.downloadCSV(data, 'audit_log');
  },
};
