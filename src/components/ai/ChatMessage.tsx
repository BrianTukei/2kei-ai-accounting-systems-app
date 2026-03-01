import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/services/aiAssistant';

interface ChatMessageProps {
  message: ChatMessageType;
}

// Renders **bold** markers and preserves line breaks
const renderContent = (text: string) => {
  return text.split('\n').map((line, i, arr) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={j}>{part.slice(2, -2)}</strong>
        : <span key={j}>{part}</span>
    );
    return (
      <React.Fragment key={i}>
        {parts}
        {i < arr.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

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
          {renderContent(message.content)}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
