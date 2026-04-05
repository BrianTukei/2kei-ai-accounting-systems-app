// Admin Messaging Panel - Complete Frontend Implementation
// Professional message generation and management for 2K AI Accounting Systems

import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Clock, Users, TrendingUp, Calendar, BarChart3, Sparkles, Target, Zap, Mail, FileText, Settings, ChevronRight, Plus, Edit3, Trash2, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminData } from '@/hooks/useAdminData';

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

  const { users: systemUsers } = useAdminData();
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [messageToSend, setMessageToSend] = useState<Message | null>(null);
  const [sendRecipientType, setSendRecipientType] = useState<string>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

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
      const response = await fetch('/api/admin/broadcasts/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
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

  const openSendDialog = (message: Message) => {
    setMessageToSend(message);
    setSendRecipientType(message.targetAudience || 'all');
    setSelectedUserIds([]);
    setIsSendDialogOpen(true);
  };

  const confirmSend = async () => {
    if (!messageToSend) return;
    
    try {
      const isSpecific = sendRecipientType === 'specific';
      if (isSpecific && selectedUserIds.length === 0) {
        toast.error('Please select at least one user');
        return;
      }

      // Step 1: Create Broadcast Draft
      const createResponse = await fetch('/api/admin/broadcasts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Ensure auth
        },
        body: JSON.stringify({
          name: `Broadcast: ${messageToSend.title.substring(0, 30)}...`,
          subject: messageToSend.title,
          message: messageToSend.body,
          recipient_group: isSpecific ? 'specific' : sendRecipientType,
          specific_recipients: isSpecific ? selectedUserIds : [],
        })
      });

      const createData = await createResponse.json();
      
      if (!createData.success || !createData.data) {
        throw new Error(createData.error || 'Failed to create broadcast draft');
      }

      const broadcastId = createData.data.id;

      // Step 2: Send Broadcast
      const sendResponse = await fetch(`/api/admin/broadcasts/${broadcastId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const sendData = await sendResponse.json();

      if (sendData.success) {
        toast.success(`Broadcast successfully created and dispatched!`);
        setIsSendDialogOpen(false);
      } else {
        throw new Error(sendData.error || 'Failed to send broadcast');
      }
    } catch (error: any) {
      console.error('Failed to send broadcast:', error);
      toast.error(error.message || 'Failed to send broadcast');
    }
  };

      const data = await response.json();
      if (data.success || data.sentTo !== undefined) {
        toast.success(`Message sent successfully to ${data.sentTo || 'users'}`);
        setMessages(prev => [{ ...messageToSend, id: Date.now().toString() }, ...prev]);
        setIsSendDialogOpen(false);
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const sendMessage = async (message: Message) => {
    openSendDialog(message);
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
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No messages sent yet. Generate and send your first message!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{message.title}</h4>
                    <span className="text-xs text-gray-500">Sent to: {message.targetAudience || 'all'}</span>
                  </div>
                  <p className="text-gray-700 text-sm">{message.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Send Message Dialog */}
      {isSendDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Send Message</h3>
              <button onClick={() => setIsSendDialogOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                  <select
                    value={sendRecipientType}
                    onChange={(e) => setSendRecipientType(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">All Users</option>
                    <option value="specific">Select Specific Registered Users</option>
                    <option value="active">Active Users</option>
                    <option value="inactive">Inactive / At-Risk Users</option>
                  </select>
                </div>

                {sendRecipientType === 'specific' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Registered Users</label>
                    <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto p-2 bg-gray-50">
                      {systemUsers && systemUsers.length > 0 ? (
                        <div className="space-y-2">
                          {systemUsers.map((user: any) => (
                            <label key={user.id} className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                className="rounded text-blue-600 focus:ring-blue-500"
                                checked={selectedUserIds.includes(user.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUserIds([...selectedUserIds, user.id]);
                                  } else {
                                    setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                                  }
                                }}
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{user.email}</span>
                                {user.name && <span className="text-xs text-gray-500">{user.name}</span>}
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : (
                         <div className="text-center py-4 text-sm text-gray-500">No registered users found.</div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {selectedUserIds.length} user(s) selected.
                    </div>
                  </div>
                )}
                
                <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                  <p className="font-semibold mb-1">Message Preview:</p>
                  <p className="line-clamp-2">{messageToSend?.body}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end p-4 border-t space-x-3 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setIsSendDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmSend}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
