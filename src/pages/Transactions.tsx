
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownLeft, ArrowUpRight, Filter, Plus, Search } from 'lucide-react';
import Navbar from '@/components/Navbar';
import TransactionCard, { Transaction } from '@/components/TransactionCard';

// Mock data for transactions
const allTransactions: Transaction[] = [
  {
    id: '1',
    amount: 2500,
    type: 'income',
    category: 'Sales Revenue',
    description: 'Monthly product sales',
    date: 'Today'
  },
  {
    id: '2',
    amount: 1200,
    type: 'expense',
    category: 'Office Rent',
    description: 'Monthly office space rent',
    date: 'Yesterday'
  },
  {
    id: '3',
    amount: 750,
    type: 'expense',
    category: 'Utilities',
    description: 'Electricity and internet',
    date: '3 days ago'
  },
  {
    id: '4',
    amount: 3200,
    type: 'income',
    category: 'Client Payment',
    description: 'Project completion payment',
    date: '5 days ago'
  },
  {
    id: '5',
    amount: 420,
    type: 'expense',
    category: 'Office Supplies',
    description: 'Stationery and equipment',
    date: '1 week ago'
  },
  {
    id: '6',
    amount: 1800,
    type: 'income',
    category: 'Consulting Fee',
    description: 'Monthly retainer',
    date: '1 week ago'
  },
  {
    id: '7',
    amount: 350,
    type: 'expense',
    category: 'Marketing',
    description: 'Social media ads',
    date: '2 weeks ago'
  },
  {
    id: '8',
    amount: 75,
    type: 'expense',
    category: 'Subscription',
    description: 'Software subscription',
    date: '2 weeks ago'
  },
  {
    id: '9',
    amount: 4500,
    type: 'income',
    category: 'Project Payment',
    description: 'Website development project',
    date: '3 weeks ago'
  },
  {
    id: '10',
    amount: 890,
    type: 'expense',
    category: 'Equipment',
    description: 'New office chair',
    date: '3 weeks ago'
  },
];

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(allTransactions);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (!query) {
      handleFilter(filterType);
      return;
    }
    
    const filtered = allTransactions.filter(
      transaction =>
        transaction.category.toLowerCase().includes(query) ||
        transaction.description.toLowerCase().includes(query)
    );
    
    setTransactions(filtered);
  };

  const handleFilter = (value: string) => {
    setFilterType(value);
    
    if (value === 'all') {
      setTransactions(
        searchQuery
          ? allTransactions.filter(
              t =>
                t.category.toLowerCase().includes(searchQuery) ||
                t.description.toLowerCase().includes(searchQuery)
            )
          : allTransactions
      );
    } else {
      const filtered = allTransactions.filter(
        t =>
          t.type === value &&
          (!searchQuery ||
            t.category.toLowerCase().includes(searchQuery) ||
            t.description.toLowerCase().includes(searchQuery))
      );
      setTransactions(filtered);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight animate-fade-in">
              Transactions
            </h1>
            <p className="text-slate-500 animate-fade-in">
              Manage your income and expenses
            </p>
          </div>
          
          <Button className="mt-4 md:mt-0 rounded-full animate-fade-in">
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </div>
        
        <Card className="glass-card glass-card-hover mb-6 animate-scale-in">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
              
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <Filter className="h-4 w-4 text-slate-500" />
                <Select 
                  onValueChange={handleFilter} 
                  defaultValue="all"
                >
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="income">Income Only</SelectItem>
                    <SelectItem value="expense">Expenses Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-scale-in">
          <Card className="glass-card glass-card-hover">
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle className="text-lg flex items-center">
                <ArrowUpRight className="h-5 w-5 mr-2 text-green-600" />
                Income
              </CardTitle>
              <div className="text-2xl font-bold text-green-600">
                +${allTransactions
                  .filter(t => t.type === 'income')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </div>
            </CardHeader>
          </Card>
          
          <Card className="glass-card glass-card-hover">
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle className="text-lg flex items-center">
                <ArrowDownLeft className="h-5 w-5 mr-2 text-red-600" />
                Expenses
              </CardTitle>
              <div className="text-2xl font-bold text-red-600">
                -${allTransactions
                  .filter(t => t.type === 'expense')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </div>
            </CardHeader>
          </Card>
        </div>
        
        <Card className="glass-card glass-card-hover animate-scale-in">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <TransactionCard 
                    key={transaction.id} 
                    transaction={transaction} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500">No transactions found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
