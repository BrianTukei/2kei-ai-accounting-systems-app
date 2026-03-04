/**
 * OrganizationContext.tsx
 * ────────────────────────
 * Central multi-tenant context.  After auth resolves, this context:
 *   1. Loads the user's active organization from Supabase
 *   2. Loads the subscription (plan + status + limits)
 *   3. Tracks AI usage this month
 *   4. Exposes helpers: hasPermission(), canUseFeature(), isAtLimit()
 *
 * Every page wrapped in <ProtectedRoute> has access to this context.
 */

import React, {
  createContext, useContext, useEffect, useState, useCallback, useMemo,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import {
  Plan, PlanId, OrgRole, SubStatus, BillingCycle,
  PLANS, isAtLimit as _isAtLimit, ROLE_PERMISSIONS,
  trialDaysRemaining, isTrialActive,
} from '@/lib/plans';
import orgStorage from '@/lib/orgStorage';
import { getDemoSubscriptionData as getBillingDemoSub } from '@/services/billing';
import { getDemoSubscriptionData as getSubscriptionDemoSub } from '@/services/subscription';

/**
 * Get demo subscription data from either billing or subscription service
 * Prefers subscription service as it's the newer implementation
 */
function getDemoSubscriptionData() {
  const subData = getSubscriptionDemoSub();
  if (subData) {
    console.log('[OrganizationContext] Using subscription service demo data');
    return subData;
  }
  const billingData = getBillingDemoSub();
  if (billingData) {
    console.log('[OrganizationContext] Using billing service demo data (legacy)');
    return billingData;
  }
  return null;
}

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface Organization {
  id:        string;
  name:      string;
  slug:      string;
  logoUrl?:  string;
  industry?: string;
  country?:  string;
  timezone:  string;
  currency:  string;
  ownerId:   string;
}

export interface Subscription {
  id:              string;
  planId:          PlanId;
  status:          SubStatus;
  billingCycle:    BillingCycle;
  trialEndsAt?:    string;
  trialStartDate?: string;
  periodEnd?:      string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?:     string;
  stripeSubscriptionId?: string;
  paymentMethodLast4?:   string;
  paymentMethodBrand?:   string;
  paymentProvider?:      string;
}

export interface AIUsage {
  chats:       number;
  invoiceGens: number;
  bankImports: number;
}

export interface OrganizationContextType {
  /** The active organization (null while loading or if not set up yet) */
  org:             Organization | null;
  /** Current subscription */
  subscription:    Subscription | null;
  /** Current plan details (from PLANS constant) */
  plan:            Plan;
  /** The logged-in user's role within this org */
  role:            OrgRole;
  /** AI usage this calendar month */
  aiUsage:         AIUsage;
  /** True while first-load is in progress */
  loading:         boolean;
  /** True if the user has no org yet (needs onboarding) */
  needsOnboarding: boolean;
  /** Reload org + subscription from Supabase */
  refresh:         () => Promise<void>;
  /** Check permission for current role */
  can:             (permission: keyof typeof ROLE_PERMISSIONS[OrgRole]) => boolean;
  /** Check if a plan feature is available */
  hasFeature:      (feature: 'aiAssistant' | 'advancedReports' | 'payroll' | 'teamAccess') => boolean;
  /** Checks if user has hit a numeric limit */
  isAtLimit:       (metric: 'invoices' | 'aiChats' | 'bankImports') => boolean;
  /** Log an AI action and return false if over limit */
  trackAI:         (action: 'chat' | 'invoice_gen' | 'bank_import' | 'categorise') => Promise<boolean>;
  /** Current usage counts for display */
  usageCounts:     { invoices: number; aiChats: number; bankImports: number };
  /** Days left in trial (0 if not trialing) */
  trialDaysLeft:   number;
  /** True if subscription is currently in a valid trial */
  isTrialing:      boolean;
}

// ─────────────────────────────────────────
// Context
// ─────────────────────────────────────────

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = (): OrganizationContextType => {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used within OrganizationProvider');
  return ctx;
};

// ─────────────────────────────────────────
// Provider
// ─────────────────────────────────────────

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authResolved } = useAuth();

  const [org,          setOrg]          = useState<Organization | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [role,         setRole]         = useState<OrgRole>('viewer');
  const [aiUsage,      setAiUsage]      = useState<AIUsage>({ chats: 0, invoiceGens: 0, bankImports: 0 });
  const [loading,      setLoading]      = useState(true);
  const [usageCounts,  setUsageCounts]  = useState({ invoices: 0, aiChats: 0, bankImports: 0 });

  // ── Derived plan object ────────────────

  const plan: Plan = useMemo(() => {
    const planId = (subscription?.planId ?? 'free') as PlanId;
    return PLANS[planId] ?? PLANS.free;
  }, [subscription]);

  // ── Load org + subscription from Supabase ─

  const loadOrgData = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    setLoading(true);
    try {
      // 1. Get membership (first accepted org)
      const { data: membership } = await supabase
        .from('organization_users')
        .select('organization_id, role, invite_accepted')
        .eq('user_id', user.id)
        .eq('invite_accepted', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (!membership?.organization_id) {
        // Check for local/demo organization in localStorage (fallback for when Supabase isn't available)
        const localOrgJson = localStorage.getItem('2k_onboarding_org');
        const onboardingComplete = localStorage.getItem('2k_onboarding_complete') === 'true';
        
        console.log('[OrganizationContext] No Supabase membership, checking localStorage');
        
        if (localOrgJson) {
          try {
            const localOrg = JSON.parse(localOrgJson);
            // Allow if: has id+name AND (onboardingComplete flag OR localStorage flag)
            if (localOrg.id && localOrg.name && (localOrg.onboardingComplete || onboardingComplete)) {
              console.log('[OrganizationContext] Using localStorage org:', localOrg.name);
              const mappedLocal: Organization = {
                id:       localOrg.id,
                name:     localOrg.name,
                slug:     localOrg.slug || localOrg.id,
                logoUrl:  undefined,
                industry: undefined,
                country:  undefined,
                timezone: localOrg.timezone || 'UTC',
                currency: localOrg.currency || 'USD',
                ownerId:  user.id,
              };
              setOrg(mappedLocal);
              setRole('owner');
              
              // Check for demo subscription first, then fall back to local org plan
              const demoSub = getDemoSubscriptionData();
              if (demoSub) {
                console.log('[OrganizationContext] Using localStorage subscription:', demoSub.planId);
                setSubscription({
                  id: '',
                  planId: demoSub.planId,
                  status: demoSub.status,
                  billingCycle: demoSub.billingCycle,
                  periodEnd: demoSub.periodEnd,
                  cancelAtPeriodEnd: demoSub.cancelAtPeriodEnd,
                });
              } else {
                console.log('[OrganizationContext] No localStorage subscription, using local org plan:', localOrg.plan || 'free');
                // Set up default subscription for local org
                setSubscription({
                  id: '',
                  planId: (localOrg.plan as PlanId) || 'free',
                  status: 'active',
                  billingCycle: 'monthly',
                  cancelAtPeriodEnd: false,
                });
              }
              
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn('Failed to parse local org data:', e);
          }
        }
        
        setOrg(null);
        setLoading(false);
        return;
      }

      setRole(membership.role as OrgRole);

      // 2. Load organization details
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', membership.organization_id)
        .single();

      if (orgData) {
        const mapped: Organization = {
          id:       orgData.id,
          name:     orgData.name,
          slug:     orgData.slug,
          logoUrl:  orgData.logo_url ?? undefined,
          industry: orgData.industry ?? undefined,
          country:  orgData.country  ?? undefined,
          timezone: orgData.timezone,
          currency: orgData.currency,
          ownerId:  orgData.owner_id,
        };
        setOrg(mapped);

        // Migrate any legacy localStorage data into org namespace on first load
        orgStorage.migrateFromLegacy(orgData.id);
      }

      // 3. Load subscription
      //    - In demo mode: localStorage is the source of truth
      //    - In production: Supabase DB is the source of truth, localStorage is a cache
      let subscriptionLoaded = false;
      
      // Check if we're in demo mode (no real Supabase URL configured)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const realSupabaseMode = supabaseUrl && !supabaseUrl.includes('placeholder');

      if (realSupabaseMode) {
        // PRODUCTION: Check Supabase FIRST (DB is source of truth)
        console.log('[OrganizationContext] Production mode: checking Supabase DB for subscription');
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('organization_id', membership.organization_id)
          .single();

        if (subData) {
          console.log('[OrganizationContext] Found Supabase subscription:', subData.plan_id, subData.status);
          setSubscription({
            id:                subData.id,
            planId:            subData.plan_id as PlanId,
            status:            subData.status   as SubStatus,
            billingCycle:      subData.billing_cycle as BillingCycle,
            trialEndsAt:       subData.trial_ends_at  ?? undefined,
            trialStartDate:    (subData as any).trial_start_date ?? undefined,
            periodEnd:         subData.current_period_end ?? undefined,
            cancelAtPeriodEnd: subData.cancel_at_period_end,
            stripeCustomerId:     (subData as any).stripe_customer_id ?? undefined,
            stripeSubscriptionId: (subData as any).stripe_subscription_id ?? undefined,
            paymentMethodLast4:   (subData as any).payment_method_last4 ?? undefined,
            paymentMethodBrand:   (subData as any).payment_method_brand ?? undefined,
            paymentProvider:      (subData as any).payment_provider ?? undefined,
          });
          subscriptionLoaded = true;
        } else {
          // No Supabase subscription — check localStorage as fallback
          // (may have been activated via demo mode or edge function not yet deployed)
          const demoSub = getDemoSubscriptionData();
          if (demoSub && demoSub.planId !== 'free') {
            console.log('[OrganizationContext] No DB subscription, using localStorage cache:', demoSub.planId);
            setSubscription({
              id:                '',
              planId:            demoSub.planId,
              status:            demoSub.status,
              billingCycle:      demoSub.billingCycle,
              trialEndsAt:       undefined,
              periodEnd:         demoSub.periodEnd,
              cancelAtPeriodEnd: demoSub.cancelAtPeriodEnd,
            });
            subscriptionLoaded = true;
          }
        }
      } else {
        // DEMO MODE: localStorage is the source of truth
        const demoSub = getDemoSubscriptionData();
        if (demoSub) {
          console.log('[OrganizationContext] Demo mode: using localStorage subscription:', demoSub.planId);
          setSubscription({
            id:                '',
            planId:            demoSub.planId,
            status:            demoSub.status,
            billingCycle:      demoSub.billingCycle,
            trialEndsAt:       undefined,
            periodEnd:         demoSub.periodEnd,
            cancelAtPeriodEnd: demoSub.cancelAtPeriodEnd,
          });
          subscriptionLoaded = true;
        }
      }

      // Default to free plan if nothing found anywhere
      if (!subscriptionLoaded) {
        console.log('[OrganizationContext] No subscription found anywhere, defaulting to free');
        setSubscription({
          id: '',
          planId: 'free',
          status: 'active',
          billingCycle: 'monthly',
          cancelAtPeriodEnd: false,
        });
      }

      // 4. Load AI usage this month
      const month = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data: usageRows } = await supabase
        .from('ai_usage_log')
        .select('action')
        .eq('organization_id', membership.organization_id)
        .eq('month', month);

      const counts = { chats: 0, invoiceGens: 0, bankImports: 0 };
      if (usageRows) {
        usageRows.forEach((r: { action: string }) => {
          if (r.action === 'chat')          counts.chats++;
          if (r.action === 'invoice_gen')   counts.invoiceGens++;
          if (r.action === 'bank_import')   counts.bankImports++;
        });
      }
      setAiUsage(counts);

      // 5. Count invoices this month from local storage
      const invoiceList: Array<{ createdAt?: string }> =
        orgStorage.getJSON(membership.organization_id, '2kai-invoices', []);
      const now = new Date();
      const invoicesThisMonth = invoiceList.filter((inv) => {
        if (!inv.createdAt) return false;
        const d = new Date(inv.createdAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }).length;

      setUsageCounts({
        invoices:   invoicesThisMonth,
        aiChats:    counts.chats,
        bankImports: counts.bankImports,
      });

    } catch (err) {
      console.error('[OrganizationContext] load error:', err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (authResolved) loadOrgData();
  }, [authResolved, loadOrgData]);

  // ── Helpers ───────────────────────────

  const can = useCallback(
    (permission: keyof typeof ROLE_PERMISSIONS[OrgRole]): boolean =>
      ROLE_PERMISSIONS[role]?.[permission] ?? false,
    [role],
  );

  const hasFeature = useCallback(
    (feature: 'aiAssistant' | 'advancedReports' | 'payroll' | 'teamAccess'): boolean => {
      const map: Record<string, boolean> = {
        aiAssistant:    plan.hasAiAssistant,
        advancedReports: plan.hasAdvancedReports,
        payroll:         plan.hasPayroll,
        teamAccess:      plan.hasTeamAccess,
      };
      return map[feature] ?? false;
    },
    [plan],
  );

  const isAtLimit = useCallback(
    (metric: 'invoices' | 'aiChats' | 'bankImports'): boolean => {
      const limitMap: Record<string, number> = {
        invoices:   plan.maxInvoicesPerMonth,
        aiChats:    plan.maxAiChatsPerMonth,
        bankImports: plan.maxBankImportsPerMonth,
      };
      const usageMap: Record<string, number> = {
        invoices:    usageCounts.invoices,
        aiChats:     aiUsage.chats,
        bankImports: aiUsage.bankImports,
      };
      return _isAtLimit(usageMap[metric] ?? 0, limitMap[metric] ?? 0);
    },
    [plan, usageCounts, aiUsage],
  );

  const trackAI = useCallback(
    async (action: 'chat' | 'invoice_gen' | 'bank_import' | 'categorise'): Promise<boolean> => {
      if (!org || !user) return false;

      // Check limit before inserting
      const limitMap: Record<string, number> = {
        chat:        plan.maxAiChatsPerMonth,
        invoice_gen: plan.maxInvoicesPerMonth,
        bank_import: plan.maxBankImportsPerMonth,
        categorise:  -1,
      };
      const usageMap: Record<string, number> = {
        chat:        aiUsage.chats,
        invoice_gen: aiUsage.invoiceGens,
        bank_import: aiUsage.bankImports,
        categorise:  0,
      };

      if (_isAtLimit(usageMap[action] ?? 0, limitMap[action] ?? 0)) return false;

      const month = new Date().toISOString().slice(0, 7);
      await supabase.from('ai_usage_log').insert({
        organization_id: org.id,
        user_id:         user.id,
        action,
        month,
      });

      // Optimistically update local state
      setAiUsage((prev) => ({
        chats:       action === 'chat'        ? prev.chats + 1       : prev.chats,
        invoiceGens: action === 'invoice_gen' ? prev.invoiceGens + 1 : prev.invoiceGens,
        bankImports: action === 'bank_import' ? prev.bankImports + 1 : prev.bankImports,
      }));

      return true;
    },
    [org, user, plan, aiUsage],
  );

  const needsOnboarding = !loading && authResolved && !!user && !org;

  const trialDaysLeft = useMemo(() => {
    if (!subscription?.trialEndsAt) return 0;
    return trialDaysRemaining(subscription.trialEndsAt);
  }, [subscription]);

  const isTrialingNow = useMemo(() => {
    if (subscription?.status === 'trialing' && subscription?.trialEndsAt) {
      return isTrialActive(subscription.trialEndsAt);
    }
    return false;
  }, [subscription]);

  const value: OrganizationContextType = {
    org,
    subscription,
    plan,
    role,
    aiUsage,
    loading,
    needsOnboarding,
    refresh: loadOrgData,
    can,
    hasFeature,
    isAtLimit,
    trackAI,
    usageCounts,
    trialDaysLeft,
    isTrialing: isTrialingNow,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

export default OrganizationContext;
