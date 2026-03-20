import { useState } from 'react';
import { Bell as BellIcon, Search as SearchIcon, Menu as MenuIcon } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

type TopbarProps = {
  onMenuClick?: () => void;
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: notifications = [] } = useNotifications(10);
  return (
    <header className="h-20 w-full px-8 flex items-center justify-between border-b border-white/5 glass z-20">
      <button
        type="button"
        onClick={onMenuClick}
        className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl text-secondary hover:text-white hover:bg-white/5 transition-colors mr-2"
        aria-label="Open sidebar"
      >
        <MenuIcon className="w-5 h-5" />
      </button>
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
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-secondary hover:text-white transition-colors"
          >
            <BellIcon className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-card"></span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-white/10 rounded-xl shadow-xl z-50">
              <div className="p-4 border-b border-white/10">
                <h3 className="font-semibold text-white">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                      <div className="text-sm text-white">{notif.type}</div>
                      <div className="text-xs text-muted mt-1">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
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
