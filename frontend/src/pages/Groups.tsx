import { useGroups } from '../hooks/useGroups';
import { useBalances } from '../hooks/useExpenses';
import { GroupCard } from '../components/GroupCard';
import { PrimaryButton } from '../components/ui/Button';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Groups() {
  const { data: groups, isLoading, error } = useGroups();
  const { data: balances } = useBalances();

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-soft pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Your Groups</h1>
          <p className="text-secondary mt-1">Manage shared spaces, trips, and apartments.</p>
        </div>
        <PrimaryButton className="gap-2 px-5">
           <Plus className="w-4 h-4" /> New Group
        </PrimaryButton>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
           <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="glass p-6 rounded-[20px] text-center max-w-2xl mx-auto mt-10 border border-danger/30 text-danger flex flex-col items-center gap-2">
           <AlertCircle className="w-8 h-8" />
           <p>Failed to load groups. Please try again.</p>
        </div>
      ) : !groups || groups.length === 0 ? (
        <div className="glass p-12 rounded-[20px] text-center max-w-2xl mx-auto mt-10">
          <h3 className="text-xl font-bold text-white mb-2">No active groups</h3>
          <p className="text-secondary mb-6">Create a group to start splitting expenses with friends.</p>
          <PrimaryButton>Create your first group</PrimaryButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {groups.map(group => {
            // Find specific group balance or safely default to 0
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
  );
}
