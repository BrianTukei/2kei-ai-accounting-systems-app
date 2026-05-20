import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { exchangeService } from '@/services/exchangeService';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE' },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', locale: 'en-CA' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU' },
  { code: 'CHF', name: 'Swiss Franc', symbol: '₣', locale: 'de-CH' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', locale: 'zh-CN' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', locale: 'pt-BR' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', locale: 'en-ZA' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', locale: 'ko-KR' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', locale: 'en-HK' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', locale: 'sv-SE' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', locale: 'nb-NO' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', locale: 'da-DK' },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł', locale: 'pl-PL' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', locale: 'cs-CZ' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', locale: 'hu-HU' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', locale: 'ru-RU' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', locale: 'tr-TR' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', locale: 'es-MX' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', locale: 'es-AR' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', locale: 'es-CL' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', locale: 'es-CO' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', locale: 'es-PE' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$', locale: 'es-UY' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', locale: 'ar-EG' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'DH', locale: 'ar-MA' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', locale: 'en-NG' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', locale: 'en-GH' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', locale: 'en-KE' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', locale: 'en-UG' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', locale: 'en-TZ' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', locale: 'en-ZM' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P', locale: 'en-BW' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', locale: 'ar-AE' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', locale: 'ar-SA' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', locale: 'ar-QA' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', locale: 'ar-KW' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', locale: 'ar-BH' },
  { code: 'OMR', name: 'Omani Rial', symbol: '﷼', locale: 'ar-OM' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', locale: 'ar-JO' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: '£', locale: 'ar-LB' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', locale: 'th-TH' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', locale: 'vi-VN' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', locale: 'id-ID' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', locale: 'ms-MY' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', locale: 'en-PH' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', locale: 'en-PK' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', locale: 'bn-BD' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨', locale: 'en-LK' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨', locale: 'ne-NP' },
];

/** Get currency symbol - maps currency code to symbol */
export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find(c => c.code === code.toUpperCase())?.symbol || code;
}

interface CurrencyContextType {
  selectedCurrency: Currency;
  setCurrency: (currency: Currency) => void;
  setAppCurrency: (code: string) => void;
  formatCurrency: (amount: number, fromCurrency?: string) => string;
  getCurrencySymbol: () => string;
  convertAmount: (amount: number, from: string, to?: string) => number;
  formatConverted: (amount: number, fromCurrency: string) => string;
  exchangeRates: Record<string, number>;
  ratesSource: string;
  ratesLastUpdated: string | null;
  isRatesLoading: boolean;
  refreshRates: () => Promise<void>;
  baseCurrency: string;
  /** Convert + format amount in one call (like pricing plans display) */
  displayAmount: (amount: number, fromCurrency: string, toCurrency?: string) => string;
  /** Get just the numeric converted amount */
  convertTo: (amount: number, fromCurrency: string, toCurrency?: string) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'selected-currency';
const BASE_CURRENCY = 'USD';

interface CurrencyProviderProps {
  children: ReactNode;
}

// Fallback rates - used immediately and updated when API responds
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

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(() => {
    const storedCurrency = localStorage.getItem(STORAGE_KEY);
    if (storedCurrency) {
      const parsed = JSON.parse(storedCurrency);
      return CURRENCIES.find(c => c.code === parsed.code) || CURRENCIES[0];
    }
    return CURRENCIES[0]; // Default to USD
  });

  // Initialize with fallback rates so conversion works immediately
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [ratesSource, setRatesSource] = useState<string>('none');
  const [ratesLastUpdated, setRatesLastUpdated] = useState<string | null>(null);
  const [isRatesLoading, setIsRatesLoading] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedCurrency));
  }, [selectedCurrency]);

  // Load exchange rates on mount and refresh every 10 minutes
  useEffect(() => {
    const loadRates = async () => {
      setIsRatesLoading(true);
      try {
        const result = await exchangeService.getRates();
        setExchangeRates(result.rates);
        setRatesSource(result.source);
        setRatesLastUpdated(result.lastUpdated);
      } catch (err) {
        console.error('[CurrencyContext] Failed to load exchange rates:', err);
      } finally {
        setIsRatesLoading(false);
      }
    };

    loadRates();

    // Auto-refresh every 10 minutes
    refreshTimerRef.current = setInterval(loadRates, 10 * 60 * 1000);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, []);

  const setCurrency = useCallback((currency: Currency) => {
    setSelectedCurrency(currency);
  }, []);

  const setAppCurrency = useCallback((code: string) => {
    const found = CURRENCIES.find(c => c.code === code);
    if (found) setSelectedCurrency(found);
  }, []);

  /**
   * Convert an amount from one currency to another using live rates.
   * Defaults: from = BASE_CURRENCY, to = selectedCurrency.
   */
  const convertAmount = useCallback((amount: number, from: string, to?: string): number => {
    const target = (to || selectedCurrency.code).toUpperCase();
    const source = from.toUpperCase();

    if (source === target) return amount;

    // Use exchangeRates from context (reactive to changes)
    const rates = exchangeRates;
    
    let rate = 1;
    let found = false;

    if (source === 'USD' && rates[target]) {
      rate = rates[target];
      found = true;
    } else if (target === 'USD' && rates[source]) {
      rate = 1 / rates[source];
      found = true;
    } else if (rates[source] && rates[target]) {
      // Both source and target are in rates (relative to USD)
      rate = rates[target] / rates[source];
      found = true;
    }

    // If rate found, use it; otherwise fall back to exchangeService
    if (found) {
      const converted = Math.round(amount * rate * 100) / 100;
      return converted;
    }

    // Fallback to exchangeService if context rates not available
    return exchangeService.convertSync(amount, source, target);
  }, [selectedCurrency.code, exchangeRates]);

  /**
   * Format a currency amount.
   * If source currency is not provided, assume BASE_CURRENCY (USD)
   * so figures convert app-wide instead of only swapping symbols.
   */
  const formatCurrency = useCallback((amount: number, fromCurrency?: string): string => {
    const sourceCurrency = (fromCurrency || BASE_CURRENCY).toUpperCase();
    let displayAmount = amount;

    if (sourceCurrency !== selectedCurrency.code.toUpperCase()) {
      displayAmount = convertAmount(amount, sourceCurrency, selectedCurrency.code);
    }

    // Format without decimals for zero-decimal currencies
    const zeroDecimalCurrencies = ['UGX', 'KES', 'TZS', 'RWF', 'NGN', 'JPY', 'VND', 'IDR'];
    const minimumFractionDigits = zeroDecimalCurrencies.includes(selectedCurrency.code) ? 0 : 2;

    try {
      return new Intl.NumberFormat(selectedCurrency.locale, {
        style: 'currency',
        currency: selectedCurrency.code,
        minimumFractionDigits,
        maximumFractionDigits: minimumFractionDigits,
      }).format(displayAmount);
    } catch {
      const symbol = selectedCurrency.symbol;
      const formatted = displayAmount.toLocaleString('en-US', {
        minimumFractionDigits,
        maximumFractionDigits: minimumFractionDigits,
      });
      return `${symbol}${formatted}`;
    }
  }, [selectedCurrency, convertAmount]);

  /**
   * Format an amount that is in a foreign currency, converting
   * to the selected display currency automatically.
   */
  const formatConverted = useCallback((amount: number, fromCurrency: string): string => {
    return formatCurrency(amount, fromCurrency);
  }, [formatCurrency]);

  const getCurrencySymbol = useCallback((): string => {
    return selectedCurrency.symbol;
  }, [selectedCurrency]);

  const refreshRates = useCallback(async () => {
    setIsRatesLoading(true);
    try {
      const result = await exchangeService.refreshRates();
      setExchangeRates(result.rates);
      setRatesSource(result.source);
      setRatesLastUpdated(result.lastUpdated);
    } catch (err) {
      console.error('[CurrencyContext] Failed to refresh rates:', err);
    } finally {
      setIsRatesLoading(false);
    }
  }, []);

  /**
   * Convert amount from one currency to another (numeric only).
   * Pattern matches getDisplayPrice from billing service.
   * Example: convertTo(1000, 'USD', 'UGX') → 3780000
   */
  const convertTo = useCallback((amount: number, fromCurrency: string, toCurrency?: string): number => {
    const from = fromCurrency.toUpperCase();
    const to = (toCurrency || selectedCurrency.code).toUpperCase();

    if (from === to) return amount;

    // Get rate using exchangeService (same as billing.ts does it)
    const liveRate = exchangeService.getRateSync(from, to);
    if (liveRate !== 1 || from === 'USD') {
      return Math.round(amount * liveRate * 100) / 100;
    }

    // Fallback is already handled by getRateSync
    return Math.round(amount * liveRate * 100) / 100;
  }, [selectedCurrency.code]);

  /**
   * Convert + format amount in one step.
   * Pattern matches getDisplayPrice from billing service.
   * Example: displayAmount(1000, 'USD', 'UGX') → "USh 3,780,000"
   */
  const displayAmount = useCallback((amount: number, fromCurrency: string, toCurrency?: string): string => {
    const to = (toCurrency || selectedCurrency.code).toUpperCase();
    const converted = convertTo(amount, fromCurrency, to);
    const symbol = CURRENCIES.find(currency => currency.code === to)?.symbol || to;

    // Format with proper decimals for the target currency
    const zeroDecimalCurrencies = ['UGX', 'KES', 'TZS', 'RWF', 'NGN', 'JPY', 'VND', 'IDR'];
    const decimals = zeroDecimalCurrencies.includes(to) ? 0 : 2;

    const formatted = converted.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    return `${symbol}${formatted}`;
  }, [selectedCurrency.code, convertTo]);

  return (
    <CurrencyContext.Provider
      value={{
        selectedCurrency,
        setCurrency,
        setAppCurrency,
        formatCurrency,
        getCurrencySymbol,
        convertAmount,
        formatConverted,
        exchangeRates,
        ratesSource,
        ratesLastUpdated,
        isRatesLoading,
        refreshRates,
        baseCurrency: BASE_CURRENCY,
        displayAmount,
        convertTo,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
