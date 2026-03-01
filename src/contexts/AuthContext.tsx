import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';

/**
 * Platform owner email(s) that are automatically granted admin role on sign-in.
 * This ensures the owner always has admin access without manual SQL.
 */
const OWNER_EMAILS = [
  'briantukei1000@gmail.com',
  'tukeibrian5@gmail.com',
];

/** All localStorage keys used by the app that must be cleared on sign-out */
const APP_STORAGE_KEYS = [
  '2k_demo_user',
  '2k_demo_org',
  '2k_onboarding_org',
  '2k_onboarding_complete',
  '2k_onboarding_state',
  '2k_pending_invites',
  'ledgerly-demo-subscription',
  'ledgerly-demo-payments',
  'ledgerly-subscription-activated',
] as const;

/**
 * Log an auth event (login / logout / signup) to the auth_events table.
 * Runs silently — never blocks the UI or throws.
 */
async function logAuthEvent(
  userId: string,
  eventType: 'login' | 'logout' | 'token_refresh' | 'signup',
  metadata?: Record<string, any>,
) {
  try {
    await supabase.from('auth_events').insert({
      user_id: userId,
      event_type: eventType,
      user_agent: navigator.userAgent,
      metadata: metadata ?? {},
    });
  } catch {
    // Non-blocking — never let tracking break the app
  }
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  authResolved: boolean; // whether initial session check completed
  isEmailVerified: boolean;
  /** Centralized sign-out: clears all app data, Supabase session, and redirects to /auth */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  /** Centralized sign-out handler used by all components */
  const signOut = useCallback(async () => {
    try {
      // Log the logout event before clearing the session
      if (user?.id) {
        await logAuthEvent(user.id, 'logout', { email: user.email });
      }

      // 1. Clear all app-specific localStorage keys
      APP_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));

      // 2. Sign out of Supabase (ignore errors for demo users who have no real session)
      try {
        await supabase.auth.signOut();
      } catch {
        // Demo users won't have a real Supabase session — that's fine
      }

      toast.success('Signed out successfully');

      // 3. Full page reload to /auth to reset all React state
      window.location.href = '/auth';
    } catch (error) {
      console.error('[AuthContext] Sign-out error:', error);
      toast.error('Error signing out');
    }
  }, [user]);
  useEffect(() => {
    let unsub: (() => void) | undefined;

    console.log('[AuthContext] Initializing, checking session...');
    
    // Check for demo user first (local development fallback)
    const demoUserJson = localStorage.getItem('2k_demo_user');
    if (demoUserJson) {
      try {
        const demoUser = JSON.parse(demoUserJson);
        console.log('[AuthContext] Demo user found:', demoUser.email);
        setUser(demoUser as User);
        setSession({ user: demoUser } as Session);
        setIsEmailVerified(true);
        setAuthResolved(true);
        return; // Skip Supabase auth check for demo mode
      } catch (e) {
        console.warn('[AuthContext] Failed to parse demo user:', e);
        localStorage.removeItem('2k_demo_user');
      }
    }
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      const isVerified = session?.user?.email_confirmed_at ? true : false;
      
      console.log('[AuthContext] Initial session:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        isVerified 
      });
      
      setSession(session ?? null);
      setUser(session?.user ?? null);
      setIsEmailVerified(isVerified);
      setAuthResolved(true);

      // Auto-promote owner email to admin role if not already admin
      if (session?.user) {
        autoPromoteOwner(session.user);
      }

      // Only set up listener after initial check to avoid duplicate reactions
      const res = supabase.auth.onAuthStateChange((_event, newSession) => {
        const isNewUserVerified = newSession?.user?.email_confirmed_at ? true : false;
        
        console.log('[AuthContext] Auth state changed:', { 
          event: _event, 
          hasSession: !!newSession,
          userId: newSession?.user?.id,
          isVerified: isNewUserVerified
        });
        
        setSession(newSession ?? null);
        setUser(newSession?.user ?? null);
        setIsEmailVerified(isNewUserVerified);

        // Track auth events for admin visibility
        if (newSession?.user) {
          if (_event === 'SIGNED_IN') {
            logAuthEvent(newSession.user.id, 'login', { email: newSession.user.email });
          } else if (_event === 'TOKEN_REFRESHED') {
            // Don't log every token refresh — too noisy
          }
        }

        // Auto-promote owner on sign-in events
        if (newSession?.user && (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED')) {
          autoPromoteOwner(newSession.user);
        }
      });

      if (res && (res as any).data && (res as any).data.subscription && typeof (res as any).data.subscription.unsubscribe === 'function') {
        unsub = () => (res as any).data.subscription.unsubscribe();
      } else if (res && typeof (res as any).unsubscribe === 'function') {
        unsub = () => (res as any).unsubscribe();
      }
    }).catch((err) => {
      console.error('[AuthContext] Error getting session:', err);
      setAuthResolved(true);
    });

    return () => {
      if (unsub) unsub();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, authResolved, isEmailVerified, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * If the signed-in user is in the OWNER_EMAILS list, ensure they have
 * the 'admin' role in user_roles. This runs silently and only inserts
 * if the role isn't already present.
 */
async function autoPromoteOwner(user: User) {
  try {
    const email = user.email?.toLowerCase();
    if (!email || !OWNER_EMAILS.map(e => e.toLowerCase()).includes(email)) return;

    // Check if already has admin role
    const { data: existing } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (existing) return; // Already admin

    // Try to insert admin role
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role: 'admin' });

    if (error) {
      // RLS may block — try via edge function as fallback
      console.warn('[AuthContext] Direct admin insert blocked by RLS, trying edge function...', error.message);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-management`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'update-role', userId: user.id, newRole: 'admin' }),
          },
        );
      }
    }

    console.log('[AuthContext] Owner auto-promoted to admin:', email);
  } catch (err) {
    console.warn('[AuthContext] Auto-promote failed (non-critical):', err);
  }
}

export default AuthContext;
