/**
 * InvoiceTable.tsx
 * Displays a list of invoices with status badges and actions.
 */
import { Invoice, InvoiceStatus } from '@/hooks/useInvoices';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit2, Trash2, CheckCircle, Send, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrency } from '@/contexts/CurrencyContext';

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft:     'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  sent:      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  paid:      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  overdue:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

interface Props {
  invoices: Invoice[];
  onView:   (inv: Invoice) => void;
  onEdit:   (inv: Invoice) => void;
  onDelete: (id: string)   => void;
  onMarkPaid: (id: string) => void;
  onMarkSent: (id: string) => void;
}

export function InvoiceTable({ invoices, onView, onEdit, onDelete, onMarkPaid, onMarkSent }: Props) {
  const { formatCurrency } = useCurrency();

  if (!invoices.length) {
    return (
      <div className="text-center py-16 text-slate-400 dark:text-slate-500">
        <p className="text-lg font-medium mb-1">No invoices yet</p>
        <p className="text-sm">Click <strong>New Invoice</strong> to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          <tr>
            <th className="text-left px-4 py-3 font-semibold">Invoice #</th>
            <th className="text-left px-4 py-3 font-semibold">Client</th>
            <th className="text-left px-4 py-3 font-semibold">Issue Date</th>
            <th className="text-left px-4 py-3 font-semibold">Due Date</th>
            <th className="text-right px-4 py-3 font-semibold">Amount</th>
            <th className="text-center px-4 py-3 font-semibold">Status</th>
            <th className="text-center px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
              <td className="px-4 py-3 font-mono font-medium text-primary">
                {inv.invoiceNumber}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900 dark:text-slate-100">{inv.clientName}</div>
                {inv.clientEmail && (
                  <div className="text-xs text-slate-400">{inv.clientEmail}</div>
                )}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{inv.issueDate}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{inv.dueDate}</td>
              <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(inv.total)}
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[inv.status]}`}>
                  {inv.status}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(inv)}>
                      <Eye className="w-4 h-4 mr-2" /> View / Print
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(inv)}>
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    {inv.status === 'draft' && (
                      <DropdownMenuItem onClick={() => onMarkSent(inv.id)}>
                        <Send className="w-4 h-4 mr-2" /> Mark as Sent
                      </DropdownMenuItem>
                    )}
                    {(inv.status === 'sent' || inv.status === 'overdue') && (
                      <DropdownMenuItem onClick={() => onMarkPaid(inv.id)}>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" /> Mark as Paid
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => onDelete(inv.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
