import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Navigation } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/services/aiAssistant';
import type { NavigationAction } from '@/ai/navigationMap';

interface ChatMessageProps {
  message: ChatMessageType;
  onNavigate?: (action: NavigationAction) => void;
}

/** Strip the hidden nav-action comment from visible text */
const stripNavAction = (text: string): string => text.replace(/<!--NAV_ACTION:.*?-->/g, '').trimEnd();

/** Extract nav action if present */
const extractNavAction = (text: string): NavigationAction | null => {
  const match = text.match(/<!--NAV_ACTION:(.*?)-->/);
  if (!match) return null;
  try { return JSON.parse(match[1]) as NavigationAction; } catch { return null; }
};

// Renders **bold** markers, `code` markers, and preserves line breaks
const renderContent = (text: string) => {
  return text.split('\n').map((line, i, arr) => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('`') && part.endsWith('`'))
        return <code key={j} className="px-1 py-0.5 rounded bg-muted-foreground/10 text-xs font-mono">{part.slice(1, -1)}</code>;
      return <span key={j}>{part}</span>;
    });
    return (
      <React.Fragment key={i}>
        {parts}
        {i < arr.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onNavigate }) => {
  const isUser = message.role === 'user';
  const navAction = !isUser ? extractNavAction(message.content) : null;
  const displayText = !isUser ? stripNavAction(message.content) : message.content;

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
      <Avatar className="w-7 h-7 flex-shrink-0 mb-1">
        <AvatarFallback
          className={
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted border border-border'
          }
        >
          {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
        </AvatarFallback>
      </Avatar>

      <div className={`flex flex-col gap-0.5 max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-3.5 py-2.5 text-sm leading-relaxed break-words ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm'
              : 'bg-muted text-foreground rounded-2xl rounded-bl-sm border border-border/50'
          }`}
        >
          {renderContent(displayText)}
          {/* Navigation action button */}
          {navAction && onNavigate && (
            <button
              onClick={() => onNavigate(navAction)}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 w-full justify-center"
            >
              <Navigation className="w-4 h-4" />
              Go to {navAction.pageName} →
            </button>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
