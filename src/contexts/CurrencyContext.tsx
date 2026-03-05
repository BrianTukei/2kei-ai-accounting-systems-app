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
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'selected-currency';
const BASE_CURRENCY = 'USD';

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(() => {
    const storedCurrency = localStorage.getItem(STORAGE_KEY);
    if (storedCurrency) {
      const parsed = JSON.parse(storedCurrency);
      return CURRENCIES.find(c => c.code === parsed.code) || CURRENCIES[0];
    }
    return CURRENCIES[0]; // Default to USD
  });

  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
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

    // Use synchronous conversion from cached rates
    return exchangeService.convertSync(amount, source, target);
  }, [selectedCurrency.code]);

  /**
   * Format a currency amount. If fromCurrency is provided and differs
   * from selectedCurrency, the amount is auto-converted first.
   */
  const formatCurrency = useCallback((amount: number, fromCurrency?: string): string => {
    let displayAmount = amount;

    // Auto-convert if the amount is in a different currency
    if (fromCurrency && fromCurrency.toUpperCase() !== selectedCurrency.code.toUpperCase()) {
      displayAmount = exchangeService.convertSync(amount, fromCurrency, selectedCurrency.code);
    }

    try {
      return new Intl.NumberFormat(selectedCurrency.locale, {
        style: 'currency',
        currency: selectedCurrency.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(displayAmount);
    } catch {
      return `${selectedCurrency.symbol}${displayAmount.toFixed(2)}`;
    }
  }, [selectedCurrency]);

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