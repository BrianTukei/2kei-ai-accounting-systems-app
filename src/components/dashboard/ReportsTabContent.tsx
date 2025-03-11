
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportsTabContent() {
  return (
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
  );
}
