
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Settings, User as UserIcon, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isOwnerEmail } from '@/lib/adminEmails';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      checkAdminRole(user.id);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    setIsAdmin(!!data || isOwnerEmail(user?.email || ''));
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (!user) {
    return (
      <Button variant="outline" onClick={() => navigate('/auth')}>
        Login
      </Button>
    );
  }

  const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
  const initials = userName
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            {user.user_metadata?.avatar_url ? (
              <AvatarImage src={user.user_metadata.avatar_url} alt={userName} />
            ) : (
          <AvatarFallback className={isAdmin ? "bg-red-500 text-white" : "bg-primary text-primary-foreground"}>
            {initials}
          </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="p-2 border-b">
          <p className="font-medium">{userName}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
          {isAdmin && (
            <p className="text-xs mt-1 font-semibold text-red-500">Administrator</p>
          )}
        </div>
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem onClick={() => navigate('/admin')}>
            <Shield className="mr-2 h-4 w-4" />
            <span>Admin Dashboard</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
