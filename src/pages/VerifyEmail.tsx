import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { EmailVerificationService } from '@/services/emailVerification';
import { toast } from 'sonner';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    // Verify the token
    const verifyToken = async () => {
      try {
        const result = await EmailVerificationService.verifyEmail(token);
        
        if (result.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
          toast.success('Email verified successfully!');
          
          // Redirect to login after a short delay
          setTimeout(() => {
            navigate('/auth?message=verified');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(result.message || 'Verification failed');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error?.message || 'An unexpected error occurred');
      }
    };

    verifyToken();
  }, [token, navigate]);

  const handleReturnToLogin = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/95 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Verifying your email address...'}
            {status === 'success' && 'Email verification completed'}
            {status === 'error' && 'Verification failed'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-muted-foreground">Please wait while we verify your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <div className="space-y-2">
                <p className="text-green-600 font-medium">{message}</p>
                <p className="text-sm text-muted-foreground">
                  You will be redirected to the login page shortly, or you can click the button below.
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <div className="space-y-2">
                <p className="text-red-600 font-medium">{message}</p>
                <p className="text-sm text-muted-foreground">
                  The verification link may be expired or invalid.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-2 pt-4">
            <Button 
              onClick={handleReturnToLogin}
              className="w-full"
            >
              {status === 'success' ? 'Continue to Login' : 'Return to Login'}
            </Button>
            
            {status === 'error' && (
              <Link to="/email-confirmation">
                <Button variant="outline" className="w-full">
                  Request New Verification Email
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}