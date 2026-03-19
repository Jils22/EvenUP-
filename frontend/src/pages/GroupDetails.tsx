import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useGroupDetails } from '../hooks/useGroups';
import { useGroupExpenses, useBalances } from '../hooks/useExpenses';
import { useSettlements } from '../hooks/useSettlements';
import { ExpenseTable } from '../components/ExpenseTable';
import { SettlementCard } from '../components/SettlementCard';
import { PrimaryButton, SecondaryButton } from '../components/ui/Button';
import { AvatarStack } from '../components/ui/AvatarStack';
import { ArrowLeft, UserPlus, Settings, Loader2 } from 'lucide-react';

export default function GroupDetails() {
  const { id } = useParams<{ id: string }>();
  
  if (!id) return <Navigate to="/groups" replace />;

  const { data: group, isLoading: groupLoading } = useGroupDetails(id);
  const { data: expenses, isLoading: expensesLoading } = useGroupExpenses(id);
  const { data: balances } = useBalances(id);
  const { data: settlements } = useSettlements();

  if (groupLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!group) {
    return <Navigate to="/groups" replace />;
  }

  // Derive net balance logic for standard group logic
  const netBalance = balances?.[0]?.netBalance || 0;
  
  // Filter appropriate settlements relating to this group
  const groupSettlements = settlements?.filter(s => s.groupId === group.id) || [];

  return (
    <div className="space-y-8 pb-10">
       <div className="flex items-center gap-4 border-b border-border-soft pb-6">
         <Link to="/groups" className="p-2 rounded-full glass hover:bg-white/10 transition text-secondary hover:text-white">
           <ArrowLeft className="w-5 h-5" />
         </Link>
         <div className="flex-1">
           <h1 className="text-3xl font-bold text-white tracking-tight">{group.name}</h1>
           <p className="text-secondary mt-1">{group.description || 'Shared group for expenses and settlements.'}</p>
         </div>
         <div className="flex items-center gap-3">
           <SecondaryButton className="px-3 gap-2 py-2 text-sm hidden sm:flex">
             <UserPlus className="w-4 h-4" /> Invite
           </SecondaryButton>
           <button className="p-2.5 rounded-[20px] bg-card border border-border-soft text-secondary hover:text-white transition">
             <Settings className="w-5 h-5" />
           </button>
         </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
           <div className="glass p-6 rounded-[20px] flex sm:items-center justify-between flex-col sm:flex-row gap-6 border border-border-soft">
             <div>
               <h3 className="text-secondary text-sm font-medium mb-2">Members</h3>
               <AvatarStack users={group.members.map(m => ({ id: m.userId, initials: m.initials, src: m.avatarUrl }))} limit={5} />
             </div>
             <div className="text-left sm:text-right">
               <h3 className="text-secondary text-sm font-medium mb-1">Your Balance</h3>
               <span className={`text-3xl font-bold tracking-tight ${netBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                 {netBalance >= 0 ? '+' : '-'}${Math.abs(netBalance).toFixed(2)}
               </span>
             </div>
           </div>

           <div className="space-y-4">
             <div className="flex items-center justify-between">
               <h2 className="text-xl font-bold text-white">Group Expenses</h2>
               <PrimaryButton className="py-2 px-4 shadow-none text-sm">Add Expense</PrimaryButton>
             </div>
             {expensesLoading ? (
                <div className="glass border border-border-soft rounded-[20px] p-10 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
             ) : (
                <ExpenseTable expenses={expenses || []} />
             )}
           </div>
         </div>
         
         <div className="space-y-4">
           <h2 className="text-xl font-bold text-white">Suggested Settlements</h2>
           {groupSettlements.length === 0 ? (
             <div className="glass border border-border-soft p-6 rounded-[20px] text-center text-secondary text-sm">
                No pending settlements for this group.
             </div>
           ) : (
             <div className="flex flex-col gap-4">
                {groupSettlements.map(settle => {
                  // Reconstruct user representations dynamically or from the API schema gracefully
                  // Using placeholder usernames because standard settlements.fromUserId must be resolved
                  // In a real flow, the API would expand the user objects
                  return (
                    <SettlementCard 
                      key={settle.id}
                      fromUser={{ name: `User ${settle.fromUserId.slice(-4)}`, initials: 'U' }}
                      toUser={{ name: `User ${settle.toUserId.slice(-4)}`, initials: 'U' }}
                      amount={settle.amount}
                      type={settle.status === 'pending' ? 'owes' : 'owed'}
                      className="flex-col !items-start gap-4"
                    />
                  );
                })}
             </div>
           )}
         </div>
       </div>
    </div>
  );
}
