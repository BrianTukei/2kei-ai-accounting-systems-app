
import { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import WelcomeHero from '@/components/dashboard/WelcomeHero';
import AdminAccessCard from '@/components/dashboard/AdminAccessCard';
import StatsGrid from '@/components/dashboard/StatsGrid';
import RealTimeStatsCard from '@/components/dashboard/RealTimeStatsCard';
import FinancialPieChart from '@/components/dashboard/FinancialPieChart';
import { AIInsightsPanel } from '@/components/ai/AIInsightsPanel';
import { Transaction } from '@/components/TransactionCard';
import { useTransactions } from '@/hooks/useTransactions';
import { useFinancialStats } from '@/hooks/useFinancialStats';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { transactions, addTransaction } = useTransactions();
  const { monthlyData, categoryBreakdown } = useFinancialStats();
  const { refresh, subscription, plan } = useOrganization();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle payment success redirect
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const planId = searchParams.get('plan');
    
    if (paymentStatus === 'success') {
      console.log('[Dashboard] Payment success detected:', { planId });
      
      // Refresh organization data to get updated subscription
      refresh().then(() => {
        console.log('[Dashboard] Organization data refreshed after payment');
      });
      
      // Show success message
      toast.success(
        `Subscription Activated Successfully!${planId ? ` You're now on the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan.` : ''}`,
        { duration: 5000 }
      );
      
      // Clean up URL params
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams, refresh]);

  // Log subscription status for debugging
  useEffect(() => {
    console.log('[Dashboard] Current subscription state:', {
      subscriptionStatus: subscription?.status,
      planId: plan?.id,
      billingCycle: subscription?.billingCycle,
    });
  }, [subscription, plan]);

  // Prepare pie chart data from category breakdown
  const pieChartColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  const pieChartData = categoryBreakdown.slice(0, 5).map((item, index) => ({
    name: item.category,
    value: item.amount,
    color: pieChartColors[index % pieChartColors.length]
  }));

  // Authentication is handled by `AuthCheck` wrapper which uses Supabase session.
  // Remove localStorage-based check to avoid redirect loops between auth and dashboard.

  // Most recent transactions first
  const recentTransactions = [...transactions].sort((a, b) => {
    return b.id.localeCompare(a.id);
  }).slice(0, 5);

  const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
    addTransaction(transaction);
    toast.success(`New ${transaction.type} added successfully`);
  };

  return (
    <PageLayout 
      title="Dashboard" 
      subtitle="Welcome back! Here's your financial overview."
      showBackButton={false}
      aiContextType="dashboard"
      aiContextData={{
        totalTransactions: transactions.length,
        monthlyData,
        categoryBreakdown,
        recentTransactions: recentTransactions.slice(0, 3) // Pass limited data for context
      }}
    >
        <WelcomeHero />        
          {/* Admin Access Card - only visible to admin */}
          <AdminAccessCard />
          
          <StatsGrid />
          
          <RealTimeStatsCard />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <FinancialPieChart 
              data={pieChartData}
              title="Expense Breakdown"
              description="Your top spending categories"
            />
            <AIInsightsPanel className="h-fit" />
          </div>
          
          <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <DashboardTabs 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              chartData={monthlyData}
              recentTransactions={recentTransactions}
              onAddTransaction={handleAddTransaction}
            />
          </div>
    </PageLayout>
  );
}
