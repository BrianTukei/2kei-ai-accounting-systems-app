import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface ResetPasswordRequest {
  userId: string;
  newPassword: string;
}

interface DeleteUserRequest {
  userId: string;
}

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  user_metadata: any;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

    // Create client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create client with user's auth token to verify they're admin
    const supabaseUser = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the requesting user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Verify the user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      throw new Error("Forbidden: Admin access required");
    }

    const body = await req.json();
    const { action, email, password, firstName, lastName, userId, newPassword, userIds } = body;

    if (action === "list") {
      // Fetch user details for the provided user IDs
      const users: AdminUser[] = [];
      for (const uid of userIds || []) {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(uid);
        if (!userError && userData) {
          users.push(userData.user as any);
        }
      }

      return new Response(
        JSON.stringify({ success: true, users }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === "create") {

      // Create the user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        },
      });

      if (createError) throw createError;

      // Add admin role
      const { error: roleInsertError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: newUser.user.id,
          role: "admin",
        });

      if (roleInsertError) throw roleInsertError;

      return new Response(
        JSON.stringify({ success: true, user: newUser.user }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === "reset-password") {

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === "delete") {

      // Delete the user (cascade will handle user_roles)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    throw new Error("Invalid action");

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
