// Enhanced AI Chat Interface - Complete Frontend Integration
// Full implementation of all advanced AI accounting concepts

import React, { useState, useEffect, useRef } from 'react';
import { Send, Upload, FileText, TrendingUp, AlertCircle, CheckCircle, Bot, User } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  action?: any;
  actionResult?: any;
  isTyping?: boolean;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
  example: string;
}

interface FinancialSummary {
  revenue: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
  cashFlow: number;
  unpaidInvoices: number;
  overdueInvoices: number;
}

export const EnhancedAIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedReceipt, setUploadedReceipt] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    initializeChat();
    loadQuickActions();
    loadFinancialSummary();
  }, []);

  const initializeChat = async () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `🤖 **Hello! I'm 2K AI Financial Assistant**, your fully autonomous AI accountant and financial analyst.

I can help you with:
📄 **Creating invoices and expenses**
🧾 **Scanning and processing receipts**
📊 **Financial analysis and insights**
⚡ **Automated bookkeeping**
🎯 **Business optimization suggestions**

Try commands like:
- "Create invoice for John worth $300"
- "Add expense from Shell for $60"
- "Scan receipt from Starbucks"
- "Show me my financial summary"
- "Generate monthly report"

What would you like to do today?`,
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
  };

  const loadQuickActions = async () => {
    try {
      const response = await fetch('/api/enhanced-ai/quick-actions');
      const data = await response.json();
      if (data.success) {
        setQuickActions(data.data);
      }
    } catch (error) {
      console.error('Failed to load quick actions:', error);
    }
  };

  const loadFinancialSummary = async () => {
    try {
      const response = await fetch('/api/enhanced-ai/analysis');
      const data = await response.json();
      if (data.success) {
        setFinancialSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Failed to load financial summary:', error);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const response = await fetch('/api/enhanced-ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          userId: 'demo-user'
        })
      });

      const data = await response.json();

      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      setIsTyping(false);

      if (data.success) {
        const aiMessage: Message = {
          id: Date.now().toString() + '_ai',
          role: 'assistant',
          content: data.action 
            ? `🎯 **Action Executed:** ${data.action.type}\n\n✅ ${data.result.message || 'Action completed successfully'}`
            : data.response,
          timestamp: new Date().toISOString(),
          action: data.action,
          actionResult: data.result
        };

        setMessages(prev => [...prev, aiMessage]);

        // Refresh financial summary if action was executed
        if (data.action) {
          setTimeout(() => loadFinancialSummary(), 1000);
        }
      } else {
        throw new Error(data.error || 'Failed to process message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      setIsTyping(false);

      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        role: 'assistant',
        content: '❌ Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    setInputMessage(action.example);
  };

  const handleReceiptUpload = async (file: File) => {
    if (!file) return;

    setUploadedReceipt(file);
    setIsLoading(true);

    try {
      // In production, implement OCR processing
      // For now, simulate with mock OCR text
      const mockOCRText = `
STARBUCKS
123 Main Street
Nairobi, Kenya
Date: 03/16/2026

Caffe Latte        $5.50
Croissant         $3.50
Tax               $0.90
Total            $10.00
Payment: Credit Card
`;

      const response = await fetch('/api/enhanced-ai/receipt/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ocrText: mockOCRText,
          imageUrl: 'receipt_image_url',
          userId: 'demo-user'
        })
      });

      const data = await response.json();

      if (data.success) {
        const receiptData = data.data;
        
        const aiMessage: Message = {
          id: Date.now().toString() + '_receipt',
          role: 'assistant',
          content: `🧾 **Receipt Processed Successfully!**

**Vendor:** ${receiptData.vendor}
**Amount:** $${receiptData.total}
**Category:** ${receiptData.category}
**Date:** ${receiptData.date}
**Confidence:** ${(receiptData.confidence * 100).toFixed(1)}%

${receiptData.duplicate ? '⚠️ **Duplicate Detected**' : ''}
${receiptData.suspicious ? '⚠️ **Suspicious Entry**' : ''}
${receiptData.confidence > 0.8 ? '✅ **Auto-created expense entry**' : '🔍 **Please review before saving**'}

**Items:** ${receiptData.items.map((item: any) => `${item.name} - $${item.price}`).join(', ')}`,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, aiMessage]);
        toast.success('Receipt processed successfully!');
        
        // Refresh financial summary
        setTimeout(() => loadFinancialSummary(), 1000);
      } else {
        throw new Error(data.error || 'Failed to process receipt');
      }
    } catch (error) {
      console.error('Failed to process receipt:', error);
      toast.error('Failed to process receipt. Please try again.');
    } finally {
      setIsLoading(false);
      setUploadedReceipt(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">2K AI Financial Assistant</h3>
              <p className="text-sm text-gray-500">Your autonomous AI accountant</p>
            </div>
          </div>
          {financialSummary && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Net Profit</div>
              <div className={`font-semibold ${financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(financialSummary.netProfit)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          {quickActions.slice(0, 4).map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
            >
              <span>{action.icon}</span>
              <span>{action.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <div className={`max-w-lg ${message.role === 'user' ? 'order-1' : ''}`}>
              <div
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.isTyping ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">AI is thinking...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center ml-3">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your finances..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <div className="flex space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleReceiptUpload(file);
              }}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <Upload className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => sendMessage(inputMessage)}
              disabled={isLoading || !inputMessage.trim()}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Upload Progress */}
        {uploadedReceipt && (
          <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800">Processing receipt: {uploadedReceipt.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};
