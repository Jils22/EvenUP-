import React from 'react';
import { cn } from '../../lib/utils';
import { Receipt, Users } from 'lucide-react';

export type EmptyStateKind = 'groups' | 'expenses';

type EmptyStateCardProps = {
  kind: EmptyStateKind;
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
};

function Illustration({ kind }: { kind: EmptyStateKind }) {
  if (kind === 'groups') {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 160 160"
        className="absolute -top-10 -right-10 opacity-30"
      >
        <defs>
          <linearGradient id="g-groups" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9d4edd" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <circle cx="92" cy="44" r="18" fill="none" stroke="url(#g-groups)" strokeWidth="2" />
        <circle cx="52" cy="84" r="26" fill="none" stroke="url(#g-groups)" strokeWidth="2" />
        <path
          d="M38 124c14-18 38-30 62-30s48 12 62 30"
          fill="none"
          stroke="url(#g-groups)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 160 160" className="absolute -top-10 -right-10 opacity-30">
      <defs>
        <linearGradient id="g-expenses" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9d4edd" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect
        x="42"
        y="34"
        width="76"
        height="98"
        rx="12"
        fill="none"
        stroke="url(#g-expenses)"
        strokeWidth="2"
      />
      <path
        d="M58 60h44M58 78h44M58 96h30"
        fill="none"
        stroke="url(#g-expenses)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EmptyStateCard({ kind, title, description, action, className }: EmptyStateCardProps) {
  const Icon = kind === 'groups' ? Users : Receipt;
  const iconColor =
    kind === 'groups' ? 'text-primary bg-primary/20 border-primary/20' : 'text-secondary bg-white/10 border-border-soft';

  return (
    <div
      className={cn(
        'glass border border-border-soft rounded-[20px] p-10 text-center flex flex-col items-center gap-4',
        className
      )}
    >
      <div className="relative">
        <Illustration kind={kind} />
        <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center border', iconColor)}>
          <Icon className="w-7 h-7" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-white">{title}</h3>
      {description && <p className="text-secondary max-w-md">{description}</p>}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

