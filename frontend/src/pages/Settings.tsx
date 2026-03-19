import React from 'react';
import { PrimaryButton, DangerButton } from '../components/ui/Button';

export default function Settings() {
  return (
    <div className="space-y-10 pb-10 max-w-4xl">
       <div className="border-b border-border-soft pb-6">
         <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
         <p className="text-secondary mt-1">Manage your account, preferences, and security.</p>
       </div>
       
       <div className="space-y-8">
         {/* Profile Section */}
         <div className="glass border border-border-soft p-8 rounded-[20px] space-y-6">
            <div className="flex items-center gap-6 mb-8">
               <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background">
                  <img src="https://i.pravatar.cc/150?u=alex" alt="Alex Morgan" className="w-full h-full object-cover" />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-white">Alex Morgan</h3>
                  <p className="text-secondary text-sm">alex.morgan@example.com</p>
                  <button className="text-primary text-sm font-medium mt-2 hover:text-white transition-colors">Change Photo</button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1.5">
                  <label className="text-xs text-secondary font-medium uppercase tracking-wider">First Name</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors" defaultValue="Alex" />
               </div>
               <div className="space-y-1.5">
                  <label className="text-xs text-secondary font-medium uppercase tracking-wider">Last Name</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors" defaultValue="Morgan" />
               </div>
            </div>
            
            <div className="pt-4 flex justify-end">
               <PrimaryButton className="px-6">Save Profile</PrimaryButton>
            </div>
         </div>

         {/* Danger Zone */}
         <div className="glass border border-danger/30 p-8 rounded-[20px] space-y-4">
            <h3 className="text-lg font-bold text-danger">Danger Zone</h3>
            <p className="text-secondary text-sm">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <div className="pt-2">
               <DangerButton className="px-6">Delete Account</DangerButton>
            </div>
         </div>
       </div>
    </div>
  );
}
