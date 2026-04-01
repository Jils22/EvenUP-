import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Receipt,
  ArrowLeftRight,
  PieChart,
  Wallet,
  Settings,
  LogOut,
  Medal,
  RefreshCw,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { name: 'Dashboard',  path: '/dashboard',  icon: LayoutDashboard },
  { name: 'Groups',     path: '/groups',      icon: Users },
  { name: 'Expenses',   path: '/expenses',    icon: Receipt },
  { name: 'Settlements',path: '/settlements', icon: ArrowLeftRight },
  { name: 'Analytics',  path: '/analytics',   icon: PieChart },
  { name: 'Budget',     path: '/budget',      icon: Wallet },
];

const premiumItems = [
  { name: 'Badges',     path: '/badges',      icon: Medal },
  { name: 'Recurring',  path: '/recurring',   icon: RefreshCw },
  { name: 'Shopping',   path: '/shopping',    icon: ShoppingCart },
  { name: 'Currency',   path: '/currency',    icon: DollarSign },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-64 glass-sidebar h-full flex flex-col justify-between py-6 z-20 overflow-y-auto">
      <div className="px-6">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
            E
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-secondary">
            EvenUP
          </span>
        </div>

        {/* Core Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(192,143,245,0.1)]'
                  : 'text-secondary hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Premium Divider */}
        <div className="my-4 border-t border-white/5 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted px-4 mb-2">
            ✨ Premium
          </p>
          <nav className="space-y-1">
            {premiumItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(192,143,245,0.1)]'
                    : 'text-secondary hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="px-6">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium mb-1',
            isActive
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'text-secondary hover:text-white hover:bg-white/5'
          )}
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium w-full text-danger hover:bg-danger/10"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
