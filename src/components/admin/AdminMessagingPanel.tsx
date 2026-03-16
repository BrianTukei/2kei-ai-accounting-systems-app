// Admin Messaging Panel - Complete Frontend Implementation
// Professional message generation and management for 2K AI Accounting Systems

import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Clock, Users, TrendingUp, Calendar, BarChart3, Sparkles, Target, Zap, Mail, FileText, Settings, ChevronRight, Plus, Edit3, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  title: string;
  body: string;
  action?: {
    text: string;
    link?: string;
    module?: string;
    type: string;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: string;
  category: string;
  scheduling?: {
    sendNow: boolean;
    bestTime?: string;
    frequency?: string;
  };
  engagement?: {
    estimatedOpenRate: number;
    estimatedClickRate: number;
  };
  createdAt: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  title: string;
  body: string;
  action?: string;
  category: string;
  priority: string;
  targetAudience: string;
}

interface Analytics {
  totalMessages: number;
  openRate: number;
  clickRate: number;
  engagementScore: number;
  bestSendingTimes: string[];
  topPerformingCategories: string[];
}

export const AdminMessagingPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'templates' | 'sent' | 'analytics' | 'insights'>('generate');
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [topic, setTopic] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedMessages, setGeneratedMessages] = useState<Message[]>([]);

  useEffect(() => {
    loadTemplates();
    loadAnalytics();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin-messaging/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/admin-messaging/analytics');
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const generateMessages = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin-messaging/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic,
          options: {
            includeAction: true,
            tone: 'friendly'
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedMessages(data.data);
        toast.success(`Generated ${data.data.length} message variations`);
      } else {
        throw new Error(data.error || 'Failed to generate messages');
      }
    } catch (error) {
      console.error('Failed to generate messages:', error);
      toast.error('Failed to generate messages');
    } finally {
      setIsLoading(false);
    }
  };

  const generateFromTemplate = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin-messaging/generate-from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate
        })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedMessages([data.data]);
        toast.success('Message generated from template');
      } else {
        throw new Error(data.error || 'Failed to generate message');
      }
    } catch (error) {
      console.error('Failed to generate from template:', error);
      toast.error('Failed to generate message from template');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message: Message) => {
    try {
      const response = await fetch('/api/admin-messaging/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          targetAudience: message.targetAudience,
          sendImmediately: true
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Message sent successfully');
        setMessages(prev => [data.data, ...prev]);
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const optimizeMessage = async (message: Message) => {
    try {
      const response = await fetch('/api/admin-messaging/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message
        })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedMessages(prev => prev.map(msg => 
          msg.id === message.id ? data.data : msg
        ));
        toast.success('Message optimized successfully');
      } else {
        throw new Error(data.error || 'Failed to optimize message');
      }
    } catch (error) {
      console.error('Failed to optimize message:', error);
      toast.error('Failed to optimize message');
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      reminder: <Clock className="w-4 h-4" />,
      announcement: <MessageSquare className="w-4 h-4" />,
      tip: <Sparkles className="w-4 h-4" />,
      update: <Settings className="w-4 h-4" />,
      promotion: <Target className="w-4 h-4" />,
      warning: <Zap className="w-4 h-4" />
    };
    return icons[category as keyof typeof icons] || <MessageSquare className="w-4 h-4" />;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Messaging</h2>
        <p className="text-gray-600">Generate and manage professional messages for your users</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'generate', label: 'Generate', icon: <Sparkles className="w-4 h-4" /> },
          { id: 'templates', label: 'Templates', icon: <FileText className="w-4 h-4" /> },
          { id: 'sent', label: 'Sent Messages', icon: <Mail className="w-4 h-4" /> },
          { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'insights', label: 'Insights', icon: <TrendingUp className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          {/* Topic Input */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-4">Generate Messages</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic or Theme
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., monthly receipt reminder, new feature announcement, payment reminder"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={generateMessages}
                disabled={isLoading || !topic.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Generating...' : 'Generate Messages'}
              </button>
            </div>
          </div>

          {/* Template Selection */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-4">Or Use a Template</h3>
            <div className="space-y-4">
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
              <button
                onClick={generateFromTemplate}
                disabled={isLoading || !selectedTemplate}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Generating...' : 'Use Template'}
              </button>
            </div>
          </div>

          {/* Generated Messages */}
          {generatedMessages.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Generated Messages</h3>
              {generatedMessages.map((message) => (
                <div key={message.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{message.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(message.priority)}`}>
                          {message.priority}
                        </span>
                        <span className="flex items-center space-x-1 text-gray-500">
                          {getCategoryIcon(message.category)}
                          <span className="text-xs">{message.category}</span>
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{message.body}</p>
                      {message.action && (
                        <div className="bg-blue-50 p-2 rounded border border-blue-200">
                          <span className="text-sm font-medium text-blue-800">Action: </span>
                          <span className="text-sm text-blue-700">{message.action.text}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => optimizeMessage(message)}
                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Optimize message"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => sendMessage(message)}
                        className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                        title="Send message"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{message.targetAudience}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>~{message.engagement?.estimatedOpenRate}% open rate</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Target className="w-3 h-3" />
                        <span>~{message.engagement?.estimatedClickRate}% click rate</span>
                      </span>
                    </div>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{message.scheduling?.bestTime || 'Send now'}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 mb-4">Message Templates</h3>
          <div className="grid gap-4">
            {templates.map((template) => (
              <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(template.priority)}`}>
                    {template.priority}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-medium text-gray-900 mb-1">{template.title}</p>
                  <p className="text-sm text-gray-700">{template.body}</p>
                </div>
                <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                  <span>Category: {template.category}</span>
                  <span>Audience: {template.targetAudience}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <h3 className="font-semibold text-gray-900 mb-4">Messaging Analytics</h3>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total Messages</span>
                <Mail className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalMessages}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Open Rate</span>
                <Eye className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-green-600">{analytics.openRate}%</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Click Rate</span>
                <Target className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{analytics.clickRate}%</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Engagement Score</span>
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-purple-600">{analytics.engagementScore}</p>
            </div>
          </div>

          {/* Best Sending Times */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Best Sending Times</h4>
            <div className="space-y-2">
              {analytics.bestSendingTimes.map((time, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Categories */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Top Performing Categories</h4>
            <div className="flex flex-wrap gap-2">
              {analytics.topPerformingCategories.map((category, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {category}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 mb-4">Messaging Insights</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">Recommendations</h4>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li>• Send receipt reminders on Monday mornings for higher engagement</li>
              <li>• Feature announcements perform best on Tuesday afternoons</li>
              <li>• Personalized messages have 35% higher engagement rates</li>
              <li>• Including clear CTAs increases click rates by 22%</li>
            </ul>
          </div>
        </div>
      )}

      {/* Sent Messages Tab */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 mb-4">Recently Sent Messages</h3>
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No messages sent yet. Generate and send your first message!</p>
          </div>
        </div>
      )}
    </div>
  );
};
