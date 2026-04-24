export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag?: string;
}

class CurrencyService {
  private rates: Map<string, ExchangeRate> = new Map();
  private currencies: Map<string, Currency> = new Map();
  private readonly API_KEY = process.env.REACT_APP_EXCHANGE_RATE_API_KEY;
  private readonly BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

  constructor() {
    this.initializeCurrencies();
    this.loadCachedRates();
  }

  private initializeCurrencies() {
    const supportedCurrencies: Currency[] = [
      { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
      { code: 'UGX', name: 'Ugandan Shilling', symbol: 'UGX', flag: '🇺🇬' },
      { code: 'KES', name: 'Kenyan Shilling', symbol: 'KES', flag: '🇰🇪' },
      { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TZS', flag: '🇹🇿' },
      { code: 'RWF', name: 'Rwandan Franc', symbol: 'RWF', flag: '🇷🇼' },
      { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
      { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
      { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
      { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
      { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', flag: '🇬🇭' },
      { code: 'BWP', name: 'Botswana Pula', symbol: 'P', flag: '🇧🇼' },
      { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', flag: '🇿🇲' },
      { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT', flag: '🇲🇿' },
      { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', flag: '🇦🇴' },
      { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA', flag: '🇨🇲' },
      { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', flag: '🇸🇳' },
      { code: 'SCR', name: 'Seychellois Rupee', symbol: '₨', flag: '🇸🇨' },
      { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨', flag: '🇲🇺' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
      { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
      { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', flag: '🇶🇦' },
      { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼' },
      { code: 'BHD', name: 'Bahraini Dinar', symbol: 'د.ب', flag: '🇧🇭' },
      { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', flag: '🇴🇲' },
    ];

    supportedCurrencies.forEach(currency => {
      this.currencies.set(currency.code, currency);
    });
  }

  private loadCachedRates() {
    // Only use localStorage in browser environment
    if (typeof localStorage === 'undefined') {
      return;
    }
    const cached = localStorage.getItem('exchange-rates');
    if (cached) {
      try {
        const rates = JSON.parse(cached);
        rates.forEach((rate: ExchangeRate) => {
          this.rates.set(`${rate.from}-${rate.to}`, rate);
        });
      } catch (error) {
        console.warn('Failed to load cached exchange rates:', error);
      }
    }
  }

  private saveCachedRates() {
    // Only use localStorage in browser environment
    if (typeof localStorage === 'undefined') {
      return;
    }
    const rates = Array.from(this.rates.values());
    localStorage.setItem('exchange-rates', JSON.stringify(rates));
  }

  async fetchLiveRates(baseCurrency: string = 'USD'): Promise<void> {
    try {
      const response = await fetch(`${this.BASE_URL}/${baseCurrency}`);
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const data = await response.json();
      const timestamp = new Date();

      // Store rates from base currency to all other currencies
      Object.entries(data.rates).forEach(([toCurrency, rate]) => {
        if (toCurrency !== baseCurrency) {
          const exchangeRate: ExchangeRate = {
            from: baseCurrency,
            to: toCurrency,
            rate: rate as number,
            timestamp
          };
          this.rates.set(`${baseCurrency}-${toCurrency}`, exchangeRate);
        }
      });

      this.saveCachedRates();
    } catch (error) {
      console.error('Failed to fetch live rates:', error);
      // Fallback to default rates
      this.setFallbackRates();
    }
  }

  private setFallbackRates() {
    const fallbackRates = [
      { from: 'USD', to: 'UGX', rate: 3700 },
      { from: 'USD', to: 'KES', rate: 128 },
      { from: 'USD', to: 'TZS', rate: 2560 },
      { from: 'USD', to: 'RWF', rate: 1230 },
      { from: 'USD', to: 'EUR', rate: 0.92 },
      { from: 'USD', to: 'GBP', rate: 0.79 },
      { from: 'USD', to: 'JPY', rate: 149 },
      { from: 'USD', to: 'CNY', rate: 7.24 },
      { from: 'USD', to: 'INR', rate: 83 },
      { from: 'USD', to: 'ZAR', rate: 18.9 },
      { from: 'USD', to: 'NGN', rate: 775 },
      { from: 'USD', to: 'GHS', rate: 12.1 },
      { from: 'USD', to: 'BWP', rate: 13.4 },
      { from: 'USD', to: 'ZMW', rate: 24.8 },
      { from: 'USD', to: 'MZN', rate: 63.9 },
      { from: 'USD', to: 'AOA', rate: 846 },
      { from: 'USD', to: 'XAF', rate: 606 },
      { from: 'USD', to: 'XOF', rate: 606 },
      { from: 'USD', to: 'SCR', rate: 14.6 },
      { from: 'USD', to: 'MUR', rate: 45.9 },
      { from: 'USD', to: 'CAD', rate: 1.36 },
      { from: 'USD', to: 'AUD', rate: 1.53 },
      { from: 'USD', to: 'CHF', rate: 0.88 },
      { from: 'USD', to: 'AED', rate: 3.67 },
      { from: 'USD', to: 'SAR', rate: 3.75 },
      { from: 'USD', to: 'QAR', rate: 3.64 },
      { from: 'USD', to: 'KWD', rate: 0.31 },
      { from: 'USD', to: 'BHD', rate: 0.38 },
      { from: 'USD', to: 'OMR', rate: 0.38 },
    ];

    const timestamp = new Date();
    fallbackRates.forEach(rate => {
      this.rates.set(`${rate.from}-${rate.to}`, { ...rate, timestamp });
    });

    this.saveCachedRates();
  }

  convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;

    // Direct conversion
    const directRate = this.rates.get(`${fromCurrency}-${toCurrency}`);
    if (directRate) {
      return parseFloat((amount * directRate.rate).toFixed(2));
    }

    // Inverse conversion (to -> from)
    const inverseRate = this.rates.get(`${toCurrency}-${fromCurrency}`);
    if (inverseRate) {
      return parseFloat((amount / inverseRate.rate).toFixed(2));
    }

    // Convert via USD as base
    if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
      const toUsdRate = this.rates.get(`${fromCurrency}-USD`);
      const fromUsdRate = this.rates.get(`USD-${toCurrency}`);
      
      if (toUsdRate && fromUsdRate) {
        const usdAmount = amount / toUsdRate.rate;
        return parseFloat((usdAmount * fromUsdRate.rate).toFixed(2));
      }
    }

    console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
    return amount;
  }

  getRate(fromCurrency: string, toCurrency: string): ExchangeRate | null {
    return this.rates.get(`${fromCurrency}-${toCurrency}`) || null;
  }

  getCurrency(code: string): Currency | null {
    return this.currencies.get(code) || null;
  }

  getAllCurrencies(): Currency[] {
    return Array.from(this.currencies.values());
  }

  getPopularCurrencies(): Currency[] {
    return [
      this.currencies.get('USD')!,
      this.currencies.get('EUR')!,
      this.currencies.get('GBP')!,
      this.currencies.get('UGX')!,
      this.currencies.get('KES')!,
      this.currencies.get('TZS')!,
      this.currencies.get('RWF')!,
      this.currencies.get('NGN')!,
      this.currencies.get('GHS')!,
      this.currencies.get('ZAR')!,
    ].filter(Boolean);
  }

  formatAmount(amount: number, currency: string): string {
    const currencyInfo = this.getCurrency(currency);
    if (!currencyInfo) return amount.toFixed(2);

    // Format based on currency
    if (['UGX', 'TZS', 'RWF', 'NGN', 'GHS', 'ZMW', 'MZN', 'AOA', 'XAF', 'XOF'].includes(currency)) {
      // These currencies typically don't show decimal places
      return `${currencyInfo.symbol} ${Math.round(amount).toLocaleString()}`;
    }

    if (['JPY', 'KRW'].includes(currency)) {
      return `${currencyInfo.symbol} ${Math.round(amount).toLocaleString()}`;
    }

    // Standard decimal currencies
    return `${currencyInfo.symbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  isRateStale(fromCurrency: string, toCurrency: string, maxAgeHours: number = 24): boolean {
    const rate = this.rates.get(`${fromCurrency}-${toCurrency}`);
    if (!rate) return true;

    const ageHours = (Date.now() - rate.timestamp.getTime()) / (1000 * 60 * 60);
    return ageHours > maxAgeHours;
  }

  async refreshStaleRates(): Promise<void> {
    const currencies = this.getAllCurrencies().map(c => c.code);
    const staleCurrencies: string[] = [];

    currencies.forEach(currency => {
      if (this.isRateStale('USD', currency)) {
        staleCurrencies.push(currency);
      }
    });

    if (staleCurrencies.length > 0) {
      await this.fetchLiveRates('USD');
    }
  }
}

export const currencyService = new CurrencyService();
