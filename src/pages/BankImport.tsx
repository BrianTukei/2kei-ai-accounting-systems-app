/**
 * BankImport.tsx
 * AI Bank Statement Automation wizard.
 * Uploads CSV / Excel bank statement → auto-parses → AI-categorises rows →
 * user reviews & edits → posts confirmed rows to Transactions.
 */
import { useRef, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';
import { ScrollableContent } from '@/components/ui/ScrollableContent';
import { useBankImport, ImportedRow } from '@/hooks/useBankImport';
import { useTransactions } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle,
  RefreshCw, ArrowRight, Sparkles, FileX, Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────
// Category options for manual override
// ─────────────────────────────────────────
const CATEGORIES = [
  'Salary Income','Bank Transfer','Client Payment','Interest Income','Refund','Dividend Income',
  'Transport Expense','Utilities','Rent & Lease','Groceries','Meals & Entertainment',
  'Insurance','Bank Charges','Loan Repayment','Supplier Payment','Salaries & Wages',
  'Tax Payment','Office Supplies','Medical Expenses','Travel','Subscriptions',
  'Cash Withdrawal','Miscellaneous Income','Miscellaneous Expense','Uncategorised',
];

// ─────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────
const STEPS = ['Upload', 'Processing', 'Review', 'Done'];
const STEP_INDEX: Record<string, number> = { upload: 0, processing: 1, review: 2, posting: 2, done: 3 };

function StepBar({ current }: { current: string }) {
  const idx = STEP_INDEX[current] ?? 0;
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((name, i) => (
        <div key={name} className="flex items-center gap-2">
          <div className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
            i < idx  ? 'bg-primary text-white' :
            i === idx ? 'bg-primary text-white ring-2 ring-primary/30' :
                        'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
          )}>
            {i < idx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
          </div>
          <span className={cn(
            'text-sm font-medium hidden sm:block',
            i === idx ? 'text-primary' : 'text-slate-400'
          )}>{name}</span>
          {i < STEPS.length - 1 && (
            <div className={cn(
              'h-px w-8 sm:w-16 transition-colors',
              i < idx ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Upload Step
// ─────────────────────────────────────────
function UploadStep({ onFile, error }: { onFile: (f: File) => void; error: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div className="space-y-6">
      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <FileSpreadsheet className="w-6 h-6 text-primary" />, title: 'CSV / Excel', desc: 'Upload your bank statement exported from your online banking portal.' },
          { icon: <Sparkles className="w-6 h-6 text-amber-500" />, title: 'AI Categorisation', desc: 'Every transaction is matched to an accounting category automatically.' },
          { icon: <CheckCircle2 className="w-6 h-6 text-green-500" />, title: 'Review & Post', desc: 'Edit any category, exclude duplicates, then post directly to Transactions.' },
        ].map((c) => (
          <Card key={c.title} className="border-slate-200 dark:border-slate-700">
            <CardContent className="pt-5 flex gap-3">
              {c.icon}
              <div>
                <div className="font-semibold text-sm">{c.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{c.desc}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-14 text-center cursor-pointer transition-all',
          dragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-primary/5'
        )}
      >
        <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
        <p className="font-semibold text-slate-700 dark:text-slate-200">
          Drop your bank statement here
        </p>
        <p className="text-sm text-slate-400 mt-1">
          or <span className="text-primary underline underline-offset-2">browse</span> to select a file
        </p>
        <p className="text-xs text-slate-400 mt-3">
          Supported: .csv, .xlsx, .xls, .ods
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.ods"
          aria-label="Upload bank statement file"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Tips */}
      <div className="text-xs text-slate-400 space-y-1 border rounded-lg p-4 dark:border-slate-700">
        <p className="font-semibold text-slate-500 mb-2">Tips for best results:</p>
        <p>• Your CSV/Excel should have columns for <strong>Date</strong>, <strong>Description</strong>, and either <strong>Debit/Credit</strong> or a single <strong>Amount</strong> column.</p>
        <p>• Column names are auto-detected — most bank exports work out of the box.</p>
        <p>• PDF files are not supported; export to CSV/Excel from your banking app first.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Processing Step
// ─────────────────────────────────────────
function ProcessingStep({ progress, fileName }: { progress: number; fileName?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-800 dark:text-slate-100 text-lg">
          AI is processing your statement…
        </p>
        {fileName && (
          <p className="text-sm text-slate-400 mt-1">{fileName}</p>
        )}
      </div>
      <div className="w-full max-w-sm space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-center text-xs text-slate-400">
          {progress < 40 ? 'Parsing rows…' : progress < 65 ? 'Mapping columns…' : progress < 85 ? 'AI categorising transactions…' : 'Finalising…'}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Review Step
// ─────────────────────────────────────────
function ReviewStep({
  rows,
  fileName,
  onToggle,
  onCategoryChange,
  onConfirmAll,
  onPost,
  onReset,
}: {
  rows: ImportedRow[];
  fileName: string;
  onToggle: (id: string) => void;
  onCategoryChange: (id: string, cat: string) => void;
  onConfirmAll: () => void;
  onPost: () => void;
  onReset: () => void;
}) {
  const confirmed   = rows.filter((r) => r.confirmed).length;
  const duplicates  = rows.filter((r) => r.isDuplicate).length;
  const income      = rows.filter((r) => r.confirmed && r.aiType === 'income').reduce((s, r) => s + r.credit, 0);
  const expense     = rows.filter((r) => r.confirmed && r.aiType === 'expense').reduce((s, r) => s + r.debit, 0);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total rows',  value: rows.length,        color: '' },
          { label: 'Selected',    value: confirmed,          color: 'text-primary' },
          { label: 'Duplicates',  value: duplicates,         color: 'text-amber-500' },
          { label: 'Income',      value: `+${fmt(income)}`,  color: 'text-green-600' },
        ].map((s) => (
          <Card key={s.label} className="border-slate-200 dark:border-slate-700">
            <CardContent className="pt-4 pb-3">
              <div className={cn('text-xl font-bold', s.color)}>{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <FileSpreadsheet className="w-4 h-4" />
          <span className="font-medium">{fileName}</span>
          {duplicates > 0 && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              <Copy className="w-3 h-3 mr-1" />{duplicates} duplicate{duplicates > 1 ? 's' : ''} deselected
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> New Import
          </Button>
          <Button variant="outline" size="sm" onClick={onConfirmAll}>
            Select All
          </Button>
          <Button size="sm" onClick={onPost} disabled={confirmed === 0} className="gap-1">
            Post {confirmed} Transaction{confirmed !== 1 ? 's' : ''}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800">
              <TableHead className="w-10">✓</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead>AI Category</TableHead>
              <TableHead className="text-center">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  'transition-colors',
                  !row.confirmed && 'opacity-40',
                  row.isDuplicate && row.confirmed && 'bg-amber-50/30 dark:bg-amber-900/10'
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={row.confirmed}
                    onCheckedChange={() => onToggle(row.id)}
                  />
                </TableCell>
                <TableCell className="text-xs font-mono text-slate-500 whitespace-nowrap">
                  {row.date}
                </TableCell>
                <TableCell className="max-w-[220px]">
                  <div className="truncate text-sm">{row.description}</div>
                  {row.isDuplicate && (
                    <span className="text-[10px] text-amber-500 font-medium">possible duplicate</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-red-600 font-mono text-sm">
                  {row.debit > 0 ? row.debit.toFixed(2) : '—'}
                </TableCell>
                <TableCell className="text-right text-green-600 font-mono text-sm">
                  {row.credit > 0 ? row.credit.toFixed(2) : '—'}
                </TableCell>
                <TableCell className="min-w-[180px]">
                  <Select
                    value={row.aiCategory}
                    onValueChange={(v) => onCategoryChange(row.id, v)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase',
                    row.aiType === 'income'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300'
                  )}>
                    {row.aiType}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Done Step
// ─────────────────────────────────────────
function DoneStep({ count, onReset, onNav }: { count: number; onReset: () => void; onNav: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Import Complete!</h2>
        <p className="text-slate-500 mt-2">
          <span className="font-semibold text-primary">{count}</span> transaction{count !== 1 ? 's' : ''} were posted to your Transactions ledger.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onReset}>
          <RefreshCw className="w-4 h-4 mr-2" /> Import Another
        </Button>
        <Button onClick={onNav}>
          View Transactions <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────
export default function BankImport() {
  const {
    step, progress, session, rows, error,
    processFile, updateRow, toggleConfirm, confirmAll, postTransactions, reset,
  } = useBankImport();

  const { addTransaction } = useTransactions();
  const [postedCount, setPostedCount] = useState(0);

  const handlePost = () => {
    const count = rows.filter((r) => r.confirmed).length;
    postTransactions(addTransaction as Parameters<typeof postTransactions>[0]);
    setPostedCount(count);
    toast.success(`${count} transaction${count !== 1 ? 's' : ''} imported successfully!`);
  };

  const handleCategoryChange = (id: string, cat: string) => {
    updateRow(id, { aiCategory: cat });
  };

  return (
    <PageLayout
      title="AI Bank Statement Import"
      subtitle="Upload your bank statement and let AI categorise every transaction automatically."
      showBackButton={false}
      aiContextType="bank-import"
    >
      <ScrollableContent>
      <SubscriptionGuard feature="aiAssistant" action="use AI Bank Import">
      <div className="max-w-5xl mx-auto">
        <StepBar current={step} />

        {step === 'upload' && (
          <UploadStep onFile={processFile} error={error} />
        )}

        {step === 'processing' && (
          <ProcessingStep progress={progress} fileName={session?.fileName} />
        )}

        {(step === 'review' || step === 'posting') && (
          <ReviewStep
            rows={rows}
            fileName={session?.fileName ?? ''}
            onToggle={toggleConfirm}
            onCategoryChange={handleCategoryChange}
            onConfirmAll={confirmAll}
            onPost={handlePost}
            onReset={reset}
          />
        )}

        {step === 'done' && (
          <DoneStep
            count={postedCount}
            onReset={reset}
            onNav={() => window.location.assign('/transactions')}
          />
        )}
      </div>
      </SubscriptionGuard>
      </ScrollableContent>
    </PageLayout>
  );
}
