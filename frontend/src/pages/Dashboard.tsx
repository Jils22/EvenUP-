import { useAuth } from '../context/AuthContext';
import { useGroups } from '../hooks/useGroups';
import { useGroupExpenses, useMyBalances } from '../hooks/useExpenses';
import { StatCard } from '../components/StatCard';
import { ChartCard } from '../components/ChartCard';
import { GroupCard } from '../components/GroupCard';
import { ExpenseTable } from '../components/ExpenseTable';
import { TrendChart } from '../charts/TrendChart';
import { CategoryChart } from '../charts/CategoryChart';
import { PrimaryButton } from '../components/ui/Button';
import { Plus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyStateCard } from '../components/ui/EmptyStateCard';
import { useGlobalActivity } from '../hooks/useActivity';
import ActivityFeed from '../components/ActivityFeed';
import { inferExpenseCategoryKey } from '../utils/expenseCategory';
import { TrustBadge } from '../components/ui/TrustBadge';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: groups, isLoading: groupsLoading } = useGroups();

  // /users/me/balances → aggregate across all groups
  const { data: myBalances } = useMyBalances();

  // Pick the first group to show 'Recent Expenses'
  const firstGroupId = groups?.[0]?.id || '';
  const { data: recentExpenses } = useGroupExpenses(firstGroupId);

  const { data: globalActivity, isLoading: activityLoading } = useGlobalActivity();

  const totalOwed = myBalances ? (myBalances.total_owed_minor / 100).toFixed(2) : null;
  const totalOwedToYou = myBalances ? (myBalances.total_owed_to_you_minor / 100).toFixed(2) : null;
  const netBalance = myBalances ? myBalances.net_minor / 100 : null;

  const isOverallLoading = groupsLoading;

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
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome, {user?.name?.split(' ')[0] ?? 'there'}! 👋</h1>
            <TrustBadge score={85} />
          </div>
          <p className="text-secondary mt-1">Here is a financial overview of your groups and spending.</p>
        </div>
        <Link to="/groups">
          <PrimaryButton className="gap-2 shadow-[0_0_20px_rgba(192,143,245,0.4)] px-5">
            <Plus className="w-4 h-4" /> Add Expense
          </PrimaryButton>
        </Link>
      </div>
      
      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Groups" 
          value={groups?.length || 0} 
          valueColor="text-primary" 
        />
        <StatCard 
          title="You Owe" 
          value={totalOwed !== null ? parseFloat(totalOwed) : 0} 
          valueColor={totalOwed !== null && parseFloat(totalOwed) > 0 ? 'text-danger' : 'text-secondary'} 
        />
        <StatCard 
          title="You Are Owed" 
          value={totalOwedToYou !== null ? parseFloat(totalOwedToYou) : 0} 
          valueColor={totalOwedToYou !== null && parseFloat(totalOwedToYou) > 0 ? 'text-success' : 'text-secondary'} 
        />
        <StatCard 
          title="Net Balance" 
          value={netBalance !== null ? netBalance : 0} 
          valueColor={netBalance !== null ? (netBalance >= 0 ? 'text-success' : 'text-danger') : 'text-secondary'} 
        />
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 transition duration-500">
         <ChartCard title="Spending Trend" subtitle="Overview of your flow" className="lg:col-span-2 relative opacity-60">
            <div className="absolute top-2 right-4 text-xs font-bold bg-warning/20 text-warning px-2 py-1 rounded-md">Coming Soon</div>
            <TrendChart />
         </ChartCard>
         <ChartCard title="Top Categories" subtitle="Real-time breakdown" className="relative">
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
              <EmptyStateCard
                kind="groups"
                title="No groups yet"
                description="Create a group to start splitting expenses with friends."
                action={
                  <Link to="/groups" className="text-primary hover:underline inline-block">
                    Create one!
                  </Link>
                }
              />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups?.slice(0, 4).map(group => (
                <Link key={group.id} to={`/groups/${group.id}`} className="block">
                  <GroupCard 
                    name={group.name}
                    balance={0}
                    members={group.members.map(m => ({
                      id: m.id,
                      initials: m.name ? m.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : m.email[0].toUpperCase(),
                    }))}
                  />
                </Link>
              ))}
            </div>
          )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Recent Expenses</h2>
              <Link to="/expenses" className="text-sm font-medium text-primary hover:text-white transition-colors">See History</Link>
            </div>
            {!firstGroupId ? (
                <EmptyStateCard
                  kind="groups"
                  title="Start by creating a group"
                  description="Once you add a group, you can record expenses and see your activity here."
                  action={
                    <Link to="/groups" className="text-primary hover:underline inline-block">
                      Go to Groups
                    </Link>
                  }
                />
            ) : recentExpenses?.length === 0 ? (
                <EmptyStateCard
                  kind="expenses"
                  title="No expenses yet"
                  description="Add your first record to see it here."
                />
            ) : (
               <ExpenseTable expenses={(recentExpenses?.slice(0, 4) || []).map(exp => {
                 let paidByName = exp.paidBy;
                 const group = groups?.find(g => g.id === exp.groupId);
                 if (group) {
                   const member = group.members?.find(m => m.id === exp.paidBy);
                   if (member && member.name) {
                     paidByName = member.name.split(' ')[0]; // Show first name
                   }
                 }
                 return { ...exp, paidBy: paidByName };
               })} />
            )}
          </div>

          <div className="space-y-4">
            {activityLoading ? (
              <div className="glass border border-border-soft py-20 flex justify-center rounded-[20px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <ActivityFeed
                activities={(globalActivity ?? []).map((a) => {
                  const mappedType =
                    a.event_type === 'expense'
                      ? 'expense'
                      : a.event_type === 'settlement'
                        ? 'settlement'
                        : 'info';

                  const verb = a.verb ? String(a.verb) : '';
                  const data = a.data ?? {};

                  const formatMoneyMinor = (minor: unknown) => {
                    const n = typeof minor === 'string' ? Number(minor) : (minor as number);
                    if (!Number.isFinite(n)) return null;
                    return `₹${(n / 100).toFixed(2)}`;
                  };

                  const titleForExpense =
                    data?.title ??
                    data?.after?.title ??
                    data?.before?.title ??
                    'Expense';

                  const categoryKey = inferExpenseCategoryKey({ title: titleForExpense });

                  const amountForExpense =
                    data?.amount_minor ??
                    data?.after?.amount_minor ??
                    data?.before?.amount_minor;

                  const amountText = mappedType === 'expense' ? formatMoneyMinor(amountForExpense) : formatMoneyMinor(data?.amount_minor ?? data?.after?.amount_minor ?? data?.before?.amount_minor);

                  let description = '';
                  if (mappedType === 'expense') {
                    description = `${titleForExpense}${verb ? ` ${verb}` : ''}${amountText ? ` • ${amountText}` : ''}`;
                  } else if (mappedType === 'settlement') {
                    description = `Settlement${verb ? ` ${verb}` : ''}${amountText ? ` • ${amountText}` : ''}`;
                  } else {
                    description = `${verb ? `${verb} • ` : ''}${a.event_type ?? 'Activity'}`;
                  }

                  const d = new Date(a.created_at);
                  const time = Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return {
                    id: a.id,
                    type: mappedType,
                    description,
                    time,
                    categoryKey: mappedType === 'expense' ? categoryKey : undefined,
                  };
                })}
              />
            )}
          </div>

        </div>

        {/* Right Sidebar Stack */}
        <div className="space-y-8">
          
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Quick Links</h2>
            <div className="flex flex-col gap-3">
              <Link to="/groups" className="glass border border-border-soft p-4 rounded-[16px] text-white hover:bg-white/5 transition flex items-center gap-3">
                <span className="text-lg">👥</span>
                <div>
                  <div className="font-semibold">Your Groups</div>
                  <div className="text-secondary text-sm">{groups?.length || 0} active groups</div>
                </div>
              </Link>
              <Link to="/expenses" className="glass border border-border-soft p-4 rounded-[16px] text-white hover:bg-white/5 transition flex items-center gap-3">
                <span className="text-lg">💸</span>
                <div>
                  <div className="font-semibold">Expenses</div>
                  <div className="text-secondary text-sm">View all expenses</div>
                </div>
              </Link>
              <Link to="/settlements" className="glass border border-border-soft p-4 rounded-[16px] text-white hover:bg-white/5 transition flex items-center gap-3">
                <span className="text-lg">✅</span>
                <div>
                  <div className="font-semibold">Settlements</div>
                  <div className="text-secondary text-sm">Settle up with friends</div>
                </div>
              </Link>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
