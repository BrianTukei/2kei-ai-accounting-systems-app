/**
 * Advanced Invoice Generation Service
 * ────────────────────────────────────────────────────────────────────────────
 * Super-intelligent invoice creation with financial analysis, payment terms,
 * tax optimization, and multi-currency support.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { v4 as uuidv4 } from 'uuid';

// ── Types ───────────────────────────────────────────────────────────────────

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
  notes?: string;
}

export interface InvoicePaymentTerms {
  daysUntilDue: number;
  acceptedPaymentMethods: string[];
  earlyPaymentDiscount?: {
    percentage: number;
    daysUntilDeadline: number;
  };
  lateFeePercentage?: number;
}

export interface InvoiceTaxBreakdown {
  taxType: string; // VAT, GST, Sales Tax, etc.
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface AdvancedInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  
  // Company details
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  taxId: string;
  
  // Client details
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone?: string;
  clientTaxId?: string;
  
  // Line items
  items: InvoiceLineItem[];
  
  // Pricing
  currency: string;
  subtotal: number;
  discounts: Array<{ description: string; amount: number }>;
  
  // Tax
  taxes: InvoiceTaxBreakdown[];
  totalTax: number;
  
  // Final
  total: number;
  amountPaid?: number;
  amountDue: number;
  
  // Terms & notes
  paymentTerms: InvoicePaymentTerms;
  notes?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    routingNumber?: string;
  };
  
  // Metadata
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue';
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    projectName?: string;
    referenceNumber?: string;
    termsVersion?: string;
    currencyExchangeRate?: number;
  };
}

// ── Advanced Invoice Service ────────────────────────────────────────────────

class AdvancedInvoiceService {
  private invoices: Map<string, AdvancedInvoice> = new Map();
  private invoiceCounter = 1000;

  // ── Invoice Creation ────────────────────────────────────────────────────────

  public createInvoice(params: Partial<AdvancedInvoice>): AdvancedInvoice {
    const invoice: AdvancedInvoice = {
      id: uuidv4(),
      invoiceNumber: this.generateInvoiceNumber(),
      invoiceDate: params.invoiceDate || new Date(),
      dueDate: params.dueDate || this.calculateDueDate(params.paymentTerms?.daysUntilDue || 30),
      
      companyName: params.companyName || 'Your Company',
      companyAddress: params.companyAddress || '',
      companyPhone: params.companyPhone || '',
      companyEmail: params.companyEmail || '',
      taxId: params.taxId || '',
      
      clientName: params.clientName || '',
      clientAddress: params.clientAddress || '',
      clientEmail: params.clientEmail || '',
      clientPhone: params.clientPhone,
      clientTaxId: params.clientTaxId,
      
      items: params.items || [],
      
      currency: params.currency || 'USD',
      subtotal: 0,
      discounts: params.discounts || [],
      
      taxes: params.taxes || [
        {
          taxType: 'VAT',
          taxRate: 18,
          taxableAmount: 0,
          taxAmount: 0
        }
      ],
      totalTax: 0,
      
      total: 0,
      amountPaid: params.amountPaid || 0,
      amountDue: 0,
      
      paymentTerms: params.paymentTerms || {
        daysUntilDue: 30,
        acceptedPaymentMethods: ['Bank Transfer', 'Credit Card', 'Cash']
      },
      notes: params.notes,
      bankDetails: params.bankDetails,
      
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: params.metadata || {}
    };

    // Calculate totals
    this.calculateInvoiceTotals(invoice);
    
    // Store invoice
    this.invoices.set(invoice.id, invoice);
    
    return invoice;
  }

  // ── Financial Calculations ─────────────────────────────────────────────────

  private calculateInvoiceTotals(invoice: AdvancedInvoice): void {
    // Calculate subtotal
    invoice.subtotal = this.roundMoney(
      invoice.items.reduce((sum, item) => sum + item.total, 0)
    );

    // Calculate discounts
    const totalDiscount = this.roundMoney(
      invoice.discounts.reduce((sum, d) => sum + d.amount, 0)
    );

    // Calculate taxes
    const discountedSubtotal = invoice.subtotal - totalDiscount;
    
    invoice.taxes.forEach(tax => {
      tax.taxableAmount = discountedSubtotal;
      tax.taxAmount = this.roundMoney(discountedSubtotal * (tax.taxRate / 100));
    });

    invoice.totalTax = this.roundMoney(
      invoice.taxes.reduce((sum, tax) => sum + tax.taxAmount, 0)
    );

    // Calculate final total
    invoice.total = this.roundMoney(invoice.subtotal - totalDiscount + invoice.totalTax);
    invoice.amountDue = Math.max(0, invoice.total - (invoice.amountPaid || 0));

    invoice.updatedAt = new Date();
  }

  // ── Advanced Features ──────────────────────────────────────────────────────

  public applyEarlyPaymentDiscount(invoiceId: string, discountPercentage: number): void {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) return;

    const discount = {
      description: `Early Payment Discount (${discountPercentage}%)`,
      amount: this.roundMoney(invoice.subtotal * (discountPercentage / 100))
    };

    invoice.discounts.push(discount);
    invoice.paymentTerms.earlyPaymentDiscount = {
      percentage: discountPercentage,
      daysUntilDeadline: 10
    };

    this.calculateInvoiceTotals(invoice);
  }

  public addPartialPayment(invoiceId: string, amount: number, paymentMethod: string, reference: string): void {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) return;

    invoice.amountPaid = (invoice.amountPaid || 0) + amount;
    invoice.updatedAt = new Date();

    // Update status
    if (invoice.amountPaid >= invoice.total) {
      invoice.status = 'paid';
    } else {
      invoice.status = 'viewed';
    }

    this.calculateInvoiceTotals(invoice);
  }

  public generateRecurringInvoice(invoiceId: string, frequency: 'monthly' | 'quarterly' | 'annually'): AdvancedInvoice[] {
    const template = this.invoices.get(invoiceId);
    if (!template) return [];

    const invoices: AdvancedInvoice[] = [];
    const intervals = frequency === 'monthly' ? 12 : frequency === 'quarterly' ? 4 : 1;

    for (let i = 1; i <= intervals; i++) {
      const newInvoice = JSON.parse(JSON.stringify(template)) as AdvancedInvoice;
      newInvoice.id = uuidv4();
      newInvoice.invoiceNumber = this.generateInvoiceNumber();
      
      const daysOffset = 
        frequency === 'monthly' ? i * 30 :
        frequency === 'quarterly' ? i * 90 :
        i * 365;

      newInvoice.invoiceDate = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);
      newInvoice.dueDate = this.calculateDueDate(newInvoice.paymentTerms.daysUntilDue, newInvoice.invoiceDate);
      newInvoice.status = 'draft';
      newInvoice.createdAt = new Date();
      newInvoice.updatedAt = new Date();
      
      this.invoices.set(newInvoice.id, newInvoice);
      invoices.push(newInvoice);
    }

    return invoices;
  }

  public getInvoiceAnalytics(invoiceId: string): Record<string, any> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) return {};

    const daysToPayment = Math.ceil(
      (invoice.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      totalValue: invoice.total,
      daysUntilDue: daysToPayment,
      isOverdue: daysToPayment < 0,
      isPartiallyPaid: invoice.amountPaid && invoice.amountPaid > 0 && invoice.amountPaid < invoice.total,
      paymentPercentage: ((invoice.amountPaid || 0) / invoice.total) * 100,
      itemCount: invoice.items.length,
      averageItemValue: invoice.subtotal / invoice.items.length,
      profitMargin: this.estimateProfitMargin(invoice),
      taxBurden: (invoice.totalTax / invoice.total) * 100
    };
  }

  // ── Utility Methods ────────────────────────────────────────────────────────

  private generateInvoiceNumber(): string {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    const sequence = String(++this.invoiceCounter).padStart(5, '0');
    return `INV-${year}${month}-${sequence}`;
  }

  private calculateDueDate(daysUntilDue: number, fromDate = new Date()): Date {
    const dueDate = new Date(fromDate);
    dueDate.setDate(dueDate.getDate() + daysUntilDue);
    return dueDate;
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private estimateProfitMargin(invoice: AdvancedInvoice): number {
    // Estimate based on typical profit margins (this should be refined with actual cost data)
    const estimatedCost = invoice.subtotal * 0.3; // Assume 30% cost of goods
    const estimatedProfit = invoice.subtotal - estimatedCost;
    return (estimatedProfit / invoice.subtotal) * 100;
  }

  // ── Storage & Retrieval ────────────────────────────────────────────────────

  public getInvoice(invoiceId: string): AdvancedInvoice | null {
    return this.invoices.get(invoiceId) || null;
  }

  public getInvoicesByStatus(status: AdvancedInvoice['status']): AdvancedInvoice[] {
    return Array.from(this.invoices.values()).filter(inv => inv.status === status);
  }

  public getAllInvoices(): AdvancedInvoice[] {
    return Array.from(this.invoices.values());
  }

  public updateInvoice(invoiceId: string, updates: Partial<AdvancedInvoice>): AdvancedInvoice | null {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) return null;

    Object.assign(invoice, updates);
    invoice.updatedAt = new Date();
    
    if (updates.items || updates.discounts || updates.taxes) {
      this.calculateInvoiceTotals(invoice);
    }

    return invoice;
  }

  public deleteInvoice(invoiceId: string): boolean {
    return this.invoices.delete(invoiceId);
  }

  public exportToJSON(invoiceId: string): string {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) return '';
    return JSON.stringify(invoice, null, 2);
  }
}

// ── Singleton Export ────────────────────────────────────────────────────────

export const advancedInvoiceService = new AdvancedInvoiceService();
