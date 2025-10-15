
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import NavigationItems from './NavigationItems';
import UserActions from './UserActions';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; email: string } | null;
}

export default function MobileMenu({ isOpen, onClose, user }: MobileMenuProps) {
  const location = useLocation();
  
  // Close mobile menu when route changes
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-40 transform transition-all duration-300 ease-in-out md:hidden',
        isOpen 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0 pointer-events-none'
      )}
    >
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose} />
      <nav className="relative h-full w-4/5 max-w-sm ml-auto bg-white flex flex-col shadow-lg animate-slide-in">
        <div className="flex items-center justify-between p-6 border-b">
          <Link to="/" className="flex items-center space-x-2" onClick={onClose}>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold">2K</span>
            </div>
            <span className="font-semibold text-xl">2KÉI Ledgerly</span>
          </Link>
          <button className="focus:outline-none" onClick={onClose}>
            <X size={24} className="text-slate-800" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            <NavigationItems orientation="vertical" onItemClick={onClose} />
          </div>
        </div>
        
        <div className="p-6 border-t">
          <UserActions user={user} orientation="vertical" onActionClick={onClose} />
        </div>
      </nav>
    </div>
  );
}
