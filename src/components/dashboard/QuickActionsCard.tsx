import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Receipt, Repeat, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export default function QuickActionsCard() {
  const actionItems = [
    {
      icon: <Receipt className="h-5 w-5" />,
      title: "Add Transaction",
      description: "Record a new income or expense",
      link: "/transactions"
    },
    {
      icon: <Repeat className="h-5 w-5" />,
      title: "Recurring Transactions",
      description: "Manage automatic transactions",
      link: "/recurring-transactions"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Financial Forecast",
      description: "View future financial projections",
      link: "/forecast"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Generate Report",
      description: "Create a financial report",
      link: "/reports"
    }
  ];

  return (
    <Card className="glass-card glass-card-hover animate-scale-in">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Jump to frequently used features</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {actionItems.map((item, index) => (
          <Link key={index} to={item.link} className="flex items-center space-x-4 p-3 rounded-md hover:bg-secondary transition-colors">
            <div className="rounded-md p-2 bg-muted">
              {item.icon}
            </div>
            <div>
              <h3 className="text-sm font-medium">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
