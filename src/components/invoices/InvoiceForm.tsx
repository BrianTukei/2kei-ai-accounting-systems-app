/**
 * InvoiceForm.tsx
 * Create or edit an invoice. Includes the AI "fill from instructions" button.
 */
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { Invoice, InvoiceItem, InvoiceStatus } from '@/hooks/useInvoices';
import { parseInvoiceInstruction } from '@/services/invoiceAI';
import { toast } from 'sonner';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Props {
  initial?: Invoice;
  onSave:  (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'subtotal' | 'taxAmount' | 'total' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

function emptyItem(): InvoiceItem {
  return { id: uuidv4(), description: '', quantity: 1, unitPrice: 0, total: 0 };
}

export function InvoiceForm({ initial, onSave, onCancel }: Props) {
  const { selectedCurrency: defaultCurrency } = useCurrency();

  const [clientName,    setClientName]    = useState(initial?.clientName    ?? '');
  const [clientEmail,   setClientEmail]   = useState(initial?.clientEmail   ?? '');
  const [clientAddress, setClientAddress] = useState(initial?.clientAddress ?? '');
  const [issueDate,     setIssueDate]     = useState(initial?.issueDate     ?? new Date().toISOString().split('T')[0]);
  const [dueDate,       setDueDate]       = useState(initial?.dueDate       ?? '');
  const [items,         setItems]         = useState<InvoiceItem[]>(initial?.items.length ? initial.items : [emptyItem()]);
  const [taxRate,       setTaxRate]       = useState(initial?.taxRate   ?? 0);
  const [discount,      setDiscount]      = useState(initial?.discount  ?? 0);
  const [notes,         setNotes]         = useState(initial?.notes     ?? '');
  const [currency,      setCurrency]      = useState(initial?.currency  ?? defaultCurrency.code ?? 'USD');
  const [status,        setStatus]        = useState(initial?.status    ?? 'draft');

  // AI fill
  const [aiPrompt,   setAiPrompt]   = useState('');
  const [aiLoading,  setAiLoading]  = useState(false);

  // Computed totals
  const subtotal  = items.reduce((s, i) => s + i.total, 0);
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total     = Math.max(0, subtotal + taxAmount - discount);

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) => prev.map((it) => {
      if (it.id !== id) return it;
      const updated = { ...it, [field]: value };
      updated.total = Math.round(updated.quantity * updated.unitPrice * 100) / 100;
      return updated;
    }));
  };

  const handleAiFill = () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setTimeout(() => {
      try {
        const parsed = parseInvoiceInstruction(aiPrompt);
        if (parsed.clientName)  setClientName(parsed.clientName);
        if (parsed.issueDate)   setIssueDate(parsed.issueDate);
        if (parsed.dueDate)     setDueDate(parsed.dueDate);
        if (parsed.currency)    setCurrency(parsed.currency);
        if (parsed.items?.length) setItems(parsed.items);
        if (parsed.notes)       setNotes(parsed.notes);
        toast.success('AI filled the invoice form!');
      } catch {
        toast.error('Could not parse the instruction. Try: "Invoice John for Web Design $500 due in 14 days"');
      } finally {
        setAiLoading(false);
      }
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) { toast.error('Client name is required'); return; }
    if (!dueDate)           { toast.error('Due date is required');    return; }
    if (items.some(i => !i.description.trim())) {
      toast.error('All item descriptions are required'); return;
    }
    onSave({
      clientName, clientEmail, clientAddress,
      issueDate, dueDate,
      status: status as InvoiceStatus,
      items, taxRate, discount, notes, currency,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── AI FILL ── */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" />
            Create Invoice with AI
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder='e.g. "Invoice John for Website Design $800 due in 7 days"'
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAiFill(); } }}
          />
          <Button type="button" variant="outline" onClick={handleAiFill} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
            Fill
          </Button>
        </CardContent>
      </Card>

      {/* ── CLIENT ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Client Name *</Label>
          <Input value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="John Doe" required />
        </div>
        <div className="space-y-1">
          <Label>Client Email</Label>
          <Input type="email" value={clientEmail} onChange={e=>setClientEmail(e.target.value)} placeholder="john@example.com" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label>Client Address</Label>
          <Input value={clientAddress} onChange={e=>setClientAddress(e.target.value)} placeholder="123 Main St, City" />
        </div>
      </div>

      {/* ── DATES & STATUS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label>Issue Date *</Label>
          <Input type="date" value={issueDate} onChange={e=>setIssueDate(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Due Date *</Label>
          <Input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['USD','EUR','GBP','ZAR','KES','NGN','GHS','AUD','CAD','INR'].map(c=>(
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── ITEMS ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Line Items</Label>
          <Button type="button" variant="outline" size="sm" onClick={()=>setItems(p=>[...p, emptyItem()])}>
            <Plus className="w-3 h-3 mr-1" /> Add Item
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="text-left px-3 py-2 font-medium min-w-[180px]">Description</th>
                <th className="text-right px-3 py-2 font-medium w-24">Qty</th>
                <th className="text-right px-3 py-2 font-medium w-28">Unit Price</th>
                <th className="text-right px-3 py-2 font-medium w-28">Total</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-2 py-1">
                    <Input
                      value={item.description}
                      onChange={e=>updateItem(item.id,'description',e.target.value)}
                      placeholder="Service or product description"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      type="number" min={0} step={1}
                      value={item.quantity}
                      onChange={e=>updateItem(item.id,'quantity',parseFloat(e.target.value)||0)}
                      className="h-8 text-sm text-right"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      type="number" min={0} step={0.01}
                      value={item.unitPrice}
                      onChange={e=>updateItem(item.id,'unitPrice',parseFloat(e.target.value)||0)}
                      className="h-8 text-sm text-right"
                    />
                  </td>
                  <td className="px-3 py-1 text-right font-medium">
                    {item.total.toFixed(2)}
                  </td>
                  <td className="px-2 py-1">
                    {items.length > 1 && (
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-600"
                        onClick={()=>setItems(p=>p.filter(i=>i.id!==item.id))}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-500">Tax (%)</span>
              <Input
                type="number" min={0} max={100} step={0.5}
                value={taxRate}
                onChange={e=>setTaxRate(parseFloat(e.target.value)||0)}
                className="h-7 w-20 text-right text-sm"
              />
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-500">Discount</span>
              <Input
                type="number" min={0} step={0.01}
                value={discount}
                onChange={e=>setDiscount(parseFloat(e.target.value)||0)}
                className="h-7 w-28 text-right text-sm"
              />
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total ({currency})</span>
              <span>{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── NOTES ── */}
      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Payment terms, bank details, thank-you message…" rows={3} />
      </div>

      {/* ── ACTIONS ── */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">
          {initial ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}
