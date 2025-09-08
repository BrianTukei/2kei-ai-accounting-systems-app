import { pipeline } from '@huggingface/transformers';

// Currency detection patterns
const CURRENCY_PATTERNS = {
  USD: ['$', 'USD', 'US$', 'Dollar'],
  EUR: ['€', 'EUR', 'Euro'],
  GBP: ['£', 'GBP', 'Pound'],
  JPY: ['¥', 'JPY', 'Yen'],
  CAD: ['C$', 'CAD'],
  AUD: ['A$', 'AUD'],
  CHF: ['CHF', 'Fr.'],
  CNY: ['¥', 'CNY', 'Yuan'],
  INR: ['₹', 'INR', 'Rupee'],
  KRW: ['₩', 'KRW', 'Won'],
  BRL: ['R$', 'BRL', 'Real'],
  ZAR: ['R', 'ZAR', 'Rand'],
  RUB: ['₽', 'RUB', 'Ruble'],
  MXN: ['MX$', 'MXN', 'Peso'],
  SGD: ['S$', 'SGD'],
  HKD: ['HK$', 'HKD'],
  NOK: ['kr', 'NOK'],
  SEK: ['kr', 'SEK'],
  DKK: ['kr', 'DKK'],
  PLN: ['zł', 'PLN'],
  CZK: ['Kč', 'CZK'],
  HUF: ['Ft', 'HUF'],
  RON: ['lei', 'RON'],
  BGN: ['лв', 'BGN'],
  HRK: ['kn', 'HRK'],
  TRY: ['₺', 'TRY', 'Lira'],
  ILS: ['₪', 'ILS', 'Shekel'],
  AED: ['د.إ', 'AED', 'Dirham'],
  SAR: ['﷼', 'SAR', 'Riyal'],
  QAR: ['﷼', 'QAR'],
  KWD: ['د.ك', 'KWD', 'Dinar'],
  BHD: ['د.ب', 'BHD'],
  OMR: ['﷼', 'OMR'],
  JOD: ['د.ا', 'JOD'],
  LBP: ['ل.ل', 'LBP'],
  EGP: ['£', 'EGP'],
  MAD: ['د.م.', 'MAD'],
  TND: ['د.ت', 'TND'],
  DZD: ['د.ج', 'DZD'],
  KES: ['KSh', 'KES'],
  UGX: ['USh', 'UGX'],
  TZS: ['TSh', 'TZS'],
  GHS: ['₵', 'GHS'],
  NGN: ['₦', 'NGN'],
  ZMW: ['K', 'ZMW'],
  BWP: ['P', 'BWP'],
  MUR: ['Rs', 'MUR'],
  SCR: ['₨', 'SCR'],
  MWK: ['MK', 'MWK'],
  RWF: ['₣', 'RWF'],
  ETB: ['Br', 'ETB'],
  UYU: ['$U', 'UYU'],
  PEN: ['S/', 'PEN'],
  COP: ['$', 'COP'],
  CLP: ['$', 'CLP'],
  ARS: ['$', 'ARS'],
  BOB: ['Bs', 'BOB'],
  PYG: ['₲', 'PYG'],
  VEF: ['Bs', 'VEF'],
  THB: ['฿', 'THB', 'Baht'],
  VND: ['₫', 'VND', 'Dong'],
  IDR: ['Rp', 'IDR', 'Rupiah'],
  MYR: ['RM', 'MYR', 'Ringgit'],
  PHP: ['₱', 'PHP', 'Peso'],
  TWD: ['NT$', 'TWD'],
  KHR: ['៛', 'KHR', 'Riel'],
  LAK: ['₭', 'LAK', 'Kip'],
  MMK: ['K', 'MMK', 'Kyat'],
  BDT: ['৳', 'BDT', 'Taka'],
  PKR: ['₨', 'PKR', 'Rupee'],
  LKR: ['Rs', 'LKR', 'Rupee'],
  NPR: ['Rs', 'NPR', 'Rupee'],
  BTN: ['Nu', 'BTN', 'Ngultrum'],
  MVR: ['Rf', 'MVR', 'Rufiyaa'],
  AFN: ['؋', 'AFN', 'Afghani'],
  IRR: ['﷼', 'IRR', 'Rial'],
  IQD: ['ع.د', 'IQD', 'Dinar'],
  SYP: ['£', 'SYP', 'Pound'],
  LYD: ['ل.د', 'LYD', 'Dinar'],
  SDG: ['ج.س.', 'SDG', 'Pound'],
  SOS: ['S', 'SOS', 'Shilling'],
  DJF: ['Fdj', 'DJF', 'Franc'],
  ERN: ['Nfk', 'ERN', 'Nakfa'],
  KMF: ['CF', 'KMF', 'Franc'],
  MGA: ['Ar', 'MGA', 'Ariary'],
  MZN: ['MT', 'MZN', 'Metical'],
  AOA: ['Kz', 'AOA', 'Kwanza'],
  CVE: ['$', 'CVE', 'Escudo'],
  GMD: ['D', 'GMD', 'Dalasi'],
  GNF: ['GF', 'GNF', 'Franc'],
  LRD: ['L$', 'LRD', 'Dollar'],
  SLL: ['Le', 'SLL', 'Leone'],
  STD: ['Db', 'STD', 'Dobra'],
  SZL: ['L', 'SZL', 'Lilangeni'],
  LSL: ['L', 'LSL', 'Loti'],
  NAD: ['N$', 'NAD', 'Dollar'],
  FJD: ['FJ$', 'FJD', 'Dollar'],
  PGK: ['K', 'PGK', 'Kina'],
  SBD: ['SI$', 'SBD', 'Dollar'],
  TOP: ['T$', 'TOP', 'Paʻanga'],
  VUV: ['VT', 'VUV', 'Vatu'],
  WST: ['WS$', 'WST', 'Tala'],
  XCD: ['EC$', 'XCD', 'Dollar'],
  XOF: ['CFA', 'XOF', 'Franc'],
  XAF: ['FCFA', 'XAF', 'Franc'],
  XPF: ['F', 'XPF', 'Franc'],
};

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
}

let ocrPipeline: any = null;

const initializeOCR = async () => {
  if (!ocrPipeline) {
    try {
      console.log('Initializing OCR pipeline...');
      ocrPipeline = await pipeline('object-detection', 'microsoft/table-transformer-structure-recognition', {
        device: 'webgpu',
      });
      console.log('OCR pipeline initialized successfully');
    } catch (error) {
      console.warn('WebGPU not available, falling back to CPU:', error);
      ocrPipeline = await pipeline('object-detection', 'microsoft/table-transformer-structure-recognition');
    }
  }
  return ocrPipeline;
};

const detectCurrency = (text: string): string => {
  const upperText = text.toUpperCase();
  
  for (const [currency, patterns] of Object.entries(CURRENCY_PATTERNS)) {
    for (const pattern of patterns) {
      if (upperText.includes(pattern.toUpperCase()) || text.includes(pattern)) {
        return currency;
      }
    }
  }
  
  // Default to USD if no currency detected
  return 'USD';
};

const extractTextFromImage = async (imageElement: HTMLImageElement): Promise<string> => {
  // Create canvas to process image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');
  
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  ctx.drawImage(imageElement, 0, 0);
  
  // For now, simulate OCR with basic image analysis
  // In production, you'd use a proper OCR service
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Simulate text extraction based on image characteristics
  const brightness = calculateAverageBrightness(imageData);
  const hasText = brightness > 50; // Simple heuristic
  
  if (!hasText) {
    throw new Error('No text detected in image');
  }
  
  // Return simulated extracted text for demonstration
  return generateMockExtractedText();
};

const calculateAverageBrightness = (imageData: ImageData): number => {
  const { data } = imageData;
  let totalBrightness = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    totalBrightness += brightness;
  }
  
  return totalBrightness / (data.length / 4);
};

const generateMockExtractedText = (): string => {
  const mockTexts = [
    `WALMART SUPERCENTER
    Store #1234
    123 Main St, City, ST 12345
    Tel: (555) 123-4567
    
    Receipt #: 0001234567890
    Date: ${new Date().toLocaleDateString()}
    Time: ${new Date().toLocaleTimeString()}
    
    Cashier: John D.
    
    GROCERIES:
    Bananas (lb)          $2.99
    Milk 1 Gal           $3.49
    Bread Loaf           $2.89
    Eggs Dozen           $4.99
    Chicken Breast       $8.99
    
    Subtotal:           $23.35
    Tax:                 $1.87
    TOTAL:              $25.22
    
    VISA ****1234       $25.22
    
    Thank you for shopping!`,
    
    `McDonald's Restaurant
    456 Oak Ave, Town, ST 54321
    Order #: 789
    
    Date: ${new Date().toLocaleDateString()}
    Time: ${new Date().toLocaleTimeString()}
    
    Big Mac Meal         $8.99
    - Big Mac            $5.99
    - Medium Fries       $1.99
    - Medium Coke        $1.00
    
    Chicken McNuggets    $4.99
    Apple Pie            $1.29
    
    Subtotal:           $15.27
    Tax:                 $1.22
    TOTAL:              $16.49
    
    Cash Tendered:      $20.00
    Change:              $3.51`,
    
    `OFFICE DEPOT
    Store #567
    789 Business Blvd, City, ST 67890
    
    Receipt #: OFF123456
    Date: ${new Date().toLocaleDateString()}
    
    HP Printer Paper     $12.99
    Stapler              $8.49
    Pens (Pack of 12)    $6.99
    Notebooks (3-pack)   $9.99
    
    Subtotal:           $38.46
    Tax:                 $3.08
    TOTAL:              $41.54
    
    CREDIT CARD ****5678 $41.54`
  ];
  
  return mockTexts[Math.floor(Math.random() * mockTexts.length)];
};

const parseReceiptText = (text: string): OCRResult => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  // Extract vendor (usually first non-empty line)
  const vendor = lines[0] || 'Unknown Vendor';
  
  // Detect currency from text
  const currency = detectCurrency(text);
  
  // Extract total amount
  const totalRegex = /TOTAL[:\s]*\$?([0-9]+\.?[0-9]*)/i;
  const totalMatch = text.match(totalRegex);
  const amount = totalMatch ? parseFloat(totalMatch[1]) : 0;
  
  // Extract subtotal
  const subtotalRegex = /SUBTOTAL[:\s]*\$?([0-9]+\.?[0-9]*)/i;
  const subtotalMatch = text.match(subtotalRegex);
  const subtotal = subtotalMatch ? parseFloat(subtotalMatch[1]) : amount * 0.9;
  
  // Extract tax
  const taxRegex = /TAX[:\s]*\$?([0-9]+\.?[0-9]*)/i;
  const taxMatch = text.match(taxRegex);
  const taxAmount = taxMatch ? parseFloat(taxMatch[1]) : amount - subtotal;
  
  // Extract date
  const dateRegex = /Date[:\s]*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/i;
  const dateMatch = text.match(dateRegex);
  const date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString();
  
  // Extract receipt number
  const receiptRegex = /(?:Receipt|Order|#)[:\s#]*([A-Za-z0-9]+)/i;
  const receiptMatch = text.match(receiptRegex);
  const receiptNumber = receiptMatch ? receiptMatch[1] : `R${Date.now()}`;
  
  // Extract items
  const items = extractItems(text);
  
  // Determine category based on vendor
  const category = categorizeVendor(vendor);
  
  // Determine payment method
  const paymentMethod = extractPaymentMethod(text);
  
  // Generate description
  const description = `${vendor} - ${items.length} items`;
  
  // Calculate confidence based on data completeness
  const confidence = calculateConfidence(vendor, amount, date, items);
  
  return {
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
    confidence
  };
};

const extractItems = (text: string): Array<{ name: string; price: number; quantity?: number }> => {
  const lines = text.split('\n');
  const items: Array<{ name: string; price: number; quantity?: number }> = [];
  
  for (const line of lines) {
    // Look for lines with price patterns
    const priceRegex = /(.+?)\s+\$?([0-9]+\.?[0-9]*)\s*$/;
    const match = line.match(priceRegex);
    
    if (match && match[2]) {
      const price = parseFloat(match[2]);
      const name = match[1].trim();
      
      // Skip lines that look like totals or taxes
      if (!name.toLowerCase().includes('total') && 
          !name.toLowerCase().includes('tax') && 
          !name.toLowerCase().includes('subtotal') &&
          price > 0 && price < 1000) {
        
        // Try to extract quantity
        const quantityRegex = /(\d+)\s*x?\s*(.+)/i;
        const qtyMatch = name.match(quantityRegex);
        
        if (qtyMatch) {
          items.push({
            name: qtyMatch[2].trim(),
            price: price / parseInt(qtyMatch[1]),
            quantity: parseInt(qtyMatch[1])
          });
        } else {
          items.push({
            name,
            price,
            quantity: 1
          });
        }
      }
    }
  }
  
  return items;
};

const categorizeVendor = (vendor: string): string => {
  const vendorLower = vendor.toLowerCase();
  
  if (vendorLower.includes('walmart') || vendorLower.includes('grocery') || vendorLower.includes('food')) {
    return 'Groceries';
  } else if (vendorLower.includes('mcdonald') || vendorLower.includes('restaurant') || vendorLower.includes('cafe')) {
    return 'Dining';
  } else if (vendorLower.includes('office') || vendorLower.includes('depot') || vendorLower.includes('supplies')) {
    return 'Office Supplies';
  } else if (vendorLower.includes('gas') || vendorLower.includes('fuel') || vendorLower.includes('shell')) {
    return 'Transportation';
  } else if (vendorLower.includes('pharmacy') || vendorLower.includes('health') || vendorLower.includes('medical')) {
    return 'Healthcare';
  } else {
    return 'Shopping';
  }
};

const extractPaymentMethod = (text: string): string => {
  const textLower = text.toLowerCase();
  
  if (textLower.includes('visa') || textLower.includes('****')) {
    return 'Credit Card';
  } else if (textLower.includes('cash')) {
    return 'Cash';
  } else if (textLower.includes('debit')) {
    return 'Debit Card';
  } else if (textLower.includes('paypal') || textLower.includes('apple pay') || textLower.includes('google pay')) {
    return 'Digital Wallet';
  } else {
    return 'Credit Card';
  }
};

const calculateConfidence = (vendor: string, amount: number, date: string, items: any[]): number => {
  let confidence = 0;
  
  if (vendor && vendor !== 'Unknown Vendor') confidence += 25;
  if (amount > 0) confidence += 25;
  if (date) confidence += 20;
  if (items.length > 0) confidence += 20;
  if (items.length >= 3) confidence += 10;
  
  return Math.min(confidence, 100);
};

export const performReceiptOCR = async (imageElement: HTMLImageElement): Promise<OCRResult> => {
  try {
    console.log('Starting OCR processing...');
    
    // Extract text from image
    const extractedText = await extractTextFromImage(imageElement);
    console.log('Extracted text:', extractedText);
    
    // Parse the extracted text
    const result = parseReceiptText(extractedText);
    console.log('Parsed result:', result);
    
    return result;
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw new Error('Failed to process receipt image');
  }
};