
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [actionType, setActionType] = useState<string>('signin');
  const [isLoading, setIsLoading] = useState(false);
  
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

    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [location.search, navigate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    if (actionType === 'signup' && !formData.name) {
      toast.error("Please enter your name");
      setIsLoading(false);
      return;
    }
    
    try {
      if (actionType === 'signup') {
        // Sign up with Supabase
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              name: formData.name,
            }
          }
        });

        if (error) throw error;

        toast.success('Account created! Please check your email to verify your account.');
        navigate('/dashboard');
      } else {
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast.success('Welcome back!');
        
        // Check if admin and redirect accordingly
        if (formData.email === 'tukeibrian5@gmail.com') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Google sign in failed');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="absolute top-4 left-4">
        <Button variant="ghost" onClick={() => navigate('/')} className="rounded-full">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>
      
      <div className="w-full max-w-md animate-scale-in">
        <Card className="glass-card glass-card-hover shadow-glass-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold">2K</span>
              </div>
            </div>
            <CardTitle className="text-2xl mt-4">
              2KÈI Ledgery Accounting
            </CardTitle>
            <CardDescription>
              {actionType === 'signin' 
                ? 'Enter your credentials below to access your account' 
                : 'Fill in the details below to create your account'}
            </CardDescription>
          </CardHeader>
          
          <Tabs value={actionType} onValueChange={setActionType} className="w-full">
            <TabsList className="grid grid-cols-2 mx-6">
              <TabsTrigger value="signin">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <LoginForm 
                formData={formData}
                isLoading={isLoading}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                handleGoogleSignIn={handleGoogleSignIn}
              />
            </TabsContent>
            
            <TabsContent value="signup">
              <SignupForm 
                formData={formData}
                isLoading={isLoading}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                handleGoogleSignIn={handleGoogleSignIn}
              />
            </TabsContent>
          </Tabs>
          
          <CardFooter className="px-8 py-4 text-center text-sm text-slate-500">
            By continuing, you agree to our{' '}
            <a href="/terms" className="underline text-primary">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline text-primary">
              Privacy Policy
            </a>
            .
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
