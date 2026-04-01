import { useState } from 'react';
import { useMyBalances } from '../hooks/useExpenses';
import { SettlementCard } from '../components/SettlementCard';
import { SecondaryButton } from '../components/ui/Button';
import { Loader2, X, Clock, CheckCircle2, Sparkles, Info } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Confetti } from '../components/ui/Confetti';
import { cn } from '../lib/utils';

export default function Settlements() {
  const { data: myBalances, isLoading } = useMyBalances();
  const toast = useToast();
  const { user } = useAuth();
  const [showHistory, setShowHistory] = useState(false);
  const [simplify, setSimplify] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const rawTransfers = myBalances?.global_transfers || [];
  const myUserId = myBalances?.user_id;

  // Algorithm: Simplify Debts (Circular debt reduction)
  function getOptimized(transfers: any[]) {
    const balanceMap: Record<string, { name: string, net: number }> = {};
    transfers.forEach(t => {
      const fromId = String(t.from_user_id);
      const toId = String(t.to_user_id);
      if (!balanceMap[fromId]) balanceMap[fromId] = { name: t.from_user_name, net: 0 };
      if (!balanceMap[toId]) balanceMap[toId] = { name: t.to_user_name, net: 0 };
      balanceMap[fromId].net -= t.amount_minor;
      balanceMap[toId].net += t.amount_minor;
    });

    const debtors = Object.entries(balanceMap).filter(([_, v]) => v.net < -1).sort((a, b) => a[1].net - b[1].net);
    const creditors = Object.entries(balanceMap).filter(([_, v]) => v.net > 1).sort((a, b) => b[1].net - a[1].net);

    const optimized: any[] = [];
    let dIdx = 0, cIdx = 0;
    while (dIdx < debtors.length && cIdx < creditors.length) {
      const amount = Math.min(Math.abs(debtors[dIdx][1].net), creditors[cIdx][1].net);
      optimized.push({
        from_user_id: debtors[dIdx][0], from_user_name: debtors[dIdx][1].name,
        to_user_id: creditors[cIdx][0], to_user_name: creditors[cIdx][1].name,
        amount_minor: amount, group_name: "Optimized Settlement"
      });
      debtors[dIdx][1].net += amount;
      creditors[cIdx][1].net -= amount;
      if (Math.abs(debtors[dIdx][1].net) < 1) dIdx++;
      if (Math.abs(creditors[cIdx][1].net) < 1) cIdx++;
    }
    return optimized;
  }

  const transfers = simplify ? getOptimized(rawTransfers) : rawTransfers;
  const myUserIdStr = String(myUserId);

  const youOwe = transfers.filter((t: any) => String(t.from_user_id) === myUserIdStr);
  const owedToYou = transfers.filter((t: any) => String(t.to_user_id) === myUserIdStr);

  function handleRemind(personName: string) {
    toast.success(`Reminder sent to ${personName}! 📩`);
  }

  function handleSettle(amount: number, toName: string) {
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 3000);
    toast.success(`Celebration! You settled ₹${amount.toFixed(2)} with ${toName}. 🎉`);
  }
  
  return (
    <div className="space-y-10 pb-10">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-soft pb-6">
         <div>
           <h1 className="text-3xl font-bold text-white tracking-tight">Pending Settlements</h1>
           <p className="text-secondary mt-1">Settle up your debts or remind friends to pay you back.</p>
         </div>
         <div className="flex items-center gap-3">
            <button 
              onClick={() => setSimplify(v => !v)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                simplify ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 text-secondary"
              )}
            >
              <Sparkles className="w-4 h-4" />
              {simplify ? "Optimization ON" : "Simplify Debts"}
            </button>
            <SecondaryButton onClick={() => setShowHistory(true)} className="px-5 gap-2">
              <Clock className="w-4 h-4" />
              History
            </SecondaryButton>
          </div>
       </div>
       
       {simplify && (
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-start gap-3 mb-6 animate-in fade-in slide-in-from-top-2">
            <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-secondary">
              <strong className="text-white">Smart Settlement</strong> is active. We've recalculated the minimum number of transactions needed to clear all debts across all your groups.
            </p>
          </div>
        )}

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {/* Left Column: What you owe */}
         <div className="space-y-6">
           <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4">You Owe</h2>
           {youOwe.length > 0 ? (
             <div className="flex flex-col gap-4">
               {youOwe.map((s: any, idx: number) => (
                 <SettlementCard 
                   key={`owe-${idx}`}
                   fromUser={{ name: 'You', initials: (user?.name?.[0] || 'Y').toUpperCase() }}
                   toUser={{ name: s.to_user_name || 'Someone', initials: (s.to_user_name?.[0] || '?').toUpperCase() }}
                   amount={s.amount_minor / 100}
                   type="owes"
                   onSettle={() => handleSettle(s.amount_minor / 100, s.to_user_name)}
                 />
               ))}
             </div>
           ) : (
             <div className="glass p-8 rounded-[20px] text-center border border-border-soft">
               <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
               <p className="text-secondary font-medium">You're all caught up! 🎉</p>
             </div>
           )}
         </div>
         
         {/* Right Column: What you are owed */}
         <div className="space-y-6">
           <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4">You Are Owed</h2>
           {owedToYou.length > 0 ? (
             <div className="flex flex-col gap-4">
               {owedToYou.map((s: any, idx: number) => (
                 <SettlementCard 
                   key={`owed-${idx}`}
                   fromUser={{ name: s.from_user_name || 'Someone', initials: (s.from_user_name?.[0] || '?').toUpperCase() }}
                   toUser={{ name: 'You', initials: (user?.name?.[0] || 'Y').toUpperCase() }}
                   amount={s.amount_minor / 100}
                   type="owed"
                   onRemind={() => handleRemind(s.from_user_name || 'them')}
                 />
               ))}
             </div>
           ) : (
             <div className="glass p-8 rounded-[20px] text-center border border-border-soft">
               <p className="text-secondary font-medium">Nobody owes you right now.</p>
             </div>
           )}
         </div>
       </div>

       {/* Settlement History Modal */}
       {showHistory && (
         <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-card border border-border-soft rounded-3xl w-full max-w-lg shadow-2xl">
             <div className="flex items-center justify-between p-6 border-b border-border-soft">
               <div>
                 <h2 className="text-xl font-bold text-white">Settlement History</h2>
                 <p className="text-secondary text-sm mt-1">All settlements across your groups</p>
               </div>
               <button onClick={() => setShowHistory(false)} className="p-2 rounded-full hover:bg-white/10 text-secondary hover:text-white transition">
                 <X className="w-5 h-5" />
               </button>
             </div>
             <div className="p-6">
               {transfers.length === 0 ? (
                 <div className="text-center py-10">
                   <Clock className="w-12 h-12 text-secondary mx-auto mb-4 opacity-50" />
                   <p className="text-secondary">No settlement history yet.</p>
                   <p className="text-secondary/60 text-sm mt-1">Past settlements will appear here once completed.</p>
                 </div>
               ) : (
                 <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                   {transfers.map((t: any, idx: number) => (
                     <div key={idx} className="flex items-center justify-between glass p-4 rounded-xl border border-border-soft">
                       <div>
                         <p className="text-white text-sm font-medium">
                           {String(t.from_user_id) === myUserIdStr ? 'You' : t.from_user_name} → {String(t.to_user_id) === myUserIdStr ? 'You' : t.to_user_name}
                         </p>
                         <p className="text-secondary text-xs mt-0.5">{t.group_name}</p>
                       </div>
                       <span className={`font-bold ${String(t.from_user_id) === myUserIdStr ? 'text-danger' : 'text-success'}`}>
                         ₹{(t.amount_minor / 100).toFixed(2)}
                       </span>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </div>
         </div>
       )}

       <Confetti trigger={celebrate} />
    </div>
  );
}
