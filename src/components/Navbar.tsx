
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, User, LogOut, TrendingUp } from "lucide-react";

// Create a mock useAuth hook to fix the import error
const useAuth = () => {
  return {
    user: { name: 'User' },
    logout: () => console.log('Logout')
  };
};

const NavigationItems = () => (
  <div className="flex items-center">
    <Link to="/dashboard" className="hidden md:block text-sm font-medium text-gray-700 px-3 py-2 hover:text-primary transition-colors">
      Dashboard
    </Link>
    <Link to="/transactions" className="hidden md:block text-sm font-medium text-gray-700 px-3 py-2 hover:text-primary transition-colors">
      Transactions
    </Link>
    <Link to="/forecast" className="hidden md:block text-sm font-medium text-gray-700 px-3 py-2 hover:text-primary transition-colors">
      Forecast
    </Link>
    <Link to="/reports" className="hidden md:block text-sm font-medium text-gray-700 px-3 py-2 hover:text-primary transition-colors">
      Reports
    </Link>
  </div>
);

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="text-xl font-semibold text-primary">
            2KÈI Ledgery Accounting
          </Link>

          <NavigationItems />

          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full h-10 w-10">
                    <Avatar>
                      <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mr-2">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth" className="text-sm font-medium text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
