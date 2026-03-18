import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { CurrencyDisplay } from '@/components/currency/MultiCurrencyInput';
import TransactionForm from '@/components/transactions/TransactionForm';
import api from '@/services/api';

/**
 * Transactions Page
 * List, create, and manage transactions
 */
export default function Transactions() {
  const navigate = useNavigate();
  const { company } = useCompany();
  
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    profit: 0,
    count: 0
  });
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
  }, [filters, pagination.page, searchTerm]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.type && { type: filters.type }),
        ...(filters.category && { category: filters.category }),
        ...(filters.status && { status: filters.status }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await api.get(`/transactions?${params}`);
      
      if (response.data.success) {
        setTransactions(response.data.data.transactions);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams({
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await api.get(`/transactions/summary?${params}`);
      
      if (response.data.success) {
        const { summary } = response.data.data;
        setSummary({
          totalIncome: summary.totalIncome || 0,
          totalExpenses: summary.totalExpenses || 0,
          profit: summary.profit || 0,
          count: summary.transactionCount?.reduce((sum, type) => sum + type.count, 0) || 0
        });
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleTransactionCreated = (transaction) => {
    setShowForm(false);
    fetchTransactions();
    fetchSummary();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'income':
        return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case 'expense':
        return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      case 'transfer':
        return <ArrowUpRight className="w-4 h-4 text-blue-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'secondary',
      cleared: 'default',
      reconciled: 'default',
      void: 'destructive',
      disputed: 'destructive'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    );
  };

  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={() => setShowForm(false)}>
            ← Back to Transactions
          </Button>
        </div>
        <TransactionForm onSuccess={handleTransactionCreated} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Manage your income and expenses</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Income</p>
                <p className="text-xl font-bold text-green-600">
                  <CurrencyDisplay amount={summary.totalIncome} currency={company?.baseCurrency?.code} />
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expenses</p>
                <p className="text-xl font-bold text-red-600">
                  <CurrencyDisplay amount={summary.totalExpenses} currency={company?.baseCurrency?.code} />
                </p>
              </div>
              <ArrowDownRight className="w-8 h-8 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className={`text-xl font-bold ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <CurrencyDisplay amount={Math.abs(summary.profit)} currency={company?.baseCurrency?.code} />
                  {summary.profit < 0 && ' (Loss)'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Count</p>
                <p className="text-xl font-bold text-blue-600">{summary.count}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
            </select>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="cleared">Cleared</option>
              <option value="reconciled">Reconciled</option>
            </select>

            {/* Date Filters */}
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="px-3 py-2 border rounded-lg"
              placeholder="Start Date"
            />
            
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="px-3 py-2 border rounded-lg"
              placeholder="End Date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No transactions found</p>
              <p className="text-sm">Start by adding your first transaction</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-sm text-gray-600">
                <div className="col-span-4">Description</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>

              {/* Transaction Rows */}
              {transactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="grid grid-cols-12 gap-4 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/transactions/${transaction._id}`)}
                >
                  <div className="col-span-4 flex items-center gap-3">
                    {getTypeIcon(transaction.type)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {transaction.counterparty?.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <p className="capitalize">{transaction.type}</p>
                    <p className="text-sm text-gray-500">{transaction.category}</p>
                  </div>
                  
                  <div className="col-span-2">
                    <p>{new Date(transaction.transactionDate).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="col-span-2">
                    {getStatusBadge(transaction.status)}
                  </div>
                  
                  <div className="col-span-2 text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      <CurrencyDisplay 
                        amount={transaction.amount.value} 
                        currency={transaction.amount.currency?.code} 
                      />
                    </p>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
