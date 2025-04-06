
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { ProfileUploadDialog } from '@/components/auth/ProfileUploadDialog';
import { trackLogin, trackSignup } from '@/utils/authUtils';

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [actionType, setActionType] = useState<string>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [showProfileUpload, setShowProfileUpload] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
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
  
  const handleProfileUploadSubmit = () => {
    if (profileImage) {
      // Save the user data with the profile image
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.profileImage = profileImage;
      localStorage.setItem('user', JSON.stringify(userData));
      
      toast.success('Profile picture uploaded successfully!');
      setShowProfileUpload(false);
      navigate('/dashboard');
    } else {
      toast.error('Please select an image to upload');
    }
  };

  const handleSkipUpload = () => {
    setShowProfileUpload(false);
    navigate('/dashboard');
  };
  
  const handleSubmit = (e: React.FormEvent) => {
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
    
    setTimeout(() => {
      setIsLoading(false);
      
      // Check if this is the admin login
      if (formData.email === 'tukeibrian5@gmail.co' && formData.password === 'Tukei@1000$') {
        const adminData = {
          name: 'Tukei Brian',
          email: 'tukeibrian5@gmail.co',
          isAdmin: true
        };
        localStorage.setItem('user', JSON.stringify(adminData));
        trackLogin(adminData);
        toast.success('Welcome back, Admin!');
        navigate('/admin');
        return;
      }
      
      // For signup, store the full user data
      if (actionType === 'signup') {
        const userData = {
          name: formData.name,
          email: formData.email,
          password: formData.password, // In a real app, you'd never store passwords in localStorage
        };
        localStorage.setItem('user', JSON.stringify(userData));
        trackSignup(userData);
        toast.success('Account created successfully!');
        setShowProfileUpload(true);
      } else {
        // For login, verify credentials against stored data
        const storedUsers = JSON.parse(localStorage.getItem('userSignups') || '[]');
        const matchedUser = storedUsers.find((user: any) => 
          user.email === formData.email
        );
        
        if (!matchedUser) {
          toast.error('Invalid email or password');
          setIsLoading(false);
          return;
        }
        
        const userData = {
          name: matchedUser.name,
          email: matchedUser.email,
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        trackLogin(userData);
        toast.success(`Welcome back, ${userData.name}!`);
        navigate('/dashboard');
      }
      
    }, 1500);
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      
      const googleUserData = {
        name: 'Google User',
        email: 'user@gmail.com',
      };
      
      localStorage.setItem('user', JSON.stringify(googleUserData));
      
      const isNewUser = Math.random() > 0.5;
      if (isNewUser) {
        trackSignup(googleUserData);
        setShowProfileUpload(true);
      } else {
        trackLogin(googleUserData);
        navigate('/dashboard');
      }
      
      toast.success('Signed in with Google successfully!');
    }, 1500);
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

      <ProfileUploadDialog
        open={showProfileUpload}
        onOpenChange={setShowProfileUpload}
        onSubmit={handleProfileUploadSubmit}
        onSkip={handleSkipUpload}
        profileImage={profileImage}
        setProfileImage={setProfileImage}
      />
    </div>
  );
}
