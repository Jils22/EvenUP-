import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isSidebarOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-white">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen ? (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Sidebar"
        >
          <button
            type="button"
            className="absolute inset-0 bg-background/80"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          />
          <div className="relative w-64">
            <Sidebar />
          </div>
        </div>
      ) : null}
      <div className="flex h-full flex-col flex-1 overflow-hidden relative">
        {/* Subtle background glow effect for premium feel */}
        <div className="pointer-events-none absolute -top-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-primary/10 blur-[120px]" />
        
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
