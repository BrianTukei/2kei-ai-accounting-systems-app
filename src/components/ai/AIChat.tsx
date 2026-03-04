import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, Bot, Minimize2, Maximize2, X, BarChart3, DollarSign, TrendingDown, AlertTriangle, Sparkles, Navigation } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { AIAssistantService, ChatMessage as ChatMessageType, FinancialSnapshot } from '@/services/aiAssistant';
import { useFinancialStats } from '@/hooks/useFinancialStats';
import type { NavigationAction } from '@/ai/navigationMap';

/** Quick suggestion chips shown when conversation is empty / after welcome */
const QUICK_SUGGESTIONS = [
  { label: '📊 Health Score', message: 'How is my business doing?' },
  { label: '💰 Cash Flow', message: 'Analyze my cash flow' },
  { label: '📉 Expenses', message: 'Analyze my expenses' },
  { label: '⚠️ Risk Areas', message: 'Show risk areas' },
  { label: '📈 Profit Analysis', message: 'Analyze my profits' },
  { label: '🧭 Navigate', message: 'Where do I add a transaction?' },
];

interface AIChatProps {
  contextType?: string;
  contextData?: any;
  onClose?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  initialMessage?: string;
  /** Pre-load messages from a saved conversation */
  preloadedMessages?: ChatMessageType[];
  /** Called whenever messages change so parent can save them */
  onMessagesChange?: (messages: ChatMessageType[]) => void;
  /** When true, fills parent container (no Card wrapper, no fixed dimensions) */
  embedded?: boolean;
}

export const AIChat: React.FC<AIChatProps> = ({
  contextType,
  contextData,
  onClose,
  isMinimized = false,
  onToggleMinimize,
  initialMessage,
  preloadedMessages,
  onMessagesChange,
  embedded = false,
}) => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [sentInitial, setSentInitial] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // ── Real financial data ─────────────────────────────────────────────────
  const stats = useFinancialStats();

  /** Build a snapshot every render so the AI always has fresh numbers */
  const financialSnapshot: FinancialSnapshot = {
    totalIncome: stats.totalIncome,
    totalExpenses: stats.totalExpenses,
    totalBalance: stats.totalBalance,
    monthlyIncome: stats.monthlyIncome,
    monthlyExpenses: stats.monthlyExpenses,
    incomeGrowth: stats.incomeGrowth,
    expenseGrowth: stats.expenseGrowth,
    categoryBreakdown: stats.categoryBreakdown,
    monthlyData: stats.monthlyData,
    transactionCount: stats.totalIncome > 0 || stats.totalExpenses > 0 ? Math.max(stats.categoryBreakdown.length * 3, 1) : 0,
  };

  /**
   * Extract a NavigationAction from an AI response if it contains one.
   * The AI engine embeds it as <!--NAV_ACTION:{...}-->
   */
  const extractNavAction = useCallback((text: string): NavigationAction | null => {
    const match = text.match(/<!--NAV_ACTION:(.*?)-->/);
    if (!match) return null;
    try {
      return JSON.parse(match[1]) as NavigationAction;
    } catch {
      return null;
    }
  }, []);

  /**
   * Navigate to a page and dispatch highlight event for the Navbar.
   */
  const handleNavigate = useCallback((action: NavigationAction) => {
    // Dispatch highlight event for the Navbar
    window.dispatchEvent(new CustomEvent('ai-nav-highlight', { detail: { menuItem: action.highlight } }));
    // Navigate after a small delay so the highlight is visible first
    setTimeout(() => {
      navigate(action.path);
    }, 300);
  }, [navigate]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input on mount / maximize
  useEffect(() => {
    if (!isMinimized) inputRef.current?.focus();
  }, [isMinimized]);

  // Welcome message (skip if preloaded messages exist)
  useEffect(() => {
    if (preloadedMessages && preloadedMessages.length > 0) {
      setMessages(preloadedMessages);
      return;
    }
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm **2KEI AI** — your intelligent financial co-pilot. 🧠\n\nI analyze your **real financial data** to provide:\n\n• 📊 Financial Health Score (0-100)\n• 📈 Profit & Margin Analysis\n• 💰 Cash Flow Assessment\n• ⚠️ Error & Risk Detection\n• 🚀 Growth Strategies\n\nTry asking: **"How is my business doing?"**`,
        timestamp: new Date(),
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-send initial message (from Quick Help / carousel buttons)
  useEffect(() => {
    if (initialMessage && !sentInitial && messages.length > 0 && !isLoading) {
      setSentInitial(true);
      sendMessage(initialMessage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage, sentInitial, messages.length, isLoading]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMsg: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => {
      const next = [...prev, userMsg];
      onMessagesChange?.(next);
      return next;
    });
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await AIAssistantService.sendMessage({
        message,
        conversationId,
        contextType,
        contextData,
        financialSnapshot,
      });

      if (response.success && response.response) {
        const aiMsg: ChatMessageType = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: response.response!,
          timestamp: new Date(),
        };
        setMessages(prev => {
          const next = [...prev, aiMsg];
          onMessagesChange?.(next);
          return next;
        });
        if (response.conversationId && !conversationId) {
          setConversationId(response.conversationId);
        }
      } else {
        throw new Error(response.error || 'No response');
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I had trouble responding. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, contextType, contextData, isLoading, onMessagesChange]);

  const handleSend = () => sendMessage(inputValue.trim());

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Input bar (shared) ─────────────────────────────────────────────────────
  const inputBar = (
    <div className="flex flex-col gap-2 pt-2 border-t border-border bg-background">
      {/* Quick suggestion chips — only show when few messages */}
      {messages.length <= 2 && !isLoading && (
        <div className="flex flex-wrap gap-1.5">
          {QUICK_SUGGESTIONS.map(s => (
            <button
              key={s.label}
              onClick={() => sendMessage(s.message)}
              className="text-[11px] px-2.5 py-1.5 rounded-full bg-primary/5 hover:bg-primary/15 text-primary border border-primary/15 transition-colors duration-200 font-medium whitespace-nowrap"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask 2KEI AI about your finances…"
          disabled={isLoading}
          className="flex-1 text-sm h-9"
        />
        <Button
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          size="sm"
          className="h-9 px-3"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );

  // ── Messages list (shared) ─────────────────────────────────────────────────
  const messageList = (
    <div className="flex flex-col gap-3 py-3 px-1">
      {messages.map(msg => <ChatMessage key={msg.id} message={msg} onNavigate={handleNavigate} />)}
      {isLoading && (
        <div className="flex gap-2 items-end">
          <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0 mb-1">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div className="bg-muted border border-border/50 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
            </span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );

  // ── Minimised strip (floating only) ───────────────────────────────────────
  if (!embedded && isMinimized) {
    return (
      <Card className="w-80 shadow-card-hover border-primary/30 rounded-2xl animate-scale-in">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-sm">2KEI AI</span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onToggleMinimize} className="h-7 w-7 p-0 rounded-lg hover:bg-primary/10"><Maximize2 className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 rounded-lg hover:bg-destructive/10"><X className="w-3.5 h-3.5" /></Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Embedded mode: fills parent flex column ───────────────────────────────
  if (embedded) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        {/* Scrollable messages area */}
        <div className="flex-1 overflow-y-auto min-h-0 px-1">
          {messageList}
        </div>
        {/* Pinned input */}
        <div className="flex-shrink-0 px-1 pb-1">
          {inputBar}
        </div>
      </div>
    );
  }

  // ── Floating mode: Card with fixed dimensions ──────────────────────────────
  return (
    <Card className="w-96 h-[520px] shadow-float border-border/50 flex flex-col rounded-2xl animate-scale-in overflow-hidden">
      <CardHeader className="pb-2 flex-shrink-0 border-b border-border/40 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold">2KEI AI</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] text-muted-foreground font-normal">Online</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            {onToggleMinimize && <Button variant="ghost" size="sm" onClick={onToggleMinimize} className="h-7 w-7 p-0 rounded-lg hover:bg-primary/10"><Minimize2 className="w-3.5 h-3.5" /></Button>}
            {onClose && <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 rounded-lg hover:bg-destructive/10"><X className="w-3.5 h-3.5" /></Button>}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-3 pt-0 min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0">
          {messageList}
        </div>
        <div className="flex-shrink-0">
          {inputBar}
        </div>
      </CardContent>
    </Card>
  );
};

