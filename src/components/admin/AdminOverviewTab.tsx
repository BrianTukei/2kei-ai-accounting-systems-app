
import OverviewChart from '@/components/OverviewChart';

// Mock data for development
const mockSignupData = [
  { date: 'Jan', count: 5 },
  { date: 'Feb', count: 12 },
  { date: 'Mar', count: 8 },
  { date: 'Apr', count: 15 },
  { date: 'May', count: 22 },
  { date: 'Jun', count: 18 },
];

export default function AdminOverviewTab() {
  // Format data for the chart
  const getChartData = () => {
    // Group signups by month and map to the format expected by OverviewChart
    const signupsByMonth = mockSignupData.reduce((acc, { date, count }) => {
      return [...acc, { 
        name: date, 
        income: count, // Use 'income' instead of 'signups'
        expenses: Math.floor(count * 0.3) // Use 'expenses' instead of 'target'
      }];
    }, [] as { name: string; income: number; expenses: number }[]);
    
    return signupsByMonth;
  };
  
  return (
    <OverviewChart 
      data={getChartData()}
      title="User Signup Trends"
      description="Monthly user registration activity"
    />
  );
}
