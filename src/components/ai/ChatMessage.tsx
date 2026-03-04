import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Navigation, AlertTriangle, Info, Zap, Brain } from 'lucide-react';
import { type ChatMessage as ChatMessageType } from '@/services/aiAssistant';
import type { NavigationAction } from '@/ai/navigationMap';
import type { AIAlert } from '@/services/ai';

interface ChatMessageProps {
  message: ChatMessageType & {
    metadata?: {
      mode?: string;
      modeLabel?: string;
      action?: { description?: string; requiresConfirmation?: boolean };
      alerts?: AIAlert[];
    };
  };
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

          {/* Action pending indicator */}
          {!isUser && message.metadata?.action?.requiresConfirmation && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-2.5 py-1.5 border border-amber-200 dark:border-amber-800">
              <Zap className="w-3.5 h-3.5" />
              <span>Action ready: <strong>{message.metadata.action.description}</strong> — use the Execute button below.</span>
            </div>
          )}

          {/* Alerts */}
          {!isUser && message.metadata?.alerts && message.metadata.alerts.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.metadata.alerts.slice(0, 3).map((alert, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-1.5 text-xs rounded-lg px-2.5 py-1.5 border ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                      : alert.severity === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  {alert.severity === 'critical' || alert.severity === 'warning'
                    ? <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                    : <Info className="w-3.5 h-3.5 flex-shrink-0 mt-px" />}
                  <span>{alert.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mode badge for AI messages */}
        {!isUser && message.metadata?.modeLabel && (
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground px-1">
            <Brain className="w-2.5 h-2.5" />
            {message.metadata.modeLabel}
          </div>
        )}

        <span className="text-[10px] text-muted-foreground px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
