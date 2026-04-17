import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Target, TrendingUp, AlertTriangle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { budgetsApi, Budget as BudgetType } from '../api/budgetsApi';
import { useToast } from '../context/ToastContext';
import { useAnalytics } from '../hooks/useExpenses';

// Budget stored locally since backend doesn't have a budget endpoint yet
const STORAGE_KEY = 'evenup_budgets';

interface Budget extends BudgetType {}

const CATEGORY_OPTIONS = [
  { key: 'food', label: '🍔 Food', color: '#C08FF5' },
  { key: 'travel', label: '✈️ Travel', color: '#42E3D0' },
  { key: 'rent', label: '🏠 Rent', color: '#FF6B6B' },
  { key: 'shopping', label: '🛍️ Shopping', color: '#4AD36E' },
  { key: 'entertainment', label: '🎬 Entertainment', color: '#FFB84D' },
  { key: 'transport', label: '🚌 Transport', color: '#4D96FF' },
  { key: 'bills', label: '📄 Bills', color: '#6F7D97' },
  { key: 'other', label: '🏷️ Other', color: '#A8B3C7' },
];

function categoryInfo(key: string) {
  return CATEGORY_OPTIONS.find(c => c.key === key) ?? { key, label: key, color: '#A8B3C7' };
}

// Removed legacy storage functions

export default function Budget() {
  const toast = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formCategory, setFormCategory] = useState('food');
  const [formLimit, setFormLimit] = useState('');
  const [formPeriod, setFormPeriod] = useState<'monthly' | 'weekly'>('monthly');

  // Real spend data from analytics
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();

  useEffect(() => {
    fetchBudgets();
  }, []);

  async function fetchBudgets() {
    setLoading(true);
    try {
      const data = await budgetsApi.getBudgets();
      setBudgets(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }

  // Build a map of category → actual spend (in rupees)
  const spendMap: Record<string, number> = {};
  if (analytics?.category_data) {
    for (const item of analytics.category_data) {
      spendMap[item.name.toLowerCase()] = item.value;
    }
  }

  function openNewForm() {
    setEditingId(null);
    setFormCategory('food');
    setFormLimit('');
    setFormPeriod('monthly');
    setShowForm(true);
  }

  function openEditForm(b: Budget) {
    setEditingId(b.id);
    setFormCategory(b.category);
    setFormLimit(String(b.limit));
    setFormPeriod(b.period);
    setShowForm(true);
  }

  async function saveBudget() {
    const limit = parseFloat(formLimit);
    if (!formCategory || isNaN(limit) || limit <= 0) return;

    const info = categoryInfo(formCategory);
    try {
      if (editingId) {
        await budgetsApi.updateBudget(editingId, { category: formCategory, limit, period: formPeriod, color: info.color });
        toast.success('Budget updated');
      } else {
        await budgetsApi.createBudget({ category: formCategory, limit, period: formPeriod, color: info.color });
        toast.success('Budget created');
      }
      await fetchBudgets();
      setShowForm(false);
    } catch (e: any) {
      toast.error(e.message || 'Error saving budget');
    }
  }

  async function deleteBudget(id: string) {
    if (!confirm('Are you sure?')) return;
    try {
      await budgetsApi.deleteBudget(id);
      toast.success('Budget deleted');
      await fetchBudgets();
    } catch (e: any) {
      toast.error(e.message || 'Error deleting budget');
    }
  }

  const totalBudgetLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalActualSpend = budgets.reduce((s, b) => s + (spendMap[b.category] ?? 0), 0);
  const overBudgetCount = budgets.filter(b => (spendMap[b.category] ?? 0) > b.limit).length;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-soft pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Budget Planner</h1>
          <p className="text-secondary mt-1">Set monthly spending limits per category and track your actual spend.</p>
        </div>
        <button
          onClick={openNewForm}
          className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-linear-to-r from-primary to-purple-600 text-white font-semibold shadow-[0_0_20px_rgba(192,143,245,0.3)] hover:shadow-[0_0_30px_rgba(192,143,245,0.5)] hover:scale-[1.02] transition-all"
        >
          <Plus className="w-4 h-4" /> Add Budget
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass border border-border-soft rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-1">
            <Target className="w-5 h-5 text-primary" />
            <span className="text-secondary text-sm font-medium">Total Budget</span>
          </div>
          <p className="text-2xl font-bold text-white">₹{totalBudgetLimit.toFixed(2)}</p>
          <p className="text-xs text-secondary mt-1">across {budgets.length} categories</p>
        </div>
        <div className="glass border border-border-soft rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-1">
            <TrendingUp className="w-5 h-5 text-danger" />
            <span className="text-secondary text-sm font-medium">Actual Spend</span>
          </div>
          <p className={`text-2xl font-bold ${totalActualSpend > totalBudgetLimit ? 'text-danger' : 'text-white'}`}>
            ₹{totalActualSpend.toFixed(2)}
          </p>
          <p className="text-xs text-secondary mt-1">from your group expenses</p>
        </div>
        <div className="glass border border-border-soft rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-1">
            {overBudgetCount > 0 ? (
              <AlertTriangle className="w-5 h-5 text-warning" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-success" />
            )}
            <span className="text-secondary text-sm font-medium">Status</span>
          </div>
          <p className={`text-2xl font-bold ${overBudgetCount > 0 ? 'text-warning' : 'text-success'}`}>
            {overBudgetCount > 0 ? `${overBudgetCount} Over` : 'On Track'}
          </p>
          <p className="text-xs text-secondary mt-1">
            {overBudgetCount > 0 ? `${overBudgetCount} categor${overBudgetCount === 1 ? 'y' : 'ies'} exceeded` : 'All categories within limits'}
          </p>
        </div>
      </div>

      {/* Budget Cards */}
      {(analyticsLoading || loading) ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="glass border border-border-soft p-12 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-5">
            <Target className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Budgets Set</h2>
          <p className="text-secondary mb-6 max-w-sm">Set a spending limit for each category to track where your money goes and stay on top of your finances.</p>
          <button
            onClick={openNewForm}
            className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-linear-to-r from-primary to-purple-600 text-white font-semibold"
          >
            <Plus className="w-4 h-4" /> Create Your First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {budgets.map(b => {
            const spent = spendMap[b.category] ?? 0;
            const pct = b.limit > 0 ? Math.min((spent / b.limit) * 100, 100) : 0;
            const isOver = spent > b.limit;
            const remaining = b.limit - spent;
            const info = categoryInfo(b.category);

            return (
              <div key={b.id} className="glass border border-border-soft rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${b.color}20` }}>
                      {info.label.split(' ')[0]}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold capitalize">{b.category}</h3>
                      <p className="text-secondary text-xs">{b.period}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(b)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-secondary hover:text-white transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteBudget(b.id)}
                      className="p-1.5 rounded-lg hover:bg-danger/10 text-secondary hover:text-danger transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-secondary">Spent: <span className={`font-semibold ${isOver ? 'text-danger' : 'text-white'}`}>₹{spent.toFixed(2)}</span></span>
                    <span className="text-secondary">Limit: <span className="text-white font-semibold">₹{b.limit.toFixed(2)}</span></span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: isOver ? '#FF6B6B' : pct > 80 ? '#FFB84D' : b.color,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className={`text-xs font-medium ${isOver ? 'text-danger' : pct > 80 ? 'text-warning' : 'text-success'}`}>
                      {isOver ? `₹${Math.abs(remaining).toFixed(2)} over budget` : `₹${remaining.toFixed(2)} remaining`}
                    </span>
                    <span className="text-xs text-secondary">{pct.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Budget Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border-soft rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border-soft">
              <h2 className="text-xl font-bold text-white">{editingId ? 'Edit Budget' : 'New Budget'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-white/10 text-secondary hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORY_OPTIONS.map(c => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setFormCategory(c.key)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition text-xs font-medium ${
                        formCategory === c.key
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-white/10 bg-white/5 text-secondary hover:border-white/20'
                      }`}
                    >
                      <span className="text-lg">{c.label.split(' ')[0]}</span>
                      <span className="truncate w-full text-center">{c.label.split(' ').slice(1).join(' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Monthly Limit */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Monthly Limit (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={formLimit}
                  onChange={e => setFormLimit(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              {/* Period */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Period</label>
                <div className="flex gap-3">
                  {(['monthly', 'weekly'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormPeriod(p)}
                      className={`flex-1 py-2.5 rounded-xl border transition font-medium text-sm capitalize ${
                        formPeriod === p
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-white/10 bg-white/5 text-secondary hover:border-white/20'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={saveBudget}
                disabled={!formLimit || parseFloat(formLimit) <= 0}
                className="w-full py-3 rounded-xl bg-linear-to-r from-primary to-purple-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed mt-1"
              >
                {editingId ? 'Save Changes' : 'Create Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
