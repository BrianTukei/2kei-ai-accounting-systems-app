
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
    <Card className={cn("modern-card-hover relative overflow-hidden group backdrop-blur-xl compact-card", className)}>
      <div className="absolute inset-0 bg-gradient-glass opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-xs font-semibold text-foreground/80 tracking-wide uppercase">{title}</CardTitle>
        {Icon && (
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300",
            iconClassName || "bg-gradient-primary/10 text-primary"
          )}>
            <Icon size={16} />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="relative z-10 pt-0">
        <div className="compact-text-2xl font-bold text-foreground tracking-tight mb-1">{value}</div>
        {(description || trend) && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">{description}</p>
            {trend && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-semibold",
                isPositive && "bg-success/10 text-success",
                isNegative && "bg-destructive/10 text-destructive"
              )}>
                {isPositive && '+'}
                {trend}%
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
