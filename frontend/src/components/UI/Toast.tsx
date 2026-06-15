import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import useUIStore from '@/store/useUIStore';
import { cn } from '@/utils/helpers';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap = {
  success: 'from-nebula-mint/20 to-nebula-mint/10 border-nebula-mint/40 text-nebula-mint',
  error: 'from-red-500/20 to-red-500/10 border-red-500/40 text-red-400',
  info: 'from-aurora/20 to-aurora/10 border-aurora/40 text-aurora',
  warning: 'from-starlight/20 to-starlight/10 border-starlight/40 text-starlight',
};

export default function ToastContainer() {
  const { toasts, hideToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 sm:top-24 right-4 sm:right-6 z-[100] flex flex-col gap-3 max-w-sm w-full">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 px-4 py-3 rounded-xl backdrop-blur-xl border animate-scale-in shadow-lg',
              'bg-gradient-to-r',
              colorMap[toast.type]
            )}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="flex-1 text-sm font-medium text-white/95 break-words">
              {toast.message}
            </p>
            <button
              onClick={() => hideToast(toast.id)}
              className="shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors -mr-1 -mt-1"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
