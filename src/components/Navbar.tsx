
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from "lucide-react";
import UserMenu from "./UserMenu";
import NavigationItems from "./navigation/NavigationItems";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-background shadow-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="text-xl font-semibold text-primary hover:text-primary/90 transition-colors">
            2KÉI Ledgerly Accounting
          </Link>

          <div className="hidden md:block">
            <NavigationItems />
          </div>

          <div className="md:hidden">
            <button 
              onClick={toggleMenu}
              className="text-muted-foreground hover:text-primary transition-colors"
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
        <div className="md:hidden bg-background shadow-md py-4 border-t border-border animate-fade-in">
          <div className="container mx-auto px-4">
            <NavigationItems orientation="vertical" onItemClick={() => setIsMenuOpen(false)} />
          </div>
        </div>
      )}
    </nav>
  );
}
