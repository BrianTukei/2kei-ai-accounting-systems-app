// Real OCR via Tesseract.js — runs entirely in the browser.
import Tesseract from 'tesseract.js';
import { categoriseTransaction } from '@/services/invoiceAI';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface OCRResult {
  vendor: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  description: string;
  items: Array<{ name: string; price: number; quantity?: number }>;
  subtotal: number;
  taxAmount: number;
  receiptNumber: string;
  paymentMethod: string;
  confidence: number;
  transactionType: 'income' | 'expense';
  suggestedAccount: string;
  rawText: string;
}

// ─────────────────────────────────────────
// Currency detection
// ─────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₹': 'INR',
  '₩': 'KRW', 'R$': 'BRL', '₺': 'TRY', '₪': 'ILS', '₵': 'GHS',
  '₦': 'NGN', '₱': 'PHP', '₫': 'VND', '฿': 'THB', '₽': 'RUB',
  'KSh': 'KES', 'USh': 'UGX', 'TSh': 'TZS', 'Rp': 'IDR', 'RM': 'MYR',
  'R': 'ZAR', 'S/': 'PEN', 'kr': 'NOK', 'zł': 'PLN', 'Kč': 'CZK',
};

function detectCurrency(text: string): string {
  const codeMatch = text.match(
    /\b(USD|EUR|GBP|ZAR|KES|UGX|NGN|GHS|INR|CAD|AUD|JPY|CNY|BRL|MXN|CHF|SGD|HKD|TWD|KRW|THB|VND|IDR|MYR|PHP|TRY|PLN|CZK|SEK|NOK|DKK)\b/i
  );
  if (codeMatch) return codeMatch[1].toUpperCase();

  // USh / UGX common OCR variants
  if (/\bU\s*Sh\b|Ush|Ugandan?\s*Shilling/i.test(text)) return 'UGX';
  if (/\bK\s*Sh\b|Ksh|Kenyan?\s*Shilling/i.test(text)) return 'KES';

  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (text.includes(symbol)) return code;
  }

  // Default: prefer UGX for East Africa apps (change if needed)
  return 'UGX';
}

// ─────────────────────────────────────────
// Number parsing (handles 1,234.56 / 1.234,56 / 20 000)
// ─────────────────────────────────────────

function parseMoney(raw: string): number {
  let s = raw.trim().replace(/[^\d.,\s]/g, '').trim();
  if (!s) return 0;

  // European: 1.234,56
  if (/^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(s)) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  }
  // Space thousands: 20 000 or 20 000.50
  if (/\s/.test(s)) {
    s = s.replace(/\s/g, '');
  }
  // US: 1,234.56
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
    return parseFloat(s.replace(/,/g, ''));
  }
  // Plain: 1234.56 or 1234
  return parseFloat(s.replace(/,/g, '')) || 0;
}

function findAllAmounts(text: string): number[] {
  const matches = [
    ...text.matchAll(/(?:[$€£₹₦₵USh|UGX|KSh|KES]\s*)?(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{1,2})?|\d+[.,]\d{1,2}|\d{2,})/gi),
  ];
  return matches
    .map((m) => parseMoney(m[1] || m[0]))
    .filter((n) => n > 0 && n < 1e9);
}

// ─────────────────────────────────────────
// Image preprocessing
// ─────────────────────────────────────────

const MAX_OCR_DIMENSION = 1600;

const preprocessImage = (imageElement: HTMLImageElement): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageElement.src;

  let { naturalWidth: w, naturalHeight: h } = imageElement;
  if (w > MAX_OCR_DIMENSION || h > MAX_OCR_DIMENSION) {
    const scale = MAX_OCR_DIMENSION / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(imageElement, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray = (gray - 128) * 1.5 + 128;
    gray = Math.max(0, Math.min(255, gray));
    gray = gray > 140 ? 255 : gray < 80 ? 0 : gray;
    data[i] = data[i + 1] = data[i + 2] = gray;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
};

const extractTextFromImage = async (imageElement: HTMLImageElement): Promise<string> => {
  console.log('[receiptOCR] Starting Tesseract OCR…');
  const processedSrc = preprocessImage(imageElement);

  const { data } = await Tesseract.recognize(processedSrc, 'eng', {
    logger: (m: any) => {
      if (m.status === 'recognizing text') {
        console.log(`[receiptOCR] OCR progress: ${Math.round((m.progress ?? 0) * 100)}%`);
      }
    },
  });

  const text = data.text.trim();
  console.log('[receiptOCR] Extracted text length:', text.length);

  if (!text || text.length < 10) {
    throw new Error('Could not read text from the receipt image. Please try a clearer photo.');
  }

  return text;
};

// ─────────────────────────────────────────
// Field extractors
// ─────────────────────────────────────────

function extractVendor(lines: string[]): string {
  for (const line of lines.slice(0, 8)) {
    const clean = line.replace(/[^a-zA-Z0-9\s&'.,-]/g, '').trim();
    if (
      clean.length >= 3 &&
      !/^(date|time|receipt|order|tel|phone|fax|store|branch|tax|vat|total|sub)/i.test(clean)
    ) {
      return clean;
    }
  }
  return 'Unknown Vendor';
}

/**
 * Extract TOTAL — prefer lines labeled TOTAL / AMOUNT DUE / GRAND TOTAL.
 * Never pick a number smaller than a clear line-item sum when possible.
 */
function extractTotal(text: string, itemSum: number): number {
  const patterns = [
    /(?:grand\s*)?total\s*(?:due|amt|amount|payable)?\s*[:.\-]?\s*[$€£₹₦₵]?\s*([0-9][0-9\s.,]*)/i,
    /(?:amount\s*(?:due|paid|tendered|payable))\s*[:.\-]?\s*[$€£₹₦₵]?\s*([0-9][0-9\s.,]*)/i,
    /(?:balance\s*due)\s*[:.\-]?\s*[$€£₹₦₵]?\s*([0-9][0-9\s.,]*)/i,
    /(?:net\s*(?:total|amount))\s*[:.\-]?\s*[$€£₹₦₵]?\s*([0-9][0-9\s.,]*)/i,
    /\btotal\b\s*[:.\-]?\s*[$€£₹₦₵]?\s*([0-9][0-9\s.,]*)/i,
  ];

  const candidates: number[] = [];
  for (const rx of patterns) {
    const m = text.match(rx);
    if (m) {
      const v = parseMoney(m[1]);
      if (v > 0) candidates.push(v);
    }
  }

  if (candidates.length > 0) {
    // Prefer the largest labeled total (often the real grand total)
    const labeled = Math.max(...candidates);
    // If items sum is close, trust items when labeled total is tiny/wrong
    if (itemSum > 0 && labeled < itemSum * 0.5 && itemSum < labeled * 20) {
      return Math.round(itemSum * 100) / 100;
    }
    return labeled;
  }

  if (itemSum > 0) return Math.round(itemSum * 100) / 100;

  const all = findAllAmounts(text);
  return all.length > 0 ? Math.max(...all) : 0;
}

function extractSubtotal(text: string, total: number): number {
  const m = text.match(/sub\s*-?\s*total\s*[:.\-]?\s*[$€£₹₦₵]?\s*([0-9][0-9\s.,]*)/i);
  if (m) {
    const v = parseMoney(m[1]);
    if (v > 0 && (total <= 0 || v <= total * 1.05)) return v;
  }
  return total > 0 ? total : 0;
}

function extractTax(text: string, total: number, subtotal: number): number {
  const patterns = [
    /(?:sales\s*)?(?:tax|vat|gst|hst)\s*(?:\([^)]*\))?\s*[:.\-]?\s*[$€£₹₦₵]?\s*([0-9][0-9\s.,]*)/i,
  ];
  for (const rx of patterns) {
    const m = text.match(rx);
    if (m) {
      const v = parseMoney(m[1]);
      // Reject tax that is larger than total (common OCR error)
      if (v > 0 && total > 0 && v < total) return v;
      if (v > 0 && total <= 0 && v < 1e6) return v;
    }
  }
  const diff = Math.round((total - subtotal) * 100) / 100;
  if (diff > 0 && diff < total) return diff;
  return 0;
}

function extractDate(text: string): string {
  const patterns = [
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})/i,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/i,
    /date[:\s]+(\S+[\s\/\-\.]\S+(?:[\s\/\-\.]\S+)?)/i,
  ];
  for (const rx of patterns) {
    const m = text.match(rx);
    if (m) return m[1].trim();
  }
  return new Date().toISOString().split('T')[0];
}

function extractReceiptNumber(text: string): string {
  const patterns = [
    /(?:receipt|invoice|order|trans(?:action)?|ref(?:erence)?)\s*(?:#|no\.?|number)?\s*[:\s]*([A-Za-z0-9\-]{3,})/i,
    /#\s*([A-Za-z0-9\-]{4,})/,
  ];
  for (const rx of patterns) {
    const m = text.match(rx);
    if (m && m[1].length >= 3) return m[1];
  }
  return '';
}

function extractPaymentMethod(text: string): string {
  const t = text.toLowerCase();
  if (/visa/i.test(t)) return 'Visa';
  if (/master\s*card/i.test(t)) return 'Mastercard';
  if (/amex|american\s*express/i.test(t)) return 'Amex';
  if (/debit/i.test(t)) return 'Debit Card';
  if (/\*{3,4}\s?\d{4}/.test(t)) return 'Credit Card';
  if (/cash/i.test(t)) return 'Cash';
  if (/mpesa|m-pesa|mobile\s*money|airtel\s*money|mtn/i.test(t)) return 'Mobile Money';
  if (/paypal/i.test(t)) return 'PayPal';
  if (/eft|transfer/i.test(t)) return 'Bank Transfer';
  return 'Unknown';
}

function extractItems(text: string): Array<{ name: string; price: number; quantity?: number }> {
  const lines = text.split('\n');
  const items: Array<{ name: string; price: number; quantity?: number }> = [];
  const skipWords =
    /^(total|sub\s*total|tax|vat|gst|hst|change|balance|cash|visa|master|amex|debit|credit|tender|payment|discount|tip|gratuity|receipt|order|date|time|tel|phone|cashier|thank|store|branch|service|charge|qty|qty\.|item|description|amount|price)$/i;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.length < 4) continue;

    // "2 x Item name   12.00" or "Item name  12.00"
    const priceMatch = line.match(/^(.+?)\s{1,}([$€£₹₦₵]|USh|UGX|KSh)?\s*(\d+[.,]\d{2}|\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\d+)\s*$/i);
    if (!priceMatch) continue;

    let name = priceMatch[1].replace(/[\.\-_]{3,}/g, '').trim();
    const price = parseMoney(priceMatch[3]);

    if (!name || name.length < 2 || price <= 0 || price > 500000) continue;
    if (skipWords.test(name)) continue;
    // Skip pure numbers / codes as names
    if (/^[\d\s:.\-/@]+$/.test(name)) continue;
    // Skip if name looks like a time or barcode fragment
    if (/^\d{1,2}:\d{2}/.test(name)) continue;

    const qtyBefore = name.match(/^(\d+)\s*[x×]\s+(.+)/i);
    const qtyAfter = name.match(/(.+?)\s*[x×]\s*(\d+)$/i);
    if (qtyBefore) {
      items.push({ name: qtyBefore[2].trim(), price, quantity: parseInt(qtyBefore[1], 10) });
    } else if (qtyAfter) {
      items.push({ name: qtyAfter[1].trim(), price, quantity: parseInt(qtyAfter[2], 10) });
    } else {
      items.push({ name, price, quantity: 1 });
    }
  }

  // Deduplicate near-identical lines
  const seen = new Set<string>();
  return items.filter((it) => {
    const key = `${it.name.toLowerCase()}|${it.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function aiCategorise(vendor: string, fullText: string): { category: string; type: 'income' | 'expense' } {
  // Avoid classifying supermarket receipts as "Tax Payment" just because VAT appears
  const textNoTaxNoise = fullText.replace(/\b(vat|tax|gst|hst)\b/gi, ' ');

  const fromText = categoriseTransaction(textNoTaxNoise, 1, 0);
  if (fromText.category !== 'Miscellaneous Expense' && fromText.category !== 'Uncategorised' && fromText.category !== 'Tax Payment') {
    return fromText;
  }

  const fromVendor = categoriseTransaction(vendor, 1, 0);
  if (fromVendor.category !== 'Miscellaneous Expense' && fromVendor.category !== 'Uncategorised' && fromVendor.category !== 'Tax Payment') {
    return fromVendor;
  }

  const v = (vendor + ' ' + fullText).toLowerCase();
  if (/grocery|supermarket|mart|walmart|shoprite|checkers|spar|nakumatt|carrefour|everyday/i.test(v))
    return { category: 'Groceries', type: 'expense' };
  if (/restaurant|cafe|coffee|pizza|burger|kfc|mcdonald|food/i.test(v))
    return { category: 'Meals & Entertainment', type: 'expense' };
  if (/gas|fuel|petrol|shell|bp/i.test(v))
    return { category: 'Transport Expense', type: 'expense' };
  if (/pharmacy|drug|clinic|hospital|medical/i.test(v))
    return { category: 'Medical Expenses', type: 'expense' };
  if (/hotel|flight|travel|uber|taxi/i.test(v))
    return { category: 'Travel', type: 'expense' };
  if (/electric|water|internet|mtn|airtel|utility/i.test(v))
    return { category: 'Utilities', type: 'expense' };
  if (/refund|return|cashback/i.test(v))
    return { category: 'Miscellaneous Income', type: 'income' };

  return { category: 'Miscellaneous Expense', type: 'expense' };
}

function calculateConfidence(result: Partial<OCRResult>): number {
  let score = 0;
  if (result.vendor && result.vendor !== 'Unknown Vendor') score += 20;
  if (result.amount && result.amount > 0) score += 25;
  if (result.date) score += 15;
  if (result.items && result.items.length > 0) score += 15;
  if (result.items && result.items.length >= 2) score += 5;
  if (result.paymentMethod && result.paymentMethod !== 'Unknown') score += 5;
  if (result.category && result.category !== 'Miscellaneous Expense') score += 10;
  if (result.receiptNumber) score += 5;
  // Penalty if tax > total (bad parse)
  if (result.taxAmount && result.amount && result.taxAmount >= result.amount) score -= 20;
  return Math.max(0, Math.min(score, 100));
}

// ─────────────────────────────────────────
// Main
// ─────────────────────────────────────────

export const performReceiptOCR = async (imageElement: HTMLImageElement): Promise<OCRResult> => {
  console.log('[receiptOCR] Starting AI receipt processing…');

  const rawText = await extractTextFromImage(imageElement);
  console.log('[receiptOCR] Raw text:\n', rawText);

  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  const vendor = extractVendor(lines);
  const items = extractItems(rawText);
  const itemSum = items.reduce((s, it) => s + it.price * (it.quantity || 1), 0);

  let amount = extractTotal(rawText, itemSum);
  let subtotal = extractSubtotal(rawText, amount);
  let taxAmount = extractTax(rawText, amount, subtotal);

  // Sanity: if tax is absurd, zero it and align subtotal
  if (amount > 0 && taxAmount >= amount) {
    taxAmount = 0;
    subtotal = amount;
  }
  if (subtotal > amount && amount > 0) {
    subtotal = amount - taxAmount;
  }
  // If total still looks wrong vs items, prefer item sum
  if (itemSum > 0 && amount > 0 && amount < itemSum * 0.4) {
    amount = Math.round(itemSum * 100) / 100;
    subtotal = amount - taxAmount;
  }
  if (amount <= 0 && itemSum > 0) {
    amount = Math.round(itemSum * 100) / 100;
    subtotal = amount;
    taxAmount = 0;
  }

  const date = extractDate(rawText);
  const receiptNumber = extractReceiptNumber(rawText);
  const paymentMethod = extractPaymentMethod(rawText);
  const currency = detectCurrency(rawText);

  const { category, type: transactionType } = aiCategorise(vendor, rawText);
  const description =
    items.length > 0
      ? `${vendor} — ${items.length} item${items.length > 1 ? 's' : ''}`
      : `${vendor} purchase`;

  const partial: Partial<OCRResult> = {
    vendor,
    amount,
    date,
    items,
    paymentMethod,
    category,
    receiptNumber,
    taxAmount,
  };
  const confidence = calculateConfidence(partial);

  const result: OCRResult = {
    vendor,
    amount,
    currency,
    date,
    category,
    description,
    items,
    subtotal: Math.max(0, subtotal),
    taxAmount: Math.max(0, taxAmount),
    receiptNumber,
    paymentMethod,
    confidence,
    transactionType,
    suggestedAccount: category,
    rawText,
  };

  console.log('[receiptOCR] AI result:', result);
  return result;
};
