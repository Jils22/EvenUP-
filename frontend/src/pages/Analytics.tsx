import React from 'react';
import { ChartCard } from '../components/ChartCard';
import { TrendChart } from '../charts/TrendChart';
import { CategoryChart } from '../charts/CategoryChart';

export default function Analytics() {
  return (
    <div className="space-y-8 pb-10">
       <div className="border-b border-border-soft pb-6">
         <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>
         <p className="text-secondary mt-1">Deep dive into your spending habits and shared history.</p>
       </div>
       
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <ChartCard title="YTD Spending Trends" subtitle="Overall flow of cash this year" className="lg:col-span-2 min-h-[400px]">
           <TrendChart />
         </ChartCard>
         
         <ChartCard title="Expense Breakdown" subtitle="Categories distribution">
           <CategoryChart />
         </ChartCard>
         
         <div className="glass border border-border-soft p-8 rounded-[20px] flex flex-col justify-center space-y-6">
           <h3 className="text-xl font-bold text-white">Insights</h3>
           <ul className="space-y-4 text-secondary leading-relaxed list-disc list-inside">
              <li>Your most expensive month was <strong className="text-primary">March</strong>.</li>
              <li>You spent 45% of your budget on <strong className="text-warning">Housing</strong>.</li>
              <li>You are usually the one paying for <strong className="text-success">Food</strong>.</li>
           </ul>
         </div>
       </div>
    </div>
  );
}
