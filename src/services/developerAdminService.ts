/**
 * developerAdminService.ts
 * ════════════════════════
 * Comprehensive service layer for the Developer Admin Dashboard.
 * Handles all admin operations including:
 *   - Admin authentication & roles
 *   - User management
 *   - Subscription & billing control
 *   - AI system monitoring
 *   - Accounting modules control
 *   - System monitoring
 *   - Notifications
 *   - Developer tools
 */

import { supabase } from '@/integrations/supabase/client';

// ─────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────

export type AdminRole = 'super_admin' | 'developer' | 'support_admin';

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  admin_role: AdminRole;
  department?: string;
  permissions: string[];
  last_active_at?: string;
  is_active: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  aiRequestsToday: number;
  pendingPayments: number;
  systemHealth: 'healthy' | 'degraded' | 'down';
  userGrowth: { month: string; count: number }[];
  revenueChart: { month: string; revenue: number }[];
  planDistribution: { plan: string; count: number; percentage: number }[];
}

export interface FeatureFlag {
  id: string;
  feature_key: string;
  feature_name: string;
  description?: string;
  status: 'enabled' | 'disabled' | 'beta' | 'deprecated';
  rollout_percentage: number;
  allowed_plans: string[];
  metadata: Record<string, any>;
  updated_at: string;
}

export interface AccountingModule {
  id: string;
  module_key: string;
  module_name: string;
  description?: string;
  icon?: string;
  is_enabled: boolean;
  required_plan: string;
  display_order: number;
  settings: Record<string, any>;
}

export interface AIConversation {
  id: string;
  user_id: string;
  user_email?: string;
  organization_id?: string;
  organization_name?: string;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  model?: string;
  cost_usd: number;
  duration_ms?: number;
  created_at: string;
}

export interface AIConfig {
  id: string;
  config_key: string;
  config_value: Record<string, any>;
  description?: string;
  is_active: boolean;
  plan_limits: Record<string, number>;
}

export interface SystemHealthStatus {
  id: string;
  service_name: string;
  status: 'healthy' | 'degraded' | 'down' | 'maintenance';
  latency_ms?: number;
  last_check_at: string;
  error_message?: string;
}

export interface ErrorLog {
  id: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  user_id?: string;
  request_url?: string;
  request_method?: string;
  severity: string;
  is_resolved: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  user_email?: string;
  admin_user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high' | 'critical';
  target_audience: string;
  starts_at: string;
  ends_at?: string;
  is_active: boolean;
  is_dismissible: boolean;
  action_url?: string;
  action_label?: string;
  created_at: string;
}

export interface APIKey {
  id: string;
  organization_id: string;
  organization_name?: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  rate_limit: number;
  last_used_at?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

export interface Webhook {
  id: string;
  organization_id: string;
  organization_name?: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  last_triggered_at?: string;
  success_count: number;
  failure_count: number;
}

export interface BackgroundJob {
  id: string;
  job_type: string;
  job_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: number;
  payload: Record<string, any>;
  result?: Record<string, any>;
  error_message?: string;
  attempts: number;
  max_attempts: number;
  started_at?: string;
  completed_at?: string;
  scheduled_for: string;
  created_at: string;
}

export interface RefundRequest {
  id: string;
  organization_id: string;
  organization_name?: string;
  payment_id: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  admin_notes?: string;
  processed_at?: string;
  created_at: string;
}

// ─────────────────────────────────────────
// Admin Authentication & Roles
// ─────────────────────────────────────────

export const AdminAuthService = {
  /**
   * Check if current user is an admin
   */
  async isAdmin(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check admin_users table
    const { data } = await supabase
      .from('admin_users' as any)
      .select('id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (data) return true;

    // Fallback: check user_roles
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    return !!roleData;
  },

  /**
   * Get current admin user role
   */
  async getAdminRole(): Promise<AdminRole | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('admin_users' as any)
      .select('admin_role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    return data?.admin_role ?? 'support_admin';
  },

  /**
   * Get full admin user details
   */
  async getAdminUser(): Promise<AdminUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const sb = supabase as any;
    const { data } = await sb
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!data) return null;

    return {
      ...data,
      email: user.email || '',
      first_name: user.user_metadata?.first_name,
      last_name: user.user_metadata?.last_name,
    };
  },

  /**
   * Get all admin users (super_admin only)
   */
  async listAdminUsers(): Promise<AdminUser[]> {
    const sb = supabase as any;
    const { data, error } = await sb
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Update admin last active timestamp
   */
  async updateLastActive(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const sb = supabase as any;
    await sb
      .from('admin_users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('user_id', user.id);
  },

  /**
   * Check role permission
   */
  hasPermission(role: AdminRole | null, requiredRole: AdminRole): boolean {
    if (!role) return false;
    const hierarchy: AdminRole[] = ['support_admin', 'developer', 'super_admin'];
    return hierarchy.indexOf(role) >= hierarchy.indexOf(requiredRole);
  },
};

// ─────────────────────────────────────────
// Dashboard Statistics
// ─────────────────────────────────────────

export const DashboardStatsService = {
  /**
   * Get comprehensive dashboard statistics
   */
  async getStats(): Promise<DashboardStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();

    // Parallel queries for efficiency
    const [
      usersResult,
      orgsResult,
      subsResult,
      aiUsageResult,
      healthResult,
    ] = await Promise.all([
      // Total users from organization_users
      supabase.from('organization_users').select('user_id', { count: 'exact', head: true }),
      // Organizations count
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
      // Subscriptions with plans
      supabase.from('subscriptions').select('plan_id, status'),
      // AI usage today
      (supabase as any).from('ai_usage_log').select('id', { count: 'exact', head: true }).gte('created_at', startOfDay),
      // System health
      (supabase as any).from('system_health').select('status'),
    ]);

    // Calculate plan distribution
    const subs = subsResult.data || [];
    const planCounts: Record<string, number> = {};
    let activeSubscriptions = 0;
    
    subs.forEach((s: any) => {
      planCounts[s.plan_id] = (planCounts[s.plan_id] || 0) + 1;
      if (s.status === 'active' || s.status === 'trialing') {
        activeSubscriptions++;
      }
    });

    const totalOrgs = orgsResult.count || 0;
    const planDistribution = Object.entries(planCounts).map(([plan, count]) => ({
      plan,
      count,
      percentage: totalOrgs > 0 ? Math.round((count / totalOrgs) * 100) : 0,
    }));

    // Calculate revenue (simplified)
    const MRR_PRICES: Record<string, number> = { free: 0, pro: 29, enterprise: 79 };
    const monthlyRevenue = subs
      .filter((s: any) => s.status === 'active')
      .reduce((sum: number, s: any) => sum + (MRR_PRICES[s.plan_id] || 0), 0);

    // Determine system health
    const healthStatuses = healthResult.data || [];
    const hasDown = healthStatuses.some((h: any) => h.status === 'down');
    const hasDegraded = healthStatuses.some((h: any) => h.status === 'degraded');
    const systemHealth = hasDown ? 'down' : hasDegraded ? 'degraded' : 'healthy';

    // Generate mock growth data (replace with real queries in production)
    const userGrowth = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        count: Math.floor(Math.random() * 100) + 50,
      };
    });

    const revenueChart = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        revenue: Math.floor(Math.random() * 5000) + 1000,
      };
    });

    return {
      totalUsers: usersResult.count || 0,
      activeSubscriptions,
      monthlyRevenue,
      aiRequestsToday: aiUsageResult?.count || 0,
      pendingPayments: 0, // TODO: Implement pending payments query
      systemHealth,
      userGrowth,
      revenueChart,
      planDistribution,
    };
  },
};

// ─────────────────────────────────────────
// Feature Flags
// ─────────────────────────────────────────

export const FeatureFlagsService = {
  async list(): Promise<FeatureFlag[]> {
    const sb = supabase as any;
    const { data, error } = await sb
      .from('feature_flags')
      .select('*')
      .order('feature_name');
    
    if (error) throw error;
    return data || [];
  },

  async update(id: string, updates: Partial<FeatureFlag>): Promise<void> {
    const sb = supabase as any;
    const { error } = await sb
      .from('feature_flags')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  },

  async toggle(id: string, enabled: boolean): Promise<void> {
    await this.update(id, { status: enabled ? 'enabled' : 'disabled' });
  },
};

// ─────────────────────────────────────────
// Accounting Modules
// ─────────────────────────────────────────

export const AccountingModulesService = {
  async list(): Promise<AccountingModule[]> {
    const sb = supabase as any;
    const { data, error } = await sb
      .from('accounting_modules')
      .select('*')
      .order('display_order');
    
    if (error) throw error;
    return data || [];
  },

  async update(id: string, updates: Partial<AccountingModule>): Promise<void> {
    const sb = supabase as any;
    const { error } = await sb
      .from('accounting_modules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  },

  async toggle(id: string, enabled: boolean): Promise<void> {
    await this.update(id, { is_enabled: enabled });
  },
};

// ─────────────────────────────────────────
// AI System Control
// ─────────────────────────────────────────

export const AIControlService = {
  async getConversations(params?: {
    limit?: number;
    offset?: number;
    userId?: string;
  }): Promise<{ conversations: AIConversation[]; total: number }> {
    const sb = supabase as any;
    let query = sb
      .from('ai_conversations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params?.userId) {
      query = query.eq('user_id', params.userId);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      conversations: data || [],
      total: count || 0,
    };
  },

  async getConfig(): Promise<AIConfig[]> {
    const sb = supabase as any;
    const { data, error } = await sb
      .from('ai_configuration')
      .select('*')
      .order('config_key');
    
    if (error) throw error;
    return data || [];
  },

  async updateConfig(id: string, updates: Partial<AIConfig>): Promise<void> {
    const sb = supabase as any;
    const { error } = await sb
      .from('ai_configuration')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  },

  async getUsageStats(): Promise<{
    totalTokens: number;
    totalCost: number;
    conversationsToday: number;
    averageTokensPerConversation: number;
  }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sb = supabase as any;
    const { data } = await sb
      .from('ai_conversations')
      .select('total_tokens, cost_usd, created_at');

    const todayConversations = (data || []).filter(
      (c: any) => new Date(c.created_at) >= startOfDay
    );

    const totalTokens = (data || []).reduce((sum: number, c: any) => sum + (c.total_tokens || 0), 0);
    const totalCost = (data || []).reduce((sum: number, c: any) => sum + (parseFloat(c.cost_usd) || 0), 0);

    return {
      totalTokens,
      totalCost,
      conversationsToday: todayConversations.length,
      averageTokensPerConversation: data?.length ? Math.round(totalTokens / data.length) : 0,
    };
  },
};

// ─────────────────────────────────────────
// System Monitoring
// ─────────────────────────────────────────

export const SystemMonitoringService = {
  async getHealthStatus(): Promise<SystemHealthStatus[]> {
    const sb = supabase as any;
    const { data, error } = await sb
      .from('system_health')
      .select('*')
      .order('service_name');
    
    if (error) throw error;
    return data || [];
  },

  async getErrorLogs(params?: {
    limit?: number;
    offset?: number;
    severity?: string;
    unresolvedOnly?: boolean;
  }): Promise<{ logs: ErrorLog[]; total: number }> {
    const sb = supabase as any;
    let query = sb
      .from('error_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params?.severity) {
      query = query.eq('severity', params.severity);
    }

    if (params?.unresolvedOnly) {
      query = query.eq('is_resolved', false);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      logs: data || [],
      total: count || 0,
    };
  },

  async resolveError(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const sb = supabase as any;
    
    const { error } = await sb
      .from('error_logs')
      .update({
        is_resolved: true,
        resolved_by: user?.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (error) throw error;
  },

  async getActivityLogs(params?: {
    limit?: number;
    offset?: number;
    userId?: string;
    action?: string;
  }): Promise<{ logs: ActivityLog[]; total: number }> {
    const sb = supabase as any;
    let query = sb
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params?.userId) {
      query = query.eq('user_id', params.userId);
    }

    if (params?.action) {
      query = query.eq('action', params.action);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      logs: data || [],
      total: count || 0,
    };
  },
};

// ─────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────

export const NotificationsService = {
  async listAnnouncements(): Promise<Announcement[]> {
    const sb = supabase as any;
    const { data, error } = await sb
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'created_at'>): Promise<Announcement> {
    const { data: { user } } = await supabase.auth.getUser();
    const sb = supabase as any;
    
    const { data, error } = await sb
      .from('announcements')
      .insert({
        ...announcement,
        created_by: user?.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<void> {
    const sb = supabase as any;
    const { error } = await sb
      .from('announcements')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  },

  async deleteAnnouncement(id: string): Promise<void> {
    const sb = supabase as any;
    const { error } = await sb
      .from('announcements')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// ─────────────────────────────────────────
// Developer Tools
// ─────────────────────────────────────────

export const DeveloperToolsService = {
  // API Keys
  async listAPIKeys(): Promise<APIKey[]> {
    const sb = supabase as any;
    const { data, error } = await sb
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async revokeAPIKey(id: string): Promise<void> {
    const sb = supabase as any;
    const { error } = await sb
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  },

  // Webhooks
  async listWebhooks(): Promise<Webhook[]> {
    const sb = supabase as any;
    const { data, error } = await sb
      .from('webhooks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async toggleWebhook(id: string, active: boolean): Promise<void> {
    const sb = supabase as any;
    const { error } = await sb
      .from('webhooks')
      .update({ is_active: active })
      .eq('id', id);
    
    if (error) throw error;
  },

  // Background Jobs
  async listBackgroundJobs(params?: {
    status?: string;
    limit?: number;
  }): Promise<BackgroundJob[]> {
    const sb = supabase as any;
    let query = sb
      .from('background_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (params?.status) {
      query = query.eq('status', params.status);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async retryJob(id: string): Promise<void> {
    const sb = supabase as any;
    const { error } = await sb
      .from('background_jobs')
      .update({
        status: 'pending',
        scheduled_for: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (error) throw error;
  },

  // Database Stats
  async getDatabaseStats(): Promise<{
    tables: { name: string; rowCount: number; size: string }[];
    totalSize: string;
  }> {
    // Note: This would typically use a database function
    // For now, return mock data
    return {
      tables: [
        { name: 'organizations', rowCount: 150, size: '2.4 MB' },
        { name: 'transactions', rowCount: 12500, size: '45.2 MB' },
        { name: 'invoices', rowCount: 3200, size: '12.1 MB' },
        { name: 'users', rowCount: 450, size: '1.8 MB' },
      ],
      totalSize: '156.8 MB',
    };
  },
};

// ─────────────────────────────────────────
// Billing & Refunds
// ─────────────────────────────────────────

export const BillingService = {
  async listRefundRequests(params?: {
    status?: string;
    limit?: number;
  }): Promise<RefundRequest[]> {
    const sb = supabase as any;
    let query = sb
      .from('refund_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (params?.status) {
      query = query.eq('status', params.status);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async processRefund(id: string, approved: boolean, notes?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const sb = supabase as any;
    
    const { error } = await sb
      .from('refund_requests')
      .update({
        status: approved ? 'approved' : 'rejected',
        admin_notes: notes,
        processed_by: user?.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (error) throw error;
  },

  async getRevenueStats(): Promise<{
    mrr: number;
    arr: number;
    revenueByPlan: { plan: string; revenue: number }[];
    revenueGrowth: number;
  }> {
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('plan_id, status');

    const MRR_PRICES: Record<string, number> = { free: 0, pro: 29, enterprise: 79 };
    const activeSubs = (subs || []).filter((s: any) => s.status === 'active');
    
    const mrr = activeSubs.reduce((sum: number, s: any) => sum + (MRR_PRICES[s.plan_id] || 0), 0);
    const arr = mrr * 12;

    const revenueByPlan = Object.entries(
      activeSubs.reduce((acc: Record<string, number>, s: any) => {
        acc[s.plan_id] = (acc[s.plan_id] || 0) + (MRR_PRICES[s.plan_id] || 0);
        return acc;
      }, {})
    ).map(([plan, revenue]) => ({ plan, revenue }));

    return {
      mrr,
      arr,
      revenueByPlan,
      revenueGrowth: 12.5, // Mock growth percentage
    };
  },
};

// ─────────────────────────────────────────
// Export all services
// ─────────────────────────────────────────

export const DevAdminServices = {
  auth: AdminAuthService,
  dashboard: DashboardStatsService,
  features: FeatureFlagsService,
  modules: AccountingModulesService,
  ai: AIControlService,
  monitoring: SystemMonitoringService,
  notifications: NotificationsService,
  devTools: DeveloperToolsService,
  billing: BillingService,
};

export default DevAdminServices;
