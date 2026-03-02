import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { navItems, type NavItem } from '@/components/navigation/NavigationItems';
import { cn } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  FileText,
  Sun,
  Moon,
  Maximize,
  Minimize,
  Search,
} from 'lucide-react';
import { useFullscreen } from '@/hooks/useFullscreen';

// ─── Types ────────────────────────────────────────────

interface TransactionHit {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string;
}

// ─── Component ────────────────────────────────────────

interface SearchCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchCommandPalette({ open, onOpenChange }: SearchCommandPaletteProps) {
  const navigate = useNavigate();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const [query, setQuery] = useState('');

  // ─── load transactions from localStorage ──────────
  const transactions = useMemo<TransactionHit[]>(() => {
    try {
      const raw = localStorage.getItem('finance-app-transactions');
      if (!raw) return [];
      const parsed = JSON.parse(raw) as any[];
      return parsed.map((t) => ({
        id: t.id ?? '',
        description: t.description ?? '',
        category: t.category ?? '',
        amount: t.amount ?? 0,
        type: t.type ?? 'expense',
        date: t.date ?? '',
      }));
    } catch {
      return [];
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- re-read every time the palette opens

  // ─── filtered transactions (max 6 shown) ──────────
  const filteredTransactions = useMemo(() => {
    if (!query.trim()) return transactions.slice(0, 5);
    const q = query.toLowerCase();
    return transactions
      .filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          String(t.amount).includes(q) ||
          t.date.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query, transactions]);

  // ─── helpers ──────────────────────────────────────
  const goTo = useCallback(
    (path: string) => {
      onOpenChange(false);
      navigate(path);
    },
    [navigate, onOpenChange],
  );

  // Toggle theme
  const toggleTheme = useCallback(() => {
    const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('theme', next);
    onOpenChange(false);
  }, [onOpenChange]);

  // ─── quick actions ────────────────────────────────
  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: 'add-transaction',
        label: 'Add new transaction',
        icon: <Plus className="h-4 w-4" />,
        action: () => goTo('/transactions'),
        keywords: 'create new add transaction',
      },
      {
        id: 'create-invoice',
        label: 'Create invoice',
        icon: <FileText className="h-4 w-4" />,
        action: () => goTo('/invoices'),
        keywords: 'create new bill invoice',
      },
      {
        id: 'toggle-theme',
        label: document.documentElement.classList.contains('dark') ? 'Switch to light mode' : 'Switch to dark mode',
        icon: document.documentElement.classList.contains('dark') ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
        action: toggleTheme,
        keywords: 'theme dark light mode',
      },
      {
        id: 'toggle-fullscreen',
        label: isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen',
        icon: isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />,
        action: () => { toggleFullscreen(); onOpenChange(false); },
        keywords: 'fullscreen maximize minimize expand',
      },
    ],
    [goTo, toggleTheme, isFullscreen, toggleFullscreen, onOpenChange],
  );

  // Reset query when dialog opens
  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  // ─── Keyboard shortcut: Ctrl+K / Cmd+K ───────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  // ─── currency helper ──────────────────────────────
  const fmt = (n: number) => {
    try {
      const stored = localStorage.getItem('selected-currency');
      const cur = stored ? JSON.parse(stored) : null;
      const code = cur?.code || 'USD';
      return new Intl.NumberFormat(cur?.locale || undefined, { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(n);
    } catch {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search pages, transactions, or actions…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-4">
            <Search className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">No results found for &ldquo;{query}&rdquo;</p>
          </div>
        </CommandEmpty>

        {/* ── Pages ── */}
        <CommandGroup heading="Pages">
          {navItems.map((item: NavItem) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.path}
                value={`${item.name} ${item.group}`}
                onSelect={() => goTo(item.path)}
                className="gap-3 cursor-pointer"
              >
                <span
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg',
                    `bg-gradient-to-br ${item.iconGradient}`,
                  )}
                >
                  <Icon size={16} className={item.iconColor} />
                </span>
                <span>{item.name}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        {/* ── Recent Transactions ── */}
        {filteredTransactions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Transactions">
              {filteredTransactions.map((tx) => (
                <CommandItem
                  key={tx.id}
                  value={`${tx.description} ${tx.category} ${tx.amount} ${tx.date}`}
                  onSelect={() => goTo('/transactions')}
                  className="gap-3 cursor-pointer"
                >
                  <span
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-lg',
                      tx.type === 'income'
                        ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20'
                        : 'bg-gradient-to-br from-rose-500/20 to-red-500/20'
                    )}
                  >
                    {tx.type === 'income' ? (
                      <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4 text-rose-600" />
                    )}
                  </span>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="truncate text-sm">{tx.description}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {tx.category} &middot; {tx.date}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-semibold tabular-nums',
                      tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600',
                    )}
                  >
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* ── Quick Actions ── */}
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem
              key={action.id}
              value={`${action.label} ${action.keywords ?? ''}`}
              onSelect={action.action}
              className="gap-3 cursor-pointer"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500/10 to-slate-500/20">
                {action.icon}
              </span>
              <span>{action.label}</span>
              {action.id === 'add-transaction' && <CommandShortcut>N</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>

      {/* Footer hint */}
      <div className="border-t px-3 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">↑↓</kbd> Navigate</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">↵</kbd> Select</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">Esc</kbd> Close</span>
        </div>
        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">K</kbd></span>
      </div>
    </CommandDialog>
  );
}
