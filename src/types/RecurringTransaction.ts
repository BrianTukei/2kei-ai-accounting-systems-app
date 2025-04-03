
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  amount: number;
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
  type: 'income' | 'expense';
  category: string;
  description: string;
  frequency: RecurrenceFrequency;
  startDate: string;
}
