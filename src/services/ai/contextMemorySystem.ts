// Context + Memory System - Makes AI Very Smart
// Advanced AI SaaS Memory Management for 2K AI Accounting Systems

import type { AIContext } from './types';

export interface UserFinancialProfile {
  userId: string;
  businessName: string;
  industry: string;
  businessSize: string;
  monthlyRevenue: number;
  monthlyExpenses: number;
  preferredCategories: string[];
  riskTolerance: 'low' | 'medium' | 'high';
}

export interface ContextualMemory {
  id: string;
  userId: string;
  type: 'preference' | 'pattern' | 'insight' | 'action';
  key: string;
  value: any;
  frequency: number;
  lastUsed: Date;
  createdAt: Date;
  expiresAt?: Date;
}

export interface MemorySearchResult {
  memories: ContextualMemory[];
  confidence: number;
  matchedTerms: string[];
}

class ContextMemorySystem {
  private memoryStore = new Map<string, ContextualMemory[]>();
  private userProfiles = new Map<string, UserFinancialProfile>();

  /**
   * Store contextual memory
   */
  async storeMemory(userId: string, type: ContextualMemory['type'], key: string, value: any): Promise<void> {
    const memory: ContextualMemory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      key,
      value,
      frequency: 1,
      lastUsed: new Date(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    if (!this.memoryStore.has(userId)) {
      this.memoryStore.set(userId, []);
    }

    const userMemories = this.memoryStore.get(userId)!;
    
    // Check if memory already exists
    const existingIndex = userMemories.findIndex(m => m.key === key && m.type === type);
    if (existingIndex >= 0) {
      userMemories[existingIndex].frequency++;
      userMemories[existingIndex].lastUsed = new Date();
      userMemories[existingIndex].value = value;
    } else {
      userMemories.push(memory);
    }

    // Keep only last 100 memories per user
    if (userMemories.length > 100) {
      userMemories.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());
      userMemories.splice(100);
    }
  }

  /**
   * Get contextual memory for user
   */
  async getContextualMemory(context: AIContext): Promise<ContextualMemory[]> {
    const userId = context.organizationId || 'default';
    const userMemories = this.memoryStore.get(userId) || [];
    
    // Filter by relevance to current context
    const relevantMemories = userMemories.filter(memory => {
      // Check if memory is still valid
      if (memory.expiresAt && memory.expiresAt < new Date()) {
        return false;
      }

      // Check relevance based on type and context
      switch (memory.type) {
        case 'preference':
          return this.isPreferenceRelevant(memory, context);
        case 'pattern':
          return this.isPatternRelevant(memory, context);
        case 'insight':
          return this.isInsightRelevant(memory, context);
        case 'action':
          return this.isActionRelevant(memory, context);
        default:
          return false;
      }
    });

    return relevantMemories.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Search memories by query
   */
  async searchMemories(userId: string, query: string): Promise<MemorySearchResult> {
    const userMemories = this.memoryStore.get(userId) || [];
    const queryTerms = query.toLowerCase().split(' ');
    
    const matchedMemories = userMemories.filter(memory => {
      const memoryText = `${memory.key} ${JSON.stringify(memory.value)}`.toLowerCase();
      return queryTerms.some(term => memoryText.includes(term));
    });

    const confidence = matchedMemories.length > 0 ? 
      matchedMemories.length / userMemories.length : 0;

    return {
      memories: matchedMemories,
      confidence,
      matchedTerms: queryTerms
    };
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, profile: Partial<UserFinancialProfile>): Promise<void> {
    const existing = this.userProfiles.get(userId) || {
      userId,
      businessName: '',
      industry: '',
      businessSize: '',
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      preferredCategories: [],
      riskTolerance: 'medium'
    };

    this.userProfiles.set(userId, { ...existing, ...profile });
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserFinancialProfile | null> {
    return this.userProfiles.get(userId) || null;
  }

  /**
   * Clean up expired memories
   */
  async cleanupExpiredMemories(): Promise<void> {
    const now = new Date();
    
    for (const [userId, memories] of this.memoryStore.entries()) {
      const validMemories = memories.filter(memory => 
        !memory.expiresAt || memory.expiresAt > now
      );
      this.memoryStore.set(userId, validMemories);
    }
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats(userId: string): Promise<{
    totalMemories: number;
    memoriesByType: Record<string, number>;
    averageFrequency: number;
  }> {
    const userMemories = this.memoryStore.get(userId) || [];
    
    const memoriesByType = userMemories.reduce((acc, memory) => {
      acc[memory.type] = (acc[memory.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageFrequency = userMemories.length > 0 
      ? userMemories.reduce((sum, m) => sum + m.frequency, 0) / userMemories.length
      : 0;

    return {
      totalMemories: userMemories.length,
      memoriesByType,
      averageFrequency
    };
  }

  private isPreferenceRelevant(memory: ContextualMemory, context: AIContext): boolean {
    // Check if preference relates to current page or role
    const preferenceKey = memory.key.toLowerCase();
    const currentPage = context.currentPage.toLowerCase();
    const userRole = context.role.toLowerCase();
    
    return preferenceKey.includes(currentPage) || 
           preferenceKey.includes(userRole) ||
           preferenceKey.includes('general');
  }

  private isPatternRelevant(memory: ContextualMemory, context: AIContext): boolean {
    // Check if pattern matches current query context
    const pattern = memory.key.toLowerCase();
    const message = context.message.toLowerCase();
    
    return message.includes(pattern) || pattern.includes('general');
  }

  private isInsightRelevant(memory: ContextualMemory, context: AIContext): boolean {
    // Check if insight is relevant to current financial context
    if (!context.financialSnapshot) return false;
    
    const insightKey = memory.key.toLowerCase();
    return insightKey.includes('revenue') || 
           insightKey.includes('expense') ||
           insightKey.includes('profit') ||
           insightKey.includes('cash');
  }

  private isActionRelevant(memory: ContextualMemory, context: AIContext): boolean {
    // Check if action relates to current intent
    const actionKey = memory.key.toLowerCase();
    const message = context.message.toLowerCase();
    
    return message.includes('create') || 
           message.includes('add') ||
           message.includes('send') ||
           actionKey.includes('recent');
  }
}

// Export singleton instance
export const contextMemorySystem = new ContextMemorySystem();
export default contextMemorySystem;
