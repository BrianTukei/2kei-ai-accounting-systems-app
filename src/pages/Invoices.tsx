/**
 * Invoices.tsx
 * Full invoice management page — dashboard stats, table, create/edit form, and PDF preview.
 */
import { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { ScrollableContent } from '@/components/ui/ScrollableContent';
import { SubscriptionGuard, UsageLimitBanner } from '@/components/SubscriptionGuard';
import { InvoiceDashboard } from '@/components/invoices/InvoiceDashboard';
import { InvoiceTable }     from '@/components/invoices/InvoiceTable';
import { InvoiceForm }      from '@/components/invoices/InvoiceForm';
import { InvoicePreview }   from '@/components/invoices/InvoicePreview';
import { useInvoices, Invoice, InvoiceInput } from '@/hooks/useInvoices';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Mode = 'list' | 'create' | 'edit' | 'preview';

export default function Invoices() {
  const {
    invoices,
    isLoading,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markPaid,
    markSent,
  } = useInvoices();

  const [mode,           setMode]          = useState<Mode>('list');
  const [selectedInv,    setSelectedInv]   = useState<Invoice | null>(null);
  const [deleteTarget,   setDeleteTarget]  = useState<string | null>(null);
  const [activeTab,      setActiveTab]     = useState('overview');

  // ─────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────

  const handleCreate = () => {
    setSelectedInv(null);
    setMode('create');
    setActiveTab('invoices');
  };

  const handleEdit = (inv: Invoice) => {
    setSelectedInv(inv);
    setMode('edit');
    setActiveTab('invoices');
  };

  const handleView = (inv: Invoice) => {
    setSelectedInv(inv);
    setMode('preview');
  };

  const handleSave = (data: InvoiceInput) => {
    if (mode === 'create') {
      createInvoice(data);
      toast.success('Invoice created successfully');
    } else if (mode === 'edit' && selectedInv) {
      updateInvoice(selectedInv.id, data);
      toast.success('Invoice updated successfully');
    }
    setMode('list');
    setSelectedInv(null);
  };

  const handleCancel = () => {
    setMode('list');
    setSelectedInv(null);
  };

  const handleDelete = (id: string) => setDeleteTarget(id);

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteInvoice(deleteTarget);
      toast.success('Invoice deleted');
      setDeleteTarget(null);
      if (selectedInv?.id === deleteTarget) {
        setMode('list');
        setSelectedInv(null);
      }
    }
  };

  const handleMarkPaid = (id: string) => {
    markPaid(id);
    toast.success('Invoice marked as paid');
  };

  const handleMarkSent = (id: string) => {
    markSent(id);
    toast.success('Invoice marked as sent');
  };

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────

  return (
    <PageLayout
      title="Invoices"
      subtitle="Create, manage, and track all your client invoices."
      showBackButton={false}
      aiContextType="invoice"
      aiContextData={{ totalInvoices: invoices.length }}
    >
      <ScrollableContent>
      <UsageLimitBanner limit="invoices" action="create a new invoice" />

      {/* Preview overlay */}
      {mode === 'preview' && selectedInv && (
        <InvoicePreview
          invoice={selectedInv}
          onClose={() => { setMode('list'); setSelectedInv(null); }}
        />
      )}

      {/* Create / Edit form */}
      {(mode === 'create' || mode === 'edit') ? (
        <div className="animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {mode === 'create' ? 'New Invoice' : `Edit ${selectedInv?.invoiceNumber}`}
            </h2>
          </div>
          <InvoiceForm
            initial={mode === 'edit' ? selectedInv ?? undefined : undefined}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        /* List / Dashboard tabs */
        <div className="animate-fade-up">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <TabsList className="w-fit">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="invoices" className="flex items-center gap-2">
                  All Invoices
                  {invoices.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                      {invoices.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <Button onClick={handleCreate} className="gap-2 self-end sm:self-auto">
                <Plus className="w-4 h-4" />
                New Invoice
              </Button>
            </div>

            <TabsContent value="overview" className="mt-0">
              {isLoading ? (
                <div className="text-center py-16 text-slate-400">Loading…</div>
              ) : (
                <InvoiceDashboard invoices={invoices} />
              )}
            </TabsContent>

            <TabsContent value="invoices" className="mt-0">
              {isLoading ? (
                <div className="text-center py-16 text-slate-400">Loading…</div>
              ) : (
                <InvoiceTable
                  invoices={invoices}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onMarkPaid={handleMarkPaid}
                  onMarkSent={handleMarkSent}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The invoice will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </ScrollableContent>
    </PageLayout>
  );
}
