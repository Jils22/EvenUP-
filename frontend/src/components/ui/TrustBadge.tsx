import React from 'react';
import { Shield, Award, Star, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TrustBadgeProps {
  score: number; // 0 to 100
  className?: string;
}

export function TrustBadge({ score, className }: TrustBadgeProps) {
  let level = "Newcomer";
  let color = "text-secondary";
  let bg = "bg-secondary/10";
  let border = "border-secondary/20";
  let Icon = Shield;

  if (score >= 90) {
    level = "Platinum Payer";
    color = "text-primary";
    bg = "bg-primary/20";
    border = "border-primary/30";
    Icon = Award;
  } else if (score >= 70) {
    level = "Gold Settler";
    color = "text-warning";
    bg = "bg-warning/10";
    border = "border-warning/20";
    Icon = Star;
  } else if (score >= 40) {
    level = "Quick Payer";
    color = "text-success";
    bg = "bg-success/10";
    border = "border-success/20";
    Icon = Zap;
  }

  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full border glass animate-in fade-in slide-in-from-top-2 duration-700", bg, border, className)}>
      <Icon className={cn("w-3.5 h-3.5", color)} />
      <span className={cn("text-[10px] font-bold uppercase tracking-widest", color)}>
        {level}
      </span>
      <div className="w-1 h-1 rounded-full bg-white/20" />
      <span className="text-[10px] font-bold text-white/70">{score}% Reliability</span>
    </div>
  );
}
