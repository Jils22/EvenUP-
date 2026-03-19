import React from 'react';
import { SecondaryButton } from '../components/ui/Button';

export default function Budget() {
  return (
    <div className="space-y-8 pb-10">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-soft pb-6">
         <div>
           <h1 className="text-3xl font-bold text-white tracking-tight">Budget & Goals</h1>
           <p className="text-secondary mt-1">Track your personal limits and shared targets.</p>
         </div>
         <SecondaryButton className="px-5">Edit Budgets</SecondaryButton>
       </div>
       
       <div className="glass border border-border-soft p-10 rounded-[20px] flex flex-col items-center justify-center min-h-[400px] text-center max-w-2xl mx-auto mt-10">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
             <span className="text-3xl">🎯</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Goal Tracking Coming Soon</h2>
          <p className="text-secondary leading-relaxed mb-8">
            We are working hard to bring you advanced budgeting tools. You'll be able to set monthly caps per category and receive intelligent alerts when you're nearing your limits.
          </p>
          <SecondaryButton>Notify Me When Ready</SecondaryButton>
       </div>
    </div>
  );
}
