import React, { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { forexService } from '@/services/forexService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRightLeft } from 'lucide-react';

/**
 * Multi-Currency Transaction Input
 * Handles currency selection and automatic conversion
 */
export function MultiCurrencyInput({ 
  amount, 
  currency, 
  onAmountChange, 
  onCurrencyChange,
  showConversion = true 
}) {
  const { company } = useCompany();
  const baseCurrency = company?.baseCurrency?.code || 'USD';
  
  const [convertedAmount, setConvertedAmount] = useState(amount);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [isConverting, setIsConverting] = useState(false);

  // Supported currencies (company base + common currencies)
  const supportedCurrencies = [
    { code: baseCurrency, name: company?.baseCurrency?.name || baseCurrency },
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'UGX', name: 'Ugandan Shilling' },
    { code: 'KES', name: 'Kenyan Shilling' },
    { code: 'TZS', name: 'Tanzanian Shilling' },
    { code: 'RWF', name: 'Rwandan Franc' },
    { code: 'NGN', name: 'Nigerian Naira' },
    { code: 'GHS', name: 'Ghanaian Cedi' },
    { code: 'ZAR', name: 'South African Rand' },
    { code: 'ZMW', name: 'Zambian Kwacha' }
  ];

  // Convert when amount or currency changes
  useEffect(() => {
    const convert = async () => {
      if (!amount || currency === baseCurrency) {
        setConvertedAmount(amount);
        setExchangeRate(1);
        return;
      }

      setIsConverting(true);
      try {
        const result = await forexService.convert(amount, currency, baseCurrency);
        setConvertedAmount(result.convertedAmount);
        setExchangeRate(result.rate);
      } catch (error) {
        console.error('Conversion error:', error);
      } finally {
        setIsConverting(false);
      }
    };

    convert();
  }, [amount, currency, baseCurrency]);

  return (
    <div className="space-y-4">
      {/* Amount and Currency Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={onCurrencyChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                Base Currency ({baseCurrency})
              </div>
              <SelectItem value={baseCurrency}>
                {baseCurrency} - {company?.baseCurrency?.name || baseCurrency}
              </SelectItem>
              
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">
                African Currencies
              </div>
              {supportedCurrencies
                .filter(c => ['UGX', 'KES', 'TZS', 'RWF', 'NGN', 'GHS', 'ZAR', 'ZMW'].includes(c.code))
                .map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </SelectItem>
                ))}
              
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">
                International Currencies
              </div>
              {supportedCurrencies
                .filter(c => ['USD', 'EUR', 'GBP'].includes(c.code))
                .map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conversion Display */}
      {showConversion && currency !== baseCurrency && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Will be recorded as:
              </span>
            </div>
            {isConverting && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
          </div>
          
          <div className="mt-2 text-lg font-semibold text-blue-900">
            {forexService.formatAmount(convertedAmount, baseCurrency)}
          </div>
          
          <div className="mt-1 text-xs text-blue-600">
            Exchange rate: 1 {currency} = {exchangeRate.toFixed(4)} {baseCurrency}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Currency Display Component
 * Shows amount in original currency + converted to base currency
 */
export function CurrencyDisplay({ amount, currency, showOriginal = false }) {
  const { company } = useCompany();
  const baseCurrency = company?.baseCurrency?.code || 'USD';
  
  const [converted, setConverted] = useState(amount);

  useEffect(() => {
    if (currency && currency !== baseCurrency) {
      forexService.convert(amount, currency, baseCurrency)
        .then(result => setConverted(result.convertedAmount))
        .catch(() => setConverted(amount));
    } else {
      setConverted(amount);
    }
  }, [amount, currency, baseCurrency]);

  const formattedOriginal = forexService.formatAmount(amount, currency);
  const formattedConverted = forexService.formatAmount(converted, baseCurrency);

  if (currency === baseCurrency || !currency) {
    return <span>{formattedConverted}</span>;
  }

  return (
    <div className="inline-flex flex-col">
      <span className="font-medium">{formattedConverted}</span>
      {showOriginal && (
        <span className="text-xs text-gray-500">
          {formattedOriginal}
        </span>
      )}
    </div>
  );
}

/**
 * Currency Selector Dropdown
 * Simple currency selection component
 */
export function CurrencySelector({ value, onChange, label = "Currency" }) {
  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
    { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
    { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK' }
  ];

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {currencies.map(c => (
            <SelectItem key={c.code} value={c.code}>
              <span className="font-medium">{c.symbol}</span>
              <span className="ml-2">{c.code}</span>
              <span className="ml-2 text-gray-500 text-sm">{c.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default MultiCurrencyInput;
