
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
import { Settings, User, LogOut, Menu, X } from "lucide-react";
import UserMenu from "./UserMenu";
import NavigationItems from "./navigation/NavigationItems";

// Create a mock useAuth hook to fix the import error
const useAuth = () => {
  return {
    user: { name: 'User' },
    logout: () => console.log('Logout')
  };
};

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

          <div className="hidden md:block">
            <NavigationItems />
          </div>

          <div className="md:hidden">
            <button 
              onClick={toggleMenu}
              className="text-gray-600 hover:text-primary"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-md py-4 border-t">
          <div className="container mx-auto px-4">
            <NavigationItems orientation="vertical" onItemClick={() => setIsMenuOpen(false)} />
          </div>
        </div>
      )}
    </nav>
  );
}
