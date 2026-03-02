import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, MessageCircle } from 'lucide-react';
import { AIChat } from './AIChat';
import { useAuth } from '@/contexts/AuthContext';

interface AIFloatingButtonProps {
  contextType?: string;
  contextData?: any;
}

export const AIFloatingButton: React.FC<AIFloatingButtonProps> = ({ 
  contextType, 
  contextData 
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { user } = useAuth();

  // Don't show if user is not authenticated
  if (!user) {
    return null;
  }

  const handleToggleChat = () => {
    if (isChatOpen && !isMinimized) {
      setIsMinimized(true);
    } else {
      setIsChatOpen(true);
      setIsMinimized(false);
    }
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setIsMinimized(false);
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Floating Button */}
      {(!isChatOpen || isMinimized) && (
        <div className="fixed bottom-6 right-6 z-50 group">
          <Button
            onClick={handleToggleChat}
            size="lg"
            className="h-14 w-14 rounded-full shadow-float bg-gradient-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0 transition-all duration-400 hover:scale-110 hover:shadow-glow animate-breathe"
          >
            {isMinimized ? (
              <MessageCircle className="w-6 h-6" />
            ) : (
              <Bot className="w-6 h-6" />
            )}
          </Button>
          
          {/* Tooltip */}
          {!isMinimized && (
            <div className="absolute bottom-[calc(100%+8px)] right-0 bg-card text-foreground text-xs font-medium px-3 py-1.5 rounded-lg shadow-card border border-border/50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              AI Assistant
              <div className="absolute -bottom-1 right-4 w-2 h-2 bg-card border-r border-b border-border/50 rotate-45" />
            </div>
          )}
        </div>
      )}

      {/* Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <AIChat
            contextType={contextType}
            contextData={contextData}
            onClose={handleCloseChat}
            isMinimized={isMinimized}
            onToggleMinimize={handleToggleMinimize}
          />
        </div>
      )}
    </>
  );
};