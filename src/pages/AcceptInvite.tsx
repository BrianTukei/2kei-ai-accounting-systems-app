/**
 * AcceptInvite.tsx
 * ────────────────
 * Handles invitation acceptance when a user clicks the invite link.
 * URL: /accept-invite?token=<token>
 *
 * Flow:
 *   1. Validate token against team_invitations table
 *   2. If user is logged in → accept immediately
 *   3. If not logged in → prompt to sign up / sign in, then accept
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Check, AlertTriangle, Loader2, Users, LogIn, UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BrandLogo from '@/components/BrandLogo';

interface InviteDetails {
  id:              string;
  email:           string;
  role:            string;
  organizationId:  string;
  orgName:         string;
  invitedByEmail?: string;
  expiresAt:       string;
  accepted:        boolean;
}

type PageState = 'loading' | 'valid' | 'expired' | 'already-accepted' | 'invalid' | 'accepting' | 'accepted' | 'error';

const ROLE_LABELS: Record<string, string> = {
  owner:      'Owner',
  accountant: 'Accountant',
  manager:    'Manager',
  viewer:     'Viewer',
};

const ROLE_DESC: Record<string, string> = {
  owner:      'Full access to manage the organization',
  accountant: 'Edit transactions and view reports',
  manager:    'View transactions and reports',
  viewer:     'Read-only access to view reports',
};

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const token = searchParams.get('token');

  const [state, setState]   = useState<PageState>('loading');
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [error, setError]   = useState('');

  // ── Load invitation details ────────

  useEffect(() => {
    if (!token) {
      setState('invalid');
      setError('No invitation token provided.');
      return;
    }

    const loadInvite = async () => {
      try {
        // Query team_invitations by token
        const { data, error: fetchErr } = await supabase
          .from('team_invitations')
          .select('id, email, role, organization_id, accepted, expires_at')
          .eq('token', token)
          .single();

        if (fetchErr || !data) {
          setState('invalid');
          setError('This invitation link is invalid or has been revoked.');
          return;
        }

        if (data.accepted) {
          setState('already-accepted');
          return;
        }

        if (new Date(data.expires_at) < new Date()) {
          setState('expired');
          return;
        }

        // Try to get org name
        let orgName = 'the organization';
        try {
          const { data: orgRow } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', data.organization_id)
            .single();
          if (orgRow) orgName = orgRow.name;
        } catch { /* ignore */ }

        setInvite({
          id:             data.id,
          email:          data.email,
          role:           data.role,
          organizationId: data.organization_id,
          orgName,
          expiresAt:      data.expires_at,
          accepted:       data.accepted,
        });

        setState('valid');
      } catch {
        setState('error');
        setError('Failed to load invitation details. Please try again.');
      }
    };

    loadInvite();
  }, [token]);

  // ── Accept invitation ────────

  const acceptInvitation = async () => {
    if (!invite || !user) return;

    setState('accepting');

    try {
      // 1. Add user to organization_users
      const { error: joinErr } = await supabase
        .from('organization_users')
        .insert({
          organization_id: invite.organizationId,
          user_id:         user.id,
          role:            invite.role,
          invite_accepted: true,
          invite_token:    token,
          invite_email:    invite.email,
          joined_at:       new Date().toISOString(),
        });

      if (joinErr) throw joinErr;

      // 2. Mark invitation as accepted
      await supabase
        .from('team_invitations')
        .update({ accepted: true })
        .eq('id', invite.id);

      setState('accepted');
      toast.success(`Welcome to ${invite.orgName}!`);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to accept invitation';
      
      // Handle duplicate membership
      if (msg.includes('duplicate') || msg.includes('unique')) {
        setState('already-accepted');
        return;
      }

      setState('error');
      setError(msg);
      toast.error('Failed to accept invitation. Please try again.');
    }
  };

  // ── Render ────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <BrandLogo size="lg" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">2K AI Accounting Systems</h1>
        </div>

        <Card className="shadow-lg border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Team Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Loading */}
            {state === 'loading' && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Loading invitation…</p>
              </div>
            )}

            {/* Valid invitation — show details */}
            {state === 'valid' && invite && (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-7 h-7 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    You're invited to join
                  </h3>
                  <p className="text-xl font-bold text-indigo-600 mt-1">{invite.orgName}</p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-slate-500">Your role</span>
                    <Badge variant="secondary" className="text-xs">
                      {ROLE_LABELS[invite.role] || invite.role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-slate-500">Permissions</span>
                    <span className="text-slate-700 dark:text-slate-300 text-xs">
                      {ROLE_DESC[invite.role] || 'Access to the organization'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-slate-500">Expires</span>
                    <span className="text-slate-700 dark:text-slate-300 text-xs">
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {user ? (
                  <Button
                    className="w-full gap-2"
                    onClick={acceptInvitation}
                  >
                    <Check className="w-4 h-4" /> Accept & Join
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500 text-center">
                      Sign in or create an account to accept this invitation.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => navigate(`/auth?redirect=/accept-invite?token=${token}`)}
                      >
                        <LogIn className="w-4 h-4" /> Sign In
                      </Button>
                      <Button
                        className="flex-1 gap-2"
                        onClick={() => navigate(`/signup?redirect=/accept-invite?token=${token}&email=${encodeURIComponent(invite.email)}`)}
                      >
                        <UserPlus className="w-4 h-4" /> Sign Up
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Accepting */}
            {state === 'accepting' && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Joining the team…</p>
              </div>
            )}

            {/* Accepted */}
            {state === 'accepted' && (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Welcome to the team!
                </h3>
                <p className="text-slate-500 text-sm">Redirecting to your dashboard…</p>
              </div>
            )}

            {/* Already accepted */}
            {state === 'already-accepted' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Invitation already accepted
                </h3>
                <p className="text-slate-500 text-sm">This invitation has already been used.</p>
                <Button onClick={() => navigate('/dashboard')} className="gap-2">
                  Go to Dashboard <Check className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Expired */}
            {state === 'expired' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Invitation expired
                </h3>
                <p className="text-slate-500 text-sm">
                  This invitation has expired. Please ask the organization owner to send a new one.
                </p>
                <Button variant="outline" onClick={() => navigate('/auth')}>
                  Go to Sign In
                </Button>
              </div>
            )}

            {/* Invalid */}
            {state === 'invalid' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Invalid invitation
                </h3>
                <p className="text-slate-500 text-sm">{error}</p>
                <Button variant="outline" onClick={() => navigate('/auth')}>
                  Go to Sign In
                </Button>
              </div>
            )}

            {/* Error */}
            {state === 'error' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Something went wrong
                </h3>
                <p className="text-slate-500 text-sm">{error}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
