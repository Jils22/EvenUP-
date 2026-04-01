import React from 'react';
import { cn } from '../lib/utils';
import { AvatarStack } from './ui/AvatarStack';
import { ChevronRight } from 'lucide-react';
import { AnimatedNumber } from './ui/AnimatedNumber';

interface GroupCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  balance: number; // positive means owed, negative means you owe
  members: Array<{ id: string | number; initials: string; src?: string }>;
}

export function GroupCard({ name, balance, members, className, ...props }: GroupCardProps) {
  const isPositive = balance >= 0;
  
  return (
    <div className={cn("tilt-card-container", className)}>
    <div 
      className={cn(
        "glass border border-border-soft p-6 rounded-[20px] flex flex-col justify-between h-48 group cursor-pointer tilt-card relative overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Subtle background glow effect on hover */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex justify-between items-start z-10">
        <div>
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">{name}</h3>
          <p className="text-xs text-secondary font-medium uppercase tracking-wider">
            {isPositive ? 'You are owed' : 'You owe'}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-secondary group-hover:bg-primary group-hover:text-white transition-colors">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
      
      <div className="flex items-end justify-between z-10">
        <AvatarStack users={members} limit={3} />
        
        <span className={cn(
          "text-2xl font-bold tracking-tight",
          isPositive ? "text-success" : "text-danger"
        )}>
          {isPositive ? '+' : '-'}₹<AnimatedNumber value={Math.abs(balance)} />
        </span>
      </div>
    </div>
    </div>
  );
}
