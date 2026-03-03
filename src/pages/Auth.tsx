
import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import BrandLogo from '@/components/BrandLogo';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/contexts/AuthContext';
export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, authResolved, isEmailVerified } = useAuth();

  const [actionType, setActionType] = useState<string>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    if (action === 'signup') {
      setActionType('signup');
    }
  }, [location.search]);

  // Navigate when session becomes available (only after authResolved)
  useEffect(() => {
    if (!authResolved) return;
    if (session && isEmailVerified) {
      navigate('/dashboard');
    }
  }, [authResolved, session, isEmailVerified, navigate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Helper function to create demo session
  const createDemoSession = (name: string, email: string) => {
    const demoUser = {
      id: `demo-user-${Date.now()}`,
      email: email,
      email_confirmed_at: new Date().toISOString(),
      user_metadata: { name: name || 'Demo User' },
    };
    localStorage.setItem('2k_demo_user', JSON.stringify(demoUser));
    // Don't set onboarding as complete for new signups - let them go through onboarding
    return demoUser;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Auth] handleSubmit called, actionType:', actionType);
    setIsLoading(true);
    setAuthError(null);
    
    // Check Supabase configuration
    if (!isSupabaseConfigured && !import.meta.env.DEV) {
      console.error('[Auth] Supabase is not configured');
      const msg = 'Service temporarily unavailable. Please try again later or contact support.';
      setAuthError(msg);
      toast.error(msg);
      setIsLoading(false);
      return;
    }
    
    if (!formData.email || !formData.password) {
      console.log('[Auth] Missing email or password');
      const msg = 'Please fill in all required fields';
      setAuthError(msg);
      toast.error(msg);
      setIsLoading(false);
      return;
    }

    if (actionType === 'signup' && !formData.name) {
      console.log('[Auth] Missing name for signup');
      const msg = 'Please enter your name';
      setAuthError(msg);
      toast.error(msg);
      setIsLoading(false);
      return;
    }
    
    try {
      if (actionType === 'signup') {
        // Client-side password validation
        if (formData.password.length < 6) {
          const msg = 'Password must be at least 6 characters long';
          setAuthError(msg);
          toast.error(msg);
          setIsLoading(false);
          return;
        }

        // Sign up with Supabase
        console.log('[Auth] Attempting signup for:', formData.email);
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/email-confirmation`,
            data: {
              full_name: formData.name,
            }
          }
        });

        if (error) {
          console.error('Signup error:', error);
          // In development mode, fallback to demo signup
          if (import.meta.env.DEV) {
            console.log('[Auth] Supabase signup failed, using demo mode');
            createDemoSession(formData.name, formData.email);
            toast.success('Demo account created! Redirecting to onboarding...');
            setTimeout(() => { window.location.href = '/onboarding'; }, 500);
            return;
          }
          // Show user-friendly error messages for common signup errors
          const code = (error as any)?.code || '';
          if (error.message?.includes('User already registered') || code === 'user_already_exists') {
            const msg = 'An account with this email already exists. Please sign in instead.';
            setAuthError(msg);
            toast.error(msg);
          } else if (error.message?.includes('Password')) {
            setAuthError(error.message);
            toast.error(error.message);
          } else if (error.message?.includes('valid email')) {
            const msg = 'Please enter a valid email address.';
            setAuthError(msg);
            toast.error(msg);
          } else if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || error.message?.includes('rate limit') || error.message?.includes('too many') || error.message?.includes('security purposes')) {
            // Rate limited — the account was likely already created, guide user to check email
            toast.info('Your account may have already been created. Please check your email inbox and spam folder for a verification code.');
            navigate(`/email-confirmation?email=${encodeURIComponent(formData.email)}`);
            return;
          } else if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
            const msg = 'Network error. Please check your internet connection and try again.';
            setAuthError(msg);
            toast.error(msg);
          } else {
            const msg = error.message || 'Sign up failed. Please try again.';
            setAuthError(msg);
            toast.error(msg);
          }
          setIsLoading(false);
          return;
        }

        console.log('Signup response:', { session: !!data.session, user: !!data.user, identities: data.user?.identities?.length });

        // Detect obfuscated duplicate: Supabase returns fake success with empty identities
        // when email is already registered but not confirmed (to avoid leaking email existence)
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          console.log('[Auth] Obfuscated duplicate detected — email already registered');
          toast.info('This email may already be registered. Please check your inbox and spam folder for a verification email, or try signing in.');
          navigate(`/email-confirmation?email=${encodeURIComponent(formData.email)}`);
          return;
        }

        if (data.user && !data.session) {
          // Email confirmation required — redirect to OTP input page
          setEmailSent(true);
          setUserEmail(formData.email);
          toast.success('Account created! Please check your email to verify your account.');
          navigate(`/email-confirmation?email=${encodeURIComponent(formData.email)}`);
        } else if (data.session) {
          // Auto-confirm is enabled, user is logged in immediately
          toast.success('Account created successfully! Redirecting...');
          // Navigation will be handled by onAuthStateChange
        }
      } else {
        // Sign in with Supabase
        console.log('[Auth] Attempting sign in with:', formData.email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          console.error('[Auth] Login error:', error);
          
          // In development mode, check if this is a demo user and allow login
          if (import.meta.env.DEV) {
            // Check if there's an existing demo user
            const existingDemoUser = localStorage.getItem('2k_demo_user');
            if (existingDemoUser) {
              try {
                const demoUser = JSON.parse(existingDemoUser);
                if (demoUser.email === formData.email) {
                  console.log('[Auth] Demo user login successful');
                  toast.success('Welcome back! Redirecting...');
                  setTimeout(() => { window.location.href = '/dashboard'; }, 500);
                  return;
                }
              } catch (e) {
                console.warn('Failed to parse demo user:', e);
              }
            }
            
            // Create new demo session for development
            console.log('[Auth] Creating demo session for login');
            createDemoSession(formData.email.split('@')[0], formData.email);
            localStorage.setItem('2k_onboarding_complete', 'true');
            localStorage.setItem('2k_onboarding_org', JSON.stringify({
              id: `demo-org-${Date.now()}`,
              name: 'Demo Company',
              slug: 'demo-company',
              currency: 'USD',
              timezone: 'UTC',
              owner_id: `demo-user-${Date.now()}`,
              onboardingComplete: true,
              plan: 'free'
            }));
            toast.success('Demo login successful! Redirecting...');
            setTimeout(() => { window.location.href = '/dashboard'; }, 500);
            return;
          }
          
          if (error.message.includes('Invalid login credentials')) {
            const msg = 'Invalid email or password. Please check your credentials or sign up for a new account.';
            setAuthError(msg);
            toast.error(msg);
          } else if (error.message.includes('Email not confirmed')) {
            const msg = 'Please verify your email address before signing in. Check your inbox for the verification link.';
            setAuthError(msg);
            toast.error(msg);
          } else {
            setAuthError(error.message);
            toast.error(error.message);
          }
          throw error;
        }

        console.log('[Auth] Login response:', { user: data.user?.id, session: !!data.session });

        // Check if email is verified
        if (data.user && !data.user.email_confirmed_at) {
          toast.error('Please verify your email address before signing in. Check your inbox for the verification link.');
          setIsLoading(false);
          return;
        }

        console.log('[Auth] Login successful, navigating to dashboard');
        toast.success('Welcome back! Redirecting...');
        // Navigation will be handled by onAuthStateChange
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      // Show a generic error if no specific message was shown above
      if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.message?.includes('Failed to fetch')) {
        const msg = 'Network error. Please check your internet connection and try again.';
        setAuthError(msg);
        toast.error(msg);
      } else if (!authError && error?.message) {
        // Only set if we haven't already set an error above
        setAuthError(error.message);
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setResetEmail(formData.email);
    setShowResetDialog(true);
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset email sent! Check your inbox.');
      setShowResetDialog(false);
    }
    setIsLoading(false);
  };

  const resendConfirmation = async () => {
    if (!userEmail) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/email-confirmation`,
        },
      });

      if (error) {
        const code = (error as any)?.code || '';
        const isRateLimit = code === 'over_email_send_rate_limit'
          || code === 'over_request_rate_limit'
          || error.message?.includes('rate limit')
          || error.message?.includes('too many')
          || error.message?.includes('security purposes');

        if (isRateLimit) {
          // Fallback: try signInWithOtp
          try {
            const { error: otpError } = await supabase.auth.signInWithOtp({
              email: userEmail,
              options: { shouldCreateUser: false },
            });
            if (!otpError) {
              toast.success('Verification email resent! Check your inbox and spam folder.');
              setIsLoading(false);
              return;
            }
          } catch { /* fallback failed */ }

          toast.info('Please wait a few minutes before requesting another email. Check your inbox and spam folder — the original code is still valid.', { duration: 8000 });
          setIsLoading(false);
          return;
        }
        throw error;
      }

      toast.success('Confirmation email has been resent. Please check your inbox and spam folder.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend email');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - Image & branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=1200&q=80&auto=format&fit=crop"
            alt="Modern financial analytics"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-accent/70" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div>
            <Link to="/" className="flex items-center space-x-2.5 group">
              <BrandLogo size="md" />
              <span className="font-semibold text-xl text-white">2K AI Accounting</span>
            </Link>
          </div>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold mb-4 leading-tight">
              Your money deserves better than spreadsheets
            </h2>
            <p className="text-white/80 text-base leading-relaxed mb-8">
              50,000+ businesses trust 2K AI to automate their accounting, forecast cash flow, and save 40+ hours every month. Subscribe now and see the difference from day one.
            </p>
            
            {/* Social proof */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-xs font-medium">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/70">
                <span className="font-semibold text-white">50,000+</span> businesses trust us
              </p>
            </div>
          </div>

          <p className="text-xs text-white/50">© {new Date().getFullYear()} 2K AI Accounting Systems</p>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex flex-col items-center justify-start pt-16 sm:justify-center sm:pt-0 p-4 sm:p-8 relative overflow-y-auto">
        <div className="absolute top-4 left-4 lg:hidden z-10">
          <Button variant="ghost" onClick={() => navigate('/')} className="rounded-full text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="absolute top-4 right-4 hidden lg:block z-10">
          <Button variant="ghost" onClick={() => navigate('/')} className="rounded-full text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Home
          </Button>
        </div>
      
      {/* Logo + welcome — always visible above card on mobile */}
      <div className="w-full max-w-md text-center mb-3 lg:hidden">
        <Link to="/" className="inline-flex items-center gap-2 mb-2">
          <BrandLogo size="sm" />
          <span className="text-base font-bold text-foreground">2K AI Accounting</span>
        </Link>
        <h2 className="text-lg sm:text-xl font-bold leading-tight mb-1 text-foreground">
          Your money deserves better than spreadsheets
        </h2>
        <p className="text-muted-foreground text-xs leading-relaxed">
          50,000+ businesses trust 2K AI to automate their accounting and save 40+ hours every month.
        </p>
      </div>

      <div className="w-full max-w-md animate-fade-up">
        <Card className="border-border/40 shadow-card bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-4">
            {/* Logo inside card — only on desktop (mobile shows it above) */}
            <div className="hidden lg:flex items-center justify-center gap-2.5 mb-3">
              <BrandLogo size="lg" />
              <span className="text-lg font-bold text-foreground">2K AI Accounting</span>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {actionType === 'signin' ? 'Welcome back' : 'Create your account'}
            </CardTitle>
            <CardDescription>
              {actionType === 'signin' 
                ? 'Enter your credentials below to access your account' 
                : 'Fill in the details below to create your account'}
            </CardDescription>
            {/* Demo mode button for local development */}
            {import.meta.env.DEV && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  console.log('[Auth] Demo login clicked');
                  // Set up a demo session in localStorage
                  const demoUser = {
                    id: 'demo-user-001',
                    email: 'demo@example.com',
                    email_confirmed_at: new Date().toISOString(),
                    user_metadata: { name: 'Demo User' },
                  };
                  localStorage.setItem('2k_demo_user', JSON.stringify(demoUser));
                  localStorage.setItem('2k_onboarding_complete', 'true');
                  localStorage.setItem('2k_onboarding_org', JSON.stringify({
                    id: 'demo-org-001',
                    name: 'Demo Company',
                    slug: 'demo-company',
                    currency: 'USD',
                    timezone: 'UTC',
                    owner_id: 'demo-user-001',
                    onboardingComplete: true,
                    plan: 'free'
                  }));
                  toast.success('Demo mode activated! Redirecting...');
                  setTimeout(() => { window.location.href = '/dashboard'; }, 500);
                }}
              >
                🧪 Demo Login (Dev Only)
              </Button>
            )}
          </CardHeader>
          
          {emailSent ? (
            <div className="px-6 pb-6 space-y-4 text-center">
              <div className="flex justify-center">
                <Mail className="h-12 w-12 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Check your email</h3>
                <p className="text-sm text-gray-600">
                  We've sent a confirmation link to <strong>{userEmail}</strong>
                </p>
              </div>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Click the link in your email to verify your account, then return here to sign in.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={resendConfirmation}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Resending..." : "Resend confirmation email"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEmailSent(false);
                    setUserEmail("");
                  }}
                  className="w-full"
                >
                  Back to sign in
                </Button>
              </div>
            </div>
          ) : (
          <Tabs value={actionType} onValueChange={(v) => { setActionType(v); setAuthError(null); }} className="w-full">
            <TabsList className="grid grid-cols-2 mx-6">
              <TabsTrigger value="signin">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {authError && (
              <div className="mx-6 mt-3 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {authError}
              </div>
            )}
            
            <TabsContent value="signin">
                  <LoginForm
                    formData={formData}
                    isLoading={isLoading}
                    handleChange={handleChange}
                    handleSubmit={handleSubmit}
                    onForgotPassword={handleForgotPassword}
                  />
            </TabsContent>
            
            <TabsContent value="signup">
              <SignupForm 
                formData={formData}
                isLoading={isLoading}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
              />
            </TabsContent>
          </Tabs>
          )}
          
          <CardFooter className="px-8 py-4 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <a href="/terms" className="underline text-primary hover:text-primary/80 transition-colors">
              Terms
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline text-primary hover:text-primary/80 transition-colors">
              Privacy Policy
            </a>
            .
          </CardFooter>
        </Card>
      </div>
      </div>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>Enter your email address and we'll send you a link to reset your password.</p>
              <Input
                type="email"
                placeholder="your@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="rounded-xl"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)} className="rounded-full">
              Cancel
            </Button>
            <AlertDialogAction onClick={handlePasswordReset} disabled={isLoading} className="rounded-full bg-gradient-to-r from-primary to-accent">
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
