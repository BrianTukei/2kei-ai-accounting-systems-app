import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Transaction } from './TransactionCard';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  transactionToEdit?: Transaction;
}

export default function AddTransactionModal({ 
  isOpen, 
  onClose, 
  onAddTransaction,
  onEditTransaction,
  transactionToEdit 
}: AddTransactionModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  useEffect(() => {
    if (transactionToEdit) {
      setAmount(transactionToEdit.amount.toString());
      setType(transactionToEdit.type);
      setCategory(transactionToEdit.category);
      setDescription(transactionToEdit.description);
    }
  }, [transactionToEdit]);
  
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
    
    if (transactionToEdit && onEditTransaction) {
      onEditTransaction({
        ...transactionToEdit,
        amount: parseFloat(amount),
        type,
        category,
        description
      });
      toast.success('Transaction updated successfully');
    } else {
      onAddTransaction({
        amount: parseFloat(amount),
        type,
        category,
        description,
        date: 'Today'
      });
      toast.success(`${type === 'income' ? 'Income' : 'Expense'} added successfully`);
    }
    
    resetForm();
    onClose();
  };
  
  const resetForm = () => {
    setAmount('');
    setType('income');
    setCategory('');
    setDescription('');
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
            {transactionToEdit ? 'Edit Transaction' : 'Add New Transaction'}
          </DialogTitle>
          <DialogDescription>
            {transactionToEdit 
              ? 'Edit the details of your transaction.'
              : 'Enter the details of your transaction to add it to your records.'
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
            <Label htmlFor="amount">Amount ($)</Label>
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
