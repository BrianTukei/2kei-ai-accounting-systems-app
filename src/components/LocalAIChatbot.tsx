import { useState, useEffect, useRef } from 'react';
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
  DollarSign,
  FileText,
  Users,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { localAIService } from '@/services/ai/localAIService';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  prompt: string;
  category: string;
}

export default function LocalAIChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  [isLoading, setIsLoading] = useState(false);
  const [isServiceAvailable, setIsServiceAvailable] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState('llama3');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions: QuickAction[] = [
    {
      icon: <FileText className="h-4 w-4" />,
      label: 'Scan Receipt',
      prompt: 'How do I scan a receipt with AI?',
      category: 'receipts'
    },
    {
      icon: <DollarSign className="h-4 w-4" />,
      label: 'Currency Help',
      prompt: 'How does currency conversion work?',
      category: 'currency'
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: 'View Reports',
      prompt: 'Where can I find financial reports?',
      category: 'reports'
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: 'Team Setup',
      prompt: 'How do I add team members?',
      category: 'team'
    },
    {
      icon: <Brain className="h-4 w-4" />,
      label: 'AI Features',
      prompt: 'What AI features are available?',
      category: 'ai'
    },
    {
      icon: <Zap className="h-4 w-4" />,
      label: 'Quick Start',
      prompt: 'Give me a quick tour of the platform',
      category: 'general'
    }
  ];

  useEffect(() => {
    checkServiceAvailability();
    loadAvailableModels();
    
    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Welcome to 2K AI Accounting Systems! I'm your AI assistant, powered by Llama 3 running locally on your system.

I can help you with:
🧠 **AI Receipt Scanning** - Upload receipts and I'll extract all details automatically
💱 **Currency Conversion** - Support for 30+ currencies including African currencies
📊 **Financial Reports** - Generate insights and analytics
👥 **Team Management** - Manage users and permissions
📄 **Invoice Creation** - Create professional invoices
🎯 **Expense Tracking** - Categorize and track expenses

Type your question below or click a quick action to get started!`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkServiceAvailability = async () => {
    try {
      const available = await localAIService.isServiceAvailable();
      setIsServiceAvailable(available);
      
      if (available) {
        toast.success('✅ Local AI (Ollama) is connected and ready!');
      } else {
        toast.warning('⚠️ Local AI (Ollama) is not running. Install it from https://ollama.com');
      }
    } catch (error) {
      console.error('Failed to check service availability:', error);
      setIsServiceAvailable(false);
    }
  };

  const loadAvailableModels = async () => {
    try {
      const models = await localAIService.listAvailableModels();
      setAvailableModels(models);
      if (models.length > 0 && !models.includes(currentModel)) {
        setCurrentModel(models[0]);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
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
      const response = await localAIService.generateChatResponse([
        { role: 'system', content: localAIService.getDefaultSystemPrompt() },
        ...messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
        { role: 'user', content: input.trim() }
      ], {
        model: currentModel,
        temperature: 0.7,
        max_tokens: 2000
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to generate response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Sorry, I encountered an error. Please make sure Ollama is running locally.

🔧 **To fix this:**
1. Download Ollama from https://ollama.com
2. Run: \`ollama run llama3\`
3. Refresh this page

💡 **Alternative:** You can also use OpenRouter.ai for free cloud AI if you prefer not to run models locally.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    setInput(action.prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const pullModel = async (modelName: string) => {
    try {
      toast.info(`Downloading ${modelName}... This may take a few minutes.`);
      await localAIService.pullModel(modelName);
      await loadAvailableModels();
      toast.success(`✅ Successfully downloaded ${modelName}`);
    } catch (error) {
      console.error('Failed to pull model:', error);
      toast.error(`Failed to download ${modelName}`);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              2K AI Assistant
              <Badge variant={isServiceAvailable ? 'default' : 'secondary'}>
                {isServiceAvailable ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Online
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
            <div className="p-4 border-b bg-gray-50">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">AI Model</label>
                  <select 
                    value={currentModel}
                    onChange={(e) => setCurrentModel(e.target.value)}
                    className="mt-1 w-full p-2 border rounded-md"
                  >
                    {availableModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={checkServiceAvailability}
                    variant="outline"
                    size="sm"
                  >
                    Check Connection
                  </Button>
                  <Button 
                    onClick={() => pullModel('llama3')}
                    variant="outline"
                    size="sm"
                    disabled={!isServiceAvailable}
                  >
                    Download Llama 3
                  </Button>
                </div>
                
                <div className="text-xs text-gray-600">
                  <p>💡 Running locally with Ollama - 100% free!</p>
                  <p>Get Ollama: https://ollama.com</p>
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
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white ml-auto'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
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
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
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
                    ? "Ask me anything about 2K AI Accounting Systems..."
                    : "Connect to Local AI first (install Ollama)"
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
                  ⚠️ Local AI is not connected. Install Ollama from https://ollama.com and run "ollama run llama3"
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
