
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Book } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsCardProps {
  onAddIncome?: () => void;
  onAddExpense?: () => void;
}

export default function QuickActionsCard({ onAddIncome, onAddExpense }: QuickActionsCardProps) {
  const navigate = useNavigate();
  
  return (
    <Card className="glass-card glass-card-hover">
      <CardHeader>
        <CardTitle>Financial Statements</CardTitle>
        <CardDescription>Access your financial reports</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => navigate('/cash-book')}
        >
          <Book className="h-4 w-4 mr-2" />
          Cash Book
        </Button>
      </CardContent>
    </Card>
  );
}
