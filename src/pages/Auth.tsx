
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';
import ProfileUpload from '@/components/auth/ProfileUpload';
import { handleGoogleAuth } from '@/utils/authUtils';

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [actionType, setActionType] = useState<string>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [showProfileUpload, setShowProfileUpload] = useState(false);
  
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

    const user = localStorage.getItem('user');
    if (user) {
      navigate('/dashboard');
    }
  }, [location.search, navigate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleGoogleSignIn = () => {
    setIsLoading(true);
    
    handleGoogleAuth()
      .then(({ isNewUser }) => {
        toast.success(isNewUser 
          ? 'Google account connected successfully!' 
          : 'Signed in with Google successfully!');
          
        if (isNewUser) {
          setShowProfileUpload(true);
        } else {
          navigate('/dashboard');
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
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
              <SignInForm
                formData={formData}
                handleChange={handleChange}
                isLoading={isLoading}
                handleGoogleSignIn={handleGoogleSignIn}
              />
            </TabsContent>
            
            <TabsContent value="signup">
              <SignUpForm
                formData={formData}
                handleChange={handleChange}
                isLoading={isLoading}
                handleGoogleSignIn={handleGoogleSignIn}
                setShowProfileUpload={setShowProfileUpload}
              />
            </TabsContent>
          </Tabs>
          
          <div className="px-8 py-4 text-center text-sm text-slate-500">
            By continuing, you agree to our{' '}
            <a href="/terms" className="underline text-primary">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline text-primary">
              Privacy Policy
            </a>
            .
          </div>
        </Card>
      </div>

      {/* Profile Picture Upload Dialog */}
      <ProfileUpload 
        open={showProfileUpload} 
        onOpenChange={setShowProfileUpload}
      />
    </div>
  );
}
