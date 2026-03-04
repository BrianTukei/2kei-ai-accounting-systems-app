
import { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Search,
  Sun,
  Moon,
  ChevronDown,
  Maximize,
  Minimize,
  ShieldAlert,
  Users as UsersIcon,
} from 'lucide-react';
import UserMenu from './UserMenu';
import NavigationItems, { navItems } from './navigation/NavigationItems';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useFullscreen } from '@/hooks/useFullscreen';
import SearchCommandPalette from '@/components/SearchCommandPalette';
import BrandLogo from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isOwnerEmail } from '@/lib/adminEmails';

export default function Navbar() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  const location = useLocation();
  const { user } = useAuth();

  // ── AI Navigation highlight listener ───────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.menuItem) {
        setHighlightedItem(detail.menuItem);
        // Auto-clear after 5 seconds
        setTimeout(() => setHighlightedItem(null), 5000);
      }
    };
    window.addEventListener('ai-nav-highlight', handler);
    return () => window.removeEventListener('ai-nav-highlight', handler);
  }, []);

  // Check admin role
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    const check = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data || isOwnerEmail(user.email || ''));
    };
    check();
  }, [user]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Close the sheet whenever the route changes
  useEffect(() => {
    setIsSheetOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const isLandingPage = location.pathname === '/';

  // Smooth scroll to a section on the landing page
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Grouped items for the hamburger sheet
  const groups: { label: string; keys: string[] }[] = [
    { label: 'Main', keys: ['main', 'reports'] },
    { label: 'Financial Statements', keys: ['financial'] },
    { label: 'Account', keys: ['saas'] },
  ];

  return (
    <header
      role="banner"
      className={`sticky top-0 z-40 transition-all duration-400 ${isScrolled ? 'backdrop-blur-xl bg-background/80 dark:bg-background/70 shadow-card border-b border-border/30' : 'bg-transparent'} `}
    >
      <nav
        role="navigation"
        aria-label="Main navigation"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="flex items-center justify-between h-16">
          {/* Left: Hamburger + Brand */}
          <div className="flex items-center space-x-3">
            {/* Hamburger menu — always visible */}
            <button
              aria-label="Open navigation menu"
              onClick={() => setIsSheetOpen(true)}
              className="relative w-10 h-10 flex items-center justify-center rounded-xl text-foreground/70 hover:text-foreground hover:bg-muted transition-all duration-300"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/dashboard" className="flex items-center space-x-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg p-1 -m-1">
              <BrandLogo size="md" />
              <div className="hidden sm:block">
                <div className="text-sm font-semibold leading-4 text-foreground">2K AI Accounting Systems</div>
                <div className="text-xs text-muted-foreground">Premium Financial Suite</div>
              </div>
            </Link>
          </div>

          {/* Center: primary nav items (desktop only) */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {isLandingPage ? (
              <>
                {['features', 'pricing', 'testimonials'].map((section) => (
                  <button
                    key={section}
                    onClick={() => scrollToSection(section)}
                    className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-primary rounded-lg hover:bg-primary/5 transition-all duration-300 capitalize"
                  >
                    {section}
                  </button>
                ))}
                <Button asChild size="sm" className="rounded-full ml-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 border-0 shadow-sm hover:shadow-elegant transition-all duration-400">
                  <Link to="/auth?action=signup">Sign Up</Link>
                </Button>
              </>
            ) : (
              <NavigationItems onlyPrimary highlightedItem={highlightedItem} />
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-2">
            <button
              aria-label="Search (Ctrl+K)"
              title="Search (Ctrl+K)"
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-xl text-foreground/60 hover:text-primary hover:bg-primary/5 transition-all duration-300"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="p-2 rounded-xl text-foreground/60 hover:text-primary hover:bg-primary/5 transition-all duration-300"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleTheme}
              aria-pressed={theme === 'dark'}
              aria-label="Toggle dark mode"
              className="p-2 rounded-xl text-foreground/60 hover:text-primary hover:bg-primary/5 transition-all duration-300"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="hidden md:block">
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Hamburger Sheet ─── */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="left" className="w-80 p-0 overflow-y-auto border-r border-border/30">
          <SheetHeader className="p-5 border-b border-border/30">
            <div className="flex items-center space-x-3">
              <BrandLogo size="sm" />
              <div>
                <SheetTitle className="text-sm font-semibold text-foreground">2K AI Accounting</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">Navigate your workspace</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Search trigger (opens command palette) */}
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={() => { setIsSheetOpen(false); setTimeout(() => setIsSearchOpen(true), 150); }}
              className="w-full flex items-center gap-2 pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-muted-foreground hover:border-primary/30 transition-all duration-300 text-left relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              Search pages…
              <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded border bg-muted font-mono">Ctrl+K</kbd>
            </button>
          </div>

          {/* Grouped nav items */}
          <div className="px-3 py-2 space-y-5">
            {groups.map((group) => {
              const groupItems = navItems.filter((i) => group.keys.includes(i.group || ''));
              if (groupItems.length === 0) return null;
              return (
                <div key={group.label}>
                  <p className="px-3 mb-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">
                    {group.label}
                  </p>
                  <nav className="space-y-0.5">
                    {groupItems.map((item) => {
                      const isActive = location.pathname === item.path;
                      const isHighlighted = highlightedItem === item.name;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsSheetOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                            isActive
                              ? 'bg-primary/8 dark:bg-primary/15 text-primary shadow-sm'
                              : 'text-foreground/70 hover:bg-muted transition-all duration-300',
                            isHighlighted && 'animate-pulse-glow ring-2 ring-primary/60 bg-primary/10 text-primary scale-[1.02]'
                          )}
                        >
                          {/* Colored icon badge */}
                          <span
                            className={cn(
                              'flex items-center justify-center w-9 h-9 rounded-lg transition-transform duration-200 group-hover:scale-110',
                              `bg-gradient-to-br ${item.iconGradient}`,
                              isActive && 'shadow-sm ring-1 ring-primary/20'
                            )}
                          >
                            <Icon
                              size={18}
                              className={cn(
                                item.iconColor,
                                'transition-colors duration-200',
                                isActive && 'drop-shadow-sm'
                              )}
                              strokeWidth={isActive ? 2.5 : 2}
                            />
                          </span>
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              );
            })}

            {/* ── Admin Section (only for admin users) ── */}
            {isAdmin && (
              <div>
                <p className="px-3 mb-2 text-[10px] uppercase tracking-wider font-semibold text-red-400 dark:text-red-500">
                  Admin
                </p>
                <nav className="space-y-0.5">
                  <Link
                    to="/admin"
                    onClick={() => setIsSheetOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                      location.pathname === '/admin'
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 shadow-sm'
                        : 'text-foreground/70 hover:bg-red-50 dark:hover:bg-red-900/20'
                    )}
                  >
                    <span className={cn(
                      'flex items-center justify-center w-9 h-9 rounded-lg transition-transform duration-200 group-hover:scale-110',
                      'bg-gradient-to-br from-red-500/20 to-rose-500/20',
                      location.pathname === '/admin' && 'shadow-sm ring-1 ring-red-400/30'
                    )}>
                      <ShieldAlert size={18} className="text-red-500" strokeWidth={location.pathname === '/admin' ? 2.5 : 2} />
                    </span>
                    <span>Admin Dashboard</span>
                  </Link>
                  <Link
                    to="/admin/users"
                    onClick={() => setIsSheetOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                      location.pathname === '/admin/users'
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 shadow-sm'
                        : 'text-foreground/70 hover:bg-red-50 dark:hover:bg-red-900/20'
                    )}
                  >
                    <span className={cn(
                      'flex items-center justify-center w-9 h-9 rounded-lg transition-transform duration-200 group-hover:scale-110',
                      'bg-gradient-to-br from-red-500/20 to-orange-500/20',
                      location.pathname === '/admin/users' && 'shadow-sm ring-1 ring-red-400/30'
                    )}>
                      <UsersIcon size={18} className="text-red-500" strokeWidth={location.pathname === '/admin/users' ? 2.5 : 2} />
                    </span>
                    <span>User Management</span>
                  </Link>
                </nav>
              </div>
            )}
          </div>

          {/* Bottom actions */}
          <div className="mt-auto border-t border-border/30 px-4 py-4 space-y-2">
            <button
              onClick={() => { toggleFullscreen(); setIsSheetOpen(false); }}
              className="w-full py-2.5 px-3 rounded-xl hover:bg-muted flex items-center gap-3 text-sm group transition-all duration-300"
            >
              <span className={cn(
                'flex items-center justify-center w-9 h-9 rounded-lg transition-transform duration-200 group-hover:scale-110',
                isFullscreen
                  ? 'bg-gradient-to-br from-rose-500/20 to-orange-500/20'
                  : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20'
              )}>
                {isFullscreen
                  ? <Minimize className="w-[18px] h-[18px] text-rose-500" />
                  : <Maximize className="w-[18px] h-[18px] text-emerald-500" />}
              </span>
              <span className="text-foreground/70">{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</span>
            </button>

            <button onClick={toggleTheme} className="w-full py-2.5 px-3 rounded-xl hover:bg-muted flex items-center gap-3 text-sm group transition-all duration-300">
              <span className={cn(
                'flex items-center justify-center w-9 h-9 rounded-lg transition-transform duration-200 group-hover:scale-110',
                theme === 'dark'
                  ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20'
                  : 'bg-gradient-to-br from-indigo-500/20 to-violet-500/20'
              )}>
                {theme === 'dark'
                  ? <Sun className="w-[18px] h-[18px] text-yellow-500" />
                  : <Moon className="w-[18px] h-[18px] text-indigo-500" />}
              </span>
              <span className="text-foreground/70">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
            <div className="md:hidden">
              <UserMenu />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Search Command Palette ─── */}
      <SearchCommandPalette open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  );
}
