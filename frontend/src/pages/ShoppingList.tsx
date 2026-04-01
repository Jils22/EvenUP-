import React, { useState, useRef, useEffect } from 'react';
import { useGroups } from '../hooks/useGroups';
import {
  useShoppingList,
  useAddShoppingItem,
  useToggleShoppingItem,
  useDeleteShoppingItem,
  useClearCheckedItems,
} from '../hooks/usePremium';
import { useToast } from '../context/ToastContext';
import { Loader2, Plus, Trash2, ShoppingCart, CheckCircle2, Circle, X } from 'lucide-react';
import { EmptyStateCard } from '../components/ui/EmptyStateCard';

interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  checked: boolean;
  assigned_to?: string;
  added_by: string;
}

export default function ShoppingList() {
  const toast = useToast();
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [newItem, setNewItem] = useState('');
  const [newQty, setNewQty] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: items, isLoading } = useShoppingList(selectedGroupId);
  const addItem = useAddShoppingItem();
  const toggleItem = useToggleShoppingItem();
  const deleteItem = useDeleteShoppingItem();
  const clearChecked = useClearCheckedItems();

  useEffect(() => {
    if (groups && groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  const unchecked = (items || []).filter((i: ShoppingItem) => !i.checked);
  const checked = (items || []).filter((i: ShoppingItem) => i.checked);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newItem.trim();
    if (!name) return;
    try {
      await addItem.mutateAsync({ groupId: selectedGroupId, name, quantity: newQty.trim() || undefined });
      setNewItem('');
      setNewQty('');
      inputRef.current?.focus();
    } catch {
      toast.error('Failed to add item.');
    }
  };

  const handleToggle = async (item: ShoppingItem) => {
    try {
      await toggleItem.mutateAsync({ groupId: selectedGroupId, itemId: item.id, checked: !item.checked });
    } catch {
      toast.error('Failed to update item.');
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteItem.mutateAsync({ groupId: selectedGroupId, itemId });
    } catch {
      toast.error('Failed to remove item.');
    }
  };

  const handleClearChecked = async () => {
    if (checked.length === 0) return;
    try {
      const result = await clearChecked.mutateAsync(selectedGroupId);
      toast.success(`Cleared ${result.deleted} item${result.deleted !== 1 ? 's' : ''}.`);
    } catch {
      toast.error('Failed to clear items.');
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="border-b border-border-soft pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Shopping List</h1>
        <p className="text-secondary mt-1">A shared list for your group's grocery run or trip shopping.</p>
      </div>

      {/* Group Tabs */}
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

      {/* Add Item Form */}
      {selectedGroupId && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Add an item..."
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-primary/50 transition-all"
            id="shopping-item-input"
          />
          <input
            type="text"
            placeholder="Qty"
            value={newQty}
            onChange={e => setNewQty(e.target.value)}
            className="w-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-primary/50 transition-all"
          />
          <button
            type="submit"
            disabled={addItem.isPending || !newItem.trim()}
            className="flex items-center gap-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-40 text-sm"
          >
            {addItem.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </form>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !selectedGroupId || !groups || groups.length === 0 ? (
        <EmptyStateCard kind="groups" title="No groups" description="Join or create a group to use the shopping list." />
      ) : (items || []).length === 0 ? (
        <div className="glass border border-border-soft rounded-2xl p-12 text-center">
          <ShoppingCart className="w-10 h-10 text-secondary mx-auto mb-4" />
          <h3 className="text-white font-bold text-xl">List is empty</h3>
          <p className="text-secondary mt-2 text-sm">Add items above to get started.</p>
        </div>
      ) : (
        <div className="glass border border-border-soft rounded-2xl overflow-hidden">
          {/* Unchecked items */}
          {unchecked.length > 0 && (
            <ul className="divide-y divide-white/5">
              {unchecked.map((item: ShoppingItem) => (
                <li key={item.id} className="flex items-center gap-3 px-5 py-4 group hover:bg-white/3 transition">
                  <button
                    onClick={() => handleToggle(item)}
                    className="flex-shrink-0 text-secondary hover:text-primary transition"
                  >
                    <Circle className="w-5 h-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className="text-white text-sm font-medium">{item.name}</span>
                    {item.quantity && (
                      <span className="ml-2 text-xs text-muted bg-white/5 px-2 py-0.5 rounded-full">{item.quantity}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-secondary hover:text-danger transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Checked items */}
          {checked.length > 0 && (
            <div className="border-t border-white/5">
              <div className="flex items-center justify-between px-5 py-2.5 bg-white/2">
                <span className="text-xs text-secondary font-medium uppercase tracking-wider">
                  Checked ({checked.length})
                </span>
                <button
                  onClick={handleClearChecked}
                  className="flex items-center gap-1 text-xs text-danger hover:text-red-400 transition font-medium"
                >
                  <X className="w-3 h-3" /> Clear all
                </button>
              </div>
              <ul className="divide-y divide-white/5">
                {checked.map((item: ShoppingItem) => (
                  <li key={item.id} className="flex items-center gap-3 px-5 py-4 group opacity-50 hover:opacity-70 transition">
                    <button
                      onClick={() => handleToggle(item)}
                      className="flex-shrink-0 text-success"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-secondary text-sm line-through">{item.name}</span>
                      {item.quantity && (
                        <span className="ml-2 text-xs text-muted">{item.quantity}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-secondary hover:text-danger transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
