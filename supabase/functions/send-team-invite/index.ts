import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { invitationId, email, role, orgName, invitedByName, token } = await req.json();

    if (!email || !token) {
      throw new Error('Email and token are required');
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://2kaiaccounting.app';
    const acceptUrl = `${siteUrl}/accept-invite?token=${token}`;

    const roleLabel: Record<string, string> = {
      owner: 'Owner',
      accountant: 'Accountant',
      manager: 'Manager',
      viewer: 'Viewer',
    };

    const roleDesc: Record<string, string> = {
      owner: 'full access to manage the organization',
      accountant: 'access to edit transactions and view reports',
      manager: 'access to view transactions and reports',
      viewer: 'read-only access to view reports',
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Team Invitation - 2K AI Accounting Systems</title>
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f1f5f9;">
        <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg, #2563eb, #4f46e5); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
              <span style="color: white; font-size: 24px; font-weight: bold;">2K</span>
            </div>
            <h1 style="color: #1e293b; margin: 8px 0 4px; font-size: 22px;">You're Invited!</h1>
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              Join ${orgName || 'a team'} on 2K AI Accounting Systems
            </p>
          </div>

          <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0;">
              <strong>${invitedByName || 'A team member'}</strong> has invited you to join
              <strong>${orgName || 'their organization'}</strong> as a
              <strong style="color: #4f46e5;">${roleLabel[role] || role}</strong>.
            </p>
            <p style="color: #64748b; font-size: 13px; margin: 12px 0 0;">
              This gives you ${roleDesc[role] || 'access to the organization'}.
            </p>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${acceptUrl}"
               style="background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 14px 32px;
                      text-decoration: none; border-radius: 8px; font-weight: 600;
                      display: inline-block; font-size: 15px; letter-spacing: 0.3px;">
              Accept Invitation
            </a>
          </div>

          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-bottom: 16px;">
            This invitation expires in 7 days.
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />

          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            If you can't click the button, copy and paste this link:<br>
            <a href="${acceptUrl}" style="color: #4f46e5; word-break: break-all; font-size: 11px;">
              ${acceptUrl}
            </a>
          </p>

          <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin-top: 16px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 11px;">
          <p>&copy; ${new Date().getFullYear()} 2K AI Accounting Systems. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    let emailSent = false;

    // ── Strategy 1: Resend API (recommended — free 100 emails/day) ──
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: Deno.env.get('RESEND_FROM') || '2K AI Accounting <onboarding@resend.dev>',
            to: [email],
            subject: `You're invited to join ${orgName || 'a team'} on 2K AI Accounting`,
            html: emailHtml,
          }),
        });
        emailSent = res.ok;
        if (!res.ok) {
          const errBody = await res.text();
          console.warn('Resend API error:', errBody);
        }
      } catch (e) {
        console.warn('Resend API unavailable:', e);
      }
    }

    // ── Strategy 2: Legacy EMAIL_SERVICE_URL (custom SMTP relay) ──
    if (!emailSent) {
      const emailServiceUrl = Deno.env.get('EMAIL_SERVICE_URL');
      const emailServiceKey = Deno.env.get('EMAIL_SERVICE_KEY');

      if (emailServiceUrl && emailServiceKey) {
        try {
          const emailResponse = await fetch(`${emailServiceUrl}/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${emailServiceKey}`,
            },
            body: JSON.stringify({
              to: email,
              from: 'noreply@2kaiaccounting.app',
              subject: `You're invited to join ${orgName || 'a team'} on 2K AI Accounting`,
              html: emailHtml,
            }),
          });
          emailSent = emailResponse.ok;
        } catch (e) {
          console.warn('Email service unavailable:', e);
        }
      }
    }

    // ── Strategy 3: Supabase Auth invite (creates auth user + sends email) ──
    if (!emailSent) {
      try {
        const { error: inviteErr } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
          redirectTo: acceptUrl,
          data: { team_invite_token: token, org_name: orgName },
        });
        if (!inviteErr) {
          emailSent = true;
        } else {
          // User may already exist — that's okay, just means we can't use this method
          console.warn('Auth invite fallback:', inviteErr.message);
        }
      } catch (e) {
        console.warn('Auth invite fallback failed:', e);
      }
    }

    // Update the invitation status
    if (invitationId) {
      await supabaseClient
        .from('team_invitations')
        .update({ email_sent: emailSent })
        .eq('id', invitationId)
        .catch(() => { /* column may not exist yet */ });
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailSent,
        acceptUrl,
        message: emailSent
          ? 'Invitation email sent successfully'
          : 'Invitation created — share the link manually',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in send-team-invite function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
