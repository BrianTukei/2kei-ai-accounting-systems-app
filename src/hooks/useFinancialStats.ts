import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Transaction } from '@/components/TransactionCard';

export interface FinancialStats {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  pendingAmount: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  incomeGrowth: number;
  expenseGrowth: number;
  monthlyData: Array<{
    name: string;
    income: number;
    expenses: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export const useFinancialStats = (): FinancialStats => {
  const { transactions } = useTransactions();
  const { convertAmount, selectedCurrency } = useCurrency();

  return useMemo(() => {
    const displayCode = selectedCurrency.code;

    // Convert each transaction into the currently selected display currency
    const toDisplay = (t: Transaction): number => {
      const amount = Number(
        (t as any).original_amount ?? (t as any).originalAmount ?? t.amount
      ) || 0;
      const from =
        (t as any).original_currency ??
        (t as any).originalCurrency ??
        t.currency ??
        displayCode;
      return convertAmount(amount, from, displayCode);
    };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + toDisplay(t), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + toDisplay(t), 0);

    const totalBalance = totalIncome - totalExpenses;

    const currentMonthTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    const monthlyIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + toDisplay(t), 0);

    const monthlyExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + toDisplay(t), 0);

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const previousMonthTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate.getMonth() === previousMonth &&
        transactionDate.getFullYear() === previousYear
      );
    });

    const previousMonthIncome = previousMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + toDisplay(t), 0);

    const previousMonthExpenses = previousMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + toDisplay(t), 0);

    const incomeGrowth =
      previousMonthIncome > 0
        ? ((monthlyIncome - previousMonthIncome) / previousMonthIncome) * 100
        : 0;

    const expenseGrowth =
      previousMonthExpenses > 0
        ? ((monthlyExpenses - previousMonthExpenses) / previousMonthExpenses) * 100
        : 0;

    const monthlyData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const targetMonth = (currentMonth - i + 12) % 12;
      const targetYear = currentMonth - i < 0 ? currentYear - 1 : currentYear;

      const monthTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return (
          transactionDate.getMonth() === targetMonth &&
          transactionDate.getFullYear() === targetYear
        );
      });

      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + toDisplay(t), 0);

      const monthExpenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + toDisplay(t), 0);

      monthlyData.push({
        name: monthNames[targetMonth],
        income: monthIncome,
        expenses: monthExpenses
      });
    }

    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        const category = transaction.category;
        acc[category] = (acc[category] || 0) + toDisplay(transaction);
        return acc;
      }, {} as Record<string, number>);

    const categoryBreakdown = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const pendingAmount = transactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= sevenDaysAgo;
      })
      .reduce((sum, t) => sum + (t.type === 'income' ? toDisplay(t) : -toDisplay(t)), 0);

    return {
      totalBalance,
      totalIncome,
      totalExpenses,
      pendingAmount: Math.abs(pendingAmount),
      monthlyIncome,
      monthlyExpenses,
      incomeGrowth,
      expenseGrowth,
      monthlyData,
      categoryBreakdown
    };
  }, [transactions, convertAmount, selectedCurrency.code]);
};