import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { trendChartData } from '../data/mockData';

export function TrendChart() {
  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trendChartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPersonal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C08FF5" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#C08FF5" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorShared" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#42E3D0" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#42E3D0" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#6F7D97" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#6F7D97" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#101C36', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
            itemStyle={{ color: '#fff' }}
          />
          <Area type="monotone" dataKey="personal" name="Personal Spend" stroke="#C08FF5" fillOpacity={1} fill="url(#colorPersonal)" strokeWidth={2} />
          <Area type="monotone" dataKey="shared" name="Shared Spend" stroke="#42E3D0" fillOpacity={1} fill="url(#colorShared)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
