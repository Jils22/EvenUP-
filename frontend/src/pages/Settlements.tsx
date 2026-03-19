import React from 'react';
import { settlements } from '../data/mockData';
import { SettlementCard } from '../components/SettlementCard';
import { SecondaryButton } from '../components/ui/Button';

export default function Settlements() {
  const youOwe = settlements.filter(s => s.type === 'owes');
  const owedToYou = settlements.filter(s => s.type === 'owed');

  return (
    <div className="space-y-10 pb-10">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-soft pb-6">
         <div>
           <h1 className="text-3xl font-bold text-white tracking-tight">Pending Settlements</h1>
           <p className="text-secondary mt-1">Settle up your debts or remind friends to pay you back.</p>
         </div>
         <SecondaryButton className="px-5">History</SecondaryButton>
       </div>
       
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {/* Left Column: What you owe */}
         <div className="space-y-6">
           <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4">You Owe</h2>
           {youOwe.length > 0 ? (
             <div className="flex flex-col gap-4">
               {youOwe.map(s => (
                 <SettlementCard 
                   key={s.id}
                   fromUser={s.fromUser}
                   toUser={s.toUser}
                   amount={s.amount}
                   type={s.type}
                 />
               ))}
             </div>
           ) : (
             <div className="glass p-8 rounded-[20px] text-center border border-border-soft">
               <p className="text-secondary font-medium">You're all caught up!</p>
             </div>
           )}
         </div>
         
         {/* Right Column: What you are owed */}
         <div className="space-y-6">
           <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4">You Are Owed</h2>
           {owedToYou.length > 0 ? (
             <div className="flex flex-col gap-4">
               {owedToYou.map(s => (
                 <SettlementCard 
                   key={s.id}
                   fromUser={s.fromUser}
                   toUser={s.toUser}
                   amount={s.amount}
                   type={s.type}
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
    </div>
  );
}
