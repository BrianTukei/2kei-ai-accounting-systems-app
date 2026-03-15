import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Brain,
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Play,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { AIAction, ActionResult } from '@/services/ai/actionAIService';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isAction?: boolean;
  action?: AIAction;
  actionResult?: ActionResult;
  confidence?: number;
}

interface ActionAIChatbotProps {
  className?: string;
}

export default function ActionAIChatbot({ className }: ActionAIChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isServiceAvailable, setIsServiceAvailable] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [capabilities, setCapabilities] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    {
      icon: <FileText className="h-4 w-4" />,
      label: 'Create Invoice',
      prompt: 'Create an invoice for John for $300',
      action: 'create_invoice'
    },
    {
      icon: <DollarSign className="h-4 w-4" />,
      label: 'Add Expense',
      prompt: 'Add expense for office supplies $50',
      action: 'create_expense'
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: 'Add Client',
      prompt: 'Add client Mary with email mary@example.com',
      action: 'add_client'
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: 'View Summary',
      prompt: 'Show me my financial summary',
      action: 'view_financial_summary'
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: 'Generate Report',
      prompt: 'Generate profit loss report',
      action: 'generate_report'
    },
    {
      icon: <Brain className="h-4 w-4" />,
      label: 'Analyze Expenses',
      prompt: 'Analyze my expenses',
      action: 'analyze_expenses'
    }
  ];

  useEffect(() => {
    checkServiceAvailability();
    loadCapabilities();
    
    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `🚀 Welcome to Action AI Assistant!

I can help you with both **answering questions** and **performing actions** in your accounting system.

## 🎯 **What I Can Do:**

**💬 Chat with me about:**
- "Where do I find reports?"
- "How do I create invoices?"
- "What are my expenses this month?"

**⚡ Ask me to perform actions:**
- "Create an invoice for John for $300"
- "Add expense for office supplies $50"
- "Generate profit loss report"
- "Show me my financial summary"

## 🤖 **Available Actions:**
${availableActions.length > 0 ? availableActions.map(action => `• ${action}`).join('\n') : 'Loading...'}

## 💡 **Try These:**
${quickActions.map(action => `• "${action.prompt}"`).join('\n')}

**I'll understand your request, extract the action, and execute it automatically!**`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkServiceAvailability = async () => {
    try {
      const response = await fetch('/api/action-ai/status');
      if (response.ok) {
        const data = await response.json();
        setIsServiceAvailable(data.data.available);
        
        if (data.data.available) {
          toast.success('✅ Action AI is ready to help!');
        } else {
          toast.warning('⚠️ Action AI is not available');
        }
      }
    } catch (error) {
      console.error('Failed to check Action AI availability:', error);
      setIsServiceAvailable(false);
    }
  };

  const loadCapabilities = async () => {
    try {
      const response = await fetch('/api/action-ai/capabilities');
      if (response.ok) {
        const data = await response.json();
        setAvailableActions(data.data.availableActions);
        setCapabilities(data.data);
      }
    } catch (error) {
      console.error('Failed to load capabilities:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/action-ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          context: {
            currentModule: 'action-ai-chatbot'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.data.response,
        timestamp: new Date(),
        isAction: data.data.isAction,
        action: data.data.action,
        actionResult: data.data.actionResult,
        confidence: data.data.confidence
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show success/error toast for actions
      if (data.data.isAction && data.data.actionResult) {
        if (data.data.actionResult.success) {
          toast.success('✅ Action completed successfully!');
        } else {
          toast.error('❌ Action failed: ' + data.data.actionResult.error);
        }
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Sorry, I had trouble processing your request. Please try again.

${isServiceAvailable ? 'The Action AI service is available, but there might be a temporary issue.' : 'Please ensure the Action AI service is running properly.'}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to process your request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setInput(action.prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getActionIcon = (actionName?: string) => {
    if (!actionName) return <Brain className="h-4 w-4" />;
    
    const actionIcons: Record<string, JSX.Element> = {
      create_invoice: <FileText className="h-4 w-4" />,
      create_expense: <DollarSign className="h-4 w-4" />,
      add_client: <Users className="h-4 w-4" />,
      generate_report: <TrendingUp className="h-4 w-4" />,
      view_financial_summary: <Target className="h-4 w-4" />,
      scan_receipt: <Zap className="h-4 w-4" />,
      analyze_expenses: <Brain className="h-4 w-4" />
    };
    
    return actionIcons[actionName] || <Brain className="h-4 w-4" />;
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-purple-500" />
              Action AI Assistant
              <Badge variant={isServiceAvailable ? 'default' : 'secondary'}>
                {isServiceAvailable ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Offline
                  </>
                )}
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Settings Panel */}
          {showSettings && (
            <div className="p-4 border-b bg-purple-50">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Available Actions</label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {availableActions.map(action => (
                      <Badge key={action} variant="outline" className="text-xs">
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={checkServiceAvailability} variant="outline" size="sm">
                    Check Connection
                  </Button>
                  <Button onClick={loadCapabilities} variant="outline" size="sm">
                    Reload Capabilities
                  </Button>
                </div>
                
                <div className="text-xs text-gray-600">
                  <p>💡 Action AI can execute commands directly in your system</p>
                  <p>Try: "Create invoice for John for $300"</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="p-4 border-b">
              <div className="mb-3">
                <h3 className="text-sm font-medium mb-2">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(action)}
                      className="justify-start h-auto p-2"
                    >
                      <div className="flex items-center gap-2">
                        {action.icon}
                        <span className="text-xs">{action.label}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      {message.isAction ? (
                        <Play className="h-4 w-4 text-purple-600" />
                      ) : (
                        <Bot className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white ml-auto'
                        : message.isAction
                        ? 'bg-purple-100 text-purple-900'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.isAction && (
                      <div className="flex items-center gap-2 mb-2">
                        {getActionIcon(message.action?.action)}
                        <Badge variant="outline" className="text-xs">
                          Action: {message.action?.action}
                        </Badge>
                        {message.confidence && (
                          <span className={`text-xs ${getConfidenceColor(message.confidence)}`}>
                            {Math.round(message.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                    
                    {message.actionResult && (
                      <div className={`mt-2 p-2 rounded text-xs ${
                        message.actionResult.success
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <div className="flex items-center gap-1">
                          {message.actionResult.success ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          <span>
                            {message.actionResult.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Play className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="bg-purple-100 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isServiceAvailable
                    ? "Ask me questions or tell me to perform actions..."
                    : "Connect to Action AI first"
                }
                disabled={!isServiceAvailable || isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || !isServiceAvailable || isLoading}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {!isServiceAvailable && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs text-yellow-800">
                  ⚠️ Action AI is not connected. Check your backend service configuration.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
