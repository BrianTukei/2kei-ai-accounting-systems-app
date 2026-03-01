import { supabase } from '@/integrations/supabase/client';

export interface VerificationEmailResponse {
  success: boolean;
  message: string;
}

export class EmailVerificationService {
  /**
   * Send / resend verification email to user using Supabase's built-in auth.
   * This uses `supabase.auth.resend()` which triggers Supabase's native
   * email confirmation flow — no custom edge function needed.
   */
  static async sendVerificationEmail(email: string): Promise<VerificationEmailResponse> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/email-confirmation`,
        },
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Verification email sent successfully. Please check your inbox and spam folder.',
      };
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      return {
        success: false,
        message: error?.message || 'Failed to send verification email',
      };
    }
  }

  /**
   * Verify email with an OTP token hash (used when Supabase sends a token-based link).
   */
  static async verifyEmail(token: string): Promise<VerificationEmailResponse> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup',
      });

      if (error) throw error;

      if (data.user) {
        return {
          success: true,
          message: 'Email verified successfully',
        };
      }

      return {
        success: false,
        message: 'Verification failed — no user returned',
      };
    } catch (error: any) {
      console.error('Error verifying email:', error);
      return {
        success: false,
        message: error?.message || 'Failed to verify email. The link may have expired.',
      };
    }
  }

  /**
   * Check if user needs email verification
   */
  static async needsVerification(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return !!(user && !user.email_confirmed_at);
    } catch {
      return false;
    }
  }

  /**
   * Resend verification email for current user
   */
  static async resendVerificationEmail(): Promise<VerificationEmailResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.email) {
        return { success: false, message: 'No user email found. Please sign up again.' };
      }

      if (user.email_confirmed_at) {
        return { success: false, message: 'Email is already verified' };
      }

      return await this.sendVerificationEmail(user.email);
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      return {
        success: false,
        message: error?.message || 'Failed to resend verification email',
      };
    }
  }
}