
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import UserMenu from '@/components/UserMenu';

interface UserActionsProps {
  user: { name: string; email: string } | null;
  orientation?: 'horizontal' | 'vertical';
  onActionClick?: () => void;
}

export default function UserActions({ user, orientation = 'horizontal', onActionClick }: UserActionsProps) {
  const handleClick = () => {
    if (onActionClick) {
      onActionClick();
    }
  };

  return (
    <div 
      className={cn(
        orientation === 'horizontal' ? 'flex items-center space-x-4' : 'grid grid-cols-2 gap-4 w-full'
      )}
    >
      {!user ? (
        <>
          <Button 
            asChild 
            variant="outline" 
            className={orientation === 'horizontal' ? 'rounded-full px-4' : 'w-full'}
            onClick={handleClick}
          >
            <Link to="/auth">Login</Link>
          </Button>
          <Button 
            asChild 
            className={orientation === 'horizontal' ? 'rounded-full px-4' : 'w-full'}
            onClick={handleClick}
          >
            <Link to="/auth?action=signup">Get Started</Link>
          </Button>
        </>
      ) : (
        orientation === 'horizontal' ? (
          <UserMenu />
        ) : (
          <Button 
            className="w-full" 
            variant="destructive"
            onClick={() => {
              localStorage.removeItem('user');
              window.location.href = '/';
              if (onActionClick) onActionClick();
            }}
          >
            Log Out
          </Button>
        )
      )}
    </div>
  );
}

// Import cn utility
import { cn } from '@/lib/utils';
