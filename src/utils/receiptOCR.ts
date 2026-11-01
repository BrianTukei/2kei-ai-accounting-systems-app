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

  if (text.includes('$')) return 'USD';
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (symbol === '$') continue;
    if (text.includes(symbol)) return code;
  }

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
  // Strong line-based match first (handles "TOTAL:        $3" and OCR noise T0TAL)
  const lineTotal = text.match(/(?:^|\n)\s*(?:grand\s*)?t[o0]tal\s*[:.\-]?\s*[$€£₹₦₵]?\s*([0-9]+(?:[.,][0-9]{1,2})?)\s*(?:$|\n)/i);
  if (lineTotal) {
    const v = parseMoney(lineTotal[1]);
    if (v > 0) return v;
  }
  // Same-line TOTAL anywhere
  const anyTotal = text.match(/\bt[o0]tal\b\s*[:.\-]?\s*[$€£₹₦₵]\s*([0-9]+(?:[.,][0-9]{1,2})?)/i);
  if (anyTotal) {
    const v = parseMoney(anyTotal[1]);
    if (v > 0 && v < 100000) return v;
  }

  const patterns = [
    /(?:grand\s*)?total\s*(?:due|amt|amount|payable)?\s*[:.\-]?\s*[$€£₹₦₵]?\s*([0-9][0-9\s.,]*)/i,
    /(?:amount\s*(?:due|paid|tendered|payable))\s*[:.\-]?\s*[$€£₹₦₵]?\s*([0-9][0-9\s.,]*)/i,
    /(?:balance\s*due)\s*[:.\-]?\s*[$€£₹₦₵]?\s*([0-9][0-9\s.,]*)/i,
    /(?:net\s*(?:total|amount))\s*[:.\-]?\s*[$€£₹₦₵]?\s*([0-9][0-9\s.,]*)/i,
    /\btotal\b\s*[:.\-]?\s*[$€£₹₦₵]\s*([0-9][0-9\s.,]*)/i,
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
    // Prefer the *smallest* labeled total under 1e6 when values diverge wildly
    // (OCR often also matches huge IDs on other lines)
    const reasonable = candidates.filter((c) => c < 100000);
    const pool = reasonable.length ? reasonable : candidates;
    const labeled = Math.min(...pool);
    if (itemSum > 0 && labeled < itemSum * 0.5 && itemSum < labeled * 20 && itemSum < 100000) {
      return Math.round(itemSum * 100) / 100;
    }
    return labeled;
  }

  if (itemSum > 0 && itemSum < 100000) return Math.round(itemSum * 100) / 100;

  const all = findAllAmounts(text).filter((n) => n < 100000);
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

function extractItems(text: string, labeledTotal: number): Array<{ name: string; price: number; quantity?: number }> {
  const lines = text.split('\n');
  const items: Array<{ name: string; price: number; quantity?: number }> = [];

  // NOTE: do NOT skip SUBTOTAL/TAX/TOTAL here — main() recovers amount from those rows
  const skipLine =
    /^(EVERYDAY|SPRINGFIELD|MAIN\s+STREET|HELLO@|CASHIER|STORE|ID:|REGISTER|RECEIPT|CARD:|TYPE:|ENTRY:|TIME:|TEL|PHONE|\(\d{3}\)|LANE|VISA|MASTERCARD|CONTACTLESS)\b/i;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.length < 3) continue;
    if (skipLine.test(line)) continue;
    if (/@/.test(line)) continue;
    // City, ST ZIP
    if (/\b[A-Z]{2}\s+\d{5}\b/.test(line)) continue;
    if (/\b\d{5}\b/.test(line) && /[A-Za-z]/.test(line) && line.length < 40 && /street|ave|rd|il|ny|ca|tx|road|blvd/i.test(line) === false) {
      // still allow product lines; only skip pure location-like
    }
    if (/^\d{5}(-\d{4})?$/.test(line)) continue;

    // Must look like: product text + price at end (prefer $X or X.XX)
    const priceMatch = line.match(
      /^(.+?)\s+([$€£₹₦₵])\s*(\d+(?:[.,]\d{1,2})?)\s*$/i
    ) || line.match(
      /^(.+?)\s+(\d+[.,]\d{2})\s*$/
    );
    if (!priceMatch) continue;

    let name = (priceMatch[1] || '').replace(/[\.\-_]{3,}/g, '').trim();
    const priceRaw = priceMatch[3] || priceMatch[2];
    const price = parseMoney(priceRaw);

    if (!name || name.length < 2 || price <= 0) continue;
    if (/^(visa|cash|change|balance|card|type|entry)\b/i.test(name)) continue;
    if (/^[\d\s:.\-/@#]+$/.test(name)) continue;
    if (/^\d{1,2}:\d{2}/.test(name)) continue;
    if (/^(#|no\.?|number)\b/i.test(name)) continue;

    // Hard filters vs labeled total
    if (labeledTotal > 0) {
      if (price > labeledTotal * 2.5 && price > 20) continue;
      if (labeledTotal <= 50 && price >= 100) continue;
    } else {
      // No total yet — reject ID-sized numbers
      if (price >= 1000) continue;
    }

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

  const seen = new Set<string>();
  return items.filter((it) => {
    const key = `${it.name.toLowerCase()}|${it.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}



function aiCategorise(vendor: string, fullText: string): { category: string; type: 'income' | 'expense' } {
  const v = `${vendor} ${fullText}`.toLowerCase();

  // Ordered rules: first match wins. Specific before generic.
  const rules: Array<{ test: RegExp; category: string; type: 'income' | 'expense' }> = [
    // Education
    { test: /school|tuition|university|college|semester|academy|preparatory|campus|student\s+fee|grade\s+\d|education/, category: 'Education', type: 'expense' },
    // Medical
    { test: /pharmacy|hospital|clinic|doctor|dental|medical|lab\s+test|prescription|chemist/, category: 'Medical Expenses', type: 'expense' },
    // Groceries / retail
    { test: /grocery|supermarket|mart\b|walmart|shoprite|checkers|spar|nakumatt|carrefour|everyday|minimart|hypermarket/, category: 'Groceries', type: 'expense' },
    // Food service
    { test: /restaurant|cafe|coffee|pizza|burger|kfc|mcdonald|subway|starbucks|takeaway|takeout|diner|food\s+court/, category: 'Meals & Entertainment', type: 'expense' },
    // Fuel / transport
    { test: /petrol|fuel|diesel|gas\s+station|shell|total\s+energies|engen|caltex|uber|bolt|taxi|parking/, category: 'Transport Expense', type: 'expense' },
    // Utilities
    { test: /electric|electricity|water\s+bill|umeme|nwsc|internet|wifi|mtn|airtel|vodafone|utility|power\s+bill/, category: 'Utilities', type: 'expense' },
    // Rent
    { test: /\brent\b|lease|landlord|property\s+manage/, category: 'Rent & Lease', type: 'expense' },
    // Insurance
    { test: /insurance|premium|assurance|policy\s+no/, category: 'Insurance', type: 'expense' },
    // Subscriptions / software
    { test: /subscription|netflix|spotify|adobe|microsoft\s+365|saas|software\s+license|github|aws/, category: 'Subscriptions', type: 'expense' },
    // Office
    { test: /office\s+supplies|stationery|staples|printer|ink\s+cartridge/, category: 'Office Supplies', type: 'expense' },
    // Travel
    { test: /hotel|airbnb|airline|flight|airport|booking\.com|travel\s+agency/, category: 'Travel', type: 'expense' },
    // Banking fees
    { test: /bank\s+charge|service\s+fee|withdrawal\s+fee|monthly\s+fee|atm\s+fee/, category: 'Bank Charges', type: 'expense' },
    // Income — only when clearly received
    { test: /payment\s+received|client\s+pay|received\s+from|deposit\s+from\s+client|sales\s+receipt/, category: 'Client Payment', type: 'income' },
    { test: /salary|payroll|wage\s+payment|stipend/, category: 'Salary Income', type: 'income' },
    { test: /refund|cashback|rebate/, category: 'Miscellaneous Income', type: 'income' },
  ];

  for (const rule of rules) {
    if (rule.test.test(v)) {
      return { category: rule.category, type: rule.type };
    }
  }

  // Fallback: shared bank-import categoriser (strip noise that causes false Client Payment)
  const cleaned = fullText
    .replace(/\b(vat|tax|gst|hst)\b/gi, ' ')
    .replace(/\binvoice\s*(no|number|#)?\b/gi, ' ');
  const fromText = categoriseTransaction(cleaned, 1, 0);
  if (
    fromText.category &&
    !['Miscellaneous Expense', 'Uncategorised', 'Tax Payment', 'Client Payment'].includes(fromText.category)
  ) {
    return fromText;
  }

  const fromVendor = categoriseTransaction(vendor, 1, 0);
  if (
    fromVendor.category &&
    !['Miscellaneous Expense', 'Uncategorised', 'Tax Payment', 'Client Payment'].includes(fromVendor.category)
  ) {
    return fromVendor;
  }

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

  // Pull ALL candidate line items first (including TOTAL/TAX lines OCR often emits as items)
  let roughItems = extractItems(rawText, 0);

  // If TOTAL/TAX/SUBTOTAL appear as "items", recover amount from them
  const findByName = (re: RegExp) =>
    roughItems.find((it) => re.test(it.name.replace(/[:\s]+$/g, '').trim()));

  const totalAsItem = findByName(/^t[o0]tal\b/i);
  const taxAsItem = findByName(/^tax\b/i);
  const subAsItem = findByName(/^sub\s*-?\s*total\b/i);

  let amount = extractTotal(rawText, 0);
  if (totalAsItem && totalAsItem.price > 0) {
    // Prefer explicit TOTAL / GRAND TOTAL line when present
    if (amount <= 0 || amount > totalAsItem.price * 5 || amount < totalAsItem.price * 0.2) {
      amount = totalAsItem.price;
    }
  }

  let taxAmount = extractTax(rawText, amount, amount);
  if (taxAsItem && taxAsItem.price >= 0 && taxAsItem.price < amount) {
    taxAmount = taxAsItem.price;
  }
  if (amount > 0 && taxAmount >= amount) taxAmount = 0;

  let subtotal = extractSubtotal(rawText, amount);
  if (subAsItem && subAsItem.price > 0 && subAsItem.price <= amount * 1.05) {
    subtotal = subAsItem.price;
  }
  if (subtotal <= 0 || subtotal > amount) {
    subtotal = Math.max(0, amount - taxAmount);
  }

  // Drop summary rows and nonsense prices (zip codes, receipt IDs)
  let items = roughItems.filter((it) => {
    const n = it.name.replace(/[:\s]+$/g, '').trim();
    if (/^(t[o0]tal|sub\s*-?\s*total|tax|vat|gst)\b/i.test(n)) return false;
    if (/springfield|main street|register|cashier|lane|receipt/i.test(n)) return false;
    if (/^[#\d\s.:-]+$/.test(n)) return false;
    if (amount > 0 && it.price > amount * 2.5 && it.price > 10) return false;
    if (amount > 0 && amount <= 100 && it.price >= 500) return false;
    if (it.price >= 1000 && amount > 0 && amount < 500) return false;
    return true;
  });

  let itemSum = items.reduce((s, it) => s + it.price * (it.quantity || 1), 0);

  // Only fall back to item sum when no TOTAL was found at all
  if (amount <= 0 && itemSum > 0 && itemSum < 100000) {
    amount = Math.round(itemSum * 100) / 100;
    subtotal = amount;
    taxAmount = 0;
  }

  // Final clamp: trust labeled TOTAL row; drop item prices far above it
  if (totalAsItem && totalAsItem.price > 0) {
    amount = totalAsItem.price;
    if (taxAmount >= amount) taxAmount = 0;
    subtotal = Math.max(0, Math.min(subtotal || amount, amount - taxAmount));
    items = items.filter((it) => it.price <= amount * 1.05 + 0.01);
  }

  // Also match "GRAND TOTAL PAID: $8,945.00" style from billing receipts
  if (amount <= 0 || amount > 1e9) {
    const grand = rawText.match(/grand\s*total(?:\s*paid)?\s*[:.\-]?\s*[$€£₹₦₵]?\s*([0-9][0-9\s.,]*)/i);
    if (grand) {
      const v = parseMoney(grand[1]);
      if (v > 0) {
        amount = v;
        subtotal = amount;
        taxAmount = 0;
        items = items.filter((it) => it.price <= amount * 1.05 + 0.01);
      }
    }
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
