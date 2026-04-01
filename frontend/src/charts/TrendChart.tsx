import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAnalytics } from '../hooks/useExpenses';
import { Loader2 } from 'lucide-react';

export function TrendChart() {
  const { data: analytics, isLoading } = useAnalytics();

  if (isLoading) return (
    <div className="w-full min-h-[300px] flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );

  const data = analytics?.trend_data && analytics.trend_data.length > 0
    ? analytics.trend_data
    : [{ name: 'No data', amount: 0 }];

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C08FF5" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#C08FF5" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#6F7D97" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#6F7D97" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#101C36', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
            itemStyle={{ color: '#fff' }}
            formatter={(v: number) => [`₹${v.toFixed(2)}`, 'Your Share']}
          />
          <Area type="monotone" dataKey="amount" name="Your Spend" stroke="#C08FF5" fillOpacity={1} fill="url(#colorAmount)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
