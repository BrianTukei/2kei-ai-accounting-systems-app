import React from 'react';
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

const ProtectedRoute = ({ 
  children, 
  allowWithoutOrg = false,
  requireActiveSubscription = false,
  skipSubscriptionCheck = false,
}: ProtectedRouteProps) => {
  const { user, authResolved, isEmailVerified } = useAuth();
  const { loading: orgLoading, needsOnboarding, subscription, plan } = useOrganization();
  const location = useLocation();

  // Check for demo user
  const isDemoUser = localStorage.getItem('2k_demo_user') !== null;
  
  // Check if current route is exempt from subscription check
  const isExemptRoute = SUBSCRIPTION_EXEMPT_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );

  // 1. Wait for both auth AND org to resolve
  if (!authResolved || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-500">Loading workspace…</p>
        </div>
      </div>
    );
  }

  // 2. Not authenticated → login (demo users skip email verification)
  if (!user) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // 3. Email not verified → email confirmation page (demo users skip)
  if (!isEmailVerified && !isDemoUser) {
    console.log('[ProtectedRoute] Email not verified, redirecting to email-confirmation');
    return <Navigate to="/email-confirmation" replace />;
  }

  // 3. No org yet → onboarding (unless this route explicitly allows it)
  if (needsOnboarding && !allowWithoutOrg) {
    console.log('[ProtectedRoute] Needs onboarding, redirecting');
    return <Navigate to="/onboarding" replace />;
  }

  // 4. Subscription check (if required and not exempt)
  if (requireActiveSubscription && !skipSubscriptionCheck && !isExemptRoute) {
    const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';
    const isFreePlan = plan?.id === 'free';
    
    // If no active subscription and route requires it, redirect to billing
    // Note: Free plan users are considered as having "active" subscription on free tier
    if (!hasActiveSubscription && !isFreePlan) {
      console.log('[ProtectedRoute] No active subscription, redirecting to billing', {
        subscriptionStatus: subscription?.status,
        planId: plan?.id,
      });
      return <Navigate to="/billing" replace state={{ from: location }} />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
