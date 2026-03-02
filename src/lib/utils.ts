import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatting utility – reads user preference from localStorage when no code given
export function formatCurrency(amount: number, currencyCode?: string, locale?: string): string {
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
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    const symbols: { [key: string]: string } = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$',
      CHF: '₣', CNY: '¥', INR: '₹', BRL: 'R$', ZAR: 'R', KRW: '₩',
      SGD: 'S$', HKD: 'HK$', SEK: 'kr', NOK: 'kr', DKK: 'kr',
      PLN: 'zł', CZK: 'Kč', HUF: 'Ft', RUB: '₽', TRY: '₺',
      MXN: '$', ARS: '$', CLP: '$', COP: '$', PEN: 'S/', UYU: '$',
      EGP: '£', MAD: 'DH', NGN: '₦', GHS: '₵', KES: 'KSh',
      UGX: 'USh', TZS: 'TSh', ZMW: 'ZK', BWP: 'P', AED: 'د.إ',
      SAR: '﷼', QAR: '﷼', KWD: 'د.ك', BHD: '.د.ب', OMR: '﷼',
      JOD: 'د.ا', LBP: '£', THB: '฿', VND: '₫', IDR: 'Rp',
      MYR: 'RM', PHP: '₱', PKR: '₨', BDT: '৳', LKR: '₨', NPR: '₨'
    };
    const symbol = symbols[currencyCode] || '$';
    return `${symbol}${amount.toFixed(2)}`;
  }
}
