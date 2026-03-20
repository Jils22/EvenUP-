import { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const STYLES = {
  success: 'border-green-500/40 bg-green-950/80 text-green-200',
  error: 'border-red-500/40 bg-red-950/80 text-red-200',
  info: 'border-purple-500/40 bg-purple-950/80 text-purple-200',
};

const ICON_COLORS = {
  success: 'text-green-400',
  error: 'text-red-400',
  info: 'text-purple-400',
};

const BAR_COLORS = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-purple-500',
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss after 3.5s
    const exitTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 3500);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [toast.id, onDismiss]);

  const Icon = ICONS[toast.type];

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 px-4 py-3 rounded-[16px] border backdrop-blur-xl shadow-2xl w-full max-w-sm overflow-hidden',
        'transition-all duration-300 ease-in-out',
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8',
        STYLES[toast.type]
      )}
    >
      <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', ICON_COLORS[toast.type])} />
      <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        className="text-white/40 hover:text-white/80 transition flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
      {/* Progress bar */}
      <div className={cn('absolute bottom-0 left-0 h-[3px] rounded-full animate-[shrink_3.5s_linear_forwards]', BAR_COLORS[toast.type])} />
    </div>
  );
}
