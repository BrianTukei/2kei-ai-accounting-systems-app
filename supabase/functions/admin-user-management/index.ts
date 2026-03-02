/**
 * admin-user-management Edge Function
 * ─────────────────────────────────────
 * Full admin user management: CRUD operations, role management,
 * user search, audit logging, suspension, and bulk operations.
 *
 * Actions:
 *   - list:              List admin users by IDs
 *   - list-all:          List all users with pagination/search
 *   - create:            Create a new admin user
 *   - reset-password:    Reset a user's password
 *   - delete:            Delete a user
 *   - update-role:       Change a user's role
 *   - suspend:           Suspend a user account
 *   - unsuspend:         Reactivate a suspended user
 *   - get-user-details:  Get detailed info about a specific user
 *   - bulk-action:       Perform action on multiple users
 *   - get-stats:         Get admin dashboard statistics
 *   - get-audit-log:     Get audit trail
 *
 * Required env vars:
 *   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PUBLISHABLE_KEY
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata: any;
  banned_until?: string;
  confirmed_at?: string;
}

// ── Audit logging helper ─────────────────────────

async function logAuditEvent(
  supabase: any,
  adminUserId: string,
  action: string,
  targetUserId: string | null,
  details: Record<string, any>,
) {
  try {
    await supabase.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      action,
      target_user_id: targetUserId,
      details,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Non-blocking – don't fail the request if audit logging fails
    console.error('Audit log error:', err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

    if (!authHeader) throw new Error("Authorization header required");

    // Create client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create client with user's auth token to verify they're admin
    const supabaseUser = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the requesting user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized: Invalid or expired token");
    }

    // Platform owner emails — always have admin access
    const OWNER_EMAILS = ['tukeibrian5@gmail.com', 'briantukei1000@gmail.com'];
    const isOwner = OWNER_EMAILS.some(e => e.toLowerCase() === (user.email || '').toLowerCase());

    // Verify the user has admin role (or is an owner)
    if (!isOwner) {
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (roleError || !roleData) {
        throw new Error("Forbidden: Admin access required");
      }
    }

    // If owner, auto-bootstrap admin role in the background (non-blocking)
    if (isOwner) {
      supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" })
        .then(() => {})
        .catch(() => {});
    }

    const body = await req.json();
    const { action } = body;

    // ── LIST admin users by IDs ───────────────────

    if (action === "list") {
      const { userIds } = body;
      const users: AdminUser[] = [];
      for (const uid of userIds || []) {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(uid);
        if (!userError && userData) {
          users.push({
            id: userData.user.id,
            email: userData.user.email || '',
            created_at: userData.user.created_at,
            last_sign_in_at: userData.user.last_sign_in_at,
            user_metadata: userData.user.user_metadata,
            banned_until: userData.user.banned_until as string | undefined,
            confirmed_at: userData.user.confirmed_at,
          });
        }
      }

      return new Response(
        JSON.stringify({ success: true, users }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── LIST ALL users with pagination & search ───

    if (action === "list-all") {
      const { page = 1, perPage = 50, search, roleFilter } = body;

      // When searching, fetch a large batch so search covers all users
      // When just paginating without search, use normal pagination
      const fetchPerPage = search ? 1000 : perPage;
      const fetchPage = search ? 1 : page;

      // Get users from Supabase Auth
      const { data: { users: allUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page: fetchPage,
        perPage: fetchPerPage,
      });

      if (listError) throw listError;

      // Get all roles for these users
      const userIds = allUsers.map((u: any) => u.id);
      const { data: rolesData } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const roleMap: Record<string, string[]> = {};
      (rolesData || []).forEach((r: any) => {
        if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
        roleMap[r.user_id].push(r.role);
      });

      // Get subscription info for each user's organization
      const { data: orgUsers } = await supabaseAdmin
        .from("organization_users")
        .select("user_id, organization_id, role")
        .in("user_id", userIds);

      const orgMap: Record<string, any> = {};
      (orgUsers || []).forEach((ou: any) => {
        orgMap[ou.user_id] = { organizationId: ou.organization_id, orgRole: ou.role };
      });

      // Filter by search term
      let filtered = allUsers.map((u: any) => ({
        id: u.id,
        email: u.email || '',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        user_metadata: u.user_metadata,
        banned_until: u.banned_until,
        confirmed_at: u.confirmed_at,
        roles: roleMap[u.id] || [],
        organization: orgMap[u.id] || null,
      }));

      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter((u: any) =>
          u.email.toLowerCase().includes(q) ||
          (u.user_metadata?.first_name || '').toLowerCase().includes(q) ||
          (u.user_metadata?.last_name || '').toLowerCase().includes(q)
        );
      }

      if (roleFilter) {
        filtered = filtered.filter((u: any) => u.roles.includes(roleFilter));
      }

      // If searching, apply client-side pagination to the filtered results
      let paginatedResult = filtered;
      let totalCount = filtered.length;
      if (search) {
        const startIdx = (page - 1) * perPage;
        paginatedResult = filtered.slice(startIdx, startIdx + perPage);
      }

      return new Response(
        JSON.stringify({
          success: true,
          users: paginatedResult,
          total: totalCount,
          page,
          perPage,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── CREATE admin user ─────────────────────────

    if (action === "create") {
      const { email, password, firstName, lastName, role: assignRole = 'admin' } = body;

      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      // Check if email already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const emailExists = existingUsers?.users?.some((u: any) => u.email === email);
      if (emailExists) {
        throw new Error("A user with this email already exists");
      }

      // Create the user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName || '',
          last_name: lastName || '',
          created_by_admin: user.id,
        },
      });

      if (createError) throw createError;

      // Add role
      const validRoles = ['admin', 'support', 'moderator'];
      const roleToAssign = validRoles.includes(assignRole) ? assignRole : 'admin';

      const { error: roleInsertError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: newUser.user.id,
          role: roleToAssign,
        });

      if (roleInsertError) throw roleInsertError;

      // Audit log
      await logAuditEvent(supabaseAdmin, user.id, 'user_created', newUser.user.id, {
        email,
        role: roleToAssign,
        firstName,
        lastName,
      });

      return new Response(
        JSON.stringify({ success: true, user: newUser.user }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── RESET PASSWORD ────────────────────────────

    if (action === "reset-password") {
      const { userId, newPassword } = body;

      if (!userId || !newPassword) {
        throw new Error("userId and newPassword are required");
      }

      if (newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      // Prevent resetting own password through this endpoint
      if (userId === user.id) {
        throw new Error("Cannot reset your own password through admin panel. Use profile settings instead.");
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) throw updateError;

      // Audit log
      await logAuditEvent(supabaseAdmin, user.id, 'password_reset', userId, {
        method: 'admin_reset',
      });

      return new Response(
        JSON.stringify({ success: true, message: "Password reset successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── DELETE user ───────────────────────────────

    if (action === "delete") {
      const { userId } = body;

      if (!userId) throw new Error("userId is required");

      // Prevent self-deletion
      if (userId === user.id) {
        throw new Error("Cannot delete your own account");
      }

      // Get user info for audit log before deletion
      const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      const targetEmail = targetUser?.user?.email || 'unknown';

      // Remove user roles first
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      // Remove from organizations
      await supabaseAdmin
        .from("organization_users")
        .delete()
        .eq("user_id", userId);

      // Delete the user
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;

      // Audit log
      await logAuditEvent(supabaseAdmin, user.id, 'user_deleted', userId, {
        deletedEmail: targetEmail,
      });

      return new Response(
        JSON.stringify({ success: true, message: "User deleted successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── UPDATE ROLE ───────────────────────────────

    if (action === "update-role") {
      const { userId, newRole, removeRole } = body;

      if (!userId) throw new Error("userId is required");

      if (removeRole) {
        // Remove a specific role
        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", removeRole);

        await logAuditEvent(supabaseAdmin, user.id, 'role_removed', userId, {
          role: removeRole,
        });
      }

      if (newRole) {
        // Check if role already exists
        const { data: existing } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .eq("role", newRole)
          .maybeSingle();

        if (!existing) {
          const { error: roleError } = await supabaseAdmin
            .from("user_roles")
            .insert({ user_id: userId, role: newRole });
          if (roleError) throw roleError;
        }

        await logAuditEvent(supabaseAdmin, user.id, 'role_assigned', userId, {
          role: newRole,
        });
      }

      // Get updated roles
      const { data: updatedRoles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({
          success: true,
          roles: (updatedRoles || []).map((r: any) => r.role),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── SUSPEND user ──────────────────────────────

    if (action === "suspend") {
      const { userId, reason, duration } = body;

      if (!userId) throw new Error("userId is required");
      if (userId === user.id) throw new Error("Cannot suspend your own account");

      // Calculate ban duration
      let bannedUntil: string;
      if (duration === 'permanent') {
        // Set to far future for permanent ban
        bannedUntil = new Date('2099-12-31').toISOString();
      } else {
        const days = parseInt(duration) || 30;
        const until = new Date();
        until.setDate(until.getDate() + days);
        bannedUntil = until.toISOString();
      }

      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: duration === 'permanent' ? '876000h' : `${(parseInt(duration) || 30) * 24}h`,
      });

      if (banError) throw banError;

      await logAuditEvent(supabaseAdmin, user.id, 'user_suspended', userId, {
        reason: reason || 'No reason provided',
        duration: duration || '30',
        banned_until: bannedUntil,
      });

      return new Response(
        JSON.stringify({ success: true, bannedUntil, message: "User suspended successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── UNSUSPEND user ────────────────────────────

    if (action === "unsuspend") {
      const { userId } = body;
      if (!userId) throw new Error("userId is required");

      const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: 'none',
      });

      if (unbanError) throw unbanError;

      await logAuditEvent(supabaseAdmin, user.id, 'user_unsuspended', userId, {});

      return new Response(
        JSON.stringify({ success: true, message: "User account reactivated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── GET USER DETAILS ──────────────────────────

    if (action === "get-user-details") {
      const { userId } = body;
      if (!userId) throw new Error("userId is required");

      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (userError) throw userError;

      // Get roles
      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      // Get organization membership
      const { data: orgMemberships } = await supabaseAdmin
        .from("organization_users")
        .select("organization_id, role, invite_accepted, created_at")
        .eq("user_id", userId);

      // Get organization details
      let organizations: any[] = [];
      if (orgMemberships && orgMemberships.length > 0) {
        const orgIds = orgMemberships.map((m: any) => m.organization_id);
        const { data: orgs } = await supabaseAdmin
          .from("organizations")
          .select("id, name, slug, currency, industry")
          .in("id", orgIds);
        organizations = (orgs || []).map((org: any) => {
          const membership = orgMemberships.find((m: any) => m.organization_id === org.id);
          return { ...org, role: membership?.role, joined: membership?.created_at };
        });
      }

      // Get subscription info
      let subscription = null;
      if (orgMemberships && orgMemberships.length > 0) {
        const { data: subData } = await supabaseAdmin
          .from("subscriptions")
          .select("*")
          .eq("organization_id", orgMemberships[0].organization_id)
          .maybeSingle();
        subscription = subData;
      }

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            ...userData.user,
            roles: (roles || []).map((r: any) => r.role),
            organizations,
            subscription,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── BULK ACTION ───────────────────────────────

    if (action === "bulk-action") {
      const { userIds, bulkAction, reason } = body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new Error("userIds array is required");
      }

      if (!bulkAction) throw new Error("bulkAction is required");

      // Filter out the admin's own ID
      const targetIds = userIds.filter((id: string) => id !== user.id);
      const results: { userId: string; success: boolean; error?: string }[] = [];

      for (const targetId of targetIds) {
        try {
          switch (bulkAction) {
            case 'suspend': {
              await supabaseAdmin.auth.admin.updateUserById(targetId, {
                ban_duration: '720h', // 30 days
              });
              results.push({ userId: targetId, success: true });
              break;
            }
            case 'unsuspend': {
              await supabaseAdmin.auth.admin.updateUserById(targetId, {
                ban_duration: 'none',
              });
              results.push({ userId: targetId, success: true });
              break;
            }
            case 'delete': {
              await supabaseAdmin.from("user_roles").delete().eq("user_id", targetId);
              await supabaseAdmin.from("organization_users").delete().eq("user_id", targetId);
              await supabaseAdmin.auth.admin.deleteUser(targetId);
              results.push({ userId: targetId, success: true });
              break;
            }
            case 'add-role': {
              const { role: roleToAdd } = body;
              if (roleToAdd) {
                await supabaseAdmin.from("user_roles").upsert({
                  user_id: targetId,
                  role: roleToAdd,
                }, { onConflict: 'user_id,role' });
              }
              results.push({ userId: targetId, success: true });
              break;
            }
            case 'remove-role': {
              const { role: roleToRemove } = body;
              if (roleToRemove) {
                await supabaseAdmin.from("user_roles")
                  .delete()
                  .eq("user_id", targetId)
                  .eq("role", roleToRemove);
              }
              results.push({ userId: targetId, success: true });
              break;
            }
            default:
              results.push({ userId: targetId, success: false, error: 'Unknown action' });
          }
        } catch (err: any) {
          results.push({ userId: targetId, success: false, error: err.message });
        }
      }

      // Audit log
      await logAuditEvent(supabaseAdmin, user.id, `bulk_${bulkAction}`, null, {
        targetCount: targetIds.length,
        reason: reason || 'Bulk admin action',
        results,
      });

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      return new Response(
        JSON.stringify({
          success: true,
          message: `Processed ${successCount} of ${targetIds.length} users${failCount > 0 ? ` (${failCount} failed)` : ''}`,
          results,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── GET STATS ─────────────────────────────────

    if (action === "get-stats") {
      const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

      const totalUsers = allUsers?.length || 0;
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const newUsersThisMonth = allUsers?.filter((u: any) =>
        new Date(u.created_at) >= thirtyDaysAgo
      ).length || 0;

      const activeUsersThisWeek = allUsers?.filter((u: any) =>
        u.last_sign_in_at && new Date(u.last_sign_in_at) >= sevenDaysAgo
      ).length || 0;

      const suspendedUsers = allUsers?.filter((u: any) =>
        u.banned_until && new Date(u.banned_until) > now
      ).length || 0;

      const confirmedUsers = allUsers?.filter((u: any) => u.confirmed_at).length || 0;

      // Get admin count
      const { count: adminCount } = await supabaseAdmin
        .from("user_roles")
        .select("*", { count: 'exact', head: true })
        .eq("role", "admin");

      // Get subscription stats (using service role — bypasses RLS)
      const { data: subscriptions } = await supabaseAdmin
        .from("subscriptions")
        .select("plan_id, status");

      const subStats = {
        total: subscriptions?.length || 0,
        active: subscriptions?.filter((s: any) => s.status === 'active').length || 0,
        pro: subscriptions?.filter((s: any) => s.plan_id === 'pro').length || 0,
        enterprise: subscriptions?.filter((s: any) => s.plan_id === 'enterprise').length || 0,
      };

      return new Response(
        JSON.stringify({
          success: true,
          stats: {
            totalUsers,
            newUsersThisMonth,
            activeUsersThisWeek,
            suspendedUsers,
            confirmedUsers,
            unconfirmedUsers: totalUsers - confirmedUsers,
            adminCount: adminCount || 0,
            subscriptions: subStats,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── GET DASHBOARD DATA (all orgs + subs + members) via service role ──

    if (action === "get-dashboard-data") {
      // Fetch ALL organizations (service role bypasses RLS)
      const { data: orgRows } = await supabaseAdmin
        .from("organizations")
        .select("id, name, slug, owner_id, industry, country, currency, created_at")
        .order("created_at", { ascending: false });

      // Fetch ALL subscriptions
      const { data: subRows } = await supabaseAdmin
        .from("subscriptions")
        .select("organization_id, plan_id, status");

      // Fetch ALL org memberships for member counts
      const { data: memberRows } = await supabaseAdmin
        .from("organization_users")
        .select("organization_id");

      return new Response(
        JSON.stringify({
          success: true,
          organizations: orgRows || [],
          subscriptions: subRows || [],
          memberRows: memberRows || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── GET AUDIT LOG ─────────────────────────────

    if (action === "get-audit-log") {
      const { page = 1, perPage = 50, filterAction } = body;
      const offset = (page - 1) * perPage;

      let query = supabaseAdmin
        .from("admin_audit_log")
        .select("*", { count: 'exact' })
        .order("created_at", { ascending: false })
        .range(offset, offset + perPage - 1);

      if (filterAction) {
        query = query.eq("action", filterAction);
      }

      const { data: logs, count, error: logError } = await query;

      if (logError) {
        // Table might not exist yet – return empty
        return new Response(
          JSON.stringify({ success: true, logs: [], total: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          logs: logs || [],
          total: count || 0,
          page,
          perPage,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── GET AUTH EVENTS (login/logout tracking) ───

    if (action === "get-auth-events") {
      const { page = 1, perPage = 100, filterType, userId: filterUserId } = body;
      const offset = (page - 1) * perPage;

      let query = supabaseAdmin
        .from("auth_events")
        .select("*", { count: 'exact' })
        .order("created_at", { ascending: false })
        .range(offset, offset + perPage - 1);

      if (filterType) {
        query = query.eq("event_type", filterType);
      }
      if (filterUserId) {
        query = query.eq("user_id", filterUserId);
      }

      const { data: events, count, error: eventsError } = await query;

      if (eventsError) {
        // Table might not exist yet – return empty
        return new Response(
          JSON.stringify({ success: true, events: [], total: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // Enrich with user emails from auth
      const userIds = [...new Set((events || []).map((e: any) => e.user_id))];
      const emailMap: Record<string, string> = {};
      for (const uid of userIds) {
        try {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(uid);
          if (userData?.user) {
            emailMap[uid] = userData.user.email || '';
          }
        } catch { /* skip */ }
      }

      const enrichedEvents = (events || []).map((e: any) => ({
        ...e,
        email: emailMap[e.user_id] || '',
      }));

      return new Response(
        JSON.stringify({
          success: true,
          events: enrichedEvents,
          total: count || 0,
          page,
          perPage,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    throw new Error(`Invalid action: ${action}`);

  } catch (error: any) {
    console.error("Admin user management error:", error);

    const status = error.message?.includes('Unauthorized') ? 401
                 : error.message?.includes('Forbidden') ? 403
                 : 400;

    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status }
    );
  }
});
