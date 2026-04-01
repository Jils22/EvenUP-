import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useAnalytics } from '../hooks/useExpenses';
import { Loader2 } from 'lucide-react';

export function CategoryChart() {
  const { data: analytics, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const data = analytics?.category_data || [];

  if (data.length === 0) {
    return <div className="text-secondary text-sm">No expense data yet</div>;
  }

  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={2}
          >
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#101C36', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Amount']}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', color: '#A8B3C7' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
