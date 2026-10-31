import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { exchangeService } from '@/services/exchangeService';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Unified currency formatting utility.
 * Reads user's selected currency from localStorage when no target code given.
 *
 * IMPORTANT:
 * - If `fromCurrency` is omitted, the amount is treated as ALREADY in the
 *   display currency (no conversion). This matches how transactions are stored.
 * - Pass `fromCurrency` only when the amount is in a different currency
 *   (e.g. formatCurrency(100, 'UGX', undefined, 'USD')).
 */
export function formatCurrency(
  amount: number,
  currencyCode?: string,
  locale?: string,
  fromCurrency?: string,
): string {
  if (!currencyCode) {
    try {
      const stored = localStorage.getItem('selected-currency');
      if (stored) {
        const parsed = JSON.parse(stored);
        currencyCode = parsed.code || 'USD';
        locale = locale || parsed.locale || 'en-US';
      }
    } catch { /* ignore */ }
  }
  currencyCode = currencyCode || 'USD';
  locale = locale || 'en-US';

  // Default source = display currency → no accidental USD conversion
  const sourceCurrency = (fromCurrency || currencyCode).toUpperCase();
  let displayAmount = amount;
  if (sourceCurrency !== currencyCode.toUpperCase()) {
    displayAmount = exchangeService.convertSync(amount, sourceCurrency, currencyCode);
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(displayAmount);
  } catch (error) {
    const symbols: { [key: string]: string } = {
      USD: '\( ', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C \)', AUD: 'A$',
      CHF: '₣', CNY: '¥', INR: '₹', BRL: 'R$', ZAR: 'R', KRW: '₩',
      SGD: 'S\( ', HKD: 'HK \)', SEK: 'kr', NOK: 'kr', DKK: 'kr',
      PLN: 'zł', CZK: 'Kč', HUF: 'Ft', RUB: '₽', TRY: '₺',
      MXN: '\( ', ARS: ' \)', CLP: '\( ', COP: ' \)', PEN: 'S/', UYU: '$',
      EGP: '£', MAD: 'DH', NGN: '₦', GHS: '₵', KES: 'KSh',
      UGX: 'USh', TZS: 'TSh', ZMW: 'ZK', BWP: 'P', AED: 'د.إ',
      SAR: '﷼', QAR: '﷼', KWD: 'د.ك', BHD: '.د.ب', OMR: '﷼',
      JOD: 'د.ا', LBP: '£', THB: '฿', VND: '₫', IDR: 'Rp',
      MYR: 'RM', PHP: '₱', PKR: '₨', BDT: '৳', LKR: '₨', NPR: '₨'
    };
    const symbol = symbols[currencyCode] || currencyCode || '$';
    return `\( {symbol} \){displayAmount.toFixed(2)}`;
  }
}

export function convertCurrency(amount: number, from: string, to: string): number {
  return exchangeService.convertSync(amount, from, to);
}

export function getExchangeRate(from: string, to: string): number {
  return exchangeService.getRateSync(from, to);
}