/**
 * orgStorage.ts
 * ─────────────
 * Thin wrapper around localStorage that namespaces every key by
 * the active organization ID, giving complete data isolation
 * between tenants without rewriting every hook.
 *
 * Usage:
 *   // instead of localStorage.getItem('finance-app-transactions')
 *   orgStorage.getItem(orgId, 'finance-app-transactions')
 *
 * All existing localStorage keys are mapped 1-to-1 here.
 */

// ─────────────────────────────────────────
// Known keys — update here if new keys are added
// ─────────────────────────────────────────
export const STORAGE_KEYS = {
  TRANSACTIONS:          'finance-app-transactions',
  RECURRING:             'recurring-transactions',
  CATEGORIES:            'finance-app-categories',
  JOURNAL:               '2kai-journal',
  BANK_IMPORTS:          '2kai-bank-imports',
  INVOICES:              '2kai-invoices',
  PAYROLL:               'payroll',
  CURRENCY:              'selectedCurrency',
  SAMPLE_LOADED:         'sampleDataLoaded',
  SETTINGS:              'app-settings',
  AI_CONTEXT:            'ai-conversation',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// ─────────────────────────────────────────
// Core helpers
// ─────────────────────────────────────────

/** Build the namespaced key */
export function nsKey(orgId: string | null | undefined, key: string): string {
  if (!orgId) return key; // fallback: no namespace (demo / unauthenticated)
  return `org_${orgId}_${key}`;
}

const orgStorage = {
  getItem(orgId: string | null | undefined, key: string): string | null {
    return localStorage.getItem(nsKey(orgId, key));
  },

  setItem(orgId: string | null | undefined, key: string, value: string): void {
    localStorage.setItem(nsKey(orgId, key), value);
  },

  removeItem(orgId: string | null | undefined, key: string): void {
    localStorage.removeItem(nsKey(orgId, key));
  },

  getJSON<T>(orgId: string | null | undefined, key: string, fallback: T): T {
    try {
      const raw = orgStorage.getItem(orgId, key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  setJSON<T>(orgId: string | null | undefined, key: string, value: T): void {
    orgStorage.setItem(orgId, key, JSON.stringify(value));
  },

  /** Copy all legacy (non-namespaced) data into org namespace on first login */
  migrateFromLegacy(orgId: string): void {
    const migrated = localStorage.getItem(`_migrated_${orgId}`);
    if (migrated) return;

    Object.values(STORAGE_KEYS).forEach((key) => {
      const legacyValue = localStorage.getItem(key);
      if (legacyValue && !localStorage.getItem(nsKey(orgId, key))) {
        localStorage.setItem(nsKey(orgId, key), legacyValue);
      }
    });

    localStorage.setItem(`_migrated_${orgId}`, '1');
  },

  /** Remove all data for an org (e.g. on account deletion) */
  purgeOrg(orgId: string): void {
    const prefix = `org_${orgId}_`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(prefix)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  },
};

export default orgStorage;
