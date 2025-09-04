
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
    <Card className={cn("modern-card-hover relative overflow-hidden group backdrop-blur-xl", className)}>
      <div className="absolute inset-0 bg-gradient-glass opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-semibold text-foreground/80 tracking-wide uppercase">{title}</CardTitle>
        {Icon && (
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-500",
            iconClassName || "bg-gradient-primary/10 text-primary"
          )}>
            <Icon size={20} />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold text-foreground tracking-tight mb-2">{value}</div>
        {(description || trend) && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-medium">{description}</p>
            {trend && (
              <span className={cn(
                "px-2.5 py-1 rounded-full text-xs font-semibold",
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
