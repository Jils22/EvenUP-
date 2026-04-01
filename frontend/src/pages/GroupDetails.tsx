import { useParams, Link, Navigate } from 'react-router-dom';
import { useGroupDetails } from '../hooks/useGroups';
import { useGroupExpenses, useBalances } from '../hooks/useExpenses';
import { ExpenseTable } from '../components/ExpenseTable';
import { DebtFlowGraph } from '../components/DebtFlowGraph';
import { PrimaryButton, SecondaryButton } from '../components/ui/Button';
import { AvatarStack } from '../components/ui/AvatarStack';
import { ArrowLeft, Download, Loader2, GitFork } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function GroupDetails() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  if (!id) return <Navigate to="/groups" replace />;

  const { data: group, isLoading: groupLoading } = useGroupDetails(id);
  const { data: expenses, isLoading: expensesLoading } = useGroupExpenses(id);
  const { data: balances } = useBalances(id);

  const netBalance: number = (() => {
    if (!balances) return 0;
    if (typeof (balances as any).net_balance_minor === 'number') return (balances as any).net_balance_minor / 100;
    if (Array.isArray(balances) && (balances[0] as any)?.netBalance != null) return (balances[0] as any).netBalance;
    return 0;
  })();

  // Extract transfers from balances for the Debt Flow Graph
  const transfers: any[] = (() => {
    if (!balances) return [];
    if ((balances as any).transfers) return (balances as any).transfers;
    if ((balances as any).global_transfers) return (balances as any).global_transfers;
    return [];
  })();

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('evenup_auth_token');
      const res = await fetch(`http://127.0.0.1:8000/groups/${id}/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${group?.name || id}_expenses.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('CSV exported!');
    } catch (e: any) { toast.error('Export failed: ' + e.message); }
  };

  if (groupLoading) return (
    <div className="flex justify-center items-center py-32">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
  if (!group) return <Navigate to="/groups" replace />;

  const members: any[] = group.members || [];
  const initials = (m: any) => m.name
    ? m.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (m.email?.[0] || '?').toUpperCase();

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border-soft pb-6">
        <Link to="/groups" className="p-2 rounded-full glass hover:bg-white/10 transition text-secondary hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">{group.name}</h1>
          <p className="text-secondary mt-1">{(group as any).description || 'Shared group expenses'}</p>
        </div>
        <div className="flex items-center gap-3">
          <SecondaryButton onClick={handleExport} className="px-3 gap-2 py-2 text-sm hidden sm:flex">
            <Download className="w-4 h-4" /> Export CSV
          </SecondaryButton>
          <Link to={`/groups/${id}`}>
            <PrimaryButton className="py-2 px-4 shadow-none text-sm">Open Group</PrimaryButton>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Balance + Members bar */}
          <div className="glass p-6 rounded-[20px] flex sm:items-center justify-between flex-col sm:flex-row gap-6 border border-border-soft">
            <div>
              <h3 className="text-secondary text-sm font-medium mb-2">Members ({members.length})</h3>
              <AvatarStack
                users={members.map(m => ({ id: m.id, initials: initials(m), src: m.avatarUrl }))}
                limit={5}
              />
            </div>
            <div className="text-left sm:text-right">
              <h3 className="text-secondary text-sm font-medium mb-1">Your Balance</h3>
              <span className={`text-3xl font-bold tracking-tight ${netBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                {netBalance >= 0 ? '+' : '-'}₹{Math.abs(netBalance).toFixed(2)}
              </span>
            </div>
          </div>

          {/* ── Debt Flow Graph ────────────────────────────────────────────── */}
          <div className="glass border border-border-soft rounded-[20px] p-6">
            <div className="flex items-center gap-2 mb-4">
              <GitFork className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-bold text-white">Debt Flow</h2>
              <span className="text-xs text-secondary ml-1">— who owes whom</span>
            </div>
            <DebtFlowGraph
              transfers={transfers}
              members={members.map(m => ({ id: m.id, name: m.name || m.email || 'Member' }))}
            />
          </div>

          {/* Expenses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Expenses</h2>
              <Link to={`/groups/${id}`}>
                <PrimaryButton className="py-2 px-4 shadow-none text-sm">+ Add Expense</PrimaryButton>
              </Link>
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

        {/* Members sidebar */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Members</h2>
          <div className="flex flex-col gap-3">
            {members.map(m => (
              <div key={m.id} className="glass border border-border-soft p-4 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {initials(m)}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{m.name || 'Unknown'}</p>
                  <p className="text-secondary text-xs truncate">{m.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
