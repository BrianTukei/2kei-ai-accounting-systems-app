/**
 * Exchange Rate Service (Frontend)
 * ─────────────────────────────────
 * Calls the exchange-rates Edge Function for all forex operations.
 * Maintains a client-side cache (10 min TTL) to reduce API calls.
 * Never exposes API keys — all forex logic runs server-side.
 *
 * Usage:
 *   import { exchangeService } from '@/services/exchangeService';
 *   const rates = await exchangeService.getRates();
 *   const converted = await exchangeService.convert(100, 'USD', 'EUR');
 */

import { supabase } from '@/integrations/supabase/client';

// ── Types ──────────────────────────────────────────────────

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  source: 'live' | 'cache' | 'fallback';
  lastUpdated: string | null;
  overrides: string[];
  cacheTTL: number;
}

export interface ConversionResult {
  originalAmount: number;
  convertedAmount: number;
  from: string;
  to: string;
  rate: number;
  rateDate?: string;
}

export interface RateOverride {
  id: string;
  base_currency: string;
  target_currency: string;
  override_rate: number;
  reason: string | null;
  set_by: string;
  active: boolean;
  effective_from: string;
  effective_until: string | null;
  created_at: string;
}

export interface RateHistoryPoint {
  rate: number;
  source: string;
  recorded_at: string;
}

// ── Client-side cache ──────────────────────────────────────

interface CachedRates {
  data: ExchangeRates;
  fetchedAt: number;
}

const CLIENT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
let ratesCache: CachedRates | null = null;

// ── Fallback rates (match Edge Function) ───────────────────

const FALLBACK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.93, GBP: 0.80, JPY: 149.50, CAD: 1.36, AUD: 1.53,
  CHF: 0.88, CNY: 7.24, INR: 83.12, BRL: 4.97, ZAR: 18.70, KRW: 1320,
  SGD: 1.34, HKD: 7.82, SEK: 10.42, NOK: 10.55, DKK: 6.92, PLN: 4.02,
  CZK: 23.15, HUF: 362, RUB: 91.50, TRY: 30.50, MXN: 17.15,
  ARS: 830, CLP: 920, COP: 3950, PEN: 3.72, UYU: 39.20,
  EGP: 50.10, MAD: 10.05, NGN: 1580, GHS: 14.80, KES: 153,
  UGX: 3780, TZS: 2650, ZMW: 26.50, BWP: 13.60,
  AED: 3.67, SAR: 3.75, QAR: 3.64, KWD: 0.31, BHD: 0.377,
  OMR: 0.385, JOD: 0.71, LBP: 89500, THB: 35.20, VND: 24850,
  IDR: 15650, MYR: 4.72, PHP: 56.30, PKR: 278, BDT: 110,
  LKR: 320, NPR: 133, RWF: 1280, XOF: 610, XAF: 610, ETB: 56.50,
};

// ── Helper: Call Edge Function ─────────────────────────────

async function callEdgeFunction(body: Record<string, unknown>): Promise<any> {
  const { data, error } = await supabase.functions.invoke('exchange-rates', {
    body,
  });

  if (error) {
    console.error('[ExchangeService] Edge function error:', error);
    throw error;
  }

  return data;
}

// ── Service API ────────────────────────────────────────────

export const exchangeService = {
  /**
   * Get all exchange rates (USD-based).
   * Uses client-side cache with 10 min TTL.
   */
  async getRates(forceRefresh = false): Promise<ExchangeRates> {
    // Check client cache
    if (!forceRefresh && ratesCache && (Date.now() - ratesCache.fetchedAt < CLIENT_CACHE_TTL)) {
      return ratesCache.data;
    }

    try {
      const result = await callEdgeFunction({ action: 'get_rates' });
      const rates: ExchangeRates = {
        base: result.base || 'USD',
        rates: result.rates || {},
        source: result.source || 'fallback',
        lastUpdated: result.lastUpdated || null,
        overrides: result.overrides || [],
        cacheTTL: result.cacheTTL || 10,
      };

      // Update client cache
      ratesCache = { data: rates, fetchedAt: Date.now() };
      return rates;
    } catch {
      // Return cached or fallback
      if (ratesCache) return ratesCache.data;
      return {
        base: 'USD',
        rates: { ...FALLBACK_RATES },
        source: 'fallback',
        lastUpdated: null,
        overrides: [],
        cacheTTL: 10,
      };
    }
  },

  /**
   * Get a single exchange rate.
   */
  async getRate(from: string, to: string): Promise<number> {
    if (from.toUpperCase() === to.toUpperCase()) return 1;

    try {
      // Try from cached rates first
      const rates = await this.getRates();
      const fromUpper = from.toUpperCase();
      const toUpper = to.toUpperCase();

      if (fromUpper === 'USD' && rates.rates[toUpper]) {
        return rates.rates[toUpper];
      }
      if (toUpper === 'USD' && rates.rates[fromUpper]) {
        return 1 / rates.rates[fromUpper];
      }
      // Cross rate
      if (rates.rates[fromUpper] && rates.rates[toUpper]) {
        return rates.rates[toUpper] / rates.rates[fromUpper];
      }

      // Fallback to Edge Function
      const result = await callEdgeFunction({ action: 'get_rate', from, to });
      return result.rate || 1;
    } catch {
      // Use fallback rates
      const fromRate = FALLBACK_RATES[from.toUpperCase()] || 1;
      const toRate = FALLBACK_RATES[to.toUpperCase()] || 1;
      return toRate / fromRate;
    }
  },

  /**
   * Convert an amount between currencies.
   * Returns full conversion details.
   */
  async convert(amount: number, from: string, to: string): Promise<ConversionResult> {
    if (from.toUpperCase() === to.toUpperCase()) {
      return { originalAmount: amount, convertedAmount: amount, from, to, rate: 1 };
    }

    try {
      const rate = await this.getRate(from, to);
      const converted = Math.round(amount * rate * 100) / 100;
      return {
        originalAmount: amount,
        convertedAmount: converted,
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate,
        rateDate: new Date().toISOString(),
      };
    } catch {
      const fallbackRate = (FALLBACK_RATES[to.toUpperCase()] || 1) / (FALLBACK_RATES[from.toUpperCase()] || 1);
      return {
        originalAmount: amount,
        convertedAmount: Math.round(amount * fallbackRate * 100) / 100,
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate: fallbackRate,
      };
    }
  },

  /**
   * Quick synchronous conversion using cached rates.
   * Falls back to fallback rates if cache is empty.
   * Use this in hot rendering paths (formatters, charts).
   */
  convertSync(amount: number, from: string, to: string): number {
    if (from.toUpperCase() === to.toUpperCase()) return amount;

    const rates = ratesCache?.data?.rates || FALLBACK_RATES;
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    let rate = 1;
    if (fromUpper === 'USD' && rates[toUpper]) {
      rate = rates[toUpper];
    } else if (toUpper === 'USD' && rates[fromUpper]) {
      rate = 1 / rates[fromUpper];
    } else if (rates[fromUpper] && rates[toUpper]) {
      rate = rates[toUpper] / rates[fromUpper];
    }

    return Math.round(amount * rate * 100) / 100;
  },

  /**
   * Get the current rate for a pair synchronously from cache.
   */
  getRateSync(from: string, to: string): number {
    if (from.toUpperCase() === to.toUpperCase()) return 1;

    const rates = ratesCache?.data?.rates || FALLBACK_RATES;
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    if (fromUpper === 'USD' && rates[toUpper]) return rates[toUpper];
    if (toUpper === 'USD' && rates[fromUpper]) return 1 / rates[fromUpper];
    if (rates[fromUpper] && rates[toUpper]) return rates[toUpper] / rates[fromUpper];

    return 1;
  },

  /**
   * Force refresh rates from the API.
   */
  async refreshRates(): Promise<ExchangeRates> {
    try {
      await callEdgeFunction({ action: 'refresh' });
      ratesCache = null; // Invalidate client cache
      return await this.getRates(true);
    } catch {
      return await this.getRates();
    }
  },

  /**
   * Set an admin rate override.
   */
  async setOverride(target: string, rate: number, reason?: string, effectiveUntil?: string): Promise<void> {
    await callEdgeFunction({
      action: 'set_override',
      target,
      rate,
      reason: reason || '',
      effective_until: effectiveUntil || null,
    });
    ratesCache = null; // Invalidate cache
  },

  /**
   * Remove an admin rate override.
   */
  async removeOverride(target: string): Promise<void> {
    await callEdgeFunction({ action: 'remove_override', target });
    ratesCache = null;
  },

  /**
   * Get all active admin overrides.
   */
  async getOverrides(): Promise<RateOverride[]> {
    const result = await callEdgeFunction({ action: 'get_overrides' });
    return result.overrides || [];
  },

  /**
   * Get rate history for a currency pair.
   */
  async getHistory(target: string, days = 30): Promise<RateHistoryPoint[]> {
    const result = await callEdgeFunction({ action: 'get_history', target, days });
    return result.history || [];
  },

  /**
   * Check if rates cache is available.
   */
  isCacheReady(): boolean {
    return !!ratesCache;
  },

  /**
   * Get source of current rates.
   */
  getRatesSource(): string {
    return ratesCache?.data?.source || 'none';
  },

  /**
   * Get last updated timestamp.
   */
  getLastUpdated(): string | null {
    return ratesCache?.data?.lastUpdated || null;
  },

  /**
   * Clear client-side cache.
   */
  clearCache(): void {
    ratesCache = null;
  },
};
