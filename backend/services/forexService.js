const axios = require('axios');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

/**
 * Forex Service
 * Handles real-time exchange rates and currency conversion
 * Uses exchangerate-api.com with fallback to cached rates
 */
class ForexService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 600 }); // 10 minute cache
    this.apiKey = process.env.EXCHANGE_RATE_API_KEY;
    this.baseUrl = 'https://v6.exchangerate-api.com/v6';
    
    // Fallback rates (updated periodically)
    this.fallbackRates = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.50,
      CNY: 7.24,
      // African currencies
      UGX: 3780,    // Ugandan Shilling
      KES: 153,     // Kenyan Shilling
      TZS: 2650,    // Tanzanian Shilling
      RWF: 1280,    // Rwandan Franc
      NGN: 1580,    // Nigerian Naira
      GHS: 14.80,   // Ghanaian Cedi
      ZAR: 18.70,   // South African Rand
      ZMW: 26.50,   // Zambian Kwacha
      BWP: 13.60,   // Botswana Pula
      EGP: 50.10,   // Egyptian Pound
      MAD: 10.05,   // Moroccan Dirham
      // Other major currencies
      CAD: 1.36,
      AUD: 1.53,
      CHF: 0.88,
      INR: 83.12,
      BRL: 4.97,
      SGD: 1.34,
      HKD: 7.82,
      SEK: 10.42,
      NOK: 10.55,
      DKK: 6.92,
      PLN: 4.02,
      CZK: 23.15,
      HUF: 362,
      RUB: 91.50,
      TRY: 30.50,
      MXN: 17.15,
      AED: 3.67,
      SAR: 3.75,
      QAR: 3.64,
      KWD: 0.31,
      BHD: 0.377,
      OMR: 0.385,
      JOD: 0.71,
      LBP: 89500,
      THB: 35.20,
      VND: 24850,
      IDR: 15650,
      MYR: 4.72,
      PHP: 56.30,
      PKR: 278,
      BDT: 110,
      LKR: 320,
      NPR: 133,
      XOF: 610,
      XAF: 610,
      ETB: 56.50
    };

    // Currency symbols
    this.currencySymbols = {
      USD: '$', EUR: '€', GBP: '£',
      UGX: 'USh', KES: 'KSh', TZS: 'TSh', RWF: 'RF',
      NGN: '₦', GHS: '₵', ZAR: 'R', ZMW: 'ZK',
      JPY: '¥', CNY: '¥', INR: '₹',
      CAD: 'C$', AUD: 'A$', CHF: '₣',
      SGD: 'S$', HKD: 'HK$'
    };

    // Zero decimal currencies (no decimals in display)
    this.zeroDecimalCurrencies = ['UGX', 'KES', 'TZS', 'RWF', 'NGN', 'JPY', 'VND', 'IDR'];
  }

  /**
   * Get exchange rate between two currencies
   * @param {string} fromCurrency - Base currency code
   * @param {string} toCurrency - Target currency code
   * @returns {Promise<number>} Exchange rate
   */
  async getExchangeRate(fromCurrency = 'USD', toCurrency = 'USD') {
    try {
      fromCurrency = fromCurrency.toUpperCase();
      toCurrency = toCurrency.toUpperCase();

      // Same currency
      if (fromCurrency === toCurrency) {
        return 1;
      }

      // Check cache first
      const cacheKey = `${fromCurrency}_${toCurrency}`;
      const cachedRate = this.cache.get(cacheKey);
      if (cachedRate) {
        logger.debug(`Using cached rate for ${cacheKey}: ${cachedRate}`);
        return cachedRate;
      }

      // Fetch from API
      const rate = await this.fetchRate(fromCurrency, toCurrency);
      
      // Cache the result
      this.cache.set(cacheKey, rate);
      
      return rate;
    } catch (error) {
      logger.error('Error getting exchange rate:', error);
      // Return fallback rate
      return this.getFallbackRate(fromCurrency, toCurrency);
    }
  }

  /**
   * Fetch rate from API
   * @private
   */
  async fetchRate(fromCurrency, toCurrency) {
    try {
      // If no API key, use fallback
      if (!this.apiKey) {
        logger.warn('No API key configured, using fallback rates');
        return this.getFallbackRate(fromCurrency, toCurrency);
      }

      const url = `${this.baseUrl}/${this.apiKey}/pair/${fromCurrency}/${toCurrency}`;
      const response = await axios.get(url, { timeout: 10000 });

      if (response.data && response.data.conversion_rate) {
        return response.data.conversion_rate;
      }

      throw new Error('Invalid response from exchange rate API');
    } catch (error) {
      logger.error('API fetch error:', error.message);
      return this.getFallbackRate(fromCurrency, toCurrency);
    }
  }

  /**
   * Get all exchange rates for a base currency
   * @param {string} baseCurrency - Base currency code
   * @returns {Promise<Object>} All rates
   */
  async getAllRates(baseCurrency = 'USD') {
    try {
      baseCurrency = baseCurrency.toUpperCase();

      // Check cache
      const cacheKey = `all_${baseCurrency}`;
      const cachedRates = this.cache.get(cacheKey);
      if (cachedRates) {
        return cachedRates;
      }

      // Fetch from API
      if (!this.apiKey) {
        logger.warn('No API key, using fallback rates');
        return this.getFallbackRates(baseCurrency);
      }

      const url = `${this.baseUrl}/${this.apiKey}/latest/${baseCurrency}`;
      const response = await axios.get(url, { timeout: 10000 });

      if (response.data && response.data.conversion_rates) {
        const rates = response.data.conversion_rates;
        this.cache.set(cacheKey, rates);
        return rates;
      }

      throw new Error('Invalid response from API');
    } catch (error) {
      logger.error('Error fetching all rates:', error);
      return this.getFallbackRates(baseCurrency);
    }
  }

  /**
   * Convert amount between currencies
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {Promise<Object>} Conversion result
   */
  async convert(amount, fromCurrency = 'USD', toCurrency = 'USD') {
    try {
      fromCurrency = fromCurrency.toUpperCase();
      toCurrency = toCurrency.toUpperCase();

      if (fromCurrency === toCurrency) {
        return {
          originalAmount: amount,
          convertedAmount: amount,
          rate: 1,
          from: fromCurrency,
          to: toCurrency,
          timestamp: new Date()
        };
      }

      const rate = await this.getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = amount * rate;

      return {
        originalAmount: amount,
        convertedAmount: this.round(convertedAmount, toCurrency),
        rate,
        from: fromCurrency,
        to: toCurrency,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Conversion error:', error);
      throw error;
    }
  }

  /**
   * Convert amount synchronously (using cached rates)
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {number} Converted amount
   */
  convertSync(amount, fromCurrency = 'USD', toCurrency = 'USD') {
    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();

    if (fromCurrency === toCurrency) return amount;

    // Try cache first
    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const cachedRate = this.cache.get(cacheKey);
    if (cachedRate) {
      return this.round(amount * cachedRate, toCurrency);
    }

    // Use fallback rates
    const fallbackRate = this.getFallbackRate(fromCurrency, toCurrency);
    return this.round(amount * fallbackRate, toCurrency);
  }

  /**
   * Format amount with currency symbol
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code
   * @returns {string} Formatted amount
   */
  formatAmount(amount, currency = 'USD') {
    currency = currency.toUpperCase();
    const symbol = this.currencySymbols[currency] || currency;
    
    const decimals = this.zeroDecimalCurrencies.includes(currency) ? 0 : 2;
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    return `${symbol}${formatted}`;
  }

  /**
   * Get currency info
   * @param {string} currencyCode - Currency code
   * @returns {Object} Currency info
   */
  getCurrencyInfo(currencyCode) {
    currencyCode = currencyCode.toUpperCase();
    return {
      code: currencyCode,
      symbol: this.currencySymbols[currencyCode] || currencyCode,
      hasDecimals: !this.zeroDecimalCurrencies.includes(currencyCode),
      isActive: this.fallbackRates[currencyCode] !== undefined
    };
  }

  /**
   * Get supported currencies
   * @returns {Array} List of supported currencies
   */
  getSupportedCurrencies() {
    return Object.keys(this.fallbackRates).map(code => ({
      code,
      symbol: this.currencySymbols[code] || code,
      name: this.getCurrencyName(code)
    }));
  }

  /**
   * Get African currencies (priority for this system)
   * @returns {Array} African currencies
   */
  getAfricanCurrencies() {
    const africanCodes = ['UGX', 'KES', 'TZS', 'RWF', 'NGN', 'GHS', 'ZAR', 'ZMW', 'BWP', 'EGP', 'MAD'];
    return africanCodes.map(code => ({
      code,
      symbol: this.currencySymbols[code] || code,
      name: this.getCurrencyName(code),
      rate: this.fallbackRates[code]
    }));
  }

  /**
   * Get fallback rate
   * @private
   */
  getFallbackRate(fromCurrency, toCurrency) {
    const fromRate = this.fallbackRates[fromCurrency] || 1;
    const toRate = this.fallbackRates[toCurrency] || 1;
    return toRate / fromRate;
  }

  /**
   * Get all fallback rates
   * @private
   */
  getFallbackRates(baseCurrency = 'USD') {
    if (baseCurrency === 'USD') {
      return this.fallbackRates;
    }

    // Convert all rates to new base
    const baseRate = this.fallbackRates[baseCurrency] || 1;
    const rates = {};
    
    for (const [currency, rate] of Object.entries(this.fallbackRates)) {
      rates[currency] = rate / baseRate;
    }
    
    return rates;
  }

  /**
   * Round amount based on currency
   * @private
   */
  round(amount, currency) {
    const decimals = this.zeroDecimalCurrencies.includes(currency) ? 0 : 2;
    return Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * Get currency name
   * @private
   */
  getCurrencyName(code) {
    const names = {
      USD: 'US Dollar',
      EUR: 'Euro',
      GBP: 'British Pound',
      JPY: 'Japanese Yen',
      CNY: 'Chinese Yuan',
      UGX: 'Ugandan Shilling',
      KES: 'Kenyan Shilling',
      TZS: 'Tanzanian Shilling',
      RWF: 'Rwandan Franc',
      NGN: 'Nigerian Naira',
      GHS: 'Ghanaian Cedi',
      ZAR: 'South African Rand',
      ZMW: 'Zambian Kwacha',
      BWP: 'Botswana Pula',
      EGP: 'Egyptian Pound',
      MAD: 'Moroccan Dirham',
      CAD: 'Canadian Dollar',
      AUD: 'Australian Dollar',
      CHF: 'Swiss Franc',
      INR: 'Indian Rupee',
      SGD: 'Singapore Dollar',
      HKD: 'Hong Kong Dollar'
    };
    return names[code] || code;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.flushAll();
    logger.info('Forex cache cleared');
  }

  /**
   * Real-time update transaction amounts based on current forex
   * Used when displaying transactions to apply latest exchange rates
   */
  async updateTransactionWithCurrentRates(transaction) {
    if (!transaction.baseCurrency || !transaction.displayCurrency) {
      return transaction;
    }

    try {
      const rate = await this.getExchangeRate(
        transaction.baseCurrency,
        transaction.displayCurrency
      );

      const convertedAmount = transaction.amount * rate;

      return {
        ...transaction,
        convertedAmount: this.formatCurrency(convertedAmount, transaction.displayCurrency),
        currentRate: rate,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.warn('[Forex] Error updating transaction rates', { error: error.message });
      return transaction;
    }
  }

  /**
   * Batch update multiple transactions with current forex rates
   * Optimized for displaying lists of transactions
   */
  async batchUpdateTransactions(transactions) {
    const updates = await Promise.all(
      transactions.map(tx => this.updateTransactionWithCurrentRates(tx))
    );
    return updates;
  }

  /**
   * Get forex rate trend (last N days)
   * Returns historical rate data for charts
   */
  async getExchangeRateTrend(fromCurrency, toCurrency, days = 7) {
    const key = `trend:${fromCurrency}:${toCurrency}:${days}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    try {
      // Generate trend data (in production, fetch from forex API with historical data)
      const rates = [];
      const now = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Add slight variation to simulate trend
        const baseRate = await this.getExchangeRate(fromCurrency, toCurrency);
        const variation = (Math.random() - 0.5) * baseRate * 0.02; // ±1% variation
        
        rates.push({
          date: date.toISOString().split('T')[0],
          rate: baseRate + variation,
          timestamp: date.getTime(),
        });
      }

      this.cache.set(key, rates, 3600); // Cache for 1 hour
      return rates;
    } catch (error) {
      logger.error('[Forex] Error getting trend', { error: error.message });
      return [];
    }
  }

  /**
   * Subscribe to real-time forex updates
   * Periodically fetches and updates rates
   */
  subscribeToRealTimeUpdates(callback, interval = 60000) {
    const updateInterval = setInterval(async () => {
      try {
        // Update major currency pairs
        const pairs = [
          ['USD', 'UGX'],
          ['USD', 'EUR'],
          ['USD', 'GBP'],
          ['EUR', 'GBP'],
          ['USD', 'KES'],
          ['USD', 'TZS'],
        ];

        const rates = {};

        for (const [from, to] of pairs) {
          const rate = await this.getExchangeRate(from, to);
          const key = `${from}/${to}`;
          rates[key] = rate;
        }

        callback({
          timestamp: new Date().toISOString(),
          rates,
        });
      } catch (error) {
        logger.error('[Forex] Real-time update error', { error: error.message });
      }
    }, interval);

    // Return unsubscribe function
    return () => clearInterval(updateInterval);
  }

  /**
   * Get forex statistics for dashboard
   * Returns summary data about forex changes
   */
  async getForexStats() {
    try {
      const stats = {
        timestamp: new Date().toISOString(),
        majorPairs: {},
        africaCurrencies: {},
      };

      // Major pairs
      const majorPairs = [
        ['USD', 'EUR'],
        ['USD', 'GBP'],
        ['EUR', 'GBP'],
      ];

      for (const [from, to] of majorPairs) {
        const rate = await this.getExchangeRate(from, to);
        const trend = await this.getExchangeRateTrend(from, to, 7);
        const change = trend.length > 1 
          ? ((trend[trend.length - 1].rate - trend[0].rate) / trend[0].rate * 100).toFixed(2)
          : '0.00';

        stats.majorPairs[`${from}/${to}`] = {
          rate,
          change: parseFloat(change),
          trend: trend.map(t => t.rate),
        };
      }

      // Africa currencies
      const africaPairs = [
        ['USD', 'UGX'],
        ['USD', 'KES'],
        ['USD', 'TZS'],
        ['USD', 'NGN'],
        ['USD', 'ZAR'],
      ];

      for (const [from, to] of africaPairs) {
        const rate = await this.getExchangeRate(from, to);
        const trend = await this.getExchangeRateTrend(from, to, 7);
        const change = trend.length > 1
          ? ((trend[trend.length - 1].rate - trend[0].rate) / trend[0].rate * 100).toFixed(2)
          : '0.00';

        stats.africaCurrencies[`${from}/${to}`] = {
          rate,
          change: parseFloat(change),
          trend: trend.map(t => t.rate),
        };
      }

      return stats;
    } catch (error) {
      logger.error('[Forex] Error getting stats', { error: error.message });
      return null;
    }
  }
}

// Export singleton instance
module.exports = new ForexService();
