/**
 * teamInvitations.ts
 * ──────────────────
 * Service for managing team invitations — insert into DB,
 * trigger invitation emails via edge function, and handle
 * invite acceptance.
 */

import { supabase } from '@/integrations/supabase/client';
import type { OrgRole } from '@/lib/plans';

export interface InvitationPayload {
  organizationId: string;
  email:          string;
  role:           OrgRole;
  invitedBy:      string;
  orgName?:       string;
  invitedByName?: string;
}

export interface InvitationResult {
  success:    boolean;
  invitation: { id: string; token: string; email: string; role: string } | null;
  acceptUrl?: string;
  emailSent:  boolean;
  error?:     string;
}

/**
 * Insert a team invitation into the DB and optionally trigger the
 * invitation email via the send-team-invite edge function.
 */
export async function sendTeamInvitation(payload: InvitationPayload): Promise<InvitationResult> {
  const { organizationId, email, role, invitedBy, orgName, invitedByName } = payload;

  try {
    // 1. Insert into team_invitations — the DB generates `token` automatically
    const { data: row, error: insertErr } = await supabase
      .from('team_invitations')
      .insert({
        organization_id: organizationId,
        email,
        role,
        invited_by: invitedBy,
      })
      .select('id, token, email, role')
      .single();

    if (insertErr) throw insertErr;

    const invitation = {
      id:    row.id as string,
      token: row.token as string,
      email: row.email as string,
      role:  row.role as string,
    };

    // 2. Try to send the invitation email via edge function
    let emailSent = false;
    let acceptUrl: string | undefined;

    try {
      const { data: fnData, error: fnErr } = await supabase.functions.invoke(
        'send-team-invite',
        {
          body: {
            invitationId:  invitation.id,
            email:         invitation.email,
            role:          invitation.role,
            orgName:       orgName || '',
            invitedByName: invitedByName || '',
            token:         invitation.token,
          },
        }
      );

      if (!fnErr && fnData) {
        emailSent = fnData.emailSent ?? false;
        acceptUrl = fnData.acceptUrl;
      }
    } catch {
      // Edge function may not be deployed — invitation still created in DB
      console.warn('[teamInvitations] Edge function unavailable; invitation still stored in DB');
    }

    return {
      success: true,
      invitation,
      acceptUrl,
      emailSent,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create invitation';
    console.error('[teamInvitations] Error:', message);
    return {
      success: false,
      invitation: null,
      emailSent: false,
      error: message,
    };
  }
}

/**
 * Send invitation for local/demo orgs — stores in localStorage only
 * and generates a mock accept URL.
 */
export function sendLocalInvitation(email: string, role: string): {
  success: boolean;
  acceptUrl: string;
} {
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const stored = JSON.parse(localStorage.getItem('2k_pending_invites') || '[]');
  stored.push({ email, role, token, createdAt: new Date().toISOString() });
  localStorage.setItem('2k_pending_invites', JSON.stringify(stored));

  const acceptUrl = `${window.location.origin}/accept-invite?token=${token}`;
  return { success: true, acceptUrl };
}

/**
 * Revoke / remove a pending invitation.
 */
export async function revokeInvitation(invitationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId);
    return !error;
  } catch {
    return false;
  }
}
