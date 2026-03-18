import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/services/api';
import { toast } from 'sonner';

/**
 * Currency Context
 * Manages currency conversion and exchange rates
 */
const CurrencyContext = createContext(undefined);

// Fallback exchange rates
const FALLBACK_RATES = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  UGX: 3700,
  KES: 110,
  TZS: 2300,
  RWF: 1100,
  NGN: 410,
  GHS: 6.2,
  ZAR: 15.5,
  ZMW: 18.5
};

export function CurrencyProvider({ children }) {
  const [exchangeRates, setExchangeRates] = useState(FALLBACK_RATES);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  // Initialize exchange rates
  useEffect(() => {
    fetchExchangeRates();
    
    // Refresh rates every hour
    const interval = setInterval(fetchExchangeRates, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchExchangeRates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/forex/rates');
      
      if (response.data.success) {
        setExchangeRates(response.data.data.rates);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      setError('Failed to fetch exchange rates. Using fallback rates.');
      // Keep fallback rates
    } finally {
      setLoading(false);
    }
  };

  const convertAmount = (amount, fromCurrency, toCurrency) => {
    if (!amount || fromCurrency === toCurrency) {
      return amount;
    }

    const fromUpper = fromCurrency.toUpperCase();
    const toUpper = toCurrency.toUpperCase();

    // Get rates
    const fromRate = exchangeRates[fromUpper] || 1;
    const toRate = exchangeRates[toUpper] || 1;

    // Convert to USD first, then to target currency
    const usdAmount = fromCurrency === 'USD' ? amount : amount / fromRate;
    const convertedAmount = toCurrency === 'USD' ? usdAmount : usdAmount * toRate;

    // Round to 2 decimal places
    return Math.round(convertedAmount * 100) / 100;
  };

  const formatCurrency = (amount, currency, options = {}) => {
    const {
      showSymbol = true,
      showCode = false,
      decimals = 2,
      locale = 'en-US'
    } = options;

    if (!amount || amount === 0) {
      return showSymbol ? `${getCurrencySymbol(currency)}0.00` : '0.00';
    }

    const currencyUpper = (currency || 'USD').toUpperCase();
    const symbol = getCurrencySymbol(currencyUpper);
    
    // Format number
    const formattedAmount = amount.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    // Add symbol and/or code
    if (showSymbol && showCode) {
      return `${symbol}${formattedAmount} ${currencyUpper}`;
    } else if (showSymbol) {
      return `${symbol}${formattedAmount}`;
    } else if (showCode) {
      return `${formattedAmount} ${currencyUpper}`;
    } else {
      return formattedAmount;
    }
  };

  const getCurrencySymbol = (currency) => {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      UGX: 'USh',
      KES: 'KSh',
      TZS: 'TSh',
      RWF: 'RF',
      NGN: '₦',
      GHS: '₵',
      ZAR: 'R',
      ZMW: 'ZK'
    };
    return symbols[currency?.toUpperCase()] || '$';
  };

  const getCurrencyInfo = (currency) => {
    const currencyUpper = (currency || 'USD').toUpperCase();
    return {
      code: currencyUpper,
      symbol: getCurrencySymbol(currencyUpper),
      name: getCurrencyName(currencyUpper),
      rate: exchangeRates[currencyUpper] || 1
    };
  };

  const getCurrencyName = (currency) => {
    const names = {
      USD: 'US Dollar',
      EUR: 'Euro',
      GBP: 'British Pound',
      UGX: 'Ugandan Shilling',
      KES: 'Kenyan Shilling',
      TZS: 'Tanzanian Shilling',
      RWF: 'Rwandan Franc',
      NGN: 'Nigerian Naira',
      GHS: 'Ghanaian Cedi',
      ZAR: 'South African Rand',
      ZMW: 'Zambian Kwacha'
    };
    return names[currency] || currency;
  };

  const getSupportedCurrencies = () => {
    return Object.keys(exchangeRates).map(code => ({
      code,
      symbol: getCurrencySymbol(code),
      name: getCurrencyName(code),
      rate: exchangeRates[code]
    }));
  };

  const refreshRates = async () => {
    await fetchExchangeRates();
    toast.success('Exchange rates updated');
  };

  const value = {
    // State
    exchangeRates,
    loading,
    error,
    lastUpdated,
    
    // Methods
    convertAmount,
    formatCurrency,
    getCurrencySymbol,
    getCurrencyInfo,
    getCurrencyName,
    getSupportedCurrencies,
    refreshRates,
    
    // Utility
    FALLBACK_RATES
  };

  return (
    <CurrencyContext.Provider value={value}>
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

export default CurrencyContext;
