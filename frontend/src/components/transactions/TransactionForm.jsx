import React, { useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { MultiCurrencyInput } from '@/components/currency/MultiCurrencyInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

/**
 * Transaction Form with Multi-Currency Support
 * Handles creating new transactions with automatic currency conversion
 */
export function TransactionForm({ onSuccess, initialData = null }) {
  const { company } = useCompany();
  const baseCurrency = company?.baseCurrency?.code || 'USD';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: initialData?.type || 'expense',
    amount: initialData?.amount?.value || 0,
    currency: initialData?.amount?.currency?.code || baseCurrency,
    category: initialData?.category || 'other_expense',
    description: initialData?.description || '',
    transactionDate: initialData?.transactionDate 
      ? new Date(initialData.transactionDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    counterparty: {
      name: initialData?.counterparty?.name || ''
    },
    notes: initialData?.notes || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare transaction data with exchange rate info
      const transactionData = {
        type: formData.type,
        amount: {
          value: formData.amount,
          currency: {
            code: formData.currency,
            symbol: getCurrencySymbol(formData.currency)
          }
        },
        // Exchange rate will be calculated on backend
        baseCurrency: baseCurrency,
        category: formData.category,
        description: formData.description,
        transactionDate: formData.transactionDate,
        counterparty: formData.counterparty,
        notes: formData.notes
      };

      const response = await api.post('/transactions', transactionData);
      
      if (response.data.success) {
        toast.success('Transaction created successfully');
        onSuccess?.(response.data.data.transaction);
        
        // Reset form if not editing
        if (!initialData) {
          setFormData({
            type: 'expense',
            amount: 0,
            currency: baseCurrency,
            category: 'other_expense',
            description: '',
            transactionDate: new Date().toISOString().split('T')[0],
            counterparty: { name: '' },
            notes: ''
          });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrencySymbol = (code) => {
    const symbols = {
      USD: '$', EUR: '€', GBP: '£',
      UGX: 'USh', KES: 'KSh', TZS: 'TSh', RWF: 'RF',
      NGN: '₦', GHS: '₵', ZAR: 'R', ZMW: 'ZK'
    };
    return symbols[code] || code;
  };

  const categories = {
    income: [
      { value: 'sales', label: 'Sales' },
      { value: 'services', label: 'Services' },
      { value: 'interest', label: 'Interest' },
      { value: 'rental', label: 'Rental Income' },
      { value: 'refund', label: 'Refund' },
      { value: 'other_income', label: 'Other Income' }
    ],
    expense: [
      { value: 'rent', label: 'Rent' },
      { value: 'utilities', label: 'Utilities' },
      { value: 'salaries', label: 'Salaries' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'office_supplies', label: 'Office Supplies' },
      { value: 'software', label: 'Software' },
      { value: 'travel', label: 'Travel' },
      { value: 'meals', label: 'Meals' },
      { value: 'insurance', label: 'Insurance' },
      { value: 'taxes', label: 'Taxes' },
      { value: 'professional_fees', label: 'Professional Fees' },
      { value: 'equipment', label: 'Equipment' },
      { value: 'other_expense', label: 'Other Expense' }
    ],
    transfer: [
      { value: 'internal_transfer', label: 'Internal Transfer' },
      { value: 'loan_payment', label: 'Loan Payment' }
    ]
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Transaction' : 'New Transaction'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type */}
          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <div className="flex gap-2">
              {['income', 'expense', 'transfer'].map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={formData.type === type ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, type, category: '' }))}
                  className="flex-1 capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Multi-Currency Amount Input */}
          <MultiCurrencyInput
            amount={formData.amount}
            currency={formData.currency}
            onAmountChange={(amount) => setFormData(prev => ({ ...prev, amount }))}
            onCurrencyChange={(currency) => setFormData(prev => ({ ...prev, currency }))}
          />

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(category) => setFormData(prev => ({ ...prev, category }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories[formData.type]?.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter transaction description"
              required
            />
          </div>

          {/* Counterparty */}
          <div className="space-y-2">
            <Label>{formData.type === 'income' ? 'Customer/Client' : 'Vendor/Payee'}</Label>
            <Input
              value={formData.counterparty.name}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                counterparty: { ...prev.counterparty, name: e.target.value }
              }))}
              placeholder="Enter name"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={formData.transactionDate}
              onChange={(e) => setFormData(prev => ({ ...prev, transactionDate: e.target.value }))}
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes (optional)"
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              initialData ? 'Update Transaction' : 'Create Transaction'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default TransactionForm;
