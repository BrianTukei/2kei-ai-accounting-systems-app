/**
 * InvoiceDashboard.tsx
 * Analytics cards + monthly revenue chart.
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Invoice } from '@/hooks/useInvoices';
import { DollarSign, Clock, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format, parseISO, startOfMonth } from 'date-fns';

interface Props { invoices: Invoice[] }

export function InvoiceDashboard({ invoices }: Props) {
  const { formatCurrency } = useCurrency();

  const stats = useMemo(() => {
    const outstanding = invoices.filter(i => i.status === 'sent');
    const paid        = invoices.filter(i => i.status === 'paid');
    const overdue     = invoices.filter(i => i.status === 'overdue');
    const sum = (list: Invoice[]) => list.reduce((s, i) => s + i.total, 0);
    return {
      outstanding: sum(outstanding),
      paid:        sum(paid),
      overdue:     sum(overdue),
      countOut:    outstanding.length,
      countPaid:   paid.length,
      countOver:   overdue.length,
    };
  }, [invoices]);

  // Monthly revenue (paid invoices grouped by month)
  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    invoices
      .filter(i => i.status === 'paid' && i.paidAt)
      .forEach(i => {
        const key = format(startOfMonth(parseISO(i.paidAt!)), 'MMM yyyy');
        map[key] = (map[key] ?? 0) + i.total;
      });
    return Object.entries(map)
      .map(([month, revenue]) => ({ month, revenue }))
      .slice(-6);
  }, [invoices]);

  const cards = [
    {
      label: 'Outstanding',
      value: formatCurrency(stats.outstanding),
      sub:   `${stats.countOut} invoice${stats.countOut !== 1 ? 's' : ''} sent`,
      icon:  <Clock className="w-5 h-5 text-blue-500" />,
      bg:    'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Paid',
      value: formatCurrency(stats.paid),
      sub:   `${stats.countPaid} invoice${stats.countPaid !== 1 ? 's' : ''} paid`,
      icon:  <CheckCircle className="w-5 h-5 text-green-500" />,
      bg:    'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Overdue',
      value: formatCurrency(stats.overdue),
      sub:   `${stats.countOver} overdue`,
      icon:  <AlertCircle className="w-5 h-5 text-red-500" />,
      bg:    'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'Total Invoiced',
      value: formatCurrency(invoices.reduce((s, i) => s + i.total, 0)),
      sub:   `${invoices.length} total`,
      icon:  <DollarSign className="w-5 h-5 text-primary" />,
      bg:    'bg-primary/5',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className={`${c.bg} border-0 shadow-sm`}>
            <CardContent className="p-4 flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">{c.label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{c.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
              </div>
              <div className="p-2 rounded-lg bg-white/60 dark:bg-white/5">
                {c.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly revenue chart */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Monthly Revenue (Paid Invoices)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
