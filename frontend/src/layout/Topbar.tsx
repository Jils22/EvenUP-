import { Bell, Search } from 'react-router-dom';
import { Bell as BellIcon, Search as SearchIcon } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="h-20 w-full px-8 flex items-center justify-between border-b border-white/5 glass z-20">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input 
            type="text" 
            placeholder="Search expenses, groups, or friends..." 
            className="w-full bg-background/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative text-secondary hover:text-white transition-colors">
          <BellIcon className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-card"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-white">Alex Morgan</p>
            <p className="text-xs text-muted">Premium Member</p>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30">
            <img src="https://i.pravatar.cc/150?u=alex" alt="User Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
}
