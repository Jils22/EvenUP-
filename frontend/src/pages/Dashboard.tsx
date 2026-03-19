import { useAuth } from '../context/AuthContext';
import { useGroups } from '../hooks/useGroups';
import { useBalances, useGroupExpenses } from '../hooks/useExpenses';
import { useSettlements } from '../hooks/useSettlements';
import { useGlobalActivity } from '../hooks/useActivity';
import { StatCard } from '../components/StatCard';
import { ChartCard } from '../components/ChartCard';
import { GroupCard } from '../components/GroupCard';
import { ExpenseTable } from '../components/ExpenseTable';
import { SettlementCard } from '../components/SettlementCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { TrendChart } from '../charts/TrendChart';
import { CategoryChart } from '../charts/CategoryChart';
import { PrimaryButton } from '../components/ui/Button';
import { Plus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const { data: balances, isLoading: balancesLoading } = useBalances();
  const { data: settlements, isLoading: settlementsLoading } = useSettlements();
  const { data: activities, isLoading: activitiesLoading } = useGlobalActivity();

  // Pick the first group to show 'Recent Expenses' just as an example since there is no global expenses API yet
  const firstGroupId = groups?.[0]?.id || '';
  const { data: recentExpenses } = useGroupExpenses(firstGroupId);

  const isOverallLoading = groupsLoading || balancesLoading;

  // Derive top level statistics safely mapping from Balances array
  // Fallback to 0 if API layout is missing aggregates
  const globalBalance = balances?.find(b => !b.userId) || {
    totalOwed: balances?.reduce((acc, b) => acc + (b.totalOwed || 0), 0) || 0,
    totalOwedToYou: balances?.reduce((acc, b) => acc + (b.totalOwedToYou || 0), 0) || 0,
    netBalance: balances?.reduce((acc, b) => acc + (b.netBalance || 0), 0) || 0,
  };

  if (isOverallLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome, {user?.name.split(' ')[0] || 'User'}!</h1>
          <p className="text-secondary mt-1">Here is a financial overview of your groups and spending.</p>
        </div>
        <PrimaryButton className="gap-2 shadow-[0_0_20px_rgba(192,143,245,0.4)] px-5">
          <Plus className="w-4 h-4" /> Add Expense
        </PrimaryButton>
      </div>
      
      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="You owe" 
          value={`$${globalBalance.totalOwed.toFixed(2)}`} 
          valueColor="text-danger" 
        />
        <StatCard 
          title="You are owed" 
          value={`$${globalBalance.totalOwedToYou.toFixed(2)}`} 
          valueColor="text-success" 
        />
        <StatCard 
          title="Net Balance" 
          value={`${globalBalance.netBalance >= 0 ? '+' : '-'}$${Math.abs(globalBalance.netBalance).toFixed(2)}`} 
          valueColor={globalBalance.netBalance >= 0 ? 'text-success' : 'text-danger'} 
        />
        <StatCard 
          title="Total Groups" 
          value={(groups?.length || 0).toString()} 
          valueColor="text-primary" 
        />
      </div>
      
      {/* Charts Row - Left as placeholder visual derivations since analytics API is missing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 opacity-60 hover:opacity-100 transition duration-500">
         <ChartCard title="Spending Trend (Demo)" subtitle="Charts await dedicated API" className="lg:col-span-2 relative">
            <div className="absolute top-2 right-4 text-xs font-bold bg-warning/20 text-warning px-2 py-1 rounded-md">Mock Data</div>
            <TrendChart />
         </ChartCard>
         <ChartCard title="Top Categories (Demo)" subtitle="Derived data pending" className="relative">
            <div className="absolute top-2 right-4 text-xs font-bold bg-warning/20 text-warning px-2 py-1 rounded-md">Mock Data</div>
            <CategoryChart />
         </ChartCard>
      </div>

      {/* Main Bottom Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column Component Stack */}
        <div className="xl:col-span-2 space-y-8">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Active Groups</h2>
              <Link to="/groups" className="text-sm font-medium text-primary hover:text-white transition-colors">View All</Link>
            </div>
            {groups?.length === 0 ? (
               <div className="glass border border-border-soft p-6 text-center rounded-[20px] text-secondary">
                 You don't have any groups yet.
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups?.slice(0, 4).map(group => {
                  const groupBalance = balances?.find(b => b.userId === group.id)?.netBalance || 0;
                  return (
                    <Link key={group.id} to={`/groups/${group.id}`} className="block">
                      <GroupCard 
                        name={group.name}
                        balance={groupBalance}
                        members={group.members.map(m => ({ id: m.userId, initials: m.initials, src: m.avatarUrl }))}
                      />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Recent Expenses</h2>
              <Link to="/expenses" className="text-sm font-medium text-primary hover:text-white transition-colors">See History</Link>
            </div>
            {!firstGroupId ? (
               <div className="glass border border-border-soft p-6 text-center rounded-[20px] text-secondary">
                 Create a group to record expenses.
               </div>
            ) : recentExpenses?.length === 0 ? (
               <div className="glass border border-border-soft p-6 text-center rounded-[20px] text-secondary">
                 No expenses logged in your primary group.
               </div>
            ) : (
               <ExpenseTable expenses={recentExpenses?.slice(0, 4) || []} />
            )}
          </div>

        </div>

        {/* Right Sidebar Stack */}
        <div className="space-y-8">
          
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Pending Settlements</h2>
            <div className="flex flex-col gap-4">
              {settlementsLoading ? (
                 <Loader2 className="animate-spin text-primary mx-auto my-4 w-6 h-6" />
              ) : settlements?.length === 0 ? (
                 <div className="glass border border-border-soft p-6 text-center rounded-[20px] text-secondary">
                   You are fully settled up!
                 </div>
              ) : (
                settlements?.slice(0, 4).map(settle => (
                  <SettlementCard 
                    key={settle.id}
                    // Mapping dynamic structure again
                    fromUser={{ name: `User ${settle.fromUserId.slice(-4)}`, initials: 'U' }}
                    toUser={{ name: `User ${settle.toUserId.slice(-4)}`, initials: 'U' }}
                    amount={settle.amount}
                    type={settle.status === 'pending' ? 'owes' : 'owed'}
                    onSettle={() => console.log('Settle clicked')}
                    onRemind={() => console.log('Remind clicked')}
                  />
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Activity Feed</h2>
            <div className="glass border border-border-soft p-6 rounded-[20px]">
              {activitiesLoading ? (
                 <Loader2 className="animate-spin text-primary mx-auto my-4 w-6 h-6" />
              ) : activities?.length === 0 ? (
                 <p className="text-secondary text-center">No recent global activity.</p>
              ) : (
                 <ActivityFeed activities={activities?.slice(0, 6) || []} />
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
