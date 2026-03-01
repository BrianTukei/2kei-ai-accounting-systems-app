import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Loader2, Mail, Clock } from "lucide-react";
import BrandLogo from '@/components/BrandLogo';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, authResolved, isEmailVerified } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'otp'>('loading');
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [userEmail, setUserEmail] = useState('');

  // OTP digit input state (6 digits)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Grab email from query param (passed from signup page) ──
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam && !userEmail) {
      setUserEmail(emailParam);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle automatic verification from URL tokens ──
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // ── 1. PKCE flow: Supabase auto-exchanges ?code= param ──
      // With flowType: 'pkce', the Supabase client auto-detects ?code= in the URL
      // and exchanges it for a session. We just need to wait for AuthContext to update.
      const codeParam = searchParams.get('code');
      if (codeParam) {
        console.log('[EmailConfirmation] PKCE code detected — waiting for Supabase auto-exchange...');
        // The Supabase client handles this automatically via detectSessionInUrl.
        // Wait a moment for onAuthStateChange to fire, then check status.
        await new Promise(r => setTimeout(r, 2000));
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email_confirmed_at) {
          setStatus('success');
          setMessage('Your email has been verified successfully! Welcome to 2K AI Accounting Systems.');
          toast.success("Email verified! Your account is now active.");
          window.history.replaceState(null, '', window.location.pathname);
          setTimeout(() => navigate('/onboarding'), 2500);
          return;
        }
        // If still not confirmed, fall through to manual verification
      }

      // ── 2. Hash-fragment tokens (implicit flow fallback) ──
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken  = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const hashType     = hashParams.get('type');

      // Also check query params for backward compat
      const queryAccessToken  = searchParams.get('access_token');
      const queryRefreshToken = searchParams.get('refresh_token');
      const queryType         = searchParams.get('type');

      const finalAccessToken  = accessToken || queryAccessToken;
      const finalRefreshToken = refreshToken || queryRefreshToken;
      const finalType         = hashType || queryType;

      if (finalAccessToken && finalRefreshToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: finalAccessToken,
            refresh_token: finalRefreshToken,
          });

          if (error) throw error;

          if (data.user) {
            const isSignup = finalType === 'signup' || finalType === 'email';
            setStatus('success');
            setMessage(
              isSignup
                ? 'Your email has been verified successfully! Welcome to 2K AI Accounting Systems.'
                : 'Successfully signed in! Welcome back.'
            );
            toast.success(isSignup ? "Email verified! Your account is now active." : "Successfully signed in!");
            window.history.replaceState(null, '', window.location.pathname);
            setTimeout(() => navigate(isSignup ? '/onboarding' : '/dashboard'), 2500);
          }
        } catch (error: any) {
          console.error('Session setup error:', error);
          setStatus('error');
          setMessage(error.message || 'Failed to verify your email. The link may have expired.');
          toast.error("Verification failed. The link may have expired or is invalid.");
        }
        return;
      }

      // ── 3. OTP token_hash verification (?token=xxx&type=signup) ──
      const queryToken = searchParams.get('token') || searchParams.get('token_hash');
      if (queryToken) {
        try {
          const otpType = (queryType === 'signup' || queryType === 'email') ? 'signup' : 'signup';
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: queryToken,
            type: otpType as any,
          });

          if (error) throw error;

          if (data.user) {
            setStatus('success');
            setMessage('Your email has been verified successfully! Welcome to 2K AI Accounting Systems.');
            toast.success("Email verified! Your account is now active.");
            setTimeout(() => navigate('/onboarding'), 2500);
          }
        } catch (error: any) {
          console.error('OTP verification error:', error);
          setStatus('error');
          setMessage(error.message || 'Failed to verify email. The link may have expired.');
          toast.error("Verification failed. The link may have expired or is invalid.");
        }
        return;
      }

      // ── 4. No tokens — show OTP input for manual code entry ──
      const emailParam = searchParams.get('email');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email_confirmed_at) {
          setStatus('success');
          setMessage('Your email is already verified!');
        } else if (user && !user.email_confirmed_at) {
          setUserEmail(user.email || '');
          setStatus('otp');
          setMessage(`We've sent a verification code to ${user.email}. Enter the 6-digit code from your email.`);
        } else if (emailParam) {
          setUserEmail(emailParam);
          setStatus('otp');
          setMessage(`We've sent a verification code to ${emailParam}. Enter the 6-digit code from your email.`);
        } else {
          setStatus('otp');
          setMessage('Please check your inbox for the verification email. Enter the 6-digit code below.');
        }
      } catch {
        if (emailParam) {
          setUserEmail(emailParam);
          setStatus('otp');
          setMessage(`We've sent a verification code to ${emailParam}. Enter the 6-digit code from your email.`);
        } else {
          setStatus('otp');
          setMessage('Please check your inbox for the verification email. Enter the 6-digit code below.');
        }
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate]);

  // ── Redirect if auth context detects verified session ──
  useEffect(() => {
    if (authResolved && session && isEmailVerified && status !== 'success') {
      setStatus('success');
      setMessage('Your email has been verified successfully!');
      toast.success("Email verified!");
      setTimeout(() => navigate('/onboarding'), 2500);
    }
  }, [authResolved, session, isEmailVerified, status, navigate]);

  // ── Cooldown timer ──
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // ── OTP digit input handlers ──
  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === 5) {
      const code = newDigits.join('');
      if (code.length === 6) {
        handleVerifyOtp(code);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < pasted.length && i < 6; i++) {
        newDigits[i] = pasted[i];
      }
      setOtpDigits(newDigits);
      if (pasted.length === 6) {
        handleVerifyOtp(pasted);
      } else {
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      }
    }
  };

  const handleVerifyOtp = async (code?: string) => {
    const otp = code || otpDigits.join('');
    if (otp.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const email = userEmail || (await supabase.auth.getUser()).data.user?.email;
      if (!email) {
        toast.error('No email address found. Please sign up again.');
        setIsVerifyingOtp(false);
        return;
      }

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });

      if (error) throw error;

      if (data.user && data.session) {
        // OTP verified — user is now signed in automatically via the returned session
        setStatus('success');
        setMessage('Email verified! Signing you in...');
        toast.success("Email verified! You're now signed in.");
        // Short delay so the user sees the success state, then redirect
        setTimeout(() => {
          // Use window.location to ensure full app reload with new session
          window.location.href = '/onboarding';
        }, 1500);
      } else if (data.user) {
        // Verified but no session returned — sign in automatically
        setStatus('success');
        setMessage('Email verified! Signing you in...');
        toast.success("Email verified! Signing you in...");
        try {
          // The user just verified; try to get the session
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            setTimeout(() => { window.location.href = '/onboarding'; }, 1500);
          } else {
            // Fallback: redirect to auth page with a success message
            toast.info('Please sign in with your credentials.');
            setTimeout(() => navigate('/auth'), 2000);
          }
        } catch {
          setTimeout(() => navigate('/auth'), 2000);
        }
      } else {
        throw new Error('Verification failed — no user returned');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      const msg = error.message?.includes('expired')
        ? 'Code has expired. Please request a new one.'
        : error.message?.includes('invalid')
          ? 'Invalid code. Please check and try again.'
          : error.message || 'Verification failed. Please try again.';
      toast.error(msg);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleGoToDashboard = () => navigate('/dashboard');
  const handleGoToOnboarding = () => navigate('/onboarding');
  const handleBackToAuth = () => navigate('/auth');

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    try {
      let email = userEmail;
      if (!email) {
        const { data: { user } } = await supabase.auth.getUser();
        email = user?.email || '';
      }

      if (!email) {
        toast.error('No email address found. Please sign up again.');
        setIsResending(false);
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/email-confirmation`,
        },
      });

      if (error) throw error;

      toast.success('Verification email sent! Please check your inbox and spam folder.');
      setResendCooldown(60);
      setUserEmail(email);
      setMessage(`A new verification email has been sent to ${email}. Enter the 6-digit code or click the link in the email.`);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to resend email. Please try signing up again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BrandLogo size="lg" />
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Verifying...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
            {status === 'otp' && 'Verify Your Email'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your email address'}
            {status === 'success' && '2K AI Accounting Systems'}
            {status === 'error' && 'Something went wrong'}
            {status === 'otp' && 'Enter the 6-digit code sent to your email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            {status === 'loading' && <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-16 w-16 text-green-500" />}
            {status === 'error' && <XCircle className="h-16 w-16 text-red-500" />}
            {status === 'otp' && <Mail className="h-16 w-16 text-blue-600" />}
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
          </div>

          {/* ── OTP 6-digit input ── */}
          {status === 'otp' && (
            <div className="space-y-4">
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, i) => (
                  <Input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isVerifyingOtp}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <Button
                onClick={() => handleVerifyOtp()}
                disabled={isVerifyingOtp || otpDigits.join('').length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isVerifyingOtp ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                ) : (
                  'Verify Code'
                )}
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {status === 'success' && (
              <>
                <Button onClick={handleGoToOnboarding} className="w-full bg-blue-600 hover:bg-blue-700">
                  Continue to Setup
                </Button>
                <Button variant="outline" onClick={handleGoToDashboard} className="w-full">
                  Go to Dashboard
                </Button>
              </>
            )}

            {status === 'otp' && (
              <>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>Enter the 6-digit code from your email, or click the verification link directly.</span>
                  </div>
                </div>
                <Button
                  onClick={handleResendVerification}
                  disabled={isResending || resendCooldown > 0}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                  ) : resendCooldown > 0 ? (
                    <><Clock className="mr-2 h-4 w-4" /> Resend in {resendCooldown}s</>
                  ) : (
                    <><Mail className="mr-2 h-4 w-4" /> Resend Verification Email</>
                  )}
                </Button>
                <Button variant="ghost" onClick={handleBackToAuth} className="w-full">
                  Back to Sign In
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <Button
                  onClick={handleResendVerification}
                  disabled={isResending || resendCooldown > 0}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isResending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                  ) : resendCooldown > 0 ? (
                    <><Clock className="mr-2 h-4 w-4" /> Resend in {resendCooldown}s</>
                  ) : (
                    <><Mail className="mr-2 h-4 w-4" /> Resend Verification Email</>
                  )}
                </Button>
                <Button variant="outline" onClick={handleBackToAuth} className="w-full">
                  Back to Authentication
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmation;