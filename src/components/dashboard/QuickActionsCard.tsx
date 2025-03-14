
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsCardProps {
  onAddIncome?: () => void;
  onAddExpense?: () => void;
}

export default function QuickActionsCard({ onAddIncome, onAddExpense }: QuickActionsCardProps) {
  const navigate = useNavigate();
  
  const handleGenerateReport = () => {
    navigate('/reports');
  };
  
  return (
    <Card className="glass-card glass-card-hover">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full justify-start p-3 bg-green-50 text-green-600 border-green-100 hover:bg-opacity-80"
          onClick={onAddIncome}
        >
          <ArrowUpRight className="h-5 w-5 mr-2" />
          Add Income
        </Button>
        
        <Button
          variant="outline"
          className="w-full justify-start p-3 bg-red-50 text-red-600 border-red-100 hover:bg-opacity-80"
          onClick={onAddExpense}
        >
          <ArrowDownLeft className="h-5 w-5 mr-2" />
          Add Expense
        </Button>
        
        <Button
          variant="outline"
          className="w-full justify-start p-3 bg-blue-50 text-blue-600 border-blue-100 hover:bg-opacity-80"
          onClick={handleGenerateReport}
        >
          <BarChart3 className="h-5 w-5 mr-2" />
          Reports & Statements
        </Button>
      </CardContent>
    </Card>
  );
}
