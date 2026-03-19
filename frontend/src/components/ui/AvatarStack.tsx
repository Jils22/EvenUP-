import React from 'react';
import { cn } from '../../lib/utils';

interface Avatar {
  id: string | number;
  src?: string;
  initials: string;
}

interface AvatarStackProps extends React.HTMLAttributes<HTMLDivElement> {
  users: Avatar[];
  limit?: number;
}

export function AvatarStack({ users, limit = 4, className, ...props }: AvatarStackProps) {
  const displayedUsers = users.slice(0, limit);
  const excess = users.length - limit;

  return (
    <div className={cn("flex items-center -space-x-3", className)} {...props}>
      {displayedUsers.map((user, i) => (
        <div 
          key={user.id} 
          className="relative inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-background bg-card text-white text-sm font-semibold overflow-hidden z-10 hover:z-20 transition-transform hover:scale-110"
          style={{ zIndex: 10 + limit - i }}
        >
          {user.src ? (
            <img src={user.src} alt={user.initials} className="w-full h-full object-cover" />
          ) : (
            <span>{user.initials}</span>
          )}
        </div>
      ))}
      {excess > 0 && (
        <div 
          className="relative inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-background bg-white/10 text-secondary text-xs font-bold z-0"
        >
          +{excess}
        </div>
      )}
    </div>
  );
}
