/**
 * InvoicePreview.tsx
 * Print-ready invoice preview with PDF download (uses jsPDF + jspdf-autotable).
 */
import { useRef } from 'react';
import { Invoice } from '@/hooks/useInvoices';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  invoice: Invoice;
  onClose: () => void;
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  draft:     'bg-slate-500',
  sent:      'bg-blue-500',
  paid:      'bg-green-500',
  overdue:   'bg-red-500',
  cancelled: 'bg-gray-400',
};

export function InvoicePreview({ invoice, onClose }: Props) {
  const previewRef = useRef<HTMLDivElement>(null);

  const downloadPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 14, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceNumber, 196, 18, { align: 'right' });

    // Business info placeholder
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.text('2K AI Accounting Systems', 14, 40);

    // Client
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 14, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.clientName, 14, 58);
    if (invoice.clientEmail)   doc.text(invoice.clientEmail,   14, 63);
    if (invoice.clientAddress) doc.text(invoice.clientAddress, 14, 68);

    // Dates
    doc.setFont('helvetica', 'bold');
    doc.text('Issue Date:', 130, 40);
    doc.text('Due Date:',   130, 46);
    doc.text('Status:',     130, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.issueDate, 165, 40);
    doc.text(invoice.dueDate,   165, 46);
    doc.text(invoice.status.toUpperCase(), 165, 52);

    // Items table
    autoTable(doc, {
      startY: 78,
      head: [['Description', 'Qty', 'Unit Price', 'Total']],
      body: invoice.items.map((it) => [
        it.description,
        it.quantity,
        `${invoice.currency} ${it.unitPrice.toFixed(2)}`,
        `${invoice.currency} ${it.total.toFixed(2)}`,
      ]),
      styles:     { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
      },
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(9);
    doc.text(`Subtotal:`,   145, finalY);
    doc.text(`${invoice.currency} ${invoice.subtotal.toFixed(2)}`, 196, finalY, { align: 'right' });
    if (invoice.taxAmount > 0) {
      doc.text(`Tax (${invoice.taxRate}%):`, 145, finalY + 6);
      doc.text(`${invoice.currency} ${invoice.taxAmount.toFixed(2)}`, 196, finalY + 6, { align: 'right' });
    }
    if (invoice.discount > 0) {
      doc.text(`Discount:`, 145, finalY + 12);
      doc.text(`-${invoice.currency} ${invoice.discount.toFixed(2)}`, 196, finalY + 12, { align: 'right' });
    }
    const totY = finalY + (invoice.taxAmount > 0 ? 12 : 6) + (invoice.discount > 0 ? 6 : 0) + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`TOTAL:`, 145, totY);
    doc.text(`${invoice.currency} ${invoice.total.toFixed(2)}`, 196, totY, { align: 'right' });

    // Notes
    if (invoice.notes) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Notes:', 14, totY);
      doc.text(invoice.notes, 14, totY + 5, { maxWidth: 120 });
    }

    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Invoice Preview</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadPDF}>
            <Download className="w-4 h-4 mr-1" /> Download PDF
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Preview card */}
      <div ref={previewRef} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg print:shadow-none">
        {/* Header bar */}
        <div className="bg-primary px-8 py-5 flex items-center justify-between">
          <div>
            <div className="text-white text-2xl font-bold tracking-wide">INVOICE</div>
            <div className="text-primary-foreground/70 text-sm mt-0.5">2K AI Accounting Systems</div>
          </div>
          <div className="text-right">
            <div className="text-white font-mono font-bold text-lg">{invoice.invoiceNumber}</div>
            <span
              className={`mt-1 inline-block px-2 py-0.5 rounded text-xs font-semibold text-white uppercase ${STATUS_BADGE_CLASS[invoice.status] ?? 'bg-slate-500'}`}
            >
              {invoice.status}
            </span>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Bill-to + dates */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Bill To</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">{invoice.clientName}</div>
              {invoice.clientEmail   && <div className="text-sm text-slate-500">{invoice.clientEmail}</div>}
              {invoice.clientAddress && <div className="text-sm text-slate-500">{invoice.clientAddress}</div>}
            </div>
            <div className="text-sm space-y-1 sm:text-right">
              <div><span className="text-slate-400">Issue Date: </span><span className="font-medium">{invoice.issueDate}</span></div>
              <div><span className="text-slate-400">Due Date: </span><span className="font-medium">{invoice.dueDate}</span></div>
              <div><span className="text-slate-400">Currency: </span><span className="font-medium">{invoice.currency}</span></div>
            </div>
          </div>

          {/* Items */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Description</th>
                  <th className="text-right px-4 py-2 font-semibold w-16">Qty</th>
                  <th className="text-right px-4 py-2 font-semibold w-28">Unit Price</th>
                  <th className="text-right px-4 py-2 font-semibold w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {invoice.items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-4 py-2">{it.description}</td>
                    <td className="px-4 py-2 text-right">{it.quantity}</td>
                    <td className="px-4 py-2 text-right">{it.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-medium">{it.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{invoice.currency} {invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Tax ({invoice.taxRate}%)</span>
                  <span>{invoice.currency} {invoice.taxAmount.toFixed(2)}</span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Discount</span>
                  <span>-{invoice.currency} {invoice.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
                <span>TOTAL</span>
                <span className="text-primary">{invoice.currency} {invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t pt-4 text-sm text-slate-500">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Notes: </span>
              {invoice.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
