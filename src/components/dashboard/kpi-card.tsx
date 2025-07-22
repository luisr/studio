// src/components/dashboard/kpi-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { formatNumber } from "@/lib/utils/currency";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  className?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const colorClasses = {
  blue: 'border-l-blue-500',
  green: 'border-l-green-500',
  purple: 'border-l-purple-500',
  orange: 'border-l-orange-500',
  red: 'border-l-red-500',
};


export function KpiCard({ title, value, icon: Icon, description, className, color = 'blue' }: KpiCardProps) {

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return formatNumber(val);
    }
    return val;
  };

  return (
    <Card className={cn("border-l-4", colorClasses[color], className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold flex items-center justify-between">
          <span>{formatValue(value)}</span>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
