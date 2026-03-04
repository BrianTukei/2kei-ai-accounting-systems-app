import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';
import { ScrollableContent } from '@/components/ui/ScrollableContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  MessageSquare, 
  Plus, 
  History, 
  Trash2,
  Edit3,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  DollarSign,
  PieChart,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { AIChat } from '@/components/ai/AIChat';
import { AIInsightsPanel } from '@/components/ai/AIInsightsPanel';
import { AIAssistantService, ChatMessage as ChatMessageType } from '@/services/aiAssistant';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';

interface LocalConversation {
  id: string;
  title: string;
  messages: ChatMessageType[];
  updatedAt: Date;
}

export default function AIAssistant() {
  const navigate = useNavigate();
  const [localConversations, setLocalConversations] = useState<LocalConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | undefined>();
  const [preloadedMessages, setPreloadedMessages] = useState<ChatMessageType[] | undefined>();
  const [chatKey, setChatKey] = useState(0);
  const [currentChatMessages, setCurrentChatMessages] = useState<ChatMessageType[]>([]);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [activeSection, setActiveSection] = useState<'chat' | 'insights' | 'help'>('chat');
  const [pendingMessage, setPendingMessage] = useState<string | undefined>();
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [generatedInsights, setGeneratedInsights] = useState<Array<{title: string; body: string; icon: React.ReactNode; severity: 'info'|'warning'|'success'}>>([]);

  // no remote load — local conversations only

  const handleNewConversation = () => {
    // Save the current conversation if it has user messages
    const userMessages = currentChatMessages.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      const firstUserText = userMessages[0].content.slice(0, 40);
      const title = firstUserText.length < userMessages[0].content.length
        ? firstUserText + '…'
        : firstUserText;
      const id = `conv_${Date.now()}`;
      setLocalConversations(prev => [
        { id, title, messages: currentChatMessages, updatedAt: new Date() },
        ...prev,
      ]);
    }
    // Start a fresh chat
    setSelectedConvId(undefined);
    setPreloadedMessages(undefined);
    setPendingMessage(undefined);
    setCurrentChatMessages([]);
    setChatKey(k => k + 1);
  };

  const handleDeleteConversation = (conversationId: string) => {
    setLocalConversations(prev => prev.filter(c => c.id !== conversationId));
    if (selectedConvId === conversationId) {
      setSelectedConvId(undefined);
    }
    toast.success('Conversation deleted');
  };

  const handleEditTitle = (conversationId: string) => {
    if (!newTitle.trim()) return;
    setLocalConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, title: newTitle } : c)
    );
    setEditingTitle(null);
    setNewTitle('');
  };

  const startEditingTitle = (conversation: LocalConversation) => {
    setEditingTitle(conversation.id);
    setNewTitle(conversation.title);
  };

  const handleSelectConversation = (conversation: LocalConversation) => {
    setSelectedConvId(conversation.id);
    setPreloadedMessages(conversation.messages);
    setPendingMessage(undefined);
    setCurrentChatMessages(conversation.messages);
    setChatKey(k => k + 1);
  };

  // Navigate to chat tab and auto-send a message
  const askAI = (message: string) => {
    setPendingMessage(message);
    setActiveSection('chat');
  };

  // Generate AI insights based on common financial analysis prompts
  const handleGenerateInsights = async () => {
    setGeneratingInsights(true);
    setGeneratedInsights([]);
    try {
      const prompts = [
        'Give me a brief cash flow health check for a small business with typical income and expenses.',
        'What are the top 3 expense reduction strategies for a small business?',
        'How can I improve my profit margin based on standard business metrics?'
      ];
      const results = await Promise.all(
        prompts.map(p => AIAssistantService.sendMessage({ message: p, contextType: 'dashboard' }))
      );
      const icons = [
        <TrendingUp className="w-5 h-5 text-blue-500" />,
        <PieChart className="w-5 h-5 text-orange-500" />,
        <DollarSign className="w-5 h-5 text-green-500" />
      ];
      const severities: Array<'info'|'warning'|'success'> = ['info', 'warning', 'success'];
      const titles = ['Cash Flow Health Check', 'Expense Reduction Strategies', 'Profit Margin Tips'];
      setGeneratedInsights(
        results.map((r, i) => ({
          title: titles[i],
          body: r.response || 'No insight generated.',
          icon: icons[i],
          severity: severities[i]
        }))
      );
      toast.success('Insights generated successfully!');
    } catch {
      toast.error('Failed to generate insights. Please try again.');
    } finally {
      setGeneratingInsights(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ScrollableContent maxHeight="100vh">
      {/* Back button always visible, even on free plan */}
      <div className="container mx-auto px-4 pt-6 max-w-6xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="-ml-2 flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>
      <SubscriptionGuard feature="aiAssistant" action="use AI Assistant">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="mb-8">

          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            AI Accounting Assistant
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Get CFO-grade financial analysis powered by your real data
          </p>
          
          {/* Section Navigation */}
          <div className="flex items-center gap-1 mt-6 p-1 bg-muted rounded-lg w-fit">
            <Button
              variant={activeSection === 'chat' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveSection('chat')}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </Button>
            <Button
              variant={activeSection === 'insights' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveSection('insights')}
              className="flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              Insights
            </Button>
            <Button
              variant={activeSection === 'help' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveSection('help')}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              Quick Help
            </Button>
          </div>
        </div>

        {/* Main Content Sections */}
        {activeSection === 'chat' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 lg:gap-6">
            {/* Sidebar - Conversations & Insights */}
            <div className="xl:col-span-1 space-y-4 lg:space-y-6">
              {/* Conversations */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Conversations
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleNewConversation}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    {localConversations.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No saved conversations yet. Start chatting, then press + to save &amp; start a new one!
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {localConversations.map((conversation) => (
                          <Card 
                            key={conversation.id}
                            className={`p-2 cursor-pointer transition-colors ${
                              selectedConvId === conversation.id
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => handleSelectConversation(conversation)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                {editingTitle === conversation.id ? (
                                  <Input
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        handleEditTitle(conversation.id);
                                      } else if (e.key === 'Escape') {
                                        setEditingTitle(null);
                                        setNewTitle('');
                                      }
                                    }}
                                    onBlur={() => handleEditTitle(conversation.id)}
                                    className="h-6 text-xs"
                                    autoFocus
                                  />
                                ) : (
                                  <p className="text-sm font-medium truncate">
                                    {conversation.title}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {conversation.updatedAt.toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingTitle(conversation);
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteConversation(conversation.id);
                                  }}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* AI Insights */}
              <AIInsightsPanel onAskAI={askAI} />
            </div>

            {/* Main Chat Area */}
            <div className="xl:col-span-3">
              <Card className="flex flex-col" style={{ height: '580px' }}>
                <CardHeader className="pb-3 flex-shrink-0 border-b">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <span className="truncate">
                      {selectedConvId
                        ? localConversations.find(c => c.id === selectedConvId)?.title || 'Chat'
                        : 'New Conversation'
                      }
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-3 min-h-0">
                  <AIChat
                    contextType="general"
                    contextData={{ source: 'assistant_page' }}
                    initialMessage={pendingMessage}
                    preloadedMessages={preloadedMessages}
                    onMessagesChange={setCurrentChatMessages}
                    key={`${chatKey}-${pendingMessage ?? ''}`}
                    embedded
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Insights Section */}
        {activeSection === 'insights' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <AIInsightsPanel className="h-fit" onAskAI={(q) => { askAI(q); setActiveSection('chat'); }} />
              <Card className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-2">AI Financial Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click below to get AI-generated insights on your cash flow, expenses, and profit margins.
                </p>
                <Button
                  className="w-full text-sm"
                  onClick={handleGenerateInsights}
                  disabled={generatingInsights}
                >
                  {generatingInsights ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Insights...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />Generate New Insights</>
                  )}
                </Button>
              </Card>
            </div>

            {/* Generated Insights */}
            {generatedInsights.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Generated Insights
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {generatedInsights.map((insight, i) => (
                    <Card key={i} className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        {insight.icon}
                        <h4 className="font-semibold text-sm">{insight.title}</h4>
                        <Badge
                          variant="outline"
                          className={`ml-auto text-xs ${
                            insight.severity === 'success' ? 'border-green-200 text-green-700 bg-green-50'
                            : insight.severity === 'warning' ? 'border-orange-200 text-orange-700 bg-orange-50'
                            : 'border-blue-200 text-blue-700 bg-blue-50'
                          }`}
                        >
                          {insight.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-6">{insight.body}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-3 text-xs text-primary"
                        onClick={() => askAI(`Tell me more about: ${insight.title}`)}
                      >
                        Ask AI for more details →
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Help Section */}
        {activeSection === 'help' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { 
                  title: 'Balance Sheet Help', 
                  topic: 'balance sheet basics and analysis',
                  description: 'Understanding assets, liabilities, and equity relationships',
                  icon: '⚖️',
                  examples: ['What is a balance sheet?', 'How to read balance sheet ratios?', 'What makes a good balance sheet?']
                },
                { 
                  title: 'Income Statement', 
                  topic: 'income statement interpretation',
                  description: 'Revenue, expenses, and profitability analysis',
                  icon: '📊',
                  examples: ['How to analyze profit margins?', 'What affects net income?', 'Revenue vs profit difference?']
                },
                { 
                  title: 'Cash Flow Management', 
                  topic: 'cash flow analysis and improvement',
                  description: 'Monitor cash inflows, outflows, and projections',
                  icon: '💰',
                  examples: ['How to improve cash flow?', 'Cash flow vs profit?', 'Managing seasonal cash flow?']
                },
                { 
                  title: 'Expense Categories', 
                  topic: 'proper expense categorization for tax purposes',
                  description: 'Organize expenses for tax efficiency and reporting',
                  icon: '🏷️',
                  examples: ['How to categorize office supplies?', 'Business vs personal expenses?', 'Tax deductible expenses?']
                },
                { 
                  title: 'Tax Planning', 
                  topic: 'tax strategies and deductions for businesses',
                  description: 'Maximize deductions and plan for tax obligations',
                  icon: '📋',
                  examples: ['What expenses are deductible?', 'Quarterly tax planning?', 'Tax saving strategies?']
                },
                { 
                  title: 'Financial Ratios', 
                  topic: 'key financial ratios and what they mean',
                  description: 'Debt-to-equity, profit margins, and liquidity ratios',
                  icon: '📈',
                  examples: ['What is debt-to-equity ratio?', 'How to calculate ROI?', 'Liquidity ratio meaning?']
                }
              ].map((item) => (
                <Card key={item.title} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-3xl">{item.icon}</div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Example Questions:</h4>
                    {item.examples.map((example, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs h-auto py-2 px-3"
                        onClick={() => askAI(example)}
                      >
                        "{example}"
                      </Button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions Carousel - Always visible */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Quick Help Topics</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Use arrow keys or buttons to navigate through accounting topics
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <kbd className="px-2 py-1 bg-muted rounded">←</kbd>
              <span>Navigate</span>
              <kbd className="px-2 py-1 bg-muted rounded">→</kbd>
            </div>
          </div>
          
          <Carousel 
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {[
                { 
                  title: 'Balance Sheet Help', 
                  topic: 'balance sheet basics and analysis',
                  description: 'Understanding assets, liabilities, and equity relationships',
                  icon: '⚖️'
                },
                { 
                  title: 'Income Statement', 
                  topic: 'income statement interpretation',
                  description: 'Revenue, expenses, and profitability analysis',
                  icon: '📊'
                },
                { 
                  title: 'Cash Flow Management', 
                  topic: 'cash flow analysis and improvement',
                  description: 'Monitor cash inflows, outflows, and projections',
                  icon: '💰'
                },
                { 
                  title: 'Expense Categories', 
                  topic: 'proper expense categorization for tax purposes',
                  description: 'Organize expenses for tax efficiency and reporting',
                  icon: '🏷️'
                },
                { 
                  title: 'Tax Planning', 
                  topic: 'tax strategies and deductions for businesses',
                  description: 'Maximize deductions and plan for tax obligations',
                  icon: '📋'
                },
                { 
                  title: 'Financial Ratios', 
                  topic: 'key financial ratios and what they mean',
                  description: 'Debt-to-equity, profit margins, and liquidity ratios',
                  icon: '📈'
                },
                { 
                  title: 'Budget Planning', 
                  topic: 'creating and maintaining business budgets',
                  description: 'Set financial goals and track performance',
                  icon: '🎯'
                },
                { 
                  title: 'Audit Preparation', 
                  topic: 'preparing for financial audits and reviews',
                  description: 'Organize records and documentation for audits',
                  icon: '🔍'
                }
              ].map((item) => (
                <CarouselItem key={item.title} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <div className="p-1">
                    <Card 
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-all hover:shadow-md hover:scale-[1.02] h-full"
                      onClick={() => askAI(`Explain ${item.topic} in simple terms with practical tips for my business.`)}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="text-2xl">{item.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm mb-1 truncate">{item.title}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <span className="text-xs text-primary font-medium">Ask AI →</span>
                        <div className="w-2 h-2 rounded-full bg-primary/20"></div>
                      </div>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex -left-12" />
            <CarouselNext className="hidden sm:flex -right-12" />
          </Carousel>
        </div>
      </div>
      </SubscriptionGuard>
      </ScrollableContent>
    </div>
  );
}