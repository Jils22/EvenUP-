import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';
import { useGroupExpenses, useAnalytics } from '../hooks/useExpenses';
import { expensesApi } from '../api/expensesApi';
import { ExpenseTable } from '../components/ExpenseTable';
import { EmptyStateCard } from '../components/ui/EmptyStateCard';
import { PrimaryButton, SecondaryButton } from '../components/ui/Button';
import { Download, Filter, Plus, Loader2, X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const CATEGORIES = ['food', 'travel', 'rent', 'shopping', 'entertainment', 'transport', 'bills', 'other'];
const CAT_LABELS: Record<string, string> = {
  food: '🍔 Food', travel: '✈️ Travel', rent: '🏠 Rent', shopping: '🛍️ Shopping',
  entertainment: '🎬 Ent.', transport: '🚌 Transport', bills: '📄 Bills', other: '🏷️ Other',
};

interface Filters {
  search: string;
  categories: string[];
  dateFrom: string;
  dateTo: string;
  amtMin: string;
  amtMax: string;
  paidBy: string;
}

const EMPTY_FILTERS: Filters = {
  search: '', categories: [], dateFrom: '', dateTo: '', amtMin: '', amtMax: '', paidBy: '',
};

function hasActiveFilters(f: Filters) {
  return f.search || f.categories.length > 0 || f.dateFrom || f.dateTo || f.amtMin || f.amtMax || f.paidBy;
}

export default function Expenses() {
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const toast = useToast();

  useEffect(() => {
    if (groups && groups.length > 0 && !selectedGroupId) setSelectedGroupId(groups[0].id);
  }, [groups, selectedGroupId]);

  // Reset filters when group changes
  useEffect(() => { setFilters(EMPTY_FILTERS); }, [selectedGroupId]);

  const { data: rawExpenses, isLoading: expensesLoading } = useGroupExpenses(selectedGroupId);

  const selectedGroup = groups?.find(g => g.id === selectedGroupId);

  // Build paid-by options from the current group members
  const paidByOptions: string[] = useMemo(() => {
    if (!selectedGroup?.members) return [];
    return selectedGroup.members.map((m: any) => m.name || m.email || 'Unknown');
  }, [selectedGroup]);

  // Map raw expenses to display format and resolve paidBy name
  const mappedExpenses = useMemo(() => {
    if (!rawExpenses) return [];
    return rawExpenses.map((exp: any) => {
      const member = selectedGroup?.members?.find((m: any) => m.id === exp.paid_by || m.id === exp.paidBy);
      const paidByName = member?.name || member?.email || exp.paidBy || exp.paid_by || 'Unknown';
      const amount = typeof exp.amount === 'number' ? exp.amount
        : typeof exp.amount_minor === 'number' ? exp.amount_minor / 100
        : 0;
      const date = exp.date || exp.created_at || '';
      return {
        id: exp.id || exp._id,
        title: exp.title || '',
        amount,
        date,
        paidBy: paidByName,
        category: (exp.category || '').toLowerCase(),
        split: exp.split_type || exp.splitType || 'equal',
      };
    });
  }, [rawExpenses, selectedGroup]);

  // Apply all filters
  const expenses = useMemo(() => {
    let list = mappedExpenses;
    const f = filters;

    if (f.search.trim()) {
      const q = f.search.trim().toLowerCase();
      list = list.filter(e => e.title.toLowerCase().includes(q) || e.paidBy.toLowerCase().includes(q));
    }
    if (f.categories.length > 0) {
      list = list.filter(e => f.categories.includes(e.category || 'other'));
    }
    if (f.dateFrom) {
      const from = new Date(f.dateFrom).getTime();
      list = list.filter(e => e.date && new Date(e.date).getTime() >= from);
    }
    if (f.dateTo) {
      const to = new Date(f.dateTo).getTime() + 86400000; // inclusive
      list = list.filter(e => e.date && new Date(e.date).getTime() <= to);
    }
    if (f.amtMin) list = list.filter(e => e.amount >= parseFloat(f.amtMin));
    if (f.amtMax) list = list.filter(e => e.amount <= parseFloat(f.amtMax));
    if (f.paidBy) list = list.filter(e => e.paidBy === f.paidBy);

    return list;
  }, [mappedExpenses, filters]);

  const toggleCategory = (cat: string) => {
    setFilters(f => ({
      ...f,
      categories: f.categories.includes(cat) ? f.categories.filter(c => c !== cat) : [...f.categories, cat],
    }));
  };

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const handleExport = async () => {
    if (!selectedGroupId) return toast.error('No group selected');
    try {
      const blob = await expensesApi.exportExpenses(selectedGroupId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedGroup?.name || selectedGroupId}_expenses.csv`;
      document.body.appendChild(a); 
      a.click(); 
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('CSV exported!');
    } catch (e: any) { 
      toast.error(e.message || 'Export failed'); 
    }
  };

  const active = hasActiveFilters(filters);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-soft pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Your Expenses</h1>
          <p className="text-secondary mt-1">Review and filter transaction history across your groups.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              active
                ? 'border-primary bg-primary/10 text-white'
                : 'border-white/10 bg-white/5 text-secondary hover:border-white/20 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {active && (
              <span className="w-5 h-5 text-xs rounded-full bg-primary text-white flex items-center justify-center font-bold">
                {[filters.search, ...filters.categories, filters.dateFrom, filters.dateTo, filters.amtMin, filters.amtMax, filters.paidBy].filter(Boolean).length}
              </span>
            )}
            {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleExport} className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-secondary hover:text-white hover:border-white/20 transition">
            <Download className="w-4 h-4" />
          </button>
          <Link to="/groups">
            <PrimaryButton className="gap-2 px-4 py-2.5 text-sm hidden sm:flex">
              <Plus className="w-4 h-4" /> Add Expense
            </PrimaryButton>
          </Link>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="glass border border-border-soft rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Filter Expenses</h3>
            {active && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-danger hover:text-red-400 transition">
                <X className="w-3.5 h-3.5" /> Clear all
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              type="text"
              placeholder="Search by title or paid by..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Category chips */}
          <div>
            <p className="text-xs text-secondary font-medium uppercase tracking-wider mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    filters.categories.includes(cat)
                      ? 'border-primary bg-primary/20 text-white'
                      : 'border-white/10 bg-white/5 text-secondary hover:border-white/20 hover:text-white'
                  }`}
                >
                  {CAT_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date From */}
            <div>
              <p className="text-xs text-secondary font-medium uppercase tracking-wider mb-2">From Date</p>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50 transition-all [color-scheme:dark]"
              />
            </div>
            {/* Date To */}
            <div>
              <p className="text-xs text-secondary font-medium uppercase tracking-wider mb-2">To Date</p>
              <input
                type="date"
                value={filters.dateTo}
                onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50 transition-all [color-scheme:dark]"
              />
            </div>
            {/* Min Amount */}
            <div>
              <p className="text-xs text-secondary font-medium uppercase tracking-wider mb-2">Min Amount (₹)</p>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={filters.amtMin}
                onChange={e => setFilters(f => ({ ...f, amtMin: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
            {/* Max Amount */}
            <div>
              <p className="text-xs text-secondary font-medium uppercase tracking-wider mb-2">Max Amount (₹)</p>
              <input
                type="number"
                min="0"
                placeholder="∞"
                value={filters.amtMax}
                onChange={e => setFilters(f => ({ ...f, amtMax: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Paid By */}
          {paidByOptions.length > 0 && (
            <div>
              <p className="text-xs text-secondary font-medium uppercase tracking-wider mb-2">Paid By</p>
              <div className="flex flex-wrap gap-2">
                {paidByOptions.map(name => (
                  <button
                    key={name}
                    onClick={() => setFilters(f => ({ ...f, paidBy: f.paidBy === name ? '' : name }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      filters.paidBy === name
                        ? 'border-primary bg-primary/20 text-white'
                        : 'border-white/10 bg-white/5 text-secondary hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result count when filters active */}
      {active && !expensesLoading && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-secondary">
            Showing <strong className="text-white">{expenses.length}</strong> of <strong className="text-white">{mappedExpenses.length}</strong> expenses
          </span>
          <button onClick={clearFilters} className="text-primary hover:text-white transition text-xs font-medium">
            Clear filters
          </button>
        </div>
      )}

      {/* Content */}
      {groupsLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !groups || groups.length === 0 ? (
        <EmptyStateCard
          kind="groups"
          title="No groups yet"
          description="You aren't part of any groups yet. Create a group to start tracking expenses."
          action={<Link to="/groups" className="inline-block"><PrimaryButton>Create your first group</PrimaryButton></Link>}
        />
      ) : (
        <div className="space-y-6">
          {/* Group tabs */}
          <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
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

          {expensesLoading ? (
            <div className="glass border border-border-soft py-20 flex justify-center rounded-[20px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : expenses.length === 0 ? (
            <EmptyStateCard
              kind="expenses"
              title={active ? 'No matching expenses' : 'No expenses yet'}
              description={active ? 'Try adjusting or clearing your filters.' : 'Once you add records, they\'ll show up here.'}
              action={active ? (
                <button onClick={clearFilters} className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition">
                  Clear filters
                </button>
              ) : undefined}
            />
          ) : (
            <ExpenseTable expenses={expenses} />
          )}
        </div>
      )}
    </div>
  );
}
