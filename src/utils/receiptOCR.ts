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
  suggestedAccount: string;          // chart-of-accounts category name
  rawText: string;                   // original OCR text for debugging
}

// ─────────────────────────────────────────
// Currency detection
// ─────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₹': 'INR',
  '₩': 'KRW', 'R$': 'BRL', '₺': 'TRY', '₪': 'ILS', '₵': 'GHS',
  '₦': 'NGN', '₱': 'PHP', '₫': 'VND', '฿': 'THB', '₽': 'RUB',
  '₲': 'PYG', '৳': 'BDT', '₨': 'PKR', '₭': 'LAK', '៛': 'KHR',
  'KSh': 'KES', 'USh': 'UGX', 'TSh': 'TZS', 'Rp': 'IDR', 'RM': 'MYR',
  'R': 'ZAR', 'S/': 'PEN', 'kr': 'NOK', 'zł': 'PLN', 'Kč': 'CZK',
};

function detectCurrency(text: string): string {
  // Look for explicit currency codes first
  const codeMatch = text.match(/\b(USD|EUR|GBP|ZAR|KES|UGX|NGN|GHS|INR|CAD|AUD|JPY|CNY|BRL|MXN|CHF|SGD|HKD|TWD|KRW|THB|VND|IDR|MYR|PHP|TRY|PLN|CZK|SEK|NOK|DKK)\b/i);
  if (codeMatch) return codeMatch[1].toUpperCase();

  // Check for symbol occurrences
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (text.includes(symbol)) return code;
  }
  return 'USD';
}

// ─────────────────────────────────────────
// Image preprocessing for better OCR
// ─────────────────────────────────────────

/**
 * Pre-process the image for better OCR accuracy:
 *  - Convert to grayscale
 *  - Increase contrast
 *  - Apply simple threshold
 */
const MAX_OCR_DIMENSION = 1600; // px — keeps memory usage reasonable

const preprocessImage = (imageElement: HTMLImageElement): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageElement.src;

  // Resize large images to avoid memory crashes on mobile
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

  // Grayscale + contrast boost
  for (let i = 0; i < data.length; i += 4) {
    let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    // Increase contrast
    gray = ((gray - 128) * 1.5) + 128;
    gray = Math.max(0, Math.min(255, gray));
    // Simple threshold to clean up
    gray = gray > 140 ? 255 : gray < 80 ? 0 : gray;
    data[i] = data[i + 1] = data[i + 2] = gray;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
};

// ─────────────────────────────────────────
// Tesseract OCR text extraction
// ─────────────────────────────────────────

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
// AI-powered receipt text analysis
// ─────────────────────────────────────────

/** Extract the vendor / store name — usually the first prominent line */
function extractVendor(lines: string[]): string {
  // Skip very short noise lines at the top
  for (const line of lines.slice(0, 5)) {
    const clean = line.replace(/[^a-zA-Z0-9\s&'.,-]/g, '').trim();
    if (clean.length >= 3 && !/^(date|time|receipt|order|tel|phone|fax|store|branch)/i.test(clean)) {
      return clean;
    }
  }
  return 'Unknown Vendor';
}

/** Extract the total amount — tries many common receipt patterns */
function extractTotal(text: string): number {
  const patterns = [
    /(?:grand\s*)?total\s*(?:due|amt|amount)?[:\s]*[\$£€₹₦₵]?\s*([0-9,]+\.?\d{0,2})/i,
    /(?:amount\s*(?:due|paid|tendered))[:\s]*[\$£€₹₦₵]?\s*([0-9,]+\.?\d{0,2})/i,
    /(?:balance\s*due)[:\s]*[\$£€₹₦₵]?\s*([0-9,]+\.?\d{0,2})/i,
    /(?:net\s*(?:total|amount))[:\s]*[\$£€₹₦₵]?\s*([0-9,]+\.?\d{0,2})/i,
    /total[:\s]*[\$£€₹₦₵]?\s*([0-9,]+\.?\d{0,2})/i,
  ];
  for (const rx of patterns) {
    const m = text.match(rx);
    if (m) {
      const v = parseFloat(m[1].replace(/,/g, ''));
      if (v > 0) return v;
    }
  }
  // Fallback: pick the largest dollar amount in the text
  const allAmounts = [...text.matchAll(/[\$£€₹₦₵]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2}))/g)]
    .map(m => parseFloat(m[1].replace(/,/g, '')))
    .filter(n => n > 0);
  return allAmounts.length > 0 ? Math.max(...allAmounts) : 0;
}

/** Extract subtotal */
function extractSubtotal(text: string, total: number): number {
  const m = text.match(/sub\s*-?\s*total[:\s]*[\$£€₹₦₵]?\s*([0-9,]+\.?\d{0,2})/i);
  if (m) return parseFloat(m[1].replace(/,/g, ''));
  return total > 0 ? Math.round(total * 0.9 * 100) / 100 : 0;
}

/** Extract tax amount */
function extractTax(text: string, total: number, subtotal: number): number {
  const patterns = [
    /(?:tax|vat|gst|hst)[:\s]*[\$£€₹₦₵]?\s*([0-9,]+\.?\d{0,2})/i,
    /(?:sales\s*tax)[:\s]*[\$£€₹₦₵]?\s*([0-9,]+\.?\d{0,2})/i,
  ];
  for (const rx of patterns) {
    const m = text.match(rx);
    if (m) return parseFloat(m[1].replace(/,/g, ''));
  }
  return Math.round((total - subtotal) * 100) / 100;
}

/** Extract date from receipt — handles many date formats */
function extractDate(text: string): string {
  const patterns = [
    // MM/DD/YYYY or DD/MM/YYYY
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
    // Month DD, YYYY
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})/i,
    // DD Month YYYY
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/i,
    // YYYY-MM-DD
    /(\d{4}-\d{2}-\d{2})/,
    // Explicit "Date:" label
    /date[:\s]+(\S+[\s\/\-\.]\S+(?:[\s\/\-\.]\S+)?)/i,
  ];
  for (const rx of patterns) {
    const m = text.match(rx);
    if (m) return m[1].trim();
  }
  return new Date().toLocaleDateString();
}

/** Extract receipt / order number */
function extractReceiptNumber(text: string): string {
  const patterns = [
    /(?:receipt|invoice|order|trans(?:action)?|ref(?:erence)?|check|ticket)\s*(?:#|no\.?|number)?\s*[:\s]*([A-Za-z0-9\-]+)/i,
    /#\s*([A-Za-z0-9\-]{4,})/,
  ];
  for (const rx of patterns) {
    const m = text.match(rx);
    if (m) return m[1];
  }
  return `R${Date.now()}`;
}

/** Extract payment method */
function extractPaymentMethod(text: string): string {
  const t = text.toLowerCase();
  if (/visa/i.test(t))                             return 'Visa';
  if (/master\s*card/i.test(t))                    return 'Mastercard';
  if (/amex|american\s*express/i.test(t))          return 'Amex';
  if (/debit/i.test(t))                            return 'Debit Card';
  if (/\*{3,4}\s?\d{4}/.test(t))                   return 'Credit Card';
  if (/cash/i.test(t))                             return 'Cash';
  if (/mpesa|m-pesa|mobile\s*money/i.test(t))      return 'Mobile Money';
  if (/paypal/i.test(t))                           return 'PayPal';
  if (/apple\s*pay/i.test(t))                      return 'Apple Pay';
  if (/google\s*pay/i.test(t))                     return 'Google Pay';
  if (/eft|transfer/i.test(t))                     return 'Bank Transfer';
  if (/check|cheque/i.test(t))                     return 'Cheque';
  return 'Unknown';
}

/** Extract line items (things purchased) */
function extractItems(text: string): Array<{ name: string; price: number; quantity?: number }> {
  const lines = text.split('\n');
  const items: Array<{ name: string; price: number; quantity?: number }> = [];
  const skipWords = /^(total|sub\s*total|tax|vat|gst|hst|change|balance|cash|visa|master|amex|debit|credit|tender|payment|discount|tip|gratuity|receipt|order|date|time|tel|phone|cashier|thank|store|branch|service|charge)/i;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.length < 4) continue;

    // Pattern: "Item name    $12.34" or "Item name 12.34"
    const priceMatch = line.match(/^(.+?)\s{2,}[\$£€₹₦₵]?\s*(\d+\.?\d{0,2})\s*$/);
    // Alt pattern: trailing number after descriptive text
    const altMatch = !priceMatch ? line.match(/^(.+?)\s+[\$£€₹₦₵]?\s*(\d+\.?\d{0,2})\s*$/) : null;
    const m = priceMatch || altMatch;
    if (!m) continue;

    const name = m[1].replace(/[\.\-_]{3,}/g, '').trim();
    const price = parseFloat(m[2]);
    if (!name || name.length < 2 || price <= 0 || price > 50000) continue;
    if (skipWords.test(name)) continue;

    // Quantity check: "2 x Item" or "2x Item" or "Item x2"
    const qtyBefore = name.match(/^(\d+)\s*x\s+(.+)/i);
    const qtyAfter  = name.match(/(.+?)\s*x\s*(\d+)$/i);
    if (qtyBefore) {
      items.push({ name: qtyBefore[2].trim(), price, quantity: parseInt(qtyBefore[1]) });
    } else if (qtyAfter) {
      items.push({ name: qtyAfter[1].trim(), price, quantity: parseInt(qtyAfter[2]) });
    } else {
      items.push({ name, price, quantity: 1 });
    }
  }
  return items;
}

// ─────────────────────────────────────────
// AI categorisation (uses the same engine as bank import)
// ─────────────────────────────────────────

/**
 * Use the app's rule-based AI (`categoriseTransaction` from invoiceAI.ts)
 * to decide the bookkeeping category and transaction type.
 * Falls back to smart vendor-keyword matching when the full text
 * does not trigger any rule.
 */
function aiCategorise(vendor: string, fullText: string): { category: string; type: 'income' | 'expense' } {
  // 1. Try categorising the full OCR text (has the most keywords)
  const fromText = categoriseTransaction(fullText, 1, 0);
  if (fromText.category !== 'Miscellaneous Expense' && fromText.category !== 'Uncategorised') {
    return fromText;
  }

  // 2. Try categorising by vendor name alone
  const fromVendor = categoriseTransaction(vendor, 1, 0);
  if (fromVendor.category !== 'Miscellaneous Expense' && fromVendor.category !== 'Uncategorised') {
    return fromVendor;
  }

  // 3. Fallback: smart keyword mapping for common receipt types
  const v = (vendor + ' ' + fullText).toLowerCase();
  if (/grocery|supermarket|walmart|target|costco|kroger|aldi|lidl|woolworths|pick.n.pay|shoprite|checkers|spar/i.test(v))
    return { category: 'Groceries', type: 'expense' };
  if (/restaurant|cafe|coffee|diner|pizza|burger|kfc|mcdonald|subway|starbucks|takeout|takeaway|food\s*court/i.test(v))
    return { category: 'Meals & Entertainment', type: 'expense' };
  if (/gas|fuel|petrol|shell|bp|chevron|texaco|caltex|exxon|engen/i.test(v))
    return { category: 'Transport Expense', type: 'expense' };
  if (/pharmacy|drug|cvs|walgreens|clicks|dis-?chem|hospital|clinic|doctor|medical|health/i.test(v))
    return { category: 'Medical Expenses', type: 'expense' };
  if (/office|depot|staples|stationery|paper/i.test(v))
    return { category: 'Office Supplies', type: 'expense' };
  if (/hotel|airbnb|flight|airline|airport|booking|travel|hertz|avis|car\s*rental/i.test(v))
    return { category: 'Travel', type: 'expense' };
  if (/hardware|home\s*depot|lowes|builder|build/i.test(v))
    return { category: 'Supplier Payment', type: 'expense' };
  if (/subscription|netflix|spotify|adobe|microsoft|google|saas|software/i.test(v))
    return { category: 'Subscriptions', type: 'expense' };
  if (/electric|water|internet|wifi|telecom|mtn|vodacom|airtel|telkom|utility/i.test(v))
    return { category: 'Utilities', type: 'expense' };
  if (/insurance|premium|assurance/i.test(v))
    return { category: 'Insurance', type: 'expense' };
  if (/rent|lease|landlord/i.test(v))
    return { category: 'Rent & Lease', type: 'expense' };

  // If nothing matched, look for income signals
  if (/refund|return|credit|cashback/i.test(v))
    return { category: 'Miscellaneous Income', type: 'income' };

  return { category: 'Miscellaneous Expense', type: 'expense' };
}

// ─────────────────────────────────────────
// Confidence scorer
// ─────────────────────────────────────────

function calculateConfidence(result: Partial<OCRResult>): number {
  let score = 0;
  if (result.vendor && result.vendor !== 'Unknown Vendor') score += 20;
  if (result.amount && result.amount > 0) score += 25;
  if (result.date && result.date !== new Date().toLocaleDateString()) score += 15;
  if (result.items && result.items.length > 0) score += 15;
  if (result.items && result.items.length >= 3) score += 5;
  if (result.paymentMethod && result.paymentMethod !== 'Unknown') score += 5;
  if (result.category && result.category !== 'Miscellaneous Expense') score += 10;
  if (result.receiptNumber && !result.receiptNumber.startsWith('R1')) score += 5;
  return Math.min(score, 100);
}

// ─────────────────────────────────────────
// Main orchestrator — Tesseract OCR ➜ AI parse
// ─────────────────────────────────────────

/**
 * Full pipeline:
 * 1. Extract raw text from image via Tesseract.js
 * 2. Intelligent field extraction (vendor, total, date, items …)
 * 3. AI categorisation aligned with the bookkeeping chart of accounts
 * 4. Confidence scoring
 */
export const performReceiptOCR = async (imageElement: HTMLImageElement): Promise<OCRResult> => {
  console.log('[receiptOCR] Starting AI receipt processing…');

  // Step 1 — OCR
  const rawText = await extractTextFromImage(imageElement);
  console.log('[receiptOCR] Raw text:\n', rawText);

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // Step 2 — Field extraction
  const vendor       = extractVendor(lines);
  const amount       = extractTotal(rawText);
  const subtotal     = extractSubtotal(rawText, amount);
  const taxAmount    = extractTax(rawText, amount, subtotal);
  const date         = extractDate(rawText);
  const receiptNumber = extractReceiptNumber(rawText);
  const paymentMethod = extractPaymentMethod(rawText);
  const items        = extractItems(rawText);
  const currency     = detectCurrency(rawText);

  // Step 3 — AI categorisation
  const { category, type: transactionType } = aiCategorise(vendor, rawText);
  const description = items.length > 0
    ? `${vendor} — ${items.length} item${items.length > 1 ? 's' : ''}`
    : `${vendor} purchase`;

  // Step 4 — Confidence
  const partial: Partial<OCRResult> = { vendor, amount, date, items, paymentMethod, category, receiptNumber };
  const confidence = calculateConfidence(partial);

  const result: OCRResult = {
    vendor,
    amount,
    currency,
    date,
    category,
    description,
    items,
    subtotal,
    taxAmount,
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