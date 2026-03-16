// Admin Messaging AI Assistant - Complete Implementation
// Professional message generation for 2K AI Accounting Systems

import { aiReasoningEngine, AIRequest, AIResponse } from './aiReasoningEngine';
import { contextMemorySystem } from './contextMemorySystem';

export interface AdminMessage {
  id: string;
  title: string;
  body: string;
  action?: {
    text: string;
    link?: string;
    module?: string;
    type: 'navigation' | 'upload' | 'generate' | 'review' | 'update';
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: 'all' | 'active' | 'subscribed' | 'trial' | 'premium';
  category: 'reminder' | 'announcement' | 'tip' | 'update' | 'promotion' | 'warning';
  scheduling?: {
    sendNow: boolean;
    bestTime?: string;
    frequency?: 'once' | 'weekly' | 'monthly' | 'quarterly';
  };
  engagement?: {
    estimatedOpenRate: number;
    estimatedClickRate: number;
    suggestedSubject?: string;
  };
  createdAt: string;
}

export interface MessageTemplate {
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

export interface MessagingAnalytics {
  totalMessages: number;
  openRate: number;
  clickRate: number;
  engagementScore: number;
  bestSendingTimes: string[];
  topPerformingCategories: string[];
  userFeedback: Array<{
    messageId: string;
    rating: number;
    feedback: string;
  }>;
}

export class AdminMessagingAI {
  private userId: string;
  private businessContext: any;

  constructor(userId: string) {
    this.userId = userId;
    this.initializeMessagingAI();
  }

  private async initializeMessagingAI() {
    console.log('📧 Admin Messaging AI Assistant initialized');
    this.businessContext = await contextMemorySystem.buildAIContext(this.userId);
  }

  // Core message generation
  async generateMessage(topic: string, options?: {
    tone?: 'friendly' | 'professional' | 'urgent' | 'encouraging';
    includeAction?: boolean;
    targetAudience?: string;
    priority?: string;
    category?: string;
  }): Promise<AdminMessage[]> {
    try {
      console.log(`📝 Generating messages for topic: ${topic}`);

      const prompt = `
You are the Admin Messaging AI Assistant for 2K AI Accounting Systems.

Generate 3-5 professional message variations for: ${topic}

Requirements:
- Title: 5-10 words, clear and engaging
- Body: 1-3 sentences, friendly and professional
- Include call-to-action if appropriate
- Target active and subscribed users
- Avoid technical jargon
- Keep tone ${options?.tone || 'friendly and professional'}

Message Structure:
Title: [Short, clear title]
Body: [Concise explanation or instruction]
Action: [Optional recommendation or link]

${options?.includeAction !== false ? 'Include relevant action suggestions linking to platform modules.' : ''}
${options?.targetAudience ? `Target audience: ${options.targetAudience}` : ''}
${options?.priority ? `Priority level: ${options.priority}` : ''}
${options?.category ? `Message category: ${options.category}` : ''}

Return JSON array of message objects with:
- title, body, action (optional), priority, category, targetAudience

Example topics and responses:
- "receipt upload reminder" → Messages about uploading receipts
- "new feature announcement" → Messages about new features
- "monthly report reminder" → Messages about checking reports
- "system maintenance" → Messages about system updates`;

      const request: AIRequest = {
        message: prompt,
        userId: this.userId,
        context: this.businessContext
      };

      const response = await aiReasoningEngine.processRequest(request);
      
      // Parse and structure messages
      const messages = this.parseMessageResponse(response.reasoning, topic, options);
      
      console.log(`✅ Generated ${messages.length} message variations`);
      return messages;
    } catch (error) {
      console.error('❌ Message generation failed:', error);
      throw error;
    }
  }

  private parseMessageResponse(response: string, topic: string, options?: any): AdminMessage[] {
    const messages: AdminMessage[] = [];
    
    // Try to parse JSON array
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedMessages = JSON.parse(jsonMatch[0]);
        
        parsedMessages.forEach((msg: any, index: number) => {
          messages.push({
            id: `msg_${Date.now()}_${index}`,
            title: msg.title || `Message about ${topic}`,
            body: msg.body || 'Check your 2K AI Accounting Systems dashboard.',
            action: msg.action ? this.parseAction(msg.action) : undefined,
            priority: options?.priority || this.determinePriority(topic),
            targetAudience: options?.targetAudience || 'active',
            category: options?.category || this.determineCategory(topic),
            scheduling: {
              sendNow: true,
              bestTime: this.suggestBestTime(topic)
            },
            engagement: {
              estimatedOpenRate: this.estimateOpenRate(topic),
              estimatedClickRate: this.estimateClickRate(topic)
            },
            createdAt: new Date().toISOString()
          });
        });
      }
    } catch (error) {
      console.error('Failed to parse message response:', error);
    }

    // Fallback to single message if parsing fails
    if (messages.length === 0) {
      messages.push(this.createFallbackMessage(topic, options));
    }

    return messages;
  }

  private parseAction(actionText: string): AdminMessage['action'] {
    // Parse action text and determine type and link
    const actionLower = actionText.toLowerCase();
    
    let type: AdminMessage['action']['type'] = 'navigation';
    let module = '';
    let link = '';

    // Determine action type and module
    if (actionLower.includes('upload') || actionLower.includes('receipt')) {
      type = 'upload';
      module = 'receipt-scanner';
    } else if (actionLower.includes('generate') || actionLower.includes('report')) {
      type = 'generate';
      module = 'reports';
    } else if (actionLower.includes('review') || actionLower.includes('check')) {
      type = 'review';
      module = 'dashboard';
    } else if (actionLower.includes('update') || actionLower.includes('settings')) {
      type = 'update';
      module = 'settings';
    } else if (actionLower.includes('invoice')) {
      type = 'navigation';
      module = 'invoices';
    } else if (actionLower.includes('expense')) {
      type = 'navigation';
      module = 'expenses';
    }

    return {
      text: actionText,
      link: module ? `/${module}` : undefined,
      module,
      type
    };
  }

  private determinePriority(topic: string): AdminMessage['priority'] {
    const priorityMap: Record<string, AdminMessage['priority']> = {
      'urgent': 'urgent',
      'maintenance': 'high',
      'security': 'urgent',
      'payment': 'high',
      'deadline': 'high',
      'reminder': 'medium',
      'update': 'medium',
      'feature': 'low',
      'tip': 'low',
      'promotion': 'low'
    };

    const topicLower = topic.toLowerCase();
    for (const [key, priority] of Object.entries(priorityMap)) {
      if (topicLower.includes(key)) {
        return priority;
      }
    }

    return 'medium';
  }

  private determineCategory(topic: string): AdminMessage['category'] {
    const categoryMap: Record<string, AdminMessage['category']> = {
      'reminder': 'reminder',
      'announcement': 'announcement',
      'update': 'update',
      'feature': 'announcement',
      'maintenance': 'warning',
      'security': 'warning',
      'tip': 'tip',
      'promotion': 'promotion',
      'deadline': 'reminder',
      'payment': 'reminder'
    };

    const topicLower = topic.toLowerCase();
    for (const [key, category] of Object.entries(categoryMap)) {
      if (topicLower.includes(key)) {
        return category;
      }
    }

    return 'announcement';
  }

  private suggestBestTime(topic: string): string {
    const timeMap: Record<string, string> = {
      'receipt': 'Monday 9:00 AM',
      'report': 'First day of month 10:00 AM',
      'invoice': 'Friday 2:00 PM',
      'expense': 'Wednesday 11:00 AM',
      'deadline': '2 days before deadline',
      'reminder': 'Business hours',
      'update': 'Tuesday 10:00 AM',
      'maintenance': 'Sunday 11:00 PM',
      'promotion': 'Thursday 3:00 PM'
    };

    const topicLower = topic.toLowerCase();
    for (const [key, time] of Object.entries(timeMap)) {
      if (topicLower.includes(key)) {
        return time;
      }
    }

    return 'Tuesday 10:00 AM';
  }

  private estimateOpenRate(topic: string): number {
    const rateMap: Record<string, number> = {
      'urgent': 85,
      'security': 90,
      'payment': 80,
      'deadline': 75,
      'reminder': 65,
      'update': 55,
      'feature': 60,
      'tip': 45,
      'promotion': 40,
      'maintenance': 70
    };

    const topicLower = topic.toLowerCase();
    for (const [key, rate] of Object.entries(rateMap)) {
      if (topicLower.includes(key)) {
        return rate;
      }
    }

    return 50;
  }

  private estimateClickRate(topic: string): number {
    const rateMap: Record<string, number> = {
      'feature': 35,
      'promotion': 30,
      'update': 25,
      'tip': 20,
      'reminder': 15,
      'payment': 25,
      'deadline': 20,
      'urgent': 20,
      'security': 15,
      'maintenance': 10
    };

    const topicLower = topic.toLowerCase();
    for (const [key, rate] of Object.entries(rateMap)) {
      if (topicLower.includes(key)) {
        return rate;
      }
    }

    return 15;
  }

  private createFallbackMessage(topic: string, options?: any): AdminMessage {
    return {
      id: `msg_${Date.now()}_fallback`,
      title: `Update about ${topic}`,
      body: `Check your 2K AI Accounting Systems for the latest updates about ${topic}.`,
      action: {
        text: 'Visit Dashboard',
        link: '/dashboard',
        module: 'dashboard',
        type: 'navigation'
      },
      priority: options?.priority || 'medium',
      targetAudience: options?.targetAudience || 'active',
      category: options?.category || 'announcement',
      scheduling: {
        sendNow: true,
        bestTime: 'Tuesday 10:00 AM'
      },
      engagement: {
        estimatedOpenRate: 50,
        estimatedClickRate: 15
      },
      createdAt: new Date().toISOString()
    };
  }

  // Pre-defined message templates
  async getTemplates(): Promise<MessageTemplate[]> {
    return [
      {
        id: 'receipt_reminder',
        name: 'Monthly Receipt Reminder',
        description: 'Remind users to upload their monthly receipts',
        title: 'Don\'t forget to upload your receipts!',
        body: 'Hi there! Make sure to upload all your receipts for this month to keep your accounting up to date.',
        action: 'Visit the Expenses module to quickly add them.',
        category: 'reminder',
        priority: 'medium',
        targetAudience: 'active'
      },
      {
        id: 'new_feature',
        name: 'New Feature Announcement',
        description: 'Announce new AI-powered features',
        title: 'New Feature: Automated Invoice Generation',
        body: 'Hello! We\'ve added a new AI-powered invoice generation feature to save you time.',
        action: 'Go to the Invoices module to try it out.',
        category: 'announcement',
        priority: 'low',
        targetAudience: 'all'
      },
      {
        id: 'monthly_report',
        name: 'Monthly Report Reminder',
        description: 'Remind users to check their monthly reports',
        title: 'Your monthly financial report is ready!',
        body: 'Your monthly financial report has been generated with insights about your business performance.',
        action: 'Check the Reports module to view your detailed analysis.',
        category: 'reminder',
        priority: 'medium',
        targetAudience: 'subscribed'
      },
      {
        id: 'system_update',
        name: 'System Update Notification',
        description: 'Inform users about system updates',
        title: 'System Update: Enhanced AI Features',
        body: 'We\'ve enhanced our AI features to provide even better financial insights and automation.',
        action: 'Explore the new features in your dashboard.',
        category: 'update',
        priority: 'low',
        targetAudience: 'all'
      },
      {
        id: 'payment_reminder',
        name: 'Payment Reminder',
        description: 'Remind users about upcoming payments',
        title: 'Upcoming payment reminder',
        body: 'You have upcoming payments that need attention. Review your payment schedule to avoid delays.',
        action: 'Check your Bills module for payment details.',
        category: 'reminder',
        priority: 'high',
        targetAudience: 'active'
      },
      {
        id: 'security_alert',
        name: 'Security Alert',
        description: 'Important security notifications',
        title: 'Important: Security Update Required',
        body: 'We\'ve implemented important security updates. Please review your account settings.',
        action: 'Update your security settings in the Settings module.',
        category: 'warning',
        priority: 'urgent',
        targetAudience: 'all'
      },
      {
        id: 'engagement_tip',
        name: 'Engagement Tip',
        description: 'Help users get more value from the platform',
        title: 'Pro Tip: Automate your expense tracking',
        body: 'Did you know you can automatically categorize expenses by uploading receipts? Try it today!',
        action: 'Upload your first receipt in the Receipt Scanner module.',
        category: 'tip',
        priority: 'low',
        targetAudience: 'trial'
      },
      {
        id: 'promotion',
        name: 'Promotional Message',
        description: 'Promote premium features',
        title: 'Upgrade to Premium for advanced features',
        body: 'Unlock advanced AI features, unlimited reports, and priority support with our Premium plan.',
        action: 'View pricing options in the Subscriptions module.',
        category: 'promotion',
        priority: 'low',
        targetAudience: 'trial'
      }
    ];
  }

  // Generate message from template
  async generateFromTemplate(templateId: string, customizations?: {
    title?: string;
    body?: string;
    action?: string;
    priority?: string;
  }): Promise<AdminMessage> {
    const templates = await this.getTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return {
      id: `msg_${Date.now()}_${templateId}`,
      title: customizations?.title || template.title,
      body: customizations?.body || template.body,
      action: template.action ? this.parseAction(template.action) : undefined,
      priority: (customizations?.priority as AdminMessage['priority']) || (template.priority as AdminMessage['priority']),
      targetAudience: template.targetAudience as AdminMessage['targetAudience'],
      category: template.category as AdminMessage['category'],
      scheduling: {
        sendNow: true,
        bestTime: this.suggestBestTime(template.name)
      },
      engagement: {
        estimatedOpenRate: this.estimateOpenRate(template.name),
        estimatedClickRate: this.estimateClickRate(template.name)
      },
      createdAt: new Date().toISOString()
    };
  }

  // Analytics and insights
  async getMessagingAnalytics(): Promise<MessagingAnalytics> {
    // Mock analytics - in production, fetch from database
    return {
      totalMessages: 150,
      openRate: 68.5,
      clickRate: 23.4,
      engagementScore: 85.2,
      bestSendingTimes: [
        'Tuesday 10:00 AM',
        'Wednesday 11:00 AM',
        'Monday 9:00 AM'
      ],
      topPerformingCategories: [
        'reminder',
        'announcement',
        'tip'
      ],
      userFeedback: [
        {
          messageId: 'msg_123',
          rating: 5,
          feedback: 'Very helpful reminder!'
        },
        {
          messageId: 'msg_124',
          rating: 4,
          feedback: 'Good timing and relevant content'
        }
      ]
    };
  }

  // Optimize message sending
  async optimizeMessage(message: AdminMessage): Promise<AdminMessage> {
    // Use AI to optimize message content
    const optimizationPrompt = `
Optimize this admin message for better engagement:

Title: ${message.title}
Body: ${message.body}
Action: ${message.action?.text || 'None'}

Optimization goals:
- Increase open rate (currently ${message.engagement?.estimatedOpenRate}%)
- Increase click rate (currently ${message.engagement?.estimatedClickRate}%)
- Maintain professional and friendly tone
- Keep message concise and actionable

Return optimized JSON with:
- optimizedTitle
- optimizedBody
- optimizationSuggestions
- expectedImprovement`;

    const request: AIRequest = {
      message: optimizationPrompt,
      userId: this.userId
    };

    try {
      const response = await aiReasoningEngine.processRequest(request);
      
      // Parse optimization suggestions
      const optimization = this.parseOptimizationResponse(response.reasoning);
      
      if (optimization.optimizedTitle) {
        message.title = optimization.optimizedTitle;
      }
      
      if (optimization.optimizedBody) {
        message.body = optimization.optimizedBody;
      }

      return message;
    } catch (error) {
      console.error('Message optimization failed:', error);
      return message;
    }
  }

  private parseOptimizationResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse optimization response:', error);
    }
    
    return {};
  }

  // Batch message generation
  async generateBatchMessages(topics: string[]): Promise<AdminMessage[]> {
    const allMessages: AdminMessage[] = [];
    
    for (const topic of topics) {
      const messages = await this.generateMessage(topic);
      allMessages.push(...messages);
    }
    
    return allMessages;
  }

  // Personalized message generation
  async generatePersonalizedMessage(userId: string, topic: string): Promise<AdminMessage> {
    // Get user-specific context
    const userContext = await contextMemorySystem.buildAIContext(userId);
    const userProfile = await contextMemorySystem.getUserProfile(userId);
    
    const personalizationPrompt = `
Generate personalized message for user:

User Context:
${JSON.stringify(userContext, null, 2)}

User Profile:
${JSON.stringify(userProfile, null, 2)}

Topic: ${topic}

Personalization requirements:
- Reference user's business name if available
- Mention relevant user activity or preferences
- Suggest actions based on user's usage patterns
- Maintain friendly and professional tone

Return JSON with personalized title and body.`;

    const request: AIRequest = {
      message: personalizationPrompt,
      userId: this.userId
    };

    try {
      const response = await aiReasoningEngine.processRequest(request);
      const personalized = this.parseMessageResponse(response.reasoning, topic);
      
      return personalized[0] || this.createFallbackMessage(topic);
    } catch (error) {
      console.error('Personalized message generation failed:', error);
      return this.createFallbackMessage(topic);
    }
  }
}

export default AdminMessagingAI;
