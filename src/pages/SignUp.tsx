import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Lock } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BrandLogo from '@/components/BrandLogo';

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName || !email || !password || !confirm) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    // Check Supabase configuration
    if (!isSupabaseConfigured) {
      setError('Service temporarily unavailable. Please try again later or contact support.');
      toast.error('Service temporarily unavailable. Please try again later.');
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        // If an avatar file is provided, resize it to a small thumbnail data URL
        let avatarDataUrl: string | undefined = undefined;
        if (avatarFile) {
          try {
            avatarDataUrl = await resizeImageToDataUrl(avatarFile, 256);
          } catch (e) {
            console.warn('Avatar resize failed', e);
          }
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/email-confirmation`,
            data: { full_name: fullName, avatar: avatarDataUrl }
          }
        });

        if (error) {
          console.error('Signup error:', error);
          // Show user-friendly error messages
          const code = (error as any)?.code || '';
          if (error.message?.includes('User already registered') || code === 'user_already_exists') {
            setError('An account with this email already exists. Please log in instead.');
            toast.error('An account with this email already exists.');
          } else if (error.message?.includes('Password')) {
            setError(error.message);
            toast.error(error.message);
          } else if (error.message?.includes('valid email')) {
            setError('Please enter a valid email address.');
            toast.error('Please enter a valid email address.');
          } else if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || error.message?.includes('rate limit') || error.message?.includes('too many') || error.message?.includes('security purposes')) {
            // Rate limited — account was likely already created, guide user to check email
            toast.info('Your account may have already been created. Please check your email inbox and spam folder for a verification code.');
            navigate(`/email-confirmation?email=${encodeURIComponent(email)}`);
            return;
          } else if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
            setError('Network error. Please check your internet connection.');
            toast.error('Network error. Please check your internet connection and try again.');
          } else {
            setError(error.message || 'Sign up failed. Please try again.');
            toast.error(error.message || 'Sign up failed');
          }
          setIsLoading(false);
          return;
        }

        console.log('Signup response:', { session: !!data.session, user: !!data.user, identities: data.user?.identities?.length });

        // Detect obfuscated duplicate: Supabase returns fake success with empty identities
        // when email is already registered but not confirmed (to avoid leaking email existence)
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          console.log('[SignUp] Obfuscated duplicate detected — email already registered');
          toast.info('This email may already be registered. Please check your inbox and spam folder for a verification email, or try signing in.');
          navigate(`/email-confirmation?email=${encodeURIComponent(email)}`);
          return;
        }

        // Try to persist a profile record and upload avatar to Storage when possible.
        try {
          const user = (data as any)?.user || (data as any)?.session?.user;
          let avatarUrl: string | undefined = undefined;

          // If we have an authenticated session and a file, upload to the 'avatars' bucket.
          if (avatarFile && (data as any)?.session) {
            try {
              const ext = avatarFile.name.split('.').pop() || 'jpg';
              const filePath = `avatars/${user.id}-${Date.now()}.${ext}`;
              const uploadRes = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });
              if (uploadRes.error) throw uploadRes.error;
              const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);
              avatarUrl = publicData?.publicUrl;
            } catch (upErr) {
              console.warn('Avatar upload failed', upErr);
            }
          }

          // If we didn't upload but have a thumbnail data URL, fall back to that.
          if (!avatarUrl && avatarDataUrl) {
            avatarUrl = avatarDataUrl;
          }

          // Upsert profile record for the new user. This is best-effort: if RLS blocks anonymous inserts,
          // it will fail silently and won't block signup.
          if (user) {
            try {
              const profile = {
                id: user.id,
                full_name: fullName,
                email,
                avatar_url: avatarUrl
              } as any;
              const { error: profileErr } = await supabase.from('profiles').upsert(profile);
              if (profileErr) console.warn('Profile upsert failed', profileErr.message || profileErr);
            } catch (profileUpsertErr) {
              console.warn('Profile upsert unexpected error', profileUpsertErr);
            }
          }
        } catch (profileFlowErr) {
          console.warn('Profile/avatar flow failed', profileFlowErr);
        }

        if (data.session) {
          toast.success('Account created — redirecting...');
          navigate('/dashboard');
        } else if (data.user) {
          toast.success('Account created! Please check your email to verify.');
          navigate(`/email-confirmation?email=${encodeURIComponent(email)}`);
        }
      } catch (err: any) {
        console.error('Unexpected signup error', err);
        const message = err?.message || 'An error occurred. Please try again.';
        if (err?.message?.includes('fetch') || err?.message?.includes('Failed to fetch')) {
          setError('Unable to connect to the server. Please check your internet connection.');
          toast.error('Unable to connect. Please check your internet connection.');
        } else {
          setError(message);
          toast.error(message);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  };

  // Resize image to a DataURL (thumbnail) using canvas to keep size small
  const resizeImageToDataUrl = (file: File, maxSize = 256): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') return reject(new Error('Invalid image'));
        img.src = reader.result;
      };
      reader.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onAvatarChange = (file?: File) => {
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  // Revoke object URL for avatar preview to avoid memory leaks.
  useEffect(() => {
    const current = avatarPreview;
    return () => {
      if (current) URL.revokeObjectURL(current);
    };
  }, [avatarPreview]);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - Sign-up form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-8">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
              <BrandLogo size="sm" className="flex-shrink-0" />
              <span className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors">2K AI Accounting</span>
            </Link>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Create your account</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Start managing your finances with AI-powered insights</p>
          </div>

          <div className="space-y-5">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="relative">
                <Label htmlFor="fullName" className="sr-only">Full Name</Label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <User className="w-4 h-4" />
                </div>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  className="pl-10 rounded-xl h-11"
                />
              </div>

              <div className="relative">
                <Label htmlFor="email" className="sr-only">Email</Label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="pl-10 rounded-xl h-11"
                />
              </div>

              <div className="relative">
                <Label htmlFor="password" className="sr-only">Password</Label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
                  className="pl-10 rounded-xl h-11"
                />
              </div>

              <div className="relative">
                <Label htmlFor="confirm" className="sr-only">Confirm Password</Label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm password"
                  className="pl-10 rounded-xl h-11"
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/5 border border-destructive/15 rounded-xl p-3">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full rounded-full py-3 h-12 bg-gradient-to-r from-primary to-accent text-white font-semibold hover:shadow-elegant transition-all duration-400 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed">
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/auth" className="text-primary font-medium hover:underline">Log In</Link>
            </p>

            <p className="text-center text-xs text-muted-foreground/70">
              By signing up, you agree to our{' '}
              <Link to="/terms" className="underline hover:text-primary transition-colors">Terms</Link>{' '}
              and{' '}
              <Link to="/privacy" className="underline hover:text-primary transition-colors">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Image (hidden on mobile) */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80&auto=format&fit=crop"
            alt="Team collaborating on finances"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-accent/70 via-primary/60 to-primary/80" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center items-center h-full p-12 text-white text-center">
          <div className="max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">Join 50,000+ businesses growing faster</h2>
            <p className="text-white/80 text-sm leading-relaxed">
              Subscribe to 2K AI Accounting Systems and watch your business transform. Automated bookkeeping, AI-powered forecasting, and real-time insights — all in 60 seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
