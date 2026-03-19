import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export const DashboardLayout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-white">
      <Sidebar />
      <div className="flex h-full flex-col flex-1 overflow-hidden relative">
        {/* Subtle background glow effect for premium feel */}
        <div className="pointer-events-none absolute -top-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-primary/10 blur-[120px]" />
        
        <Topbar />
        
        <main className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-6 py-8 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
