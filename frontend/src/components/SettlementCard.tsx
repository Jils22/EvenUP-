import React from 'react';
import { cn } from '../lib/utils';
import { PrimaryButton, SecondaryButton } from './ui/Button';

interface SettlementCardProps extends React.HTMLAttributes<HTMLDivElement> {
  fromUser: { name: string; initials: string; src?: string };
  toUser: { name: string; initials: string; src?: string };
  amount: number;
  type: 'owes' | 'owed';
  onSettle?: () => void;
  onRemind?: () => void;
}

export function SettlementCard({ 
  fromUser, 
  toUser, 
  amount, 
  type, 
  onSettle, 
  onRemind, 
  className, 
  ...props 
}: SettlementCardProps) {
  const youOwe = type === 'owes';

  return (
    <div className={cn("glass border border-border-soft p-6 rounded-[20px] flex items-center justify-between", className)} {...props}>
      <div className="flex items-center gap-4">
        {/* User Avatar Source */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-background">
            {fromUser.src ? (
              <img src={fromUser.src} alt={fromUser.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-secondary/20 flex items-center justify-center font-bold text-secondary">
                {fromUser.initials}
              </div>
            )}
          </div>
          {/* Owe direction badge */}
          <div className={cn(
            "absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold",
            youOwe ? "bg-danger text-white" : "bg-success text-card"
          )}>
            {youOwe ? '→' : '←'}
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-secondary text-sm">
            {youOwe ? (
              <>You owe <strong className="text-white">{toUser.name}</strong></>
            ) : (
              <><strong className="text-white">{fromUser.name}</strong> owes you</>
            )}
          </span>
          <span className={cn("text-xl font-bold tracking-tight", youOwe ? "text-danger" : "text-success")}>
            ${amount.toFixed(2)}
          </span>
        </div>
      </div>
      
      <div>
        {youOwe ? (
          <PrimaryButton onClick={onSettle} className="px-5 py-2 text-sm shadow-none">
            Pay Now
          </PrimaryButton>
        ) : (
          <SecondaryButton onClick={onRemind} className="px-5 py-2 text-sm">
            Remind
          </SecondaryButton>
        )}
      </div>
    </div>
  );
}
