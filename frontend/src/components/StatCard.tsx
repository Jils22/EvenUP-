import React from 'react';
import { cn } from '../lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  valueColor?: string; // e.g. 'text-success' or 'text-danger'
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  valueColor = "text-white", 
  className, 
  ...props 
}: StatCardProps) {
  return (
    <div 
      className={cn(
        "glass border border-border-soft p-6 rounded-[20px] flex flex-col gap-3 transition-transform hover:-translate-y-1 hover:shadow-2xl", 
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-secondary text-sm font-medium tracking-wide">{title}</span>
        {Icon && (
          <div className="p-2 bg-white/5 rounded-xl text-primary">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-3">
        <span className={cn("text-3xl font-bold tracking-tight", valueColor)}>
          {value}
        </span>
        
        {trend && (
          <span 
            className={cn(
              "text-sm font-semibold flex items-center gap-1",
              trend.isPositive ? "text-success" : "text-danger"
            )}
          >
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
}
