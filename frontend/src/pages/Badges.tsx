import React from 'react';
import { useMyBadges } from '../hooks/usePremium';
import { Loader2, Lock } from 'lucide-react';

// Badge category colours for the category label chip
const CAT_STYLES: Record<string, string> = {
  milestone:   'bg-primary/15 text-primary border-primary/30',
  social:      'bg-sky-400/15 text-sky-300 border-sky-400/30',
  spending:    'bg-warning/15 text-warning border-warning/30',
  settlement:  'bg-success/15 text-success border-success/30',
  exploration: 'bg-violet-400/15 text-violet-300 border-violet-400/30',
  streak:      'bg-orange-400/15 text-orange-300 border-orange-400/30',
};

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earned: boolean;
  earned_at: string | null;
}

function BadgeCard({ badge }: { badge: Badge }) {
  const catStyle = CAT_STYLES[badge.category] || 'bg-white/5 text-secondary border-white/10';

  return (
    <div
      className={`
        relative glass border rounded-2xl p-6 flex flex-col items-center gap-3 text-center
        transition-all duration-300 group
        ${badge.earned
          ? 'border-primary/30 shadow-[0_0_20px_rgba(192,143,245,0.12)] hover:shadow-[0_0_30px_rgba(192,143,245,0.22)] hover:-translate-y-1'
          : 'border-white/5 opacity-50 grayscale'}
      `}
    >
      {/* Glow on earned */}
      {badge.earned && (
        <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}

      {/* Icon */}
      <div
        className={`
          text-4xl w-16 h-16 rounded-xl flex items-center justify-center
          ${badge.earned ? 'bg-primary/10' : 'bg-white/5'}
        `}
      >
        {badge.earned ? badge.icon : <Lock className="w-6 h-6 text-secondary/50" />}
      </div>

      {/* Name */}
      <div>
        <h3 className={`font-bold text-base ${badge.earned ? 'text-white' : 'text-secondary/60'}`}>
          {badge.name}
        </h3>
        <p className="text-secondary text-xs mt-1 leading-relaxed">{badge.description}</p>
      </div>

      {/* Category chip */}
      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${catStyle}`}>
        {badge.category}
      </span>

      {/* Earned date */}
      {badge.earned && badge.earned_at && (
        <p className="text-muted text-[10px]">
          Earned {new Date(badge.earned_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

export default function Badges() {
  const { data, isLoading } = useMyBadges();

  const badges: Badge[] = data?.badges || [];
  const earned: number = data?.earned || 0;
  const total: number = data?.total || 0;

  const pct = total > 0 ? Math.round((earned / total) * 100) : 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="border-b border-border-soft pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Badges & Achievements</h1>
        <p className="text-secondary mt-1">Earn badges by being an active and reliable group member.</p>
      </div>

      {/* Progress Card */}
      {!isLoading && total > 0 && (
        <div className="glass border border-border-soft rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-secondary text-sm">Your Progress</p>
              <p className="text-white font-bold text-2xl mt-0.5">
                {earned} <span className="text-secondary font-normal text-lg">/ {total} badges</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-br from-primary to-purple-400">
                {pct}%
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-purple-400 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Badge Grid */}
      {!isLoading && badges.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Show earned first, then locked */}
          {[...badges].sort((a, b) => (b.earned ? 1 : 0) - (a.earned ? 1 : 0)).map(badge => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      )}

      {!isLoading && badges.length === 0 && (
        <div className="glass border border-border-soft rounded-2xl p-12 text-center">
          <p className="text-6xl mb-4">🏅</p>
          <h3 className="text-white font-bold text-xl">No badges yet</h3>
          <p className="text-secondary mt-2 text-sm">Start adding expenses to earn your first badge!</p>
        </div>
      )}
    </div>
  );
}
