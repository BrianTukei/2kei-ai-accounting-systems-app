
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, BarChart3 } from 'lucide-react';

export default function QuickActionsCard() {
  return (
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
  );
}
