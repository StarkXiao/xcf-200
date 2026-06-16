import { useState, useEffect } from 'react';
import { X, Clock, Bell, Sparkles, CalendarDays } from 'lucide-react';

interface ReminderModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { remindAt: string; note: string }) => Promise<void>;
  letterTitle?: string;
}

const quickOptions = [
  { label: '1小时后', hours: 1 },
  { label: '今晚', getDate: () => { const d = new Date(); d.setHours(21, 0, 0, 0); if (d <= new Date()) d.setDate(d.getDate() + 1); return d; } },
  { label: '明天', getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(20, 0, 0, 0); return d; } },
  { label: '3天后', getDate: () => { const d = new Date(); d.setDate(d.getDate() + 3); d.setHours(20, 0, 0, 0); return d; } },
  { label: '一周后', getDate: () => { const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(20, 0, 0, 0); return d; } },
  { label: '一个月后', getDate: () => { const d = new Date(); d.setMonth(d.getMonth() + 1); d.setHours(20, 0, 0, 0); return d; } },
];

function formatDateTimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ReminderModal({ open, onClose, onSubmit, letterTitle }: ReminderModalProps) {
  const [dateTime, setDateTime] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const defaultDate = new Date();
      defaultDate.setHours(defaultDate.getHours() + 1, 0, 0, 0);
      setDateTime(formatDateTimeLocal(defaultDate));
      setNote('');
    }
  }, [open]);

  if (!open) return null;

  const handleQuickSelect = (option: typeof quickOptions[0]) => {
    let date: Date;
    if ('hours' in option) {
      date = new Date();
      date.setHours(date.getHours() + (option as any).hours, 0, 0, 0);
    } else {
      date = (option as any).getDate();
    }
    setDateTime(formatDateTimeLocal(date));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateTime) return;
    const remindAt = new Date(dateTime).toISOString();
    if (new Date(remindAt) <= new Date()) return;
    try {
      setSubmitting(true);
      await onSubmit({ remindAt, note: note.trim() });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const isPast = dateTime ? new Date(dateTime) <= new Date() : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif-sc text-xl font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-nebula-orange" />
            设置回看提醒
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {letterTitle && (
          <div className="mb-5 p-3 rounded-xl bg-starlight/8 border border-starlight/20">
            <div className="text-xs text-white/50 mb-1">信件标题</div>
            <div className="text-sm text-white font-medium truncate">{letterTitle}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-aurora" />
              快速选择
            </label>
            <div className="grid grid-cols-3 gap-2">
              {quickOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => handleQuickSelect(option)}
                  className="px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white/70 hover:bg-aurora/15 hover:border-aurora/30 hover:text-aurora transition-all"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-nebula-purple" />
              自定义时间
            </label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="input-field"
            />
            {isPast && (
              <p className="mt-2 text-xs text-nebula-orange">请选择未来的时间</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2 flex justify-between">
              <span>备注（选填）</span>
              <span className="text-xs text-white/40">{note.length}/100</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 100))}
              rows={2}
              placeholder="写下你想提醒自己的话..."
              className="input-field resize-none text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting || isPast || !dateTime}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              设置提醒
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
