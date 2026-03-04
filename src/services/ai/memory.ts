/**
 * ai/memory.ts
 * ────────────────────────────────────────────────────────────────────────────
 * AI Memory System — stores per-organization:
 *   - Frequently asked questions
 *   - Financial behavior patterns
 *   - Repeated actions
 *   - User preferences
 *
 * Uses localStorage for client-side persistence with optional Supabase sync.
 * The AI becomes smarter over time by learning from interaction patterns.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { AIMemoryEntry } from './types';

const MEMORY_KEY_PREFIX = '2kai_memory_';
const MAX_ENTRIES_PER_ORG = 100;
const DECAY_THRESHOLD_DAYS = 90;

// ── Memory store ────────────────────────────────────────────────────────────

function getStorageKey(orgId: string): string {
  return `${MEMORY_KEY_PREFIX}${orgId}`;
}

function loadMemory(orgId: string): AIMemoryEntry[] {
  try {
    const raw = localStorage.getItem(getStorageKey(orgId));
    if (!raw) return [];
    const entries: AIMemoryEntry[] = JSON.parse(raw);
    // Revive dates
    return entries.map(e => ({
      ...e,
      lastUsed: new Date(e.lastUsed),
      createdAt: new Date(e.createdAt),
    }));
  } catch {
    return [];
  }
}

function saveMemory(orgId: string, entries: AIMemoryEntry[]): void {
  try {
    // Prune old entries
    const now = new Date();
    const pruned = entries
      .filter(e => {
        const daysSinceUse = (now.getTime() - new Date(e.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceUse < DECAY_THRESHOLD_DAYS || e.frequency > 5;
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, MAX_ENTRIES_PER_ORG);

    localStorage.setItem(getStorageKey(orgId), JSON.stringify(pruned));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Record that a question was asked and its intent.
 */
export function rememberQuestion(orgId: string, question: string, intent: string): void {
  const entries = loadMemory(orgId);
  const normalized = question.toLowerCase().trim();
  const key = `faq_${intent}_${normalized.slice(0, 50)}`;

  const existing = entries.find(e => e.key === key);
  if (existing) {
    existing.frequency++;
    existing.lastUsed = new Date();
  } else {
    entries.push({
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      organizationId: orgId,
      type: 'faq',
      key,
      value: { question: normalized, intent },
      frequency: 1,
      lastUsed: new Date(),
      createdAt: new Date(),
    });
  }

  saveMemory(orgId, entries);
}

/**
 * Record a repeated action.
 */
export function rememberAction(orgId: string, actionType: string, data: Record<string, any>): void {
  const entries = loadMemory(orgId);
  const key = `action_${actionType}`;

  const existing = entries.find(e => e.key === key);
  if (existing) {
    existing.frequency++;
    existing.lastUsed = new Date();
    existing.value = { ...existing.value, lastData: data };
  } else {
    entries.push({
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      organizationId: orgId,
      type: 'action',
      key,
      value: { actionType, lastData: data },
      frequency: 1,
      lastUsed: new Date(),
      createdAt: new Date(),
    });
  }

  saveMemory(orgId, entries);
}

/**
 * Record a financial behavior pattern.
 */
export function rememberPattern(orgId: string, patternKey: string, patternData: any): void {
  const entries = loadMemory(orgId);
  const key = `pattern_${patternKey}`;

  const existing = entries.find(e => e.key === key);
  if (existing) {
    existing.frequency++;
    existing.lastUsed = new Date();
    existing.value = patternData;
  } else {
    entries.push({
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      organizationId: orgId,
      type: 'pattern',
      key,
      value: patternData,
      frequency: 1,
      lastUsed: new Date(),
      createdAt: new Date(),
    });
  }

  saveMemory(orgId, entries);
}

/**
 * Store a user preference.
 */
export function rememberPreference(orgId: string, prefKey: string, prefValue: any): void {
  const entries = loadMemory(orgId);
  const key = `pref_${prefKey}`;

  const existing = entries.find(e => e.key === key);
  if (existing) {
    existing.value = prefValue;
    existing.lastUsed = new Date();
  } else {
    entries.push({
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      organizationId: orgId,
      type: 'preference',
      key,
      value: prefValue,
      frequency: 1,
      lastUsed: new Date(),
      createdAt: new Date(),
    });
  }

  saveMemory(orgId, entries);
}

// ── Retrieval ───────────────────────────────────────────────────────────────

/**
 * Get frequently asked questions for this org.
 */
export function getFrequentQuestions(orgId: string, limit = 5): AIMemoryEntry[] {
  return loadMemory(orgId)
    .filter(e => e.type === 'faq')
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit);
}

/**
 * Get frequently used actions.
 */
export function getFrequentActions(orgId: string, limit = 5): AIMemoryEntry[] {
  return loadMemory(orgId)
    .filter(e => e.type === 'action')
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit);
}

/**
 * Get all patterns for this org.
 */
export function getPatterns(orgId: string): AIMemoryEntry[] {
  return loadMemory(orgId)
    .filter(e => e.type === 'pattern')
    .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Get a specific preference.
 */
export function getPreference(orgId: string, prefKey: string): any | undefined {
  const entries = loadMemory(orgId);
  const entry = entries.find(e => e.key === `pref_${prefKey}`);
  return entry?.value;
}

/**
 * Build a context string from memory for the AI system prompt.
 */
export function buildMemoryContext(orgId: string): string {
  const faqs = getFrequentQuestions(orgId, 3);
  const actions = getFrequentActions(orgId, 3);
  const patterns = getPatterns(orgId).slice(0, 3);

  if (faqs.length === 0 && actions.length === 0 && patterns.length === 0) {
    return '';
  }

  let context = '\n[Organization Memory]\n';

  if (faqs.length > 0) {
    context += 'Frequently asked: ' + faqs.map(f => f.value.question).join('; ') + '\n';
  }
  if (actions.length > 0) {
    context += 'Common actions: ' + actions.map(a => a.value.actionType).join(', ') + '\n';
  }
  if (patterns.length > 0) {
    context += 'Patterns: ' + patterns.map(p => p.key.replace('pattern_', '')).join(', ') + '\n';
  }

  return context;
}

/**
 * Clear all memory for an organization.
 */
export function clearMemory(orgId: string): void {
  try {
    localStorage.removeItem(getStorageKey(orgId));
  } catch {
    // Silently fail
  }
}
