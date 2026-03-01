/**
 * useDeveloperAdmin.ts
 * ════════════════════
 * Custom React hooks for the Developer Admin Dashboard.
 * Provides data fetching, caching, mutations, and state management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import {
  AdminAuthService,
  DashboardStatsService,
  FeatureFlagsService,
  AccountingModulesService,
  AIControlService,
  SystemMonitoringService,
  NotificationsService,
  DeveloperToolsService,
  BillingService,
  AdminRole,
  AdminUser,
  DashboardStats,
  FeatureFlag,
  AccountingModule,
  AIConfig,
  SystemHealthStatus,
  ErrorLog,
  ActivityLog,
  Announcement,
  APIKey,
  Webhook,
  BackgroundJob,
  RefundRequest,
} from '@/services/developerAdminService';
import { useToast } from './use-toast';

// Query keys for cache management
const QUERY_KEYS = {
  adminUser: ['admin', 'user'],
  adminRole: ['admin', 'role'],
  dashboardStats: ['admin', 'dashboard', 'stats'],
  featureFlags: ['admin', 'features'],
  accountingModules: ['admin', 'modules'],
  aiConversations: ['admin', 'ai', 'conversations'],
  aiConfig: ['admin', 'ai', 'config'],
  aiUsageStats: ['admin', 'ai', 'usage'],
  systemHealth: ['admin', 'system', 'health'],
  errorLogs: ['admin', 'system', 'errors'],
  activityLogs: ['admin', 'system', 'activity'],
  announcements: ['admin', 'notifications', 'announcements'],
  apiKeys: ['admin', 'devtools', 'apikeys'],
  webhooks: ['admin', 'devtools', 'webhooks'],
  backgroundJobs: ['admin', 'devtools', 'jobs'],
  refundRequests: ['admin', 'billing', 'refunds'],
  revenueStats: ['admin', 'billing', 'revenue'],
};

// ─────────────────────────────────────────
// Admin Authentication Hook
// ─────────────────────────────────────────

export function useAdminAuth() {
  const { toast } = useToast();

  const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery({
    queryKey: QUERY_KEYS.adminRole,
    queryFn: AdminAuthService.isAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: adminRole } = useQuery({
    queryKey: ['admin', 'role', 'type'],
    queryFn: AdminAuthService.getAdminRole,
    enabled: isAdmin === true,
    staleTime: 5 * 60 * 1000,
  });

  const { data: adminUser } = useQuery({
    queryKey: QUERY_KEYS.adminUser,
    queryFn: AdminAuthService.getAdminUser,
    enabled: isAdmin === true,
    staleTime: 5 * 60 * 1000,
  });

  const hasPermission = useCallback((requiredRole: AdminRole): boolean => {
    return AdminAuthService.hasPermission(adminRole ?? null, requiredRole);
  }, [adminRole]);

  // Update last active on mount
  useEffect(() => {
    if (isAdmin) {
      AdminAuthService.updateLastActive().catch(() => {});
    }
  }, [isAdmin]);

  return {
    isAdmin: isAdmin ?? false,
    isCheckingAdmin,
    adminRole,
    adminUser,
    hasPermission,
    isSuperAdmin: adminRole === 'super_admin',
    isDeveloper: adminRole === 'developer' || adminRole === 'super_admin',
  };
}

// ─────────────────────────────────────────
// Dashboard Stats Hook
// ─────────────────────────────────────────

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: QUERY_KEYS.dashboardStats,
    queryFn: DashboardStatsService.getStats,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

// ─────────────────────────────────────────
// Feature Flags Hook
// ─────────────────────────────────────────

export function useFeatureFlags() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery<FeatureFlag[]>({
    queryKey: QUERY_KEYS.featureFlags,
    queryFn: FeatureFlagsService.list,
    staleTime: 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<FeatureFlag> }) =>
      FeatureFlagsService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.featureFlags });
      toast({ title: 'Feature flag updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      FeatureFlagsService.toggle(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.featureFlags });
      toast({ title: 'Feature flag toggled' });
    },
    onError: (error: any) => {
      toast({ title: 'Toggle failed', description: error.message, variant: 'destructive' });
    },
  });

  return {
    ...query,
    updateFlag: updateMutation.mutate,
    toggleFlag: toggleMutation.mutate,
    isUpdating: updateMutation.isPending || toggleMutation.isPending,
  };
}

// ─────────────────────────────────────────
// Accounting Modules Hook
// ─────────────────────────────────────────

export function useAccountingModules() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery<AccountingModule[]>({
    queryKey: QUERY_KEYS.accountingModules,
    queryFn: AccountingModulesService.list,
    staleTime: 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AccountingModule> }) =>
      AccountingModulesService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountingModules });
      toast({ title: 'Module updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      AccountingModulesService.toggle(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountingModules });
      toast({ title: 'Module toggled' });
    },
    onError: (error: any) => {
      toast({ title: 'Toggle failed', description: error.message, variant: 'destructive' });
    },
  });

  return {
    ...query,
    updateModule: updateMutation.mutate,
    toggleModule: toggleMutation.mutate,
    isUpdating: updateMutation.isPending || toggleMutation.isPending,
  };
}

// ─────────────────────────────────────────
// AI Control Hook
// ─────────────────────────────────────────

export function useAIControl() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [conversationParams, setConversationParams] = useState({ limit: 50, offset: 0 });

  const conversationsQuery = useQuery({
    queryKey: [...QUERY_KEYS.aiConversations, conversationParams],
    queryFn: () => AIControlService.getConversations(conversationParams),
    staleTime: 30 * 1000,
  });

  const configQuery = useQuery<AIConfig[]>({
    queryKey: QUERY_KEYS.aiConfig,
    queryFn: AIControlService.getConfig,
    staleTime: 60 * 1000,
  });

  const usageStatsQuery = useQuery({
    queryKey: QUERY_KEYS.aiUsageStats,
    queryFn: AIControlService.getUsageStats,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AIConfig> }) =>
      AIControlService.updateConfig(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.aiConfig });
      toast({ title: 'AI configuration updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    },
  });

  return {
    conversations: conversationsQuery.data?.conversations ?? [],
    conversationsTotal: conversationsQuery.data?.total ?? 0,
    isLoadingConversations: conversationsQuery.isLoading,
    setConversationParams,
    config: configQuery.data ?? [],
    isLoadingConfig: configQuery.isLoading,
    usageStats: usageStatsQuery.data,
    isLoadingUsageStats: usageStatsQuery.isLoading,
    updateConfig: updateConfigMutation.mutate,
    isUpdatingConfig: updateConfigMutation.isPending,
  };
}

// ─────────────────────────────────────────
// System Monitoring Hook
// ─────────────────────────────────────────

export function useSystemMonitoring() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [errorParams, setErrorParams] = useState({ limit: 50, unresolvedOnly: false });
  const [activityParams, setActivityParams] = useState({ limit: 100 });

  const healthQuery = useQuery<SystemHealthStatus[]>({
    queryKey: QUERY_KEYS.systemHealth,
    queryFn: SystemMonitoringService.getHealthStatus,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });

  const errorLogsQuery = useQuery({
    queryKey: [...QUERY_KEYS.errorLogs, errorParams],
    queryFn: () => SystemMonitoringService.getErrorLogs(errorParams),
    staleTime: 30 * 1000,
  });

  const activityLogsQuery = useQuery({
    queryKey: [...QUERY_KEYS.activityLogs, activityParams],
    queryFn: () => SystemMonitoringService.getActivityLogs(activityParams),
    staleTime: 30 * 1000,
  });

  const resolveErrorMutation = useMutation({
    mutationFn: SystemMonitoringService.resolveError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.errorLogs });
      toast({ title: 'Error marked as resolved' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to resolve error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    healthStatus: healthQuery.data ?? [],
    isLoadingHealth: healthQuery.isLoading,
    errorLogs: errorLogsQuery.data?.logs ?? [],
    errorLogsTotal: errorLogsQuery.data?.total ?? 0,
    isLoadingErrors: errorLogsQuery.isLoading,
    setErrorParams,
    activityLogs: activityLogsQuery.data?.logs ?? [],
    activityLogsTotal: activityLogsQuery.data?.total ?? 0,
    isLoadingActivity: activityLogsQuery.isLoading,
    setActivityParams,
    resolveError: resolveErrorMutation.mutate,
    isResolvingError: resolveErrorMutation.isPending,
    overallHealth: healthQuery.data?.every(h => h.status === 'healthy')
      ? 'healthy'
      : healthQuery.data?.some(h => h.status === 'down')
        ? 'down'
        : 'degraded',
  };
}

// ─────────────────────────────────────────
// Notifications Hook
// ─────────────────────────────────────────

export function useNotifications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery<Announcement[]>({
    queryKey: QUERY_KEYS.announcements,
    queryFn: NotificationsService.listAnnouncements,
    staleTime: 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: NotificationsService.createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.announcements });
      toast({ title: 'Announcement created' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create announcement', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Announcement> }) =>
      NotificationsService.updateAnnouncement(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.announcements });
      toast({ title: 'Announcement updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update announcement', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: NotificationsService.deleteAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.announcements });
      toast({ title: 'Announcement deleted' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to delete announcement', description: error.message, variant: 'destructive' });
    },
  });

  return {
    ...query,
    createAnnouncement: createMutation.mutate,
    updateAnnouncement: updateMutation.mutate,
    deleteAnnouncement: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ─────────────────────────────────────────
// Developer Tools Hook
// ─────────────────────────────────────────

export function useDeveloperTools() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [jobsParams, setJobsParams] = useState({ limit: 50 });

  const apiKeysQuery = useQuery<APIKey[]>({
    queryKey: QUERY_KEYS.apiKeys,
    queryFn: DeveloperToolsService.listAPIKeys,
    staleTime: 60 * 1000,
  });

  const webhooksQuery = useQuery<Webhook[]>({
    queryKey: QUERY_KEYS.webhooks,
    queryFn: DeveloperToolsService.listWebhooks,
    staleTime: 60 * 1000,
  });

  const jobsQuery = useQuery<BackgroundJob[]>({
    queryKey: [...QUERY_KEYS.backgroundJobs, jobsParams],
    queryFn: () => DeveloperToolsService.listBackgroundJobs(jobsParams),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const revokeKeyMutation = useMutation({
    mutationFn: DeveloperToolsService.revokeAPIKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.apiKeys });
      toast({ title: 'API key revoked' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to revoke key', description: error.message, variant: 'destructive' });
    },
  });

  const toggleWebhookMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      DeveloperToolsService.toggleWebhook(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.webhooks });
      toast({ title: 'Webhook updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update webhook', description: error.message, variant: 'destructive' });
    },
  });

  const retryJobMutation = useMutation({
    mutationFn: DeveloperToolsService.retryJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.backgroundJobs });
      toast({ title: 'Job queued for retry' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to retry job', description: error.message, variant: 'destructive' });
    },
  });

  return {
    apiKeys: apiKeysQuery.data ?? [],
    isLoadingApiKeys: apiKeysQuery.isLoading,
    webhooks: webhooksQuery.data ?? [],
    isLoadingWebhooks: webhooksQuery.isLoading,
    jobs: jobsQuery.data ?? [],
    isLoadingJobs: jobsQuery.isLoading,
    setJobsParams,
    revokeKey: revokeKeyMutation.mutate,
    toggleWebhook: toggleWebhookMutation.mutate,
    retryJob: retryJobMutation.mutate,
    isRevoking: revokeKeyMutation.isPending,
    isTogglingWebhook: toggleWebhookMutation.isPending,
    isRetryingJob: retryJobMutation.isPending,
  };
}

// ─────────────────────────────────────────
// Billing Hook
// ─────────────────────────────────────────

export function useBilling() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [refundParams, setRefundParams] = useState({ status: '', limit: 50 });

  const refundsQuery = useQuery<RefundRequest[]>({
    queryKey: [...QUERY_KEYS.refundRequests, refundParams],
    queryFn: () => BillingService.listRefundRequests(refundParams),
    staleTime: 60 * 1000,
  });

  const revenueQuery = useQuery({
    queryKey: QUERY_KEYS.revenueStats,
    queryFn: BillingService.getRevenueStats,
    staleTime: 60 * 1000,
  });

  const processRefundMutation = useMutation({
    mutationFn: ({ id, approved, notes }: { id: string; approved: boolean; notes?: string }) =>
      BillingService.processRefund(id, approved, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.refundRequests });
      toast({ title: 'Refund processed' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to process refund', description: error.message, variant: 'destructive' });
    },
  });

  return {
    refunds: refundsQuery.data ?? [],
    isLoadingRefunds: refundsQuery.isLoading,
    setRefundParams,
    revenue: revenueQuery.data,
    isLoadingRevenue: revenueQuery.isLoading,
    processRefund: processRefundMutation.mutate,
    isProcessingRefund: processRefundMutation.isPending,
  };
}

// ─────────────────────────────────────────
// Combined Admin Dashboard Hook
// ─────────────────────────────────────────

export function useDeveloperAdminDashboard() {
  const auth = useAdminAuth();
  const stats = useDashboardStats();
  const features = useFeatureFlags();
  const modules = useAccountingModules();
  const ai = useAIControl();
  const monitoring = useSystemMonitoring();
  const notifications = useNotifications();
  const devTools = useDeveloperTools();
  const billing = useBilling();

  return {
    auth,
    stats,
    features,
    modules,
    ai,
    monitoring,
    notifications,
    devTools,
    billing,
    isLoading: auth.isCheckingAdmin || stats.isLoading,
  };
}

export default useDeveloperAdminDashboard;
