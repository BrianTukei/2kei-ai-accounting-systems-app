
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, BarChart3, FileText } from 'lucide-react';
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
          Generate Report
        </Button>
        
        <div className="border-t pt-4 mt-2">
          <p className="text-sm text-slate-500 mb-2">Financial Statements</p>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/income-statement')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Income Statement
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/cash-flow')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Cash Flow
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/balance-sheet')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Balance Sheet
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/trial-balance')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Trial Balance
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
