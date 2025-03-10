
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowUpRight, ArrowDownLeft, DollarSign, CreditCard, BarChart3, Plus } from 'lucide-react';
import Navbar from '@/components/Navbar';
import StatCard from '@/components/StatCard';
import TransactionCard, { Transaction } from '@/components/TransactionCard';
import OverviewChart from '@/components/OverviewChart';

// Mock data
const chartData = [
  { name: 'Jan', income: 4000, expenses: 2400 },
  { name: 'Feb', income: 3000, expenses: 1398 },
  { name: 'Mar', income: 5000, expenses: 3800 },
  { name: 'Apr', income: 2780, expenses: 3908 },
  { name: 'May', income: 5890, expenses: 4800 },
  { name: 'Jun', income: 3390, expenses: 2800 },
  { name: 'Jul', income: 4490, expenses: 3300 },
];

const recentTransactions: Transaction[] = [
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
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight animate-fade-in">
              Dashboard
            </h1>
            <p className="text-slate-500 animate-fade-in">
              Welcome back! Here's your financial overview.
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-2 animate-fade-in">
            <Button className="rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </Button>
          </div>
        </div>
        
        <Tabs 
          defaultValue="overview" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="glass-effect border border-slate-200/50 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 animate-scale-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Balance" 
                value="$12,580.00" 
                description="Updated just now" 
                icon={DollarSign}
                iconClassName="bg-blue-100 text-blue-600"
              />
              <StatCard 
                title="Income" 
                value="$8,320.00" 
                description="This month" 
                trend={12}
                icon={ArrowUpRight}
                iconClassName="bg-green-100 text-green-600"
              />
              <StatCard 
                title="Expenses" 
                value="$3,250.00" 
                description="This month" 
                trend={-8}
                icon={ArrowDownLeft}
                iconClassName="bg-red-100 text-red-600"
              />
              <StatCard 
                title="Pending" 
                value="$1,750.00" 
                description="In transit" 
                icon={CreditCard}
                iconClassName="bg-amber-100 text-amber-600"
              />
            </div>
            
            {/* Chart Section */}
            <OverviewChart 
              data={chartData}
              title="Income vs Expenses"
              description="Financial performance over time"
            />
            
            {/* Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="glass-card glass-card-hover lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Your latest financial activity</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild className="rounded-full">
                    <Link to="/transactions">
                      View All
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTransactions.slice(0, 4).map((transaction) => (
                      <TransactionCard 
                        key={transaction.id} 
                        transaction={transaction} 
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card glass-card-hover">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Add Income', icon: ArrowUpRight, color: 'bg-green-50 text-green-600 border-green-100' },
                    { label: 'Add Expense', icon: ArrowDownLeft, color: 'bg-red-50 text-red-600 border-red-100' },
                    { label: 'Generate Report', icon: BarChart3, color: 'bg-blue-50 text-blue-600 border-blue-100' },
                  ].map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className={`w-full justify-start p-3 ${action.color} hover:bg-opacity-80`}
                    >
                      <action.icon className="h-5 w-5 mr-2" />
                      {action.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="transactions" className="animate-scale-in">
            <Card className="glass-card glass-card-hover">
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>View and manage your financial activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <TransactionCard 
                      key={transaction.id} 
                      transaction={transaction} 
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports" className="animate-scale-in">
            <Card className="glass-card glass-card-hover">
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
                <CardDescription>Generate and analyze your financial data</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-slate-500">
                  Report functionality will be available in the next update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
