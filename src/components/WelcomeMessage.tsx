import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, CheckCircle, X } from 'lucide-react';
import { userCompanyService, type WelcomeMessage } from '@/services/userCompanyService';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface WelcomeMessageProps {
  onDismiss?: () => void;
  showOnboarding?: boolean;
}

export default function WelcomeMessage({ onDismiss, showOnboarding = true }: WelcomeMessageProps) {
  const [welcomeData, setWelcomeData] = useState<WelcomeMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { user } = useAuth();
  const { org: organization } = useOrganization();

  useEffect(() => {
    if (!user || isDismissed) return;

    // Check if user has seen welcome message
    const hasSeenWelcome = localStorage.getItem(`welcome-seen-${user.id}`);
    if (hasSeenWelcome) return;

    // Generate welcome message
    const company = organization ? userCompanyService.getCompany(organization.id) : undefined;
    const userForService = user ? {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      phone: user.phone,
      avatar: user.user_metadata?.avatar_url,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(),
      preferences: {
        baseCurrency: 'USD',
        dateFormat: 'YYYY-MM-DD',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false,
          receiptProcessing: true,
          currencyAlerts: false,
          weeklyReports: false,
        },
      },
    } : undefined;
    
    if (userForService) {
      const message = userCompanyService.generateWelcomeMessage(userForService, company);
      setWelcomeData(message);
      setIsVisible(true);
    }
  }, [user, organization, isDismissed]);

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(`welcome-seen-${user.id}`, 'true');
    }
    setIsVisible(false);
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleAction = () => {
    if (welcomeData?.actionUrl) {
      // Navigate to action URL
      window.location.href = welcomeData.actionUrl;
    }
    handleDismiss();
  };

  const handleGetStarted = () => {
    toast.success('Welcome! Let\'s get you started with your first receipt scan.');
    // Trigger receipt scanner or guide to onboarding
    const scannerButton = document.querySelector('[data-receipt-scanner-trigger]') as HTMLButtonElement;
    if (scannerButton) {
      scannerButton.click();
    } else {
      // Fallback to dashboard
      window.location.href = '/dashboard';
    }
    handleDismiss();
  };

  if (!isVisible || !welcomeData || !user) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto relative overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2 z-10"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -mr-16 -mt-16 opacity-50" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-100 to-blue-100 rounded-full -ml-12 -mb-12 opacity-50" />
        
        <CardContent className="pt-8 pb-6 px-6 relative">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {welcomeData.title}
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {welcomeData.message}
              </p>
            </div>
            
            {showOnboarding && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Quick Start Guide
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">1</Badge>
                    <span className="text-blue-800">Upload or scan your first receipt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">2</Badge>
                    <span className="text-blue-800">Watch AI extract details automatically</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">3</Badge>
                    <span className="text-blue-800">Review and save to your transactions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">4</Badge>
                    <span className="text-blue-800">Generate PDFs with your company branding</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2 pt-2">
              <Button 
                onClick={handleGetStarted}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                data-receipt-scanner-trigger
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Get Started Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              {welcomeData.actionText && welcomeData.actionUrl && (
                <Button 
                  variant="outline" 
                  onClick={handleAction}
                  className="w-full"
                >
                  {welcomeData.actionText}
                </Button>
              )}
            </div>
            
            <div className="text-xs text-gray-500 pt-2">
              Welcome to the future of intelligent accounting! 🚀
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
