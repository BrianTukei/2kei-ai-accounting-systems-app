
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  CreditCard, 
  BarChart, 
  Settings, 
  User, 
  Menu, 
  X 
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: CreditCard },
  { name: 'Reports', path: '/reports', icon: BarChart },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 w-full z-50 transition-all duration-400',
          scrolled 
            ? 'bg-white/80 backdrop-blur-lg border-b border-slate-200/50 shadow-subtle py-2' 
            : 'bg-transparent py-4'
        )}
      >
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2"
          >
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold">2K</span>
            </div>
            <span className="font-semibold text-xl">2KÈI Ledgery</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    'flex items-center space-x-1 font-medium px-1 py-2 transition-all duration-300',
                    isActive 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-slate-600 hover:text-primary'
                  )}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side - Auth Button or User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Button asChild variant="outline" className="rounded-full px-4">
              <Link to="/auth">
                <User size={18} className="mr-2" />
                Sign In
              </Link>
            </Button>
            <Button asChild className="rounded-full px-4">
              <Link to="/auth?action=signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            className="md:hidden focus:outline-none"
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X size={24} className="text-slate-800" />
            ) : (
              <Menu size={24} className="text-slate-800" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={cn(
          'fixed inset-0 z-40 transform transition-all duration-300 ease-in-out md:hidden',
          mobileMenuOpen 
            ? 'translate-x-0 opacity-100' 
            : 'translate-x-full opacity-0 pointer-events-none'
        )}
      >
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        <nav className="relative h-full w-4/5 max-w-sm ml-auto bg-white flex flex-col shadow-lg animate-slide-in">
          <div className="flex items-center justify-between p-6 border-b">
            <Link to="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold">2K</span>
              </div>
              <span className="font-semibold text-xl">2KÈI Ledgery</span>
            </Link>
            <button className="focus:outline-none" onClick={toggleMobileMenu}>
              <X size={24} className="text-slate-800" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      'flex items-center space-x-3 p-3 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-slate-100 text-slate-700'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="p-6 border-t">
            <div className="grid grid-cols-2 gap-4">
              <Button asChild variant="outline" className="w-full">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              </Button>
              <Button asChild className="w-full">
                <Link to="/auth?action=signup" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
              </Button>
            </div>
          </div>
        </nav>
      </div>
      
      {/* Navbar Spacer */}
      <div className="h-16" />
    </>
  );
}
