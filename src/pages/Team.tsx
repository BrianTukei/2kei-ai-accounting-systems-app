/**
 * Team.tsx
 * ─────────
 * Team member management:
 *   - List current members with roles
 *   - Invite new members by email
 *   - Change member roles
 *   - Remove members
 *   - View pending invitations
 */

import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';
import { ROLE_LABELS, type OrgRole } from '@/lib/plans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { UserPlus, Mail, Trash2, Crown, Clock, Copy, Check, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sendTeamInvitation } from '@/services/teamInvitations';
import { ScrollableContent } from '@/components/ui/ScrollableContent';

interface Member {
  id:           string;
  userId:       string;
  email:        string;
  displayName:  string;
  role:         OrgRole;
  joinedAt?:    string;
}

interface Invitation {
  id:        string;
  email:     string;
  role:      OrgRole;
  expiresAt: string;
  accepted:  boolean;
}

const ROLE_BADGE_CLASS: Record<OrgRole, string> = {
  owner:      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  accountant: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  manager:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  viewer:     'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export default function Team() {
  const { org, role: myRole, plan, can } = useOrganization();
  const { user } = useAuth();

  const [members,     setMembers]     = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading,     setLoading]     = useState(true);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole,  setInviteRole]  = useState<OrgRole>('viewer');
  const [inviting,    setInviting]    = useState(false);

  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // ── Load members + invitations ────────

  const loadTeam = async () => {
    if (!org) return;
    setLoading(true);
    try {
      // Members
      const { data: memberRows } = await supabase
        .from('organization_users')
        .select('id, user_id, role, joined_at')
        .eq('organization_id', org.id)
        .eq('invite_accepted', true);

      if (memberRows) {
        // Fetch profile/email info from auth.users via a supabase function
        // (In production use an admin API or store display_name in profiles table)
        const mapped: Member[] = memberRows.map((r: {
          id: string; user_id: string; role: string; joined_at: string | null;
        }) => ({
          id:          r.id,
          userId:      r.user_id,
          email:       r.user_id.slice(0, 8) + '…', // placeholder; real app fetches profile
          displayName: 'User ' + r.user_id.slice(0, 6),
          role:        r.role as OrgRole,
          joinedAt:    r.joined_at ?? undefined,
        }));
        setMembers(mapped);
      }

      // Pending invitations
      const { data: invRows } = await supabase
        .from('team_invitations')
        .select('id, email, role, expires_at, accepted')
        .eq('organization_id', org.id)
        .eq('accepted', false)
        .gt('expires_at', new Date().toISOString());

      if (invRows) {
        setInvitations(invRows.map((r: {
          id: string; email: string; role: string; expires_at: string; accepted: boolean;
        }) => ({
          id:        r.id,
          email:     r.email,
          role:      r.role as OrgRole,
          expiresAt: r.expires_at,
          accepted:  r.accepted,
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTeam(); }, [org]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Invite ─────────────────────────────

  const handleInvite = async () => {
    if (!org || !inviteEmail.trim() || !user) return;

    const atLimit = plan.maxUsers !== -1 && members.length >= plan.maxUsers;
    if (atLimit) {
      toast.error(`Your ${plan.name} plan supports up to ${plan.maxUsers} members. Upgrade to add more.`);
      return;
    }

    setInviting(true);
    try {
      const result = await sendTeamInvitation({
        organizationId: org.id,
        email: inviteEmail.trim(),
        role: inviteRole,
        invitedBy: user.id,
        orgName: org.name,
        invitedByName: user.email || 'Team admin',
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to send invitation');
      }

      if (result.emailSent) {
        toast.success(`Invitation email sent to ${inviteEmail.trim()}`);
      } else {
        // Email not delivered — show the link for manual sharing
        toast.info('Invitation created. Share the link below with your invitee.');
      }

      // Always show the accept link so the inviter can share it
      if (result.acceptUrl) {
        setInviteLink(result.acceptUrl);
        setLinkCopied(false);
      }

      setInviteEmail('');
      loadTeam();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send invitation.';
      toast.error(msg);
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      toast.success('Invite link copied!');
      setTimeout(() => setLinkCopied(false), 3000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  // ── Change role ───────────────────────

  const handleRoleChange = async (memberId: string, newRole: OrgRole) => {
    if (!org) return;
    const { error } = await supabase
      .from('organization_users')
      .update({ role: newRole })
      .eq('id', memberId);
    if (error) {
      toast.error('Could not update role.');
    } else {
      toast.success('Role updated.');
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m));
    }
  };

  // ── Remove member ─────────────────────

  const handleRemove = async () => {
    if (!removeTarget || !org) return;
    const { error } = await supabase
      .from('organization_users')
      .delete()
      .eq('id', removeTarget.id);
    if (error) {
      toast.error('Could not remove member.');
    } else {
      toast.success('Member removed.');
      setMembers((prev) => prev.filter((m) => m.id !== removeTarget.id));
    }
    setRemoveTarget(null);
  };

  // ── Revoke invitation ─────────────────

  const handleRevokeInvite = async (invId: string) => {
    await supabase.from('team_invitations').delete().eq('id', invId);
    setInvitations((prev) => prev.filter((i) => i.id !== invId));
    toast.success('Invitation revoked.');
  };

  const canManage = can('canManageTeam');
  const memberCount = members.length;
  const maxUsers = plan.maxUsers;

  return (
    <PageLayout
      title="Team Members"
      subtitle="Manage who has access to your organization's accounting workspace."
      showBackButton={false}
    >
      <SubscriptionGuard feature="teamAccess">
        <ScrollableContent>
        <div className="space-y-6">

          {/* Stats */}
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>
              <strong className="text-slate-800 dark:text-slate-200">{memberCount}</strong>{' '}
              member{memberCount !== 1 ? 's' : ''}
            </span>
            {maxUsers !== -1 && (
              <span className="text-slate-400">·  {maxUsers - memberCount} seats remaining</span>
            )}
          </div>

          {/* Invite form */}
          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-500" /> Invite a Team Member
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 flex-wrap">
                  <div className="flex-1 min-w-48">
                    <Label className="text-xs mb-1 block">Email address</Label>
                    <Input
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Role</Label>
                    <Select defaultValue="viewer" onValueChange={(v) => setInviteRole(v as OrgRole)}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accountant">Accountant</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="gap-2">
                      <Mail className="w-4 h-4" />
                      {inviting ? 'Sending…' : 'Send invite'}
                    </Button>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-400 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.entries(ROLE_LABELS) as [OrgRole, string][]).map(([r, label]) => (
                    <div key={r} className="flex items-center gap-1.5">
                      <span className={cn('px-1.5 py-0.5 rounded text-xs', ROLE_BADGE_CLASS[r])}>{label}</span>
                      <span className="text-slate-400">—</span>
                      <span>
                        {r === 'owner'      && 'Full access'}
                        {r === 'accountant' && 'Edit transactions'}
                        {r === 'manager'    && 'View reports'}
                        {r === 'viewer'     && 'Read only'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invite link sharing card */}
          {inviteLink && (
            <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Share this invite link
                  </span>
                </div>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={inviteLink}
                    className="text-xs bg-white dark:bg-slate-900 flex-1"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button size="sm" variant="outline" onClick={handleCopyLink} className="gap-1.5 shrink-0">
                    {linkCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {linkCopied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Send this link to your team member so they can join your organization.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Members list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Members</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-center text-slate-400 text-sm">Loading…</div>
              ) : members.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">No members yet.</div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {members.map((member) => (
                    <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                          {member.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                          {member.displayName}
                          {member.role === 'owner' && <Crown className="w-3 h-3 text-amber-500" />}
                        </div>
                        <div className="text-xs text-slate-400 truncate">{member.email}</div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {canManage && member.role !== 'owner' ? (
                          <Select
                            value={member.role}
                            onValueChange={(v) => handleRoleChange(member.id, v as OrgRole)}
                          >
                            <SelectTrigger className="h-7 text-xs w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="accountant">Accountant</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary" className={cn('text-xs', ROLE_BADGE_CLASS[member.role])}>
                            {ROLE_LABELS[member.role]}
                          </Badge>
                        )}

                        {canManage && member.role !== 'owner' && (
                          <Button size="sm" variant="ghost"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                            onClick={() => setRemoveTarget(member)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Pending invitations */}
          {invitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" /> Pending Invitations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invitations.map((inv) => (
                    <li key={inv.id} className="flex items-center gap-3 px-4 py-3">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                          {inv.email}
                        </div>
                        <div className="text-xs text-slate-400">
                          Expires {new Date(inv.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="secondary" className={cn('text-xs', ROLE_BADGE_CLASS[inv.role])}>
                        {ROLE_LABELS[inv.role]}
                      </Badge>
                      {canManage && (
                        <Button size="sm" variant="ghost"
                          className="text-red-500 hover:text-red-600 h-7 w-7 p-0"
                          onClick={() => handleRevokeInvite(inv.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
        </ScrollableContent>
      </SubscriptionGuard>

      {/* Remove member dialog */}
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeTarget?.displayName}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will immediately lose access to this workspace. You can re-invite them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleRemove}>
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
