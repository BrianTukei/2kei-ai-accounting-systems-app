
import OverviewChart from '@/components/OverviewChart';
import { useChartData } from '@/hooks/useChartData';

export default function AdminOverviewTab() {
  // Use the custom hook to get formatted chart data
  const { chartData } = useChartData();
  
  return (
    <OverviewChart 
      data={chartData}
      title="User Signup Trends"
      description="Monthly user registration activity"
    />
  );
}
