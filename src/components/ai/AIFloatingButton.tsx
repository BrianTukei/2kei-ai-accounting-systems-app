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
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleToggleChat}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isMinimized ? (
              <MessageCircle className="w-6 h-6" />
            ) : (
              <Bot className="w-6 h-6" />
            )}
          </Button>
          
          {/* Tooltip */}
          {!isMinimized && (
            <div className="absolute bottom-16 right-0 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              AI Assistant
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