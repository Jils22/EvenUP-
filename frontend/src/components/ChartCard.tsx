import React from 'react';
import { cn } from '../lib/utils';

interface ChartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function ChartCard({ title, subtitle, children, className, ...props }: ChartCardProps) {
  return (
    <div className={cn("glass border border-border-soft rounded-[20px] flex flex-col", className)} {...props}>
      <div className="flex flex-col gap-1 p-6 border-b border-border-soft">
        <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
        {subtitle && <p className="text-sm text-secondary">{subtitle}</p>}
      </div>
      
      <div className="p-6 flex-1 min-h-[300px]">
        {children}
      </div>
    </div>
  );
}
