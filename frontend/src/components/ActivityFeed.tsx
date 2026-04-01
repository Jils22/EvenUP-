import React from 'react';
import { cn } from '../lib/utils';
import { Receipt, Info, UserPlus, CreditCard } from 'lucide-react';
import { getExpenseCategoryIconProps, inferExpenseCategoryKey, type ExpenseCategoryKey } from '../utils/expenseCategory';

export interface Activity {
  id: string | number;
  type: 'expense' | 'info' | 'join' | 'settlement';
  description: React.ReactNode;
  time: string;
  categoryKey?: ExpenseCategoryKey;
}

interface ActivityFeedProps extends React.HTMLAttributes<HTMLDivElement> {
  activities: Activity[];
}

const icons = {
  expense: { icon: Receipt, color: "text-primary bg-primary/20", border: "border-primary/20" },
  info: { icon: Info, color: "text-secondary bg-white/10", border: "border-border-soft" },
  join: { icon: UserPlus, color: "text-warning bg-warning/20", border: "border-warning/20" },
  settlement: { icon: CreditCard, color: "text-success bg-success/20", border: "border-success/20" },
};

export function ActivityFeed({ activities, className, ...props }: ActivityFeedProps) {
  if (!activities.length) {
    return (
      <div className={cn("glass border border-border-soft rounded-[20px] p-8 text-center", className)}>
        <p className="text-secondary">No activity to show.</p>
      </div>
    );
  }

  return (
    <div className={cn("glass border border-border-soft rounded-[20px] p-6", className)} {...props}>
      <h3 className="font-semibold text-white mb-6">Recent Activity</h3>
      
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        {activities.map((activity) => {
          const expenseCategory =
            activity.type === 'expense'
              ? activity.categoryKey ?? inferExpenseCategoryKey({ title: typeof activity.description === 'string' ? activity.description : undefined })
              : undefined;

          const config = (() => {
            if (activity.type === 'expense') {
              const cat = expenseCategory ?? 'other';
              return {
                icon: getExpenseCategoryIconProps(cat).Icon,
                color: getExpenseCategoryIconProps(cat).colorClass,
                border: getExpenseCategoryIconProps(cat).borderClass,
              };
            }

            return icons[activity.type];
          })();

          const Icon = config.icon;
          
          return (
            <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              
              {/* Timeline marker */}
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110",
                config.color
              )}>
                <Icon className="w-4 h-4" />
              </div>
              
              {/* Content box */}
              <div className={cn(
                "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass p-4 rounded-2xl border transition-colors group-hover:border-white/20",
                config.border
              )}>
                <p className="text-sm text-white mb-1">{activity.description}</p>
                <time className="text-xs text-secondary">{activity.time}</time>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ActivityFeed;
