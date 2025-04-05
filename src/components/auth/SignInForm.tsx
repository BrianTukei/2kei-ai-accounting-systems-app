
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, EyeIcon, EyeOffIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CardContent } from '@/components/ui/card';

interface SignInFormProps {
  formData: {
    email: string;
    password: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  handleGoogleSignIn: () => void;
}

export default function SignInForm({ 
  formData, 
  handleChange, 
  isLoading, 
  handleGoogleSignIn 
}: SignInFormProps) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // For login, verify credentials against stored data
    const storedUsers = JSON.parse(localStorage.getItem('userSignups') || '[]');
    const matchedUser = storedUsers.find((user: any) => 
      user.email === formData.email && user.password === formData.password
    );
    
    if (!matchedUser) {
      toast.error('Invalid email or password');
      return;
    }
    
    const userData = {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      profileImage: matchedUser.profileImage
    };
    
    localStorage.setItem('user', JSON.stringify(userData));
    trackLogin(userData);
    toast.success(`Welcome back, ${userData.name}!`);
    navigate('/dashboard');
  };
  
  const trackLogin = (userData: { email: string }) => {
    try {
      const storedLogins = localStorage.getItem('loginHistory');
      const logins = storedLogins ? JSON.parse(storedLogins) : [];
      
      logins.push({
        email: userData.email,
        timestamp: new Date().toISOString()
      });
      
      if (logins.length > 100) {
        logins.splice(0, logins.length - 100);
      }
      
      localStorage.setItem('loginHistory', JSON.stringify(logins));
      
      console.log(`User login tracked: ${userData.email}`);
    } catch (error) {
      console.error('Error tracking login:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <a href="#" className="text-xs text-primary hover:underline">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 px-2"
              onClick={toggleShowPassword}
            >
              {showPassword ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Logging in...' : (
            <>
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </>
          )}
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        
        <Button 
          type="button" 
          variant="outline" 
          className="w-full" 
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" className="mr-2" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
            </g>
          </svg>
          Continue with Google
        </Button>
      </CardContent>
    </form>
  );
}
