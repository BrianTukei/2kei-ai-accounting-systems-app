import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Company, User } from './userCompanyService';
import { ParsedReceipt } from './ai/receiptParser';
import { currencyService } from './currencyService';

export interface PDFDocument {
  id: string;
  type: 'receipt' | 'invoice' | 'report' | 'statement';
  title: string;
  generatedAt: Date;
  data: any;
  company?: Company;
  user?: User;
}

export interface PDFConfig {
  orientation: 'portrait' | 'landscape';
  format: 'a4' | 'letter' | 'a3';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  fontSize: number;
  fontFamily: string;
}

class PDFService {
  private defaultConfig: PDFConfig = {
    orientation: 'portrait',
    format: 'a4',
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
    fontSize: 12,
    fontFamily: 'helvetica',
  };

  generateReceiptPDF(receipt: ParsedReceipt, company?: Company, user?: User): jsPDF {
    const doc = new jsPDF(this.defaultConfig.orientation, 'pt', this.defaultConfig.format);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add company header
    this.addCompanyHeader(doc, company, pageWidth);

    // Add receipt title
    doc.setFontSize(20);
    doc.setFont(this.defaultConfig.fontFamily, 'bold');
    doc.text('Receipt', pageWidth / 2, 120, { align: 'center' });

    // Add receipt details
    doc.setFontSize(12);
    doc.setFont(this.defaultConfig.fontFamily, 'normal');
    
    const receiptDetails = [
      ['Merchant:', receipt.merchant],
      ['Date:', receipt.date],
      ['Payment Method:', receipt.payment_method],
      ['Currency:', `${receipt.original_currency} → ${receipt.currency}`],
    ];

    let yPosition = 160;
    receiptDetails.forEach(([label, value]) => {
      doc.setFont(this.defaultConfig.fontFamily, 'bold');
      doc.text(label, 60, yPosition);
      doc.setFont(this.defaultConfig.fontFamily, 'normal');
      doc.text(value, 150, yPosition);
      yPosition += 20;
    });

    // Add items table
    const tableData = receipt.items.map(item => [
      item.name,
      item.category,
      currencyService.formatAmount(item.original_price, receipt.original_currency),
      currencyService.formatAmount(item.price, receipt.currency),
    ]);

    const originalTax = receipt.original_tax ?? receipt.tax;
    const convertedTax = receipt.original_tax
      ? currencyService.convert(receipt.original_tax, receipt.original_currency, receipt.currency)
      : receipt.tax;

    const originalSubtotal = receipt.original_total - (originalTax || 0);
    const convertedSubtotal = receipt.total - (convertedTax || 0);

    tableData.push([
      'Subtotal',
      '',
      currencyService.formatAmount(originalSubtotal, receipt.original_currency),
      currencyService.formatAmount(convertedSubtotal, receipt.currency),
    ]);

    if (originalTax > 0) {
      tableData.push([
        'Tax',
        '',
        currencyService.formatAmount(originalTax, receipt.original_currency),
        currencyService.formatAmount(convertedTax, receipt.currency),
      ]);
    }

    tableData.push([
      'TOTAL',
      '',
      currencyService.formatAmount(receipt.original_total, receipt.original_currency),
      currencyService.formatAmount(receipt.total, receipt.currency),
    ]);

    autoTable(doc, {
      head: [['Item', 'Category', 'Original Amount', 'USD Amount']],
      body: tableData,
      startY: yPosition + 20,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 8,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      footStyles: {
        fillColor: [240, 240, 240],
        fontStyle: 'bold',
      },
    });

    // Add footer
    this.addFooter(doc, company, user, pageWidth, pageHeight);

    return doc;
  }

  generateInvoicePDF(invoiceData: any, company?: Company, user?: User): jsPDF {
    const doc = new jsPDF(this.defaultConfig.orientation, 'pt', this.defaultConfig.format);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add company header
    this.addCompanyHeader(doc, company, pageWidth);

    // Add invoice title and number
    doc.setFontSize(20);
    doc.setFont(this.defaultConfig.fontFamily, 'bold');
    doc.text('INVOICE', pageWidth / 2, 120, { align: 'center' });

    doc.setFontSize(14);
    doc.text(`Invoice #${invoiceData.invoiceNumber}`, pageWidth / 2, 145, { align: 'center' });

    // Add invoice details
    doc.setFontSize(12);
    doc.setFont(this.defaultConfig.fontFamily, 'normal');
    
    const invoiceDetails = [
      ['Invoice Date:', invoiceData.date],
      ['Due Date:', invoiceData.dueDate],
      ['Status:', invoiceData.status],
      ['Currency:', invoiceData.currency],
    ];

    let yPosition = 180;
    invoiceDetails.forEach(([label, value]) => {
      doc.setFont(this.defaultConfig.fontFamily, 'bold');
      doc.text(label, 60, yPosition);
      doc.setFont(this.defaultConfig.fontFamily, 'normal');
      doc.text(value, 150, yPosition);
      yPosition += 20;
    });

    // Add bill to and ship to sections
    if (invoiceData.billTo) {
      doc.setFont(this.defaultConfig.fontFamily, 'bold');
      doc.text('Bill To:', 60, yPosition);
      doc.setFont(this.defaultConfig.fontFamily, 'normal');
      const billToLines = this.formatAddress(invoiceData.billTo);
      billToLines.forEach((line, index) => {
        doc.text(line, 60, yPosition + 20 + (index * 15));
      });
    }

    if (invoiceData.shipTo) {
      doc.setFont(this.defaultConfig.fontFamily, 'bold');
      doc.text('Ship To:', 300, yPosition);
      doc.setFont(this.defaultConfig.fontFamily, 'normal');
      const shipToLines = this.formatAddress(invoiceData.shipTo);
      shipToLines.forEach((line, index) => {
        doc.text(line, 300, yPosition + 20 + (index * 15));
      });
    }

    // Add items table
    const tableData = invoiceData.items.map((item: any) => [
      item.description,
      item.quantity,
      currencyService.formatAmount(item.unitPrice, invoiceData.currency),
      currencyService.formatAmount(item.total, invoiceData.currency),
    ]);

    const subtotal = invoiceData.items.reduce((sum: number, item: any) => sum + item.total, 0);
    const tax = invoiceData.tax || 0;
    const total = subtotal + tax;

    tableData.push([
      { content: 'Subtotal', colSpan: 3, styles: { fontStyle: 'bold' } },
      { content: currencyService.formatAmount(subtotal, invoiceData.currency), styles: { fontStyle: 'bold' } },
    ]);

    if (tax > 0) {
      tableData.push([
        { content: 'Tax', colSpan: 3, styles: { fontStyle: 'bold' } },
        { content: currencyService.formatAmount(tax, invoiceData.currency), styles: { fontStyle: 'bold' } },
      ]);
    }

    tableData.push([
      { content: 'TOTAL', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
      { content: currencyService.formatAmount(total, invoiceData.currency), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
    ]);

    autoTable(doc, {
      head: [['Description', 'Quantity', 'Unit Price', 'Total']],
      body: tableData,
      startY: yPosition + 80,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 8,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      footStyles: {
        fillColor: [240, 240, 240],
        fontStyle: 'bold',
      },
    });

    // Add footer
    this.addFooter(doc, company, user, pageWidth, pageHeight);

    return doc;
  }

  generateReportPDF(reportData: any, company?: Company, user?: User): jsPDF {
    const doc = new jsPDF(this.defaultConfig.orientation, 'pt', this.defaultConfig.format);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add company header
    this.addCompanyHeader(doc, company, pageWidth);

    // Add report title
    doc.setFontSize(20);
    doc.setFont(this.defaultConfig.fontFamily, 'bold');
    doc.text(reportData.title, pageWidth / 2, 120, { align: 'center' });

    // Add report period
    doc.setFontSize(12);
    doc.setFont(this.defaultConfig.fontFamily, 'normal');
    doc.text(`Period: ${reportData.period}`, pageWidth / 2, 145, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 165, { align: 'center' });

    // Add summary section
    if (reportData.summary) {
      doc.setFont(this.defaultConfig.fontFamily, 'bold');
      doc.text('Summary', 60, 200);
      doc.setFont(this.defaultConfig.fontFamily, 'normal');

      let yPosition = 220;
      Object.entries(reportData.summary).forEach(([key, value]) => {
        const label = this.formatLabel(key);
        const formattedValue = this.formatValue(value as any, reportData.currency);
        doc.text(`${label}: ${formattedValue}`, 60, yPosition);
        yPosition += 20;
      });
    }

    // Add charts or tables based on report type
    if (reportData.data && reportData.data.length > 0) {
      const tableData = reportData.data.map((item: any) => {
        if (typeof item === 'object') {
          return Object.values(item);
        }
        return [item];
      });

      const headers = reportData.headers || Object.keys(reportData.data[0] || {}).map(this.formatLabel);

      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 280,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 8,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
        },
      });
    }

    // Add footer
    this.addFooter(doc, company, user, pageWidth, pageHeight);

    return doc;
  }

  private addCompanyHeader(doc: jsPDF, company: Company | undefined, pageWidth: number): void {
    if (!company) return;

    let yPosition = 40;

    // Add logo if available
    if (company.logo && company.settings.branding.showLogo) {
      try {
        // Note: In a real implementation, you'd need to load the image
        // doc.addImage(company.logo, 'PNG', 60, yPosition, 60, 30);
        yPosition += 40;
      } catch (error) {
        console.warn('Failed to add company logo:', error);
      }
    }

    // Add company name
    doc.setFontSize(16);
    doc.setFont(this.defaultConfig.fontFamily, 'bold');
    doc.setTextColor(company.settings.branding.primaryColor);
    
    const logoPosition = company.settings.branding.logoPosition;
    const xPosition = logoPosition === 'center' ? pageWidth / 2 : logoPosition === 'right' ? pageWidth - 200 : 60;
    
    doc.text(company.name, xPosition, yPosition, { align: logoPosition === 'center' ? 'center' : 'left' });

    // Add company details if enabled
    if (company.settings.branding.showCompanyInfo) {
      doc.setFontSize(10);
      doc.setFont(this.defaultConfig.fontFamily, 'normal');
      doc.setTextColor(0);

      yPosition += 15;
      
      if (company.address) {
        const addressLines = this.formatAddress(company.address);
        addressLines.forEach((line, index) => {
          doc.text(line, xPosition, yPosition + (index * 12), { align: logoPosition === 'center' ? 'center' : 'left' });
        });
        yPosition += addressLines.length * 12;
      }

      if (company.contact) {
        if (company.contact.phone) {
          doc.text(`Phone: ${company.contact.phone}`, xPosition, yPosition, { align: logoPosition === 'center' ? 'center' : 'left' });
          yPosition += 12;
        }
        if (company.contact.email) {
          doc.text(`Email: ${company.contact.email}`, xPosition, yPosition, { align: logoPosition === 'center' ? 'center' : 'left' });
          yPosition += 12;
        }
        if (company.contact.website) {
          doc.text(`Website: ${company.contact.website}`, xPosition, yPosition, { align: logoPosition === 'center' ? 'center' : 'left' });
        }
      }
    }

    // Reset text color
    doc.setTextColor(0);
  }

  private addFooter(doc: jsPDF, company: Company | undefined, user: User | undefined, pageWidth: number | undefined, pageHeight: number | undefined): void {
    if (!pageWidth || !pageHeight) return;

    const footerY = pageHeight - 30;

    // Add custom footer if provided
    if (company?.settings.branding.customFooter) {
      doc.setFontSize(8);
      doc.setFont(this.defaultConfig.fontFamily, 'italic');
      doc.text(company.settings.branding.customFooter, pageWidth / 2, footerY, { align: 'center' });
    } else {
      // Default footer
      doc.setFontSize(8);
      doc.setFont(this.defaultConfig.fontFamily, 'normal');
      
      const footerText = company?.name ? `© ${new Date().getFullYear()} ${company.name}` : `Generated by 2K AI Accounting Systems`;
      doc.text(footerText, pageWidth / 2, footerY, { align: 'center' });
    }

    // Add page number
    const pageNumber = `Page ${doc.getCurrentPageInfo().pageNumber}`;
    doc.text(pageNumber, pageWidth - 60, footerY, { align: 'right' });
  }

  private formatAddress(address: any): string[] {
    const lines: string[] = [];
    
    if (address.street) lines.push(address.street);
    if (address.city && address.state) {
      lines.push(`${address.city}, ${address.state}`);
    } else if (address.city) {
      lines.push(address.city);
    }
    if (address.postalCode) lines.push(address.postalCode);
    if (address.country) lines.push(address.country);

    return lines;
  }

  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private formatValue(value: any, currency?: string): string {
    if (typeof value === 'number') {
      if (currency) {
        return currencyService.formatAmount(value, currency);
      }
      return value.toLocaleString();
    }
    return String(value);
  }

  downloadPDF(doc: jsPDF, filename: string): void {
    doc.save(filename);
  }

  getPDFBlob(doc: jsPDF): Blob {
    return new Blob([doc.output('blob')], { type: 'application/pdf' });
  }

  async getPDFDataUrl(doc: jsPDF): Promise<string> {
    return doc.output('dataurlstring');
  }
}

export const pdfService = new PDFService();
