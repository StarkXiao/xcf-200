import { useState, useEffect } from 'react';
import { X, Bell, CheckCheck, Mail, Star, MessageSquare } from 'lucide-react';
import { strangerReplyApi } from '@/api/strangerReply';
import type { Notification } from '@/types';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import { formatDate } from '@/utils/helpers';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeIcons: Record<string, { icon: any; color: string; bgColor: string }> = {
  new_reply: { icon: Mail, color: 'text-aurora', bgColor: 'bg-aurora/10' },
  reply_reviewed: { icon: Star, color: 'text-starlight', bgColor: 'bg-starlight/10' },
  system: { icon: Bell, color: 'text-nebula-purple', bgColor: 'bg-nebula-purple/10' },
  default: { icon: MessageSquare, color: 'text-nebula-pink', bgColor: 'bg-nebula-pink/10' },
};

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { user } = useAuthStore();
  const { showToast } = useUIStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await strangerReplyApi.getNotifications({
        userId: user.id,
        limit: 20,
      });
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      showToast({ type: 'error', message: '加载通知失败' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
    }
  }, [isOpen, user]);

  const handleMarkRead = async (id: string) => {
    try {
      await strangerReplyApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await strangerReplyApi.markAllNotificationsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      showToast({ type: 'success', message: '已全部标记为已读' });
    } catch (err) {
      showToast({ type: 'error', message: '操作失败' });
    }
  };

  const handleClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkRead(notification.id);
    }
    if (notification.relatedId) {
      window.location.href = `/letter/${notification.relatedId}`;
    }
  };

  if (!isOpen) return null;

  const getTypeInfo = (type: string) => {
    return typeIcons[type] || typeIcons.default;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md h-full bg-gradient-to-b from-deep-space to-cosmic-900 shadow-2xl animate-slide-in-right">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-starlight/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-starlight" />
            </div>
            <div>
              <h3 className="font-serif-sc text-lg font-semibold text-white">消息通知</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-starlight">{unreadCount} 条未读</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                全部已读
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100%-73px)]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-white/20 border-t-starlight rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-5xl mb-4">🔔</div>
              <p className="text-white/60 mb-1">暂无通知</p>
              <p className="text-xs text-white/40">有新消息会在这里显示</p>
            </div>
          ) : (
            <div className="p-3">
              {notifications.map((notification) => {
                const typeInfo = getTypeInfo(notification.type);
                const Icon = typeInfo.icon;
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleClick(notification)}
                    className={`p-4 rounded-xl mb-2 cursor-pointer transition-all ${
                      notification.read
                        ? 'bg-white/3 hover:bg-white/5'
                        : 'bg-white/8 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full ${typeInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${typeInfo.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium ${notification.read ? 'text-white/70' : 'text-white'}`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-nebula-pink flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className={`text-xs mt-1 line-clamp-2 ${notification.read ? 'text-white/50' : 'text-white/60'}`}>
                          {notification.content}
                        </p>
                        <p className="text-xs text-white/30 mt-2">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
