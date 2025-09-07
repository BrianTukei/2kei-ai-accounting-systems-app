
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { RecurrenceFrequency, RecurringTransaction, RecurringTransactionFormData } from '@/types/RecurringTransaction';
import { format } from 'date-fns';
import { useCurrency } from '@/contexts/CurrencyContext';

interface RecurringTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecurringTransaction: (transaction: RecurringTransactionFormData) => void;
  onUpdateRecurringTransaction?: (transaction: RecurringTransaction) => void;
  transactionToEdit?: RecurringTransaction;
}

export default function RecurringTransactionModal({ 
  isOpen, 
  onClose, 
  onAddRecurringTransaction,
  onUpdateRecurringTransaction,
  transactionToEdit 
}: RecurringTransactionModalProps) {
  const { getCurrencySymbol } = useCurrency();
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  
  useEffect(() => {
    if (transactionToEdit) {
      setAmount(transactionToEdit.amount.toString());
      setType(transactionToEdit.type);
      setCategory(transactionToEdit.category);
      setDescription(transactionToEdit.description);
      setFrequency(transactionToEdit.frequency);
      setStartDate(transactionToEdit.startDate);
    } else {
      // Reset form when no transaction to edit
      resetForm();
    }
  }, [transactionToEdit, isOpen]);
  
  // Predefined categories based on transaction type
  const incomeCategories = [
    'Salary', 'Sales Revenue', 'Consulting Fee', 'Client Payment', 
    'Project Payment', 'Investment', 'Dividend', 'Interest', 'Other'
  ];
  
  const expenseCategories = [
    'Office Rent', 'Utilities', 'Office Supplies', 'Marketing', 
    'Subscription', 'Equipment', 'Salary', 'Travel', 'Food', 'Other'
  ];
  
  const categories = type === 'income' ? incomeCategories : expenseCategories;
  
  const frequencyOptions: Array<{value: RecurrenceFrequency, label: string}> = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!category) {
      toast.error('Please select a category');
      return;
    }
    
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    
    if (!startDate) {
      toast.error('Please enter a start date');
      return;
    }
    
    if (transactionToEdit && onUpdateRecurringTransaction) {
      onUpdateRecurringTransaction({
        ...transactionToEdit,
        amount: parseFloat(amount),
        type,
        category,
        description,
        frequency,
        startDate
      });
      toast.success('Recurring transaction updated successfully');
    } else {
      onAddRecurringTransaction({
        amount: parseFloat(amount),
        type,
        category,
        description,
        frequency,
        startDate
      });
      toast.success(`Recurring ${type} added successfully`);
    }
    
    resetForm();
    onClose();
  };
  
  const resetForm = () => {
    setAmount('');
    setType('income');
    setCategory('');
    setDescription('');
    setFrequency('monthly');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
  };
  
  const handleTypeChange = (value: string) => {
    setType(value as 'income' | 'expense');
    setCategory(''); // Reset category when type changes
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] glass-card">
        <DialogHeader>
          <DialogTitle>
            {transactionToEdit ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}
          </DialogTitle>
          <DialogDescription>
            {transactionToEdit 
              ? 'Edit your recurring transaction details.'
              : 'Set up a transaction that repeats automatically.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select
              value={type}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({getCurrencySymbol()})</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={setCategory}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(value) => setFrequency(value as RecurrenceFrequency)}
            >
              <SelectTrigger id="frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{transactionToEdit ? 'Update Transaction' : 'Add Transaction'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
