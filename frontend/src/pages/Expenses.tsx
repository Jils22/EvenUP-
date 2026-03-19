import { useState, useEffect } from 'react';
import { useGroups } from '../hooks/useGroups';
import { useGroupExpenses } from '../hooks/useExpenses';
import { ExpenseTable } from '../components/ExpenseTable';
import { PrimaryButton, SecondaryButton } from '../components/ui/Button';
import { Download, Filter, Plus, Loader2, Info } from 'lucide-react';

export default function Expenses() {
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  useEffect(() => {
    if (groups && groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  const { data: expenses, isLoading: expensesLoading } = useGroupExpenses(selectedGroupId);

  return (
    <div className="space-y-8 pb-10">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-soft pb-6">
         <div>
           <h1 className="text-3xl font-bold text-white tracking-tight">Your Expenses</h1>
           <p className="text-secondary mt-1">Review transaction history across your groups.</p>
         </div>
         <div className="flex items-center gap-3">
           <SecondaryButton className="aspect-square p-0 w-11 flex items-center justify-center">
             <Filter className="w-4 h-4 text-secondary" />
           </SecondaryButton>
           <SecondaryButton className="aspect-square p-0 w-11 flex items-center justify-center">
             <Download className="w-4 h-4 text-secondary" />
           </SecondaryButton>
           <PrimaryButton className="gap-2 px-5 hidden sm:flex">
             <Plus className="w-4 h-4" /> Add Record
           </PrimaryButton>
         </div>
       </div>

       {groupsLoading ? (
         <div className="flex justify-center py-20">
           <Loader2 className="w-8 h-8 animate-spin text-primary" />
         </div>
       ) : !groups || groups.length === 0 ? (
         <div className="glass border border-border-soft rounded-[20px] p-10 text-center flex flex-col items-center gap-4">
           <Info className="w-10 h-10 text-secondary" />
           <p className="text-secondary">You aren't part of any groups yet. Create a group to start tracking expenses.</p>
         </div>
       ) : (
         <div className="space-y-6">
           {/* Simple group selector to scope the expenses payload */}
           <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
             {groups.map((g) => (
                <button 
                  key={g.id}
                  onClick={() => setSelectedGroupId(g.id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                    selectedGroupId === g.id 
                      ? 'bg-primary text-white' 
                      : 'bg-white/5 text-secondary hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  {g.name}
                </button>
             ))}
           </div>

           {expensesLoading ? (
             <div className="glass border border-border-soft py-20 flex justify-center rounded-[20px]">
               <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
           ) : !expenses || expenses.length === 0 ? (
             <div className="glass border border-border-soft p-10 text-center text-secondary rounded-[20px]">
               No expenses recorded in this group yet.
             </div>
           ) : (
             <ExpenseTable expenses={expenses} />
           )}
         </div>
       )}
    </div>
  );
}
