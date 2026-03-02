import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, Bot, Minimize2, Maximize2, X } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { AIAssistantService, ChatMessage as ChatMessageType } from '@/services/aiAssistant';

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
        content: `Hello! I'm your AI Accounting Assistant. I can help you with:\n\n• Understanding financial reports\n• Expense categorization\n• Accounting principles\n• Tax and bookkeeping guidance\n• Financial analysis and insights\n\nWhat would you like to know about your finances today?`,
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
    <div className="flex gap-2 pt-2 border-t border-border bg-background">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask me about your finances…"
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
  );

  // ── Messages list (shared) ─────────────────────────────────────────────────
  const messageList = (
    <div className="flex flex-col gap-3 py-3 px-1">
      {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
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
            <span className="font-medium text-sm">AI Assistant</span>
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
              <span className="text-sm font-semibold">AI Accounting Assistant</span>
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

