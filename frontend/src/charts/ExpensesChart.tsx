import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { chartData } from '../data/mockData';

export default function ExpensesChart() {
  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C08FF5" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#C08FF5" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#6F7D97" />
          <YAxis stroke="#6F7D97" />
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#101C36', border: '1px solid #ffffff10', borderRadius: '12px' }}
            itemStyle={{ color: '#C08FF5' }}
          />
          <Area type="monotone" dataKey="expenses" stroke="#C08FF5" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
