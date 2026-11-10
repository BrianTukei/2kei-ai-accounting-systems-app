import React, { useEffect, useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * When true, the route is accessible even if the user hasn't created
   * an organization yet (e.g. /onboarding, /super-admin).
   */
  allowWithoutOrg?: boolean;
  /**
   * When true, the route requires an active subscription.
   * Users without active subscription will be redirected to billing.
   * Default: false (allow free tier access)
   */
  requireActiveSubscription?: boolean;
  /**
   * When true, this route is accessible without subscription check
   * (e.g., /billing page itself to avoid redirect loops).
   */
  skipSubscriptionCheck?: boolean;
}

// Routes that should always be accessible without subscription
const SUBSCRIPTION_EXEMPT_ROUTES = [
  '/billing',
  '/onboarding',
  '/profile',
  '/settings',
  '/super-admin',
  '/admin',
  '/dev-admin',
  '/admin-test',
];

/** Max seconds to wait for org loading before showing fallback */
const LOADING_TIMEOUT_MS = 12_000;

const ProtectedRoute = ({ 
  children, 
  allowWithoutOrg = false,
  requireActiveSubscription = false,
  skipSubscriptionCheck = false,
}: ProtectedRouteProps) => {
  const { user, authResolved, isEmailVerified } = useAuth();
  const { loading: orgLoading, needsOnboarding, subscription, plan } = useOrganization();
  const location = useLocation();

  // Safety timeout to prevent infinite loading spinner
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!orgLoading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => {
      if (orgLoading) {
        console.warn('[ProtectedRoute] Loading timed out after', LOADING_TIMEOUT_MS, 'ms');
        setTimedOut(true);
      }
    }, LOADING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [orgLoading]);

  // Check for demo user
  const isDemoUser = localStorage.getItem('2k_demo_user') !== null;
  
  // Check if current route is exempt from subscription check
  const isExemptRoute = SUBSCRIPTION_EXEMPT_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );

  // 1. Wait for auth to resolve (always required)
  if (!authResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-500">Authenticating…</p>
        </div>
      </div>
    );
  }

  // 2. Wait for org to load (but with timeout protection)
  if (orgLoading && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-500">Loading workspace…</p>
        </div>
      </div>
    );
  }

  // 2b. If loading timed out, let the user through (fallback to free plan)
  if (timedOut && orgLoading) {
    console.warn('[ProtectedRoute] Proceeding despite timeout — org may not be fully loaded');
  }

  // 3. Not authenticated → login (demo users skip email verification)
  if (!user) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // 4. Email not verified → email confirmation page (demo users skip)
  if (!isEmailVerified && !isDemoUser) {
    console.log('[ProtectedRoute] Email not verified, redirecting to email-confirmation');
    return <Navigate to="/email-confirmation" replace />;
  }

  // 5. No org yet → onboarding (unless this route explicitly allows it)
  if (needsOnboarding && !allowWithoutOrg) {
    console.log('[ProtectedRoute] Needs onboarding, redirecting');
    return <Navigate to="/onboarding" replace />;
  }

  // 6. Paid-feature gate (reports, AI, payroll, bank import, etc.)
  if (requireActiveSubscription && !skipSubscriptionCheck && !isExemptRoute) {
    const planId = plan?.id || 'free';
    const isPaidPlan = planId === 'pro' || planId === 'enterprise';
    const status = subscription?.status;
    const statusOk = !status || status === 'active' || status === 'trialing';

    // Free plan (or inactive paid) cannot open premium routes
    if (!isPaidPlan || !statusOk) {
      console.log('[ProtectedRoute] Premium feature blocked', {
        subscriptionStatus: status,
        planId,
      });
      return <Navigate to="/billing" replace state={{ from: location }} />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
