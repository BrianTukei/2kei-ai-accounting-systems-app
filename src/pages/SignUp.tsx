import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Lock } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
          if (error.message?.includes('User already registered')) {
            setError('An account with this email already exists. Please log in instead.');
            toast.error('An account with this email already exists.');
          } else if (error.message?.includes('Password')) {
            setError(error.message);
            toast.error(error.message);
          } else if (error.message?.includes('valid email')) {
            setError('Please enter a valid email address.');
            toast.error('Please enter a valid email address.');
          } else if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
            setError('Too many signup attempts. Please try again in a few minutes.');
            toast.error('Too many signup attempts. Please wait and try again.');
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google sign in error', err);
      toast.error(err?.message || 'Google sign in failed');
      setIsLoading(false);
    }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/95 py-12 px-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Sign-up card */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-2xl p-8">
          <div className="max-w-md mx-auto">
            <div className="mb-6 text-center">
              <h1 className="text-2xl md:text-3xl font-semibold">Welcome to 2K AI Accounting Systems</h1>
              <p className="text-sm text-muted-foreground mt-2">Create Your Account</p>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-800 hover:shadow-md transition-shadow disabled:opacity-60"
              >
                <svg width="18" height="18" viewBox="0 0 533.5 544.3" aria-hidden="true">
                  <defs />
                  <path fill="#4285f4" d="M533.5 278.4c0-17.7-1.6-35-4.6-51.6H272v97.8h147.1c-6.3 34.1-25.3 62.9-54 82.2v68.2h87.1c51-47 80.3-116.3 80.3-196.6z"/>
                  <path fill="#34a853" d="M272 544.3c73.6 0 135.5-24.4 180.7-66.2l-87.1-68.2c-24.3 16.3-55.4 26-93.6 26-71.9 0-132.9-48.6-154.8-114.1H26.9v71.6C72.2 492.3 165.5 544.3 272 544.3z"/>
                  <path fill="#fbbc04" d="M117.2 319.8c-10.9-32.6-10.9-67.8 0-100.4V147.8H26.9c-40.6 79.1-40.6 172.6 0 251.7l90.3-79.7z"/>
                  <path fill="#ea4335" d="M272 109.3c39.9-.6 78.1 14.3 107.3 41.8l80.5-80.5C407.3 25 345.4.6 272 .6 165.5.6 72.2 52.6 26.9 147.8l90.3 71.6c22-65.5 82.9-114.1 154.8-110.7z"/>
                </svg>
                <span className="text-sm font-medium">Sign Up with Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border/60" />
                <div className="text-xs text-muted-foreground">OR</div>
                <div className="flex-1 h-px bg-border/60" />
              </div>

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
                    className="pl-10"
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
                    className="pl-10"
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
                    className="pl-10"
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
                    className="pl-10"
                  />
                </div>

                {error && <div className="text-sm text-destructive">{error}</div>}

                <Button type="submit" disabled={isLoading} className="w-full rounded-full py-3 bg-gradient-primary text-white hover:shadow-[0_8px_24px_rgba(59,130,246,0.18)] transition-shadow disabled:opacity-60 disabled:cursor-not-allowed">
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Already have an account?{' '}
                <Link to="/auth" className="text-primary underline">Log In</Link>
              </p>
            </div>
          </div>
        </div>

        {/* Illustration / right side */}
        <div className="hidden md:flex items-center justify-center">
          <div className="max-w-lg">
            {/* Simple illustrative SVG */}
            <svg viewBox="0 0 800 600" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Finance illustration">
              <defs>
                <linearGradient id="g1" x1="0" x2="1">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="800" height="600" rx="24" fill="url(#g1)" opacity="0.06" />
              <g transform="translate(80,80)">
                <rect x="0" y="0" width="320" height="160" rx="12" fill="#fff" opacity="0.9"/>
                <rect x="20" y="20" width="280" height="12" rx="6" fill="#e6edf8"/>
                <rect x="20" y="44" width="200" height="12" rx="6" fill="#cfe0ff"/>
                <rect x="20" y="68" width="240" height="12" rx="6" fill="#a5d2ff"/>

                <rect x="360" y="0" width="320" height="220" rx="12" fill="#fff" opacity="0.95"/>
                <rect x="380" y="24" width="80" height="80" rx="8" fill="#7c3aed" opacity="0.12"/>
                <rect x="470" y="40" width="160" height="12" rx="6" fill="#e9d5ff"/>
                <rect x="470" y="64" width="100" height="12" rx="6" fill="#d8b4fe"/>

                <g transform="translate(40,220)">
                  <rect x="0" y="0" width="520" height="200" rx="12" fill="#fff" opacity="0.95"/>
                  <rect x="32" y="28" width="120" height="120" rx="8" fill="#60a5fa" opacity="0.12"/>
                  <rect x="168" y="36" width="320" height="92" rx="8" fill="#fff"/>
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
