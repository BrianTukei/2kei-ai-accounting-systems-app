import React, { useState } from 'react';
import { useCurrency, CURRENCIES } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ChevronDown, DollarSign, Globe } from 'lucide-react';
import { toast } from 'sonner';

/**
 * CurrencySelector Component
 * 
 * Dropdown to select currency. When changed, all amounts in the system
 * automatically convert using real-time exchange rates.
 * 
 * Example: User selects UGX → All $ amounts convert to Uganda Shillings
 */
export const CurrencySelector: React.FC = () => {
  const { 
    selectedCurrency, 
    setCurrency, 
    exchangeRates, 
    ratesSource, 
    ratesLastUpdated,
    isRatesLoading,
    refreshRates 
  } = useCurrency();

  const [open, setOpen] = useState(false);

  const handleCurrencyChange = (currencyCode: string) => {
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    if (currency) {
      setCurrency(currency);
      toast.success(`Currency changed to ${currency.name} (${currency.code})`);
      setOpen(false);
    }
  };

  // Group currencies by region
  const africanCurrencies = CURRENCIES.filter(c => 
    ['UGX', 'KES', 'TZS', 'RWF', 'NGN', 'GHS', 'ZAR', 'ZMW', 'BWP', 'EGP', 'MAD'].includes(c.code)
  );

  const majorCurrencies = CURRENCIES.filter(c => 
    ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'].includes(c.code)
  );

  const otherCurrencies = CURRENCIES.filter(c => 
    !africanCurrencies.includes(c) && !majorCurrencies.includes(c)
  );

  const formatLastUpdated = () => {
    if (!ratesLastUpdated) return 'Never';
    const date = new Date(ratesLastUpdated);
    return date.toLocaleTimeString();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[140px]">
          <span className="text-lg">{selectedCurrency.symbol}</span>
          <span className="font-medium">{selectedCurrency.code}</span>
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-72">
        {/* Header with current currency */}
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Select Currency
          </span>
          <Badge variant="secondary" className="text-xs">
            {ratesSource}
          </Badge>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Refresh rates button */}
        <div className="px-2 py-1.5">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-between text-xs"
            onClick={(e) => {
              e.stopPropagation();
              refreshRates();
            }}
            disabled={isRatesLoading}
          >
            <span className="flex items-center gap-2">
              <RefreshCw className={cn("w-3 h-3", isRatesLoading && "animate-spin")} />
              Refresh Rates
            </span>
            <span className="text-gray-400">
              {formatLastUpdated()}
            </span>
          </Button>
        </div>

        <DropdownMenuSeparator />
        
        {/* African Currencies */}
        <DropdownMenuLabel className="text-xs text-gray-500">
          African Currencies
        </DropdownMenuLabel>
        {africanCurrencies.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => handleCurrencyChange(currency.code)}
            className={cn(
              "cursor-pointer",
              selectedCurrency.code === currency.code && "bg-blue-50"
            )}
          >
            <span className="w-8 text-lg">{currency.symbol}</span>
            <div className="flex flex-col">
              <span className="font-medium">{currency.code}</span>
              <span className="text-xs text-gray-500">{currency.name}</span>
            </div>
            {selectedCurrency.code === currency.code && (
              <Badge variant="default" className="ml-auto text-xs">Active</Badge>
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        
        {/* Major Currencies */}
        <DropdownMenuLabel className="text-xs text-gray-500">
          Major Currencies
        </DropdownMenuLabel>
        {majorCurrencies.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => handleCurrencyChange(currency.code)}
            className={cn(
              "cursor-pointer",
              selectedCurrency.code === currency.code && "bg-blue-50"
            )}
          >
            <span className="w-8 text-lg">{currency.symbol}</span>
            <div className="flex flex-col">
              <span className="font-medium">{currency.code}</span>
              <span className="text-xs text-gray-500">{currency.name}</span>
            </div>
            {selectedCurrency.code === currency.code && (
              <Badge variant="default" className="ml-auto text-xs">Active</Badge>
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        
        {/* Other Currencies */}
        <DropdownMenuLabel className="text-xs text-gray-500">
          Other Currencies
        </DropdownMenuLabel>
        {otherCurrencies.slice(0, 10).map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => handleCurrencyChange(currency.code)}
            className={cn(
              "cursor-pointer",
              selectedCurrency.code === currency.code && "bg-blue-50"
            )}
          >
            <span className="w-8 text-lg">{currency.symbol}</span>
            <div className="flex flex-col">
              <span className="font-medium">{currency.code}</span>
              <span className="text-xs text-gray-500">{currency.name}</span>
            </div>
            {selectedCurrency.code === currency.code && (
              <Badge variant="default" className="ml-auto text-xs">Active</Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySelector;
