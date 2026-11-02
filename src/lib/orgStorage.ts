/**
 * orgStorage.ts
 * ─────────────
 * localStorage namespaced by organization AND user so each person
 * has independent books even when they share an organization.
 *
 * Key shape: org_{orgId}_user_{userId}_{key}
 */

export const STORAGE_KEYS = {
  TRANSACTIONS: 'finance-app-transactions',
  RECURRING: 'recurring-transactions',
  CATEGORIES: 'finance-app-categories',
  JOURNAL: '2kai-journal',
  BANK_IMPORTS: '2kai-bank-imports',
  INVOICES: '2kai-invoices',
  PAYROLL: 'payroll',
  CURRENCY: 'selectedCurrency',
  SAMPLE_LOADED: 'sampleDataLoaded',
  SETTINGS: 'app-settings',
  AI_CONTEXT: 'ai-conversation',
  SCANNED_RECEIPTS: 'scannedReceipts',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** Build namespaced key — requires both org and user for accounting data */
export function nsKey(
  orgId: string | null | undefined,
  key: string,
  userId?: string | null
): string {
  if (orgId && userId) return `org_${orgId}_user_${userId}_${key}`;
  if (orgId) return `org_${orgId}_${key}`; // legacy org-only (prefer not for books)
  if (userId) return `user_${userId}_${key}`;
  return key;
}

const orgStorage = {
  getItem(
    orgId: string | null | undefined,
    key: string,
    userId?: string | null
  ): string | null {
    // Prefer user-scoped; fall back to org-only legacy once
    const primary = localStorage.getItem(nsKey(orgId, key, userId));
    if (primary != null) return primary;
    if (userId && orgId) {
      const legacy = localStorage.getItem(nsKey(orgId, key));
      return legacy;
    }
    return null;
  },

  setItem(
    orgId: string | null | undefined,
    key: string,
    value: string,
    userId?: string | null
  ): void {
    localStorage.setItem(nsKey(orgId, key, userId), value);
  },

  removeItem(
    orgId: string | null | undefined,
    key: string,
    userId?: string | null
  ): void {
    localStorage.removeItem(nsKey(orgId, key, userId));
  },

  getJSON<T>(
    orgId: string | null | undefined,
    key: string,
    fallback: T,
    userId?: string | null
  ): T {
    try {
      const raw = orgStorage.getItem(orgId, key, userId);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  setJSON<T>(
    orgId: string | null | undefined,
    key: string,
    value: T,
    userId?: string | null
  ): void {
    orgStorage.setItem(orgId, key, JSON.stringify(value), userId);
  },

  /** Clear this user's accounting caches for an org (not other users). */
  clearUserBooks(orgId: string, userId: string): void {
    const keys = [
      STORAGE_KEYS.TRANSACTIONS,
      STORAGE_KEYS.JOURNAL,
      STORAGE_KEYS.RECURRING,
      STORAGE_KEYS.BANK_IMPORTS,
      STORAGE_KEYS.INVOICES,
      STORAGE_KEYS.PAYROLL,
      STORAGE_KEYS.SCANNED_RECEIPTS,
      STORAGE_KEYS.SAMPLE_LOADED,
    ];
    for (const k of keys) {
      localStorage.removeItem(nsKey(orgId, k, userId));
    }
  },
};

export default orgStorage;
