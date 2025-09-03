
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: LucideIcon;
  trend?: number;
  className?: string;
  iconClassName?: string;
}

export default function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  className,
  iconClassName
}: StatCardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;
  
  return (
    <Card className={cn("glass-card glass-card-hover overflow-hidden group", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
        {Icon && (
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300",
            iconClassName || "bg-gradient-to-br from-primary/10 to-accent/10 text-primary"
          )}>
            <Icon size={18} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {(description || trend) && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            {trend && (
              <span className={cn(
                "mr-1 text-xs font-medium",
                isPositive && "text-green-500",
                isNegative && "text-red-500"
              )}>
                {isPositive && '+'}
                {trend}%
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
