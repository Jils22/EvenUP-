import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroups, useCreateGroup } from '../hooks/useGroups';
import { GroupCard } from '../components/GroupCard';
import { PrimaryButton, SecondaryButton } from '../components/ui/Button';
import { Plus, Loader2, AlertCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyStateCard } from '../components/ui/EmptyStateCard';

export default function Groups() {
  const navigate = useNavigate();
  const { data: groups, isLoading, error } = useGroups();
  const createGroup = useCreateGroup();

  const [showForm, setShowForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [formError, setFormError] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim()) {
      setFormError('Group name is required');
      return;
    }
    setFormError('');
    try {
      const newGroup = await createGroup.mutateAsync({ name: groupName.trim() });
      setGroupName('');
      setShowForm(false);
      // Navigate to the new group
      if (newGroup?.id) navigate(`/groups/${newGroup.id}`);
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || err?.message || 'Failed to create group');
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-soft pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Your Groups</h1>
          <p className="text-secondary mt-1">Manage shared spaces, trips, and apartments.</p>
        </div>
        <PrimaryButton className="gap-2 px-5" onClick={() => setShowForm(true)}>
           <Plus className="w-4 h-4" /> New Group
        </PrimaryButton>
      </div>

      {/* New Group Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass border border-border-soft rounded-[24px] p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New Group</h2>
              <button
                onClick={() => { setShowForm(false); setGroupName(''); setFormError(''); }}
                className="p-2 rounded-full hover:bg-white/10 transition text-secondary hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="e.g. Goa Trip, Apartment, etc."
                  className="w-full bg-white/5 border border-border-soft rounded-[12px] px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
                  autoFocus
                />
                {formError && <p className="text-danger text-sm mt-2">{formError}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <PrimaryButton type="submit" className="flex-1" disabled={createGroup.isPending}>
                  {createGroup.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Group'}
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  className="flex-1"
                  onClick={() => { setShowForm(false); setGroupName(''); setFormError(''); }}
                >
                  Cancel
                </SecondaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

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
        <EmptyStateCard
          kind="groups"
          title="No groups yet"
          description="Create a group to start splitting expenses with friends."
          action={<PrimaryButton onClick={() => setShowForm(true)}>Create your first group</PrimaryButton>}
          className="max-w-2xl mx-auto"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {groups.map(group => (
            <Link key={group.id} to={`/groups/${group.id}`} className="block">
              <GroupCard 
                name={group.name}
                balance={0}
                members={(group.members || []).map((m: any) => ({ id: m.userId || m.id, initials: m.initials || m.name?.[0] || '?', src: m.avatarUrl }))}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
