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

    const { email } = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    // Generate verification token using database function
    const { data: token, error: tokenError } = await supabaseClient
      .rpc('create_verification_token', { user_email: email });

    if (tokenError) {
      throw new Error(tokenError.message);
    }

    // Send email via your preferred service
    // For now, we'll use a simple email template
    const verificationUrl = `${Deno.env.get('SITE_URL')}/verify-email?token=${token}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email - 2K AI Accounting Systems</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">2K AI Accounting Systems</h1>
        </div>
        
        <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Verify Your Email Address</h2>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">
            Thank you for signing up with 2K AI Accounting Systems! To complete your registration, 
            please verify your email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold; 
                      display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            This verification link will expire in 24 hours for security reasons.
          </p>
          
          <p style="color: #64748b; font-size: 14px;">
            If you can't click the button, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">
              ${verificationUrl}
            </a>
          </p>
          
          <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
            If you didn't create an account with us, you can safely ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
          <p>&copy; 2024 2K AI Accounting Systems. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    // You can replace this with your preferred email service (SendGrid, Resend, etc.)
    // For demonstration, we'll use a simple fetch to a hypothetical email service
    const emailResponse = await fetch(`${Deno.env.get('EMAIL_SERVICE_URL')}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('EMAIL_SERVICE_KEY')}`,
      },
      body: JSON.stringify({
        to: email,
        from: 'noreply@2keiledgerly.com',
        subject: 'Verify Your Email - 2K AI Accounting Systems',
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send email');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification email sent successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in send-verification-email function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});