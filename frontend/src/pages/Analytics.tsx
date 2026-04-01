import React from 'react';
import { ChartCard } from '../components/ChartCard';
import { TrendChart } from '../charts/TrendChart';
import { CategoryChart } from '../charts/CategoryChart';
import { useAnalytics } from '../hooks/useExpenses';
import { Loader2, TrendingUp, Award, PieChart } from 'lucide-react';

export default function Analytics() {
  const { data: analytics, isLoading } = useAnalytics();

  // Derive insights from real data
  const categories = analytics?.category_data || [];
  const trend = analytics?.trend_data || [];
  const totalSpend = analytics?.total_spend_minor != null ? (analytics.total_spend_minor / 100) : null;

  const topCategory = categories.length > 0
    ? [...categories].sort((a, b) => b.value - a.value)[0]
    : null;

  const topMonth = trend.length > 0
    ? [...trend].sort((a, b) => b.amount - a.amount)[0]
    : null;

  const topCategoryPct = topCategory && totalSpend && totalSpend > 0
    ? Math.round((topCategory.value / totalSpend) * 100)
    : null;

  return (
    <div className="space-y-8 pb-10">
      <div className="border-b border-border-soft pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-secondary mt-1">Deep dive into your spending habits and shared history.</p>
      </div>

      {totalSpend != null && (
        <div className="glass border border-border-soft rounded-2xl p-5 flex items-center gap-4">
          <PieChart className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <p className="text-secondary text-sm">Total tracked spend (your share)</p>
            <p className="text-2xl font-bold text-white">₹{totalSpend.toFixed(2)}</p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Monthly Spending Trend" subtitle="Your expense share over the last 6 months" className="lg:col-span-2 min-h-[400px]">
          <TrendChart />
        </ChartCard>
        
        <ChartCard title="Category Breakdown" subtitle="Where your money goes">
          <CategoryChart />
        </ChartCard>
        
        {/* Insights */}
        <div className="glass border border-border-soft p-8 rounded-[20px] space-y-5">
          <h3 className="text-xl font-bold text-white">Insights</h3>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <ul className="space-y-4">
              {topMonth ? (
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-secondary text-sm">
                    Your highest spend month was <strong className="text-white">{topMonth.name}</strong> at <strong className="text-primary">₹{topMonth.amount.toFixed(2)}</strong>.
                  </p>
                </li>
              ) : (
                <li className="text-secondary text-sm">No trend data yet — add expenses to see monthly insights.</li>
              )}
              {topCategory && topCategoryPct != null && (
                <li className="flex items-start gap-3">
                  <Award className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  <p className="text-secondary text-sm">
                    You spend the most on <strong className="text-white capitalize">{topCategory.name}</strong> — <strong className="text-warning">{topCategoryPct}%</strong> of your total tracked spend.
                  </p>
                </li>
              )}
              {categories.length === 0 && !isLoading && (
                <li className="text-secondary text-sm">No category data yet. Add expenses with categories to see insights here.</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
