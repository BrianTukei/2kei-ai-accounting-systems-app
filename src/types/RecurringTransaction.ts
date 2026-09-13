
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  amount: number;
  currency?: string;
  original_amount?: number;
  original_currency?: string;
  originalAmount?: number;
  originalCurrency?: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  nextDate: string;
  active: boolean;
  createdAt: string;
}

export interface RecurringTransactionFormData {
  amount: number;
  currency?: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  frequency: RecurrenceFrequency;
  startDate: string;
}
