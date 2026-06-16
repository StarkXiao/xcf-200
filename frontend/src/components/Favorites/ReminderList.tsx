import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Clock, Trash2, Calendar, Edit3, ChevronRight, ExternalLink } from 'lucide-react';
import { favoritesApi } from '@/api/favorites';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import { formatDate, formatRelativeTime } from '@/utils/helpers';
import ReminderModal from './ReminderModal';
import type { FavoriteReminder, Letter } from '@/types';

interface ReminderWithLetter extends FavoriteReminder {
  letter: Partial<Letter> | null;
}

interface ReminderListProps {
  reminders: ReminderWithLetter[];
  onRefresh: () => void;
}

export default function ReminderList({ reminders, onRefresh }: ReminderListProps) {
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  const [editingReminder, setEditingReminder] = useState<ReminderWithLetter | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleComplete = async (reminderId: string) => {
    if (!user) return;
    try {
      const res = await favoritesApi.updateReminder(user.id, reminderId, { completed: true });
      if (res.success) {
        showToast({ type: 'success', message: res.message });
        onRefresh();
      }
    } catch (err) {
      showToast({ type: 'error', message: '操作失败' });
    }
  };

  const handleDelete = async (reminderId: string) => {
    if (!user) return;
    try {
      const res = await favoritesApi.deleteReminder(user.id, reminderId);
      if (res.success) {
        showToast({ type: 'info', message: res.message });
        onRefresh();
      }
    } catch (err) {
      showToast({ type: 'error', message: '操作失败' });
    }
  };

  const handleEditSubmit = async (data: { remindAt: string; note: string }) => {
    if (!user || !editingReminder) return;
    try {
      const res = await favoritesApi.updateReminder(user.id, editingReminder.id, data);
      if (res.success) {
        showToast({ type: 'success', message: res.message });
        setShowEditModal(false);
        setEditingReminder(null);
        onRefresh();
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '操作失败' });
    }
  };

  const pendingReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);

  const renderReminder = (reminder: ReminderWithLetter) => {
    const isOverdue = !reminder.completed && new Date(reminder.remindAt) < new Date();
    return (
      <div
        key={reminder.id}
        className={`p-4 rounded-xl border transition-all ${
          reminder.completed
            ? 'bg-white/3 border-white/10 opacity-60'
            : isOverdue
            ? 'bg-nebula-orange/8 border-nebula-orange/30'
            : 'bg-white/5 border-white/10 hover:bg-white/10'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            reminder.completed ? 'bg-nebula-mint/15' : isOverdue ? 'bg-nebula-orange/15' : 'bg-aurora/15'
          }`}>
            {reminder.completed ? (
              <Check className="w-4 h-4 text-nebula-mint" />
            ) : (
              <Bell className={`w-4 h-4 ${isOverdue ? 'text-nebula-orange' : 'text-aurora'}`} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h5 className="font-medium text-white truncate">
                {reminder.letter?.title || '信件已删除'}
              </h5>
              {isOverdue && !reminder.completed && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-nebula-orange/20 text-nebula-orange shrink-0">
                  已逾期
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-white/50 mb-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(reminder.remindAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(reminder.remindAt)}
              </span>
            </div>

            {reminder.note && (
              <p className="text-xs text-white/60 italic mb-3">「{reminder.note}」</p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {reminder.letter?.id && (
                <Link
                  to={`/letter/${reminder.letter.id}`}
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-aurora/10 text-aurora hover:bg-aurora/20 transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  回看信件
                </Link>
              )}
              {!reminder.completed && (
                <>
                  <button
                    onClick={() => handleComplete(reminder.id)}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-nebula-mint/10 text-nebula-mint hover:bg-nebula-mint/20 transition-all"
                  >
                    <Check className="w-3 h-3" />
                    标记已看
                  </button>
                  <button
                    onClick={() => {
                      setEditingReminder(reminder);
                      setShowEditModal(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition-all"
                  >
                    <Edit3 className="w-3 h-3" />
                    修改
                  </button>
                </>
              )}
              <button
                onClick={() => handleDelete(reminder.id)}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
              >
                <Trash2 className="w-3 h-3" />
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {pendingReminders.length > 0 && (
        <div>
          <h4 className="font-medium text-white mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-nebula-orange" />
            待回看 ({pendingReminders.length})
          </h4>
          <div className="space-y-3">
            {pendingReminders.map(renderReminder)}
          </div>
        </div>
      )}

      {completedReminders.length > 0 && (
        <div>
          <h4 className="font-medium text-white mb-4 flex items-center gap-2">
            <Check className="w-4 h-4 text-nebula-mint" />
            已回看 ({completedReminders.length})
          </h4>
          <div className="space-y-3">
            {completedReminders.map(renderReminder)}
          </div>
        </div>
      )}

      {reminders.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">⏰</div>
          <p className="text-lg text-white/70 font-serif-sc mb-2">还没有设置回看提醒</p>
          <p className="text-sm text-white/50">
            在收藏信件时可以设置提醒，让星光不会被遗忘
          </p>
        </div>
      )}

      <ReminderModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingReminder(null);
        }}
        onSubmit={handleEditSubmit}
        letterTitle={editingReminder?.letter?.title}
      />
    </div>
  );
}
