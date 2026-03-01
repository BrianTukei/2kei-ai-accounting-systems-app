import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  FileText, BarChart3, Download, ArrowUpDown as ArrowsUpDown, Receipt,
  BarChart, Users, Book, TrendingUp, TrendingDown, DollarSign, Wallet,
  PieChart as PieChartIcon, Calendar, Filter, Printer, ChevronDown,
  ChevronUp, AlertTriangle, CheckCircle, Layers, ArrowRight,
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { ScrollableContent } from '@/components/ui/ScrollableContent';
import OverviewChart from '@/components/OverviewChart';
import { useFinancialStats } from '@/hooks/useFinancialStats';
import { useTransactions } from '@/hooks/useTransactions';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import {
  LineChart, Line, BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, RadialBarChart, RadialBar, TooltipProps,
} from 'recharts';

// ─── Colors ──────────────────────────────────
const CHART_COLORS = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6'];
const INCOME_COLOR = '#22c55e';
const EXPENSE_COLOR = '#ef4444';
const NET_COLOR = '#6366f1';

// ─── Helpers ─────────────────────────────────
function parseDate(d: string): Date {
  const parsed = new Date(d);
  if (!isNaN(parsed.getTime())) return parsed;
  // Handle "Today" / "Yesterday"
  if (d.toLowerCase() === 'today') return new Date();
  if (d.toLowerCase() === 'yesterday') {
    const y = new Date(); y.setDate(y.getDate() - 1); return y;
  }
  return new Date();
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split('-');
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${names[Number(m) - 1]} ${y}`;
}

function weekKey(d: Date) {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `W${week} ${d.getFullYear()}`;
}

// ─── Custom Tooltip ──────────────────────────
function ChartTooltip({ active, payload, label, fmt }: TooltipProps<number, string> & { fmt: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-lg text-sm">
      <p className="font-semibold mb-1.5 text-slate-700 dark:text-slate-200">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2" style={{ color: entry.color }}>
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          {entry.name}: {fmt(entry.value ?? 0)}
        </p>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// ─── MAIN COMPONENT ──────────────────────────
// ═══════════════════════════════════════════════

export default function Reports() {
  const [activeTab, setActiveTab] = useState('financial');
  const { monthlyData, totalIncome, totalExpenses, totalBalance, categoryBreakdown, incomeGrowth, expenseGrowth, monthlyIncome, monthlyExpenses } = useFinancialStats();
  const { transactions } = useTransactions();
  const { formatCurrency } = useCurrency();

  const fmt = (v: number) => formatCurrency(v);

  // ─── Derived data ─────────────────────────
  const enriched = useMemo(() => {
    const txns = transactions.map(t => ({ ...t, _date: parseDate(t.date) }));
    txns.sort((a, b) => b._date.getTime() - a._date.getTime());

    // Monthly aggregation
    const byMonth = new Map<string, { income: number; expenses: number; count: number }>();
    txns.forEach(t => {
      const k = monthKey(t._date);
      const cur = byMonth.get(k) || { income: 0, expenses: 0, count: 0 };
      if (t.type === 'income') cur.income += t.amount;
      else cur.expenses += t.amount;
      cur.count++;
      byMonth.set(k, cur);
    });
    const monthlyAgg = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ name: monthLabel(k), ...v, net: v.income - v.expenses }));

    // Weekly aggregation
    const byWeek = new Map<string, { income: number; expenses: number }>();
    txns.forEach(t => {
      const k = weekKey(t._date);
      const cur = byWeek.get(k) || { income: 0, expenses: 0 };
      if (t.type === 'income') cur.income += t.amount;
      else cur.expenses += t.amount;
      byWeek.set(k, cur);
    });
    const weeklyAgg = Array.from(byWeek.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([k, v]) => ({ name: k, ...v, net: v.income - v.expenses }));

    // Category breakdown (all)
    const catMap = new Map<string, { income: number; expense: number; count: number }>();
    txns.forEach(t => {
      const cur = catMap.get(t.category) || { income: 0, expense: 0, count: 0 };
      if (t.type === 'income') cur.income += t.amount;
      else cur.expense += t.amount;
      cur.count++;
      catMap.set(t.category, cur);
    });
    const categories = Array.from(catMap.entries()).map(([cat, v]) => ({
      category: cat,
      income: v.income,
      expense: v.expense,
      net: v.income - v.expense,
      count: v.count,
    })).sort((a, b) => (b.income + b.expense) - (a.income + a.expense));

    // Top vendors
    const vendorMap = new Map<string, { total: number; count: number; type: string }>();
    txns.forEach(t => {
      const vendor = t.metadata?.vendor || 'Unknown';
      const cur = vendorMap.get(vendor) || { total: 0, count: 0, type: t.type };
      cur.total += t.amount;
      cur.count++;
      vendorMap.set(vendor, cur);
    });
    const topVendors = Array.from(vendorMap.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Expense pie for financial report
    const expensePie = categoryBreakdown.map((c, i) => ({
      name: c.category,
      value: c.amount,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));

    // Income by category
    const incomeByCat = txns
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    const incomePie = Object.entries(incomeByCat)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value);

    // Running balance over time
    const sorted = [...txns].sort((a, b) => a._date.getTime() - b._date.getTime());
    let runBal = 0;
    const balanceOverTime = sorted.map(t => {
      runBal += t.type === 'income' ? t.amount : -t.amount;
      return { name: t.date, balance: runBal };
    });

    // Cumulative monthly
    let cumIncome = 0, cumExpense = 0;
    const cumulativeMonthly = monthlyAgg.map(m => {
      cumIncome += m.income;
      cumExpense += m.expenses;
      return { name: m.name, income: cumIncome, expenses: cumExpense, net: cumIncome - cumExpense };
    });

    // Daily transaction count for heatmap-style
    const dailyMap = new Map<string, number>();
    txns.forEach(t => {
      const k = t._date.toISOString().slice(0, 10);
      dailyMap.set(k, (dailyMap.get(k) || 0) + 1);
    });

    // Average transaction size
    const avgIncome = txns.filter(t => t.type === 'income').length > 0
      ? txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) / txns.filter(t => t.type === 'income').length
      : 0;
    const avgExpense = txns.filter(t => t.type === 'expense').length > 0
      ? txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) / txns.filter(t => t.type === 'expense').length
      : 0;

    // Largest transactions
    const largestIncome = [...txns].filter(t => t.type === 'income').sort((a, b) => b.amount - a.amount).slice(0, 5);
    const largestExpenses = [...txns].filter(t => t.type === 'expense').sort((a, b) => b.amount - a.amount).slice(0, 5);

    return {
      txns, monthlyAgg, weeklyAgg, categories, topVendors,
      expensePie, incomePie, balanceOverTime, cumulativeMonthly,
      avgIncome, avgExpense, largestIncome, largestExpenses,
    };
  }, [transactions, categoryBreakdown]);

  // ─── PDF Generators ────────────────────────
  const generateFinancialPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Financial Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.setFontSize(14);
    doc.text('2K AI Accounting Systems', 14, 42);

    // Summary
    doc.setFontSize(12);
    doc.text('Financial Summary', 14, 56);
    doc.setFontSize(10);
    doc.text(`Total Income: ${fmt(totalIncome)}`, 14, 64);
    doc.text(`Total Expenses: ${fmt(totalExpenses)}`, 14, 72);
    doc.setTextColor(totalBalance >= 0 ? 34 : 239, totalBalance >= 0 ? 197 : 68, totalBalance >= 0 ? 94 : 68);
    doc.text(`Net Balance: ${fmt(totalBalance)}`, 14, 80);
    doc.setTextColor(0, 0, 0);

    // Monthly table
    autoTable(doc, {
      startY: 90,
      head: [['Month', 'Income', 'Expenses', 'Net']],
      body: enriched.monthlyAgg.map(m => [m.name, fmt(m.income), fmt(m.expenses), fmt(m.net)]),
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
    });

    // Expense categories
    const y2 = (doc as any).lastAutoTable.finalY + 10;
    autoTable(doc, {
      startY: y2,
      head: [['Category', 'Amount', '% of Total']],
      body: enriched.expensePie.map(c => [
        c.name,
        fmt(c.value),
        `${totalExpenses > 0 ? ((c.value / totalExpenses) * 100).toFixed(1) : 0}%`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] },
    });

    addPDFFooter(doc);
    doc.save('financial_report.pdf');
    toast.success('Financial Report PDF downloaded');
  };

  const generateTransactionsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Transaction Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}  |  ${transactions.length} transactions`, 14, 30);
    doc.setFontSize(14);
    doc.text('2K AI Accounting Systems', 14, 42);

    autoTable(doc, {
      startY: 52,
      head: [['Date', 'Category', 'Description', 'Type', 'Amount']],
      body: enriched.txns.map(t => [
        t.date,
        t.category,
        t.description.slice(0, 30),
        t.type === 'income' ? 'Income' : 'Expense',
        fmt(t.amount),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.textColor = data.cell.raw === 'Income' ? [34, 197, 94] : [239, 68, 68];
        }
      },
    });

    addPDFFooter(doc);
    doc.save('transaction_report.pdf');
    toast.success('Transaction Report PDF downloaded');
  };

  const generateCustomPDF = (filters: { type?: string; category?: string; dateFrom?: string; dateTo?: string }) => {
    let filtered = [...enriched.txns];
    if (filters.type && filters.type !== 'all') filtered = filtered.filter(t => t.type === filters.type);
    if (filters.category && filters.category !== 'all') filtered = filtered.filter(t => t.category === filters.category);
    if (filters.dateFrom) filtered = filtered.filter(t => t._date >= new Date(filters.dateFrom!));
    if (filters.dateTo) filtered = filtered.filter(t => t._date <= new Date(filters.dateTo!));

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Custom Report', 14, 22);
    doc.setFontSize(11);
    const filterDesc = [
      filters.type && filters.type !== 'all' ? `Type: ${filters.type}` : null,
      filters.category && filters.category !== 'all' ? `Category: ${filters.category}` : null,
      filters.dateFrom ? `From: ${filters.dateFrom}` : null,
      filters.dateTo ? `To: ${filters.dateTo}` : null,
    ].filter(Boolean).join('  |  ') || 'All transactions';
    doc.text(`Filters: ${filterDesc}`, 14, 30);
    doc.text(`${filtered.length} transactions found  |  Generated: ${new Date().toLocaleDateString()}`, 14, 38);

    const fInc = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const fExp = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    doc.setFontSize(10);
    doc.text(`Income: ${fmt(fInc)}   Expenses: ${fmt(fExp)}   Net: ${fmt(fInc - fExp)}`, 14, 48);

    autoTable(doc, {
      startY: 56,
      head: [['Date', 'Category', 'Description', 'Type', 'Amount']],
      body: filtered.map(t => [t.date, t.category, t.description.slice(0, 30), t.type, fmt(t.amount)]),
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] },
    });

    addPDFFooter(doc);
    doc.save('custom_report.pdf');
    toast.success('Custom Report PDF downloaded');
  };

  function addPDFFooter(doc: jsPDF) {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text('2K AI Accounting Systems — Confidential', 14, doc.internal.pageSize.height - 10);
      doc.text(`Page ${i}/${pages}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    }
  }

  // ─── Render ────────────────────────────────
  return (
    <PageLayout title="Reports & Analytics" subtitle="Comprehensive financial analysis, transaction breakdown, and custom reporting">
      <ScrollableContent>
      <SubscriptionGuard feature="advancedReports" action="access Advanced Reports">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="financial" className="gap-2 text-sm font-medium">
            <BarChart3 className="h-4 w-4" /> Financial Reports
          </TabsTrigger>
          <TabsTrigger value="transaction" className="gap-2 text-sm font-medium">
            <ArrowsUpDown className="h-4 w-4" /> Transaction Reports
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-2 text-sm font-medium">
            <Layers className="h-4 w-4" /> Custom Reports
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════ */}
        {/* FINANCIAL REPORTS TAB                    */}
        {/* ════════════════════════════════════════ */}
        <TabsContent value="financial" className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard icon={<DollarSign className="h-5 w-5" />} label="Total Income" value={fmt(totalIncome)} trend={incomeGrowth} color="green" />
            <KPICard icon={<Wallet className="h-5 w-5" />} label="Total Expenses" value={fmt(totalExpenses)} trend={expenseGrowth} color="red" invertTrend />
            <KPICard icon={<TrendingUp className="h-5 w-5" />} label="Net Profit" value={fmt(totalBalance)} color={totalBalance >= 0 ? 'green' : 'red'} />
            <KPICard icon={<Receipt className="h-5 w-5" />} label="Transactions" value={String(transactions.length)} color="indigo" />
          </div>

          {/* Income vs Expenses line chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Income vs Expenses Trend</CardTitle>
                <CardDescription>Monthly comparison over time</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={generateFinancialPDF}>
                <Download className="h-4 w-4 mr-1" /> Export PDF
              </Button>
            </CardHeader>
            <CardContent className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={enriched.monthlyAgg}>
                  <defs>
                    <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={INCOME_COLOR} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={INCOME_COLOR} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={EXPENSE_COLOR} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={EXPENSE_COLOR} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => fmt(v).replace(/\.\d+/, '')} tick={{ fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip fmt={fmt} />} />
                  <Legend />
                  <Area type="monotone" dataKey="income" name="Income" stroke={INCOME_COLOR} fill="url(#incG)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke={EXPENSE_COLOR} fill="url(#expG)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Net Profit bar + Expense pie side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly net profit bar chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Net Profit/Loss</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={enriched.monthlyAgg}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => fmt(v).replace(/\.\d+/, '')} tick={{ fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip fmt={fmt} />} />
                    <Bar dataKey="net" name="Net Profit" radius={[4, 4, 0, 0]}>
                      {enriched.monthlyAgg.map((entry, i) => (
                        <Cell key={i} fill={entry.net >= 0 ? INCOME_COLOR : EXPENSE_COLOR} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expense breakdown pie chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {enriched.expensePie.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={enriched.expensePie}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={{ strokeWidth: 1 }}
                      >
                        {enriched.expensePie.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">No expense data</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Income pie + cumulative chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Income Sources</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {enriched.incomePie.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={enriched.incomePie} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {enriched.incomePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">No income data</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cumulative Cash Flow</CardTitle>
                <CardDescription>Running total over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={enriched.cumulativeMonthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => fmt(v).replace(/\.\d+/, '')} tick={{ fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip fmt={fmt} />} />
                    <Area type="monotone" dataKey="net" name="Net Cash Flow" stroke={NET_COLOR} fill={NET_COLOR} fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickLink to="/cash-book" icon={<Book className="h-4 w-4" />} title="Cash Book" color="indigo" />
            <QuickLink to="/payroll" icon={<Users className="h-4 w-4" />} title="Payroll Reports" color="purple" />
            <QuickLink to="/income-statement" icon={<FileText className="h-4 w-4" />} title="Income Statement" color="blue" />
            <QuickLink to="/balance-sheet" icon={<Layers className="h-4 w-4" />} title="Balance Sheet" color="emerald" />
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════ */}
        {/* TRANSACTION REPORTS TAB                  */}
        {/* ════════════════════════════════════════ */}
        <TabsContent value="transaction" className="space-y-6">
          <TransactionReports
            enriched={enriched}
            fmt={fmt}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            generatePDF={generateTransactionsPDF}
          />
        </TabsContent>

        {/* ════════════════════════════════════════ */}
        {/* CUSTOM REPORTS TAB                       */}
        {/* ════════════════════════════════════════ */}
        <TabsContent value="custom" className="space-y-6">
          <CustomReports enriched={enriched} fmt={fmt} generatePDF={generateCustomPDF} />
        </TabsContent>
      </Tabs>
      </SubscriptionGuard>
      </ScrollableContent>
    </PageLayout>
  );
}


// ═══════════════════════════════════════════════
// ─── KPI Card sub-component ──────────────────
// ═══════════════════════════════════════════════

function KPICard({ icon, label, value, trend, color, invertTrend }: {
  icon: React.ReactNode; label: string; value: string;
  trend?: number; color: string; invertTrend?: boolean;
}) {
  const colorMap: Record<string, string> = {
    green: 'from-green-500/10 to-green-500/5 text-green-700 dark:text-green-400',
    red: 'from-red-500/10 to-red-500/5 text-red-700 dark:text-red-400',
    indigo: 'from-indigo-500/10 to-indigo-500/5 text-indigo-700 dark:text-indigo-400',
    purple: 'from-purple-500/10 to-purple-500/5 text-purple-700 dark:text-purple-400',
  };
  const iconBg: Record<string, string> = {
    green: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
  };
  const isPositiveTrend = invertTrend ? (trend ?? 0) <= 0 : (trend ?? 0) >= 0;

  return (
    <Card className={cn('bg-gradient-to-br border-0 shadow-sm', colorMap[color] || colorMap.indigo)}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className={cn('p-2 rounded-lg', iconBg[color] || iconBg.indigo)}>{icon}</div>
          {trend !== undefined && (
            <Badge variant="outline" className={cn('text-xs', isPositiveTrend ? 'border-green-300 text-green-700 dark:text-green-400' : 'border-red-300 text-red-700 dark:text-red-400')}>
              {isPositiveTrend ? <ChevronUp className="h-3 w-3 mr-0.5" /> : <ChevronDown className="h-3 w-3 mr-0.5" />}
              {Math.abs(trend).toFixed(1)}%
            </Badge>
          )}
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs opacity-70 mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}


// ═══════════════════════════════════════════════
// ─── Quick Link card ─────────────────────────
// ═══════════════════════════════════════════════

function QuickLink({ to, icon, title, color }: { to: string; icon: React.ReactNode; title: string; color: string }) {
  const bg: Record<string, string> = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
  };
  return (
    <Link to={to}>
      <Card className="hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer">
        <CardContent className="pt-5 pb-4">
          <p className="text-sm font-medium mb-3">{title}</p>
          <Button size="sm" className={cn('w-full gap-2', bg[color] || bg.indigo)}>
            {icon} <span>View</span> <ArrowRight className="h-3 w-3 ml-auto" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}


// ═══════════════════════════════════════════════
// ─── TRANSACTION REPORTS ─────────────────────
// ═══════════════════════════════════════════════

function TransactionReports({ enriched, fmt, totalIncome, totalExpenses, generatePDF }: {
  enriched: any; fmt: (v: number) => string;
  totalIncome: number; totalExpenses: number;
  generatePDF: () => void;
}) {
  const [sortField, setSortField] = useState<'date' | 'amount' | 'category'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  const sorted = useMemo(() => {
    let list = [...enriched.txns];
    if (filterType !== 'all') list = list.filter((t: any) => t.type === filterType);
    list.sort((a: any, b: any) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a._date.getTime() - b._date.getTime();
      else if (sortField === 'amount') cmp = a.amount - b.amount;
      else cmp = a.category.localeCompare(b.category);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [enriched.txns, filterType, sortField, sortDir]);

  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
    setPage(0);
  };

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={<TrendingUp className="h-5 w-5" />} label="Avg Income" value={fmt(enriched.avgIncome)} color="green" />
        <KPICard icon={<TrendingDown className="h-5 w-5" />} label="Avg Expense" value={fmt(enriched.avgExpense)} color="red" />
        <KPICard icon={<CheckCircle className="h-5 w-5" />} label="Income Txns" value={String(enriched.txns.filter((t: any) => t.type === 'income').length)} color="green" />
        <KPICard icon={<AlertTriangle className="h-5 w-5" />} label="Expense Txns" value={String(enriched.txns.filter((t: any) => t.type === 'expense').length)} color="red" />
      </div>

      {/* Weekly trend + category bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Trend</CardTitle>
            <CardDescription>Last 8 weeks income vs expenses</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={enriched.weeklyAgg} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={v => fmt(v).replace(/\.\d+/, '')} tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip fmt={fmt} />} />
                <Legend />
                <Bar dataKey="income" name="Income" fill={INCOME_COLOR} radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill={EXPENSE_COLOR} radius={[3, 3, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={enriched.categories.slice(0, 8)} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tickFormatter={v => fmt(v).replace(/\.\d+/, '')} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip fmt={fmt} />} />
                <Legend />
                <Bar dataKey="income" name="Income" fill={INCOME_COLOR} radius={[0, 3, 3, 0]} />
                <Bar dataKey="expense" name="Expense" fill={EXPENSE_COLOR} radius={[0, 3, 3, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 income + expense side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" /> Largest Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {enriched.largestIncome.map((t: any, i: number) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-green-600 w-5 text-center">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{t.description}</p>
                      <p className="text-xs text-slate-500">{t.category} · {t.date}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-green-600">{fmt(t.amount)}</span>
                </div>
              ))}
              {enriched.largestIncome.length === 0 && <p className="text-sm text-slate-400">No income transactions</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" /> Largest Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {enriched.largestExpenses.map((t: any, i: number) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-red-600 w-5 text-center">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{t.description}</p>
                      <p className="text-xs text-slate-500">{t.category} · {t.date}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-red-600">{fmt(t.amount)}</span>
                </div>
              ))}
              {enriched.largestExpenses.length === 0 && <p className="text-sm text-slate-400">No expense transactions</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top vendors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Vendors / Payees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {enriched.topVendors.map((v: any, i: number) => {
              const pct = enriched.topVendors[0]?.total > 0 ? (v.total / enriched.topVendors[0].total) * 100 : 0;
              return (
                <div key={v.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-5 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{v.name}</span>
                      <span className="text-sm font-semibold">{fmt(v.total)}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{v.count} txn{v.count > 1 ? 's' : ''}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Full transaction table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">All Transactions</CardTitle>
            <CardDescription>{sorted.length} records</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={v => { setFilterType(v); setPage(0); }}>
              <SelectTrigger className="w-[130px] h-9">
                <Filter className="h-3 w-3 mr-1" /> <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={generatePDF}>
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('date')}>
                    Date {sortField === 'date' && (sortDir === 'asc' ? <ChevronUp className="inline h-3 w-3" /> : <ChevronDown className="inline h-3 w-3" />)}
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('category')}>
                    Category {sortField === 'category' && (sortDir === 'asc' ? <ChevronUp className="inline h-3 w-3" /> : <ChevronDown className="inline h-3 w-3" />)}
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('amount')}>
                    Amount {sortField === 'amount' && (sortDir === 'asc' ? <ChevronUp className="inline h-3 w-3" /> : <ChevronDown className="inline h-3 w-3" />)}
                  </TableHead>
                  <TableHead>Vendor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs whitespace-nowrap">{t.date}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{t.category}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{t.description}</TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', t.type === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900/40' : 'bg-red-100 text-red-700 dark:bg-red-900/40')}>
                        {t.type === 'income' ? 'Income' : 'Expense'}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn('text-right font-semibold text-sm', t.type === 'income' ? 'text-green-600' : 'text-red-600')}>
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{t.metadata?.vendor || '—'}</TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-400">No transactions found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-slate-500">Page {page + 1} of {totalPages}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}


// ═══════════════════════════════════════════════
// ─── CUSTOM REPORTS ──────────────────────────
// ═══════════════════════════════════════════════

function CustomReports({ enriched, fmt, generatePDF }: {
  enriched: any; fmt: (v: number) => string;
  generatePDF: (filters: any) => void;
}) {
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'pie'>('bar');

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    enriched.txns.forEach((t: any) => cats.add(t.category));
    return Array.from(cats).sort();
  }, [enriched.txns]);

  const filtered = useMemo(() => {
    let list = [...enriched.txns];
    if (filterType !== 'all') list = list.filter((t: any) => t.type === filterType);
    if (filterCategory !== 'all') list = list.filter((t: any) => t.category === filterCategory);
    if (dateFrom) list = list.filter((t: any) => t._date >= new Date(dateFrom));
    if (dateTo) list = list.filter((t: any) => t._date <= new Date(dateTo));
    return list;
  }, [enriched.txns, filterType, filterCategory, dateFrom, dateTo]);

  const filteredStats = useMemo(() => {
    const income = filtered.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
    const expense = filtered.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);

    // By category
    const catMap = new Map<string, { income: number; expense: number }>();
    filtered.forEach((t: any) => {
      const cur = catMap.get(t.category) || { income: 0, expense: 0 };
      if (t.type === 'income') cur.income += t.amount;
      else cur.expense += t.amount;
      catMap.set(t.category, cur);
    });
    const byCategory = Array.from(catMap.entries()).map(([cat, v]) => ({
      category: cat, income: v.income, expense: v.expense, total: v.income + v.expense,
    })).sort((a, b) => b.total - a.total);

    // By month
    const monthMap = new Map<string, { income: number; expenses: number }>();
    filtered.forEach((t: any) => {
      const k = monthKey(t._date);
      const cur = monthMap.get(k) || { income: 0, expenses: 0 };
      if (t.type === 'income') cur.income += t.amount;
      else cur.expenses += t.amount;
      monthMap.set(k, cur);
    });
    const byMonth = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ name: monthLabel(k), ...v, net: v.income - v.expenses }));

    // Pie data
    const pieData = byCategory.map((c, i) => ({
      name: c.category, value: c.total, color: CHART_COLORS[i % CHART_COLORS.length],
    }));

    return { income, expense, net: income - expense, count: filtered.length, byCategory, byMonth, pieData };
  }, [filtered]);

  const handleExport = () => {
    generatePDF({ type: filterType, category: filterCategory, dateFrom, dateTo });
  };

  const renderChart = () => {
    if (filteredStats.byMonth.length === 0 && filteredStats.pieData.length === 0) {
      return <div className="flex items-center justify-center h-full text-slate-400">No data for selected filters</div>;
    }

    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={filteredStats.pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={3} dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {filteredStats.pieData.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip formatter={(v: number) => fmt(v)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    const ChartComponent = chartType === 'area' ? AreaChart : chartType === 'line' ? LineChart : RechartsBarChart;
    const DataComponent = chartType === 'area' ? Area : chartType === 'line' ? Line : Bar;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={filteredStats.byMonth}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={v => fmt(v).replace(/\.\d+/, '')} tick={{ fontSize: 11 }} />
          <Tooltip content={<ChartTooltip fmt={fmt} />} />
          <Legend />
          {chartType === 'area' ? (
            <>
              <Area type="monotone" dataKey="income" name="Income" stroke={INCOME_COLOR} fill={INCOME_COLOR} fillOpacity={0.2} strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke={EXPENSE_COLOR} fill={EXPENSE_COLOR} fillOpacity={0.2} strokeWidth={2} />
            </>
          ) : chartType === 'line' ? (
            <>
              <Line type="monotone" dataKey="income" name="Income" stroke={INCOME_COLOR} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="expenses" name="Expenses" stroke={EXPENSE_COLOR} strokeWidth={2} dot={{ r: 4 }} />
            </>
          ) : (
            <>
              <Bar dataKey="income" name="Income" fill={INCOME_COLOR} radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill={EXPENSE_COLOR} radius={[3, 3, 0, 0]} />
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <>
      {/* Filter panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" /> Report Filters
          </CardTitle>
          <CardDescription>Configure your custom report parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Transaction Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income Only</SelectItem>
                  <SelectItem value="expense">Expenses Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date From</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date To</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Chart Type</Label>
              <Select value={chartType} onValueChange={v => setChartType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={() => { setFilterType('all'); setFilterCategory('all'); setDateFrom(''); setDateTo(''); }}>
              Clear Filters
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" /> Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={<DollarSign className="h-5 w-5" />} label="Filtered Income" value={fmt(filteredStats.income)} color="green" />
        <KPICard icon={<Wallet className="h-5 w-5" />} label="Filtered Expenses" value={fmt(filteredStats.expense)} color="red" />
        <KPICard icon={<TrendingUp className="h-5 w-5" />} label="Net Result" value={fmt(filteredStats.net)} color={filteredStats.net >= 0 ? 'green' : 'red'} />
        <KPICard icon={<Receipt className="h-5 w-5" />} label="Matching Txns" value={String(filteredStats.count)} color="indigo" />
      </div>

      {/* Dynamic chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Custom Analysis</CardTitle>
          <CardDescription>
            {filterType !== 'all' ? `${filterType} only` : 'All types'}
            {filterCategory !== 'all' ? ` · ${filterCategory}` : ''}
            {dateFrom ? ` · From ${dateFrom}` : ''}
            {dateTo ? ` · To ${dateTo}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[360px]">
          {renderChart()}
        </CardContent>
      </Card>

      {/* Category breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Income</TableHead>
                  <TableHead className="text-right">Expense</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                  <TableHead>Distribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStats.byCategory.map((c: any) => {
                  const grandTotal = filteredStats.income + filteredStats.expense;
                  const pct = grandTotal > 0 ? ((c.total / grandTotal) * 100) : 0;
                  return (
                    <TableRow key={c.category}>
                      <TableCell className="font-medium">{c.category}</TableCell>
                      <TableCell className="text-right text-green-600">{fmt(c.income)}</TableCell>
                      <TableCell className="text-right text-red-600">{fmt(c.expense)}</TableCell>
                      <TableCell className={cn('text-right font-semibold', c.income - c.expense >= 0 ? 'text-green-600' : 'text-red-600')}>
                        {fmt(c.income - c.expense)}
                      </TableCell>
                      <TableCell className="text-right text-slate-500">{pct.toFixed(1)}%</TableCell>
                      <TableCell className="w-[120px]">
                        <Progress value={pct} className="h-2" />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredStats.byCategory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400">No data matches your filters</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Filtered transactions list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtered Transactions</CardTitle>
          <CardDescription>{filteredStats.count} transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filtered.slice(0, 50).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                    t.type === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-900/40' : 'bg-red-100 text-red-600 dark:bg-red-900/40')}>
                    {t.type === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.description}</p>
                    <p className="text-xs text-slate-500">{t.category} · {t.date}{t.metadata?.vendor ? ` · ${t.metadata.vendor}` : ''}</p>
                  </div>
                </div>
                <span className={cn('font-semibold text-sm shrink-0 ml-3', t.type === 'income' ? 'text-green-600' : 'text-red-600')}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </span>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center py-10 text-slate-400">No transactions match your filters</p>}
            {filtered.length > 50 && <p className="text-center py-2 text-xs text-slate-400">Showing first 50 of {filtered.length} transactions</p>}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
