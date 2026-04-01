import React, { useState, useEffect } from 'react';
import { useGroups } from '../hooks/useGroups';
import {
  useRecurring,
  useCreateRecurring,
  useDeleteRecurring,
  useToggleRecurring,
} from '../hooks/usePremium';
import { useToast } from '../context/ToastContext';
import { PrimaryButton } from '../components/ui/Button';
import { Loader2, Plus, Trash2, Power, Calendar, RefreshCw } from 'lucide-react';
import { EmptyStateCard } from '../components/ui/EmptyStateCard';

const CATEGORIES = ['food', 'travel', 'rent', 'shopping', 'entertainment', 'transport', 'bills', 'other'];
const FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'] as const;

const FREQ_LABELS: Record<typeof FREQUENCIES[number], string> = {
  weekly: 'Every Week',
  biweekly: 'Every 2 Weeks',
  monthly: 'Every Month',
  quarterly: 'Every Quarter',
  yearly: 'Every Year',
};

const CAT_ICONS: Record<string, string> = {
  food: '🍔', travel: '✈️', rent: '🏠', shopping: '🛍️',
  entertainment: '🎬', transport: '🚌', bills: '📄', other: '🏷️',
};

interface RecurringItem {
  id: string;
  title: string;
  amount: number;
  frequency: string;
  category?: string;
  active: boolean;
  next_due: string;
  paid_by_user_id: string;
}

export default function Recurring() {
  const toast = useToast();
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formFreq, setFormFreq] = useState<typeof FREQUENCIES[number]>('monthly');
  const [formCat, setFormCat] = useState('bills');
  const [formPaidBy, setFormPaidBy] = useState('');

  const { data: recurring, isLoading: recurringLoading } = useRecurring(selectedGroupId);
  const createMutation = useCreateRecurring();
  const deleteMutation = useDeleteRecurring();
  const toggleMutation = useToggleRecurring();

  useEffect(() => {
    if (groups && groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    const group = groups?.find(g => g.id === selectedGroupId);
    if (group?.members?.[0]) setFormPaidBy(group.members[0].id);
  }, [selectedGroupId, groups]);

  const selectedGroup = groups?.find(g => g.id === selectedGroupId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAmount || !formPaidBy) {
      return toast.error('Please fill in all required fields.');
    }
    const group = groups?.find(g => g.id === selectedGroupId);
    const participantIds = group?.members.map((m: any) => m.id) || [];
    if (!participantIds.includes(formPaidBy)) participantIds.push(formPaidBy);

    try {
      await createMutation.mutateAsync({
        groupId: selectedGroupId,
        payload: {
          title: formTitle.trim(),
          amount: parseFloat(formAmount),
          paid_by_user_id: formPaidBy,
          frequency: formFreq,
          category: formCat,
          participant_user_ids: participantIds,
        },
      });
      toast.success('Recurring expense added!');
      setShowForm(false);
      setFormTitle(''); setFormAmount('');
    } catch (e: any) {
      toast.error(e?.data?.detail || 'Failed to create recurring expense.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this recurring bill?')) return;
    try {
      await deleteMutation.mutateAsync({ groupId: selectedGroupId, recurringId: id });
      toast.success('Removed.');
    } catch {
      toast.error('Could not remove recurring expense.');
    }
  };

  const handleToggle = async (item: RecurringItem) => {
    try {
      await toggleMutation.mutateAsync({
        groupId: selectedGroupId,
        recurringId: item.id,
        active: !item.active,
      });
    } catch {
      toast.error('Could not update status.');
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-soft pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Recurring Bills</h1>
          <p className="text-secondary mt-1">Manage shared subscriptions, rent, and recurring expenses.</p>
        </div>
        <PrimaryButton
          onClick={() => setShowForm(v => !v)}
          className="gap-2 px-5"
          id="add-recurring-btn"
        >
          <Plus className="w-4 h-4" /> Add Recurring
        </PrimaryButton>
      </div>

      {/* Group selector */}
      {!groupsLoading && groups && groups.length > 0 && (
        <div className="flex overflow-x-auto pb-2 gap-2">
          {groups.map((g: any) => (
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
      )}

      {/* Add Form */}
      {showForm && selectedGroup && (
        <div className="glass border border-primary/20 rounded-2xl p-6 space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
          <h3 className="text-white font-semibold">New Recurring Expense</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-secondary font-medium uppercase tracking-wider mb-1 block">Title *</label>
              <input
                type="text"
                placeholder="e.g. Netflix Subscription"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-secondary font-medium uppercase tracking-wider mb-1 block">Amount (₹) *</label>
              <input
                type="number" min="0.01" step="0.01"
                placeholder="0.00"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-secondary font-medium uppercase tracking-wider mb-1 block">Frequency *</label>
              <select
                value={formFreq}
                onChange={e => setFormFreq(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-all [color-scheme:dark]"
              >
                {FREQUENCIES.map(f => <option key={f} value={f}>{FREQ_LABELS[f]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-secondary font-medium uppercase tracking-wider mb-1 block">Category</label>
              <select
                value={formCat}
                onChange={e => setFormCat(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-all [color-scheme:dark]"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-secondary font-medium uppercase tracking-wider mb-1 block">Paid By *</label>
              <select
                value={formPaidBy}
                onChange={e => setFormPaidBy(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-all [color-scheme:dark]"
              >
                {selectedGroup.members.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name || m.email}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-secondary hover:text-white transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-50 text-sm"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content */}
      {groupsLoading || recurringLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !groups || groups.length === 0 ? (
        <EmptyStateCard kind="groups" title="No groups yet" description="Create a group to add recurring expenses." />
      ) : !recurring || recurring.length === 0 ? (
        <div className="glass border border-border-soft rounded-2xl p-12 text-center">
          <RefreshCw className="w-10 h-10 text-secondary mx-auto mb-4" />
          <h3 className="text-white font-bold text-xl">No recurring expenses</h3>
          <p className="text-secondary mt-2 text-sm">Add shared bills like rent or subscriptions to track them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recurring.map((item: RecurringItem) => (
            <div
              key={item.id}
              className={`glass border rounded-2xl p-5 flex items-start gap-4 transition-all ${
                item.active ? 'border-border-soft' : 'border-white/5 opacity-60'
              }`}
            >
              <div className="text-3xl w-12 h-12 flex items-center justify-center bg-white/5 rounded-xl flex-shrink-0">
                {CAT_ICONS[item.category || 'other'] || '🏷️'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-white font-bold truncate">{item.title}</h3>
                  <span className="text-primary font-bold text-lg whitespace-nowrap">₹{item.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-secondary">
                    <RefreshCw className="w-3 h-3" /> {FREQ_LABELS[item.frequency as typeof FREQUENCIES[number]] || item.frequency}
                  </span>
                  {item.next_due && (
                    <span className="flex items-center gap-1 text-xs text-secondary">
                      <Calendar className="w-3 h-3" /> Due {new Date(item.next_due).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                  item.active
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-white/5 text-secondary border-white/10'
                }`}>
                  {item.active ? 'Active' : 'Paused'}
                </span>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(item)}
                  title={item.active ? 'Pause' : 'Resume'}
                  className={`p-2 rounded-lg transition ${
                    item.active
                      ? 'text-secondary hover:text-warning hover:bg-warning/10'
                      : 'text-secondary hover:text-success hover:bg-success/10'
                  }`}
                >
                  <Power className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  title="Delete"
                  className="p-2 rounded-lg text-secondary hover:text-danger hover:bg-danger/10 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
