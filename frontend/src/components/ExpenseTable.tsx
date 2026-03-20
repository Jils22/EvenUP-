import React from 'react';
import { cn } from '../lib/utils';
import { Badge } from './ui/Badge';
import { getExpenseCategoryIconProps, inferExpenseCategoryKey } from '../utils/expenseCategory';

export interface Expense {
  id: string | number;
  title: string;
  amount: number;
  date: string;
  split?: 'equal' | 'exact' | 'percentage';
  splitType?: 'equal' | 'exact' | 'percentage';
  paidBy: string;
  category?: string;
}

interface ExpenseTableProps extends React.HTMLAttributes<HTMLDivElement> {
  expenses: Expense[];
}

export function ExpenseTable({ expenses, className, ...props }: ExpenseTableProps) {
  if (!expenses.length) {
    return (
      <div className={cn("glass border border-border-soft rounded-[20px] p-10 flex flex-col items-center justify-center text-center", className)}>
        <p className="text-secondary font-medium">No expenses to display.</p>
      </div>
    );
  }

  return (
    <div className={cn("glass border border-border-soft rounded-[20px] overflow-hidden", className)} {...props}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 text-secondary">
            <tr>
              <th className="px-6 py-4 font-semibold w-1/3">Transaction</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Paid By</th>
              <th className="px-6 py-4 font-semibold">Split Type</th>
              <th className="px-6 py-4 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 font-medium text-white group-hover:text-primary transition-colors">
                  {(() => {
                    const categoryKey = inferExpenseCategoryKey({ title: expense.title, category: expense.category });
                    const iconProps = getExpenseCategoryIconProps(categoryKey);
                    const Icon = iconProps.Icon;
                    return (
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-xl flex items-center justify-center border',
                            iconProps.containerBgClass
                          )}
                          aria-hidden="true"
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{expense.title}</div>
                          {categoryKey !== 'other' ? (
                            <div className="text-xs text-secondary mt-0.5">{iconProps.label}</div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 text-secondary">
                  {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                      {expense.paidBy.charAt(0)}
                    </div>
                    <span className="text-white">{expense.paidBy}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {(() => {
                    const split = expense.split ?? expense.splitType ?? 'equal';
                    const badgeVariant = split === 'equal' ? 'primary' : 'warning';
                    return (
                      <Badge variant={badgeVariant}>
                        {split}
                      </Badge>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 text-right font-bold text-white">
                  ${expense.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
