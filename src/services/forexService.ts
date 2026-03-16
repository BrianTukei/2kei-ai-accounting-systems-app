import axios from 'axios';

export interface ExchangeRate {
  base: string;
  target: string;
  rate: number;
  timestamp: string;
  source: string;
}

export interface ExchangeRatesResponse {
  success: boolean;
  base: string;
  date: string;
  rates: Record<string, number>;
}

// African currencies supported
export const SUPPORTED_CURRENCIES = [
  { code: 'UGX', name: 'Uganda Shilling', symbol: 'USh', flag: '🇺🇬' },
  { code: 'KES', name: 'Kenya Shilling', symbol: 'KSh', flag: '🇰🇪' },
  { code: 'TZS', name: 'Tanzania Shilling', symbol: 'TSh', flag: '🇹🇿' },
  { code: 'RWF', name: 'Rwanda Franc', symbol: 'RF', flag: '🇷🇼' },
  { code: 'NGN', name: 'Nigeria Naira', symbol: '₦', flag: '🇳🇬' },
  { code: 'GHS', name: 'Ghana Cedi', symbol: '₵', flag: '🇬🇭' },
  { code: 'ZAR', name: 'South Africa Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'ZMW', name: 'Zambia Kwacha', symbol: 'K', flag: '🇿🇲' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' }
];

class ForexService {
  private apiUrl: string = 'https://api.exchangerate-api.com/v4/latest';
  private cache: Map<string, ExchangeRate> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes cache
  private lastFetch: number = 0;

  // Get exchange rate from base to target currency
  async getRate(base: string, target: string): Promise<{ success: boolean; rate?: number; error?: string }> {
    try {
      const cacheKey = `${base}-${target}`;
      const cached = this.cache.get(cacheKey);
      
      // Return cached rate if still valid
      if (cached && Date.now() - this.lastFetch < this.cacheExpiry) {
        return {
          success: true,
          rate: cached.rate
        };
      }

      // Fetch fresh rates
      const response = await axios.get(`${this.apiUrl}/${base.toUpperCase()}`, {
        timeout: 10000 // 10 second timeout
      });

      if (!response.data || !response.data.rates) {
        return {
          success: false,
          error: 'Invalid response from exchange rate API'
        };
      }

      const rates = response.data.rates;
      
      // Cache all rates
      Object.keys(rates).forEach(currency => {
        const key = `${base}-${currency}`;
        this.cache.set(key, {
          base,
          target: currency,
          rate: rates[currency],
          timestamp: new Date().toISOString(),
          source: 'exchangerate-api'
        });
      });

      this.lastFetch = Date.now();

      // Return requested rate
      const rate = rates[target.toUpperCase()];
      
      if (!rate) {
        return {
          success: false,
          error: `Exchange rate not found for ${target}`
        };
      }

      return {
        success: true,
        rate
      };
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      
      // Return cached rate even if expired, as fallback
      const cacheKey = `${base}-${target}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        return {
          success: true,
          rate: cached.rate,
          error: 'Using cached rate - API temporarily unavailable'
        };
      }

      return {
        success: false,
        error: 'Failed to fetch exchange rate: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  // Get all rates for a base currency
  async getAllRates(base: string): Promise<{ success: boolean; rates?: Record<string, number>; error?: string }> {
    try {
      const response = await axios.get(`${this.apiUrl}/${base.toUpperCase()}`, {
        timeout: 10000
      });

      if (!response.data || !response.data.rates) {
        return {
          success: false,
          error: 'Invalid response from exchange rate API'
        };
      }

      return {
        success: true,
        rates: response.data.rates
      };
    } catch (error) {
      console.error('Error fetching all rates:', error);
      return {
        success: false,
        error: 'Failed to fetch exchange rates'
      };
    }
  }

  // Convert amount from one currency to another
  async convert(amount: number, from: string, to: string): Promise<{ success: boolean; converted?: number; rate?: number; error?: string }> {
    const result = await this.getRate(from, to);
    
    if (!result.success || !result.rate) {
      return result;
    }

    return {
      success: true,
      converted: amount * result.rate,
      rate: result.rate
    };
  }

  // Convert amount through USD as intermediate (for African currencies)
  async convertViaUSD(amount: number, from: string, to: string): Promise<{ success: boolean; converted?: number; rate?: number; intermediateRate?: number; error?: string }> {
    try {
      // Get rate from source to USD
      const fromToUSD = await this.getRate(from, 'USD');
      
      if (!fromToUSD.success || !fromToUSD.rate) {
        return fromToUSD;
      }

      // Get rate from USD to target
      const usdToTarget = await this.getRate('USD', to);
      
      if (!usdToTarget.success || !usdToTarget.rate) {
        return usdToTarget;
      }

      // Calculate cross rate
      const crossRate = fromToUSD.rate * usdToTarget.rate;

      return {
        success: true,
        converted: amount * crossRate,
        rate: crossRate,
        intermediateRate: fromToUSD.rate
      };
    } catch (error) {
      console.error('Error converting via USD:', error);
      return {
        success: false,
        error: 'Failed to convert currency'
      };
    }
  }

  // Get supported currencies
  getSupportedCurrencies() {
    return SUPPORTED_CURRENCIES;
  }

  // Get currency info
  getCurrencyInfo(code: string) {
    return SUPPORTED_CURRENCIES.find(c => c.code === code.toUpperCase());
  }

  // Format amount with currency symbol
  formatAmount(amount: number, currencyCode: string): string {
    const currency = this.getCurrencyInfo(currencyCode);
    
    if (!currency) {
      return `${amount} ${currencyCode}`;
    }

    // Format based on currency
    switch (currencyCode.toUpperCase()) {
      case 'UGX':
      case 'KES':
      case 'TZS':
      case 'RWF':
        return `${currency.symbol} ${amount.toLocaleString()}`;
      case 'USD':
      case 'EUR':
      case 'GBP':
        return `${currency.symbol}${amount.toFixed(2)}`;
      default:
        return `${amount.toFixed(2)} ${currencyCode}`;
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    this.lastFetch = 0;
  }

  // Get cache status
  getCacheStatus(): { size: number; lastFetch: string; isValid: boolean } {
    return {
      size: this.cache.size,
      lastFetch: this.lastFetch ? new Date(this.lastFetch).toISOString() : 'Never',
      isValid: Date.now() - this.lastFetch < this.cacheExpiry
    };
  }
}

export const forexService = new ForexService();
export default forexService;
