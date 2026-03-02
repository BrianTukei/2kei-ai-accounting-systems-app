
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

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
    <Card className={cn(
      "fintech-card stat-accent group compact-card",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">{title}</CardTitle>
        {Icon && (
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-400",
            iconClassName || "bg-primary/8 dark:bg-primary/15 text-primary"
          )}>
            <Icon size={16} strokeWidth={2} />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="relative z-10 pt-0">
        <div className="compact-text-2xl font-bold text-foreground tracking-tight mb-1.5 counter-value">{value}</div>
        {(description || trend !== undefined) && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground font-medium truncate">{description}</p>
            {trend !== undefined && trend !== 0 && (
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0 transition-colors",
                isPositive && "bg-success/10 text-success",
                isNegative && "bg-destructive/10 text-destructive"
              )}>
                {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {isPositive && '+'}{trend}%
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
