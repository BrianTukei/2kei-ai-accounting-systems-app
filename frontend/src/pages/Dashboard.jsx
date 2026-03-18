import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { CurrencyDisplay } from '@/components/currency/MultiCurrencyInput';
import api from '@/services/api';

/**
 * Dashboard Component
 * Main dashboard with overview statistics and charts
 */
export default function Dashboard() {
  const { company } = useCompany();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    profit: 0,
    transactionCount: 0,
    recentTransactions: [],
    topCategories: []
  });
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch transaction summary
      const summaryResponse = await api.get(`/transactions/summary?period=${period}`);
      
      if (summaryResponse.data.success) {
        const { summary, categoryBreakdown } = summaryResponse.data.data;
        
        // Fetch recent transactions
        const transactionsResponse = await api.get('/transactions?limit=5');
        
        setStats({
          totalIncome: summary.totalIncome || 0,
          totalExpenses: summary.totalExpenses || 0,
          profit: summary.profit || 0,
          profitMargin: summary.profitMargin || 0,
          transactionCount: summary.transactionCount?.reduce((sum, type) => sum + type.count, 0) || 0,
          recentTransactions: transactionsResponse.data?.data?.transactions || [],
          topCategories: categoryBreakdown?.slice(0, 5) || []
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getProfitStatus = () => {
    if (stats.profit > 0) return 'positive';
    if (stats.profit < 0) return 'negative';
    return 'neutral';
  };

  const getProfitIcon = () => {
    if (stats.profit > 0) return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (stats.profit < 0) return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user?.firstName}! Here's your financial overview.
          </p>
        </div>
        
        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Income */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  <CurrencyDisplay 
                    amount={stats.totalIncome} 
                    currency={company?.baseCurrency?.code} 
                  />
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  <CurrencyDisplay 
                    amount={stats.totalExpenses} 
                    currency={company?.baseCurrency?.code} 
                  />
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${
                  getProfitStatus() === 'positive' ? 'text-green-600' :
                  getProfitStatus() === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  <CurrencyDisplay 
                    amount={Math.abs(stats.profit)} 
                    currency={company?.baseCurrency?.code} 
                  />
                  {stats.profit < 0 && ' (Loss)'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Margin: {formatPercentage(stats.profitMargin)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                getProfitStatus() === 'positive' ? 'bg-green-100' :
                getProfitStatus() === 'negative' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                {getProfitIcon()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Count */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.transactionCount.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Transactions
              <Button variant="outline" size="sm">
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No transactions yet</p>
                <p className="text-sm">Start by adding your first transaction</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentTransactions.map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{transaction.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        <CurrencyDisplay 
                          amount={transaction.amount.value} 
                          currency={transaction.amount.currency?.code} 
                        />
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.transactionDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No category data yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.topCategories.map((category, index) => (
                  <div key={category._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium capitalize">
                          {category._id.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {category.count} transaction{category.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        <CurrencyDisplay 
                          amount={category.total} 
                          currency={company?.baseCurrency?.code} 
                        />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-auto p-4 flex flex-col items-center gap-2">
              <CreditCard className="w-6 h-6" />
              <span>Add Transaction</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <DollarSign className="w-6 h-6" />
              <span>Create Invoice</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              <span>View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
