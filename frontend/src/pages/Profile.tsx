import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail, Heart, Bookmark, Settings, Calendar, Sparkles, PenLine,
  User as UserIcon, Edit3, LogOut, ChevronRight, FileText, MessageCircle,
  Route, AlertTriangle, ExternalLink, Award, Trophy, Plus, Trash2,
  FolderOpen, Bell, Check, CheckSquare, Square, Move, BarChart3, Eye
} from 'lucide-react';
import LetterCard from '@/components/Letter/LetterCard';
import MailRouteStatsCard from '@/components/MailRoute/MailRouteStatsCard';
import MiniMailRouteStatus from '@/components/MailRoute/MiniMailRouteStatus';
import HonorCard from '@/components/Activity/HonorCard';
import GroupModal from '@/components/Favorites/GroupModal';
import FavoritesStats from '@/components/Favorites/FavoritesStats';
import ReminderList from '@/components/Favorites/ReminderList';
import ReminderModal from '@/components/Favorites/ReminderModal';
import { userApi } from '@/api/user';
import { lettersApi } from '@/api/letters';
import { activitiesApi } from '@/api/activities';
import { favoritesApi, type GroupWithCount } from '@/api/favorites';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import type { Letter, UserStats, Honor, FavoriteStats, FavoriteReminder, FavoriteGroup } from '@/types';
import { formatDate, getRecipientTypeLabel, EXCEPTION_INFO } from '@/utils/helpers';

type TabType = 'letters' | 'favorites' | 'mailroute' | 'honors' | 'edit';
type FavoritesSubTab = 'list' | 'groups' | 'reminders' | 'stats';

const avatarOptions = ['🌟', '🌙', '🌈', '🦋', '🌸', '🌊', '⭐', '🐱', '🦄', '🌻', '☕', '🎨', '🍀', '🌠', '🔮', '🌌'];

const statItems = [
  { key: 'totalLetters', label: '寄出信件', icon: Mail, color: 'text-aurora', bg: 'bg-aurora/15' },
  { key: 'totalLikes', label: '收到星星', icon: Heart, color: 'text-nebula-pink', bg: 'bg-nebula-pink/15' },
  { key: 'totalReplies', label: '收到回信', icon: MessageCircle, color: 'text-starlight', bg: 'bg-starlight/15' },
  { key: 'totalFavorites', label: '收藏信件', icon: Bookmark, color: 'text-nebula-mint', bg: 'bg-nebula-mint/15' },
];

interface FavLetter extends Letter {
  favoritedAt: string;
  favoriteId: string;
  groupId: string | null;
}

interface ReminderWithLetter extends FavoriteReminder {
  letter: Partial<Letter> | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateUser } = useAuthStore();
  const { showToast, setLoading } = useUIStore();

  const [activeTab, setActiveTab] = useState<TabType>('letters');
  const [userLetters, setUserLetters] = useState<Letter[]>([]);
  const [favorites, setFavorites] = useState<FavLetter[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [exceptionLetters, setExceptionLetters] = useState<any[]>([]);
  const [honors, setHonors] = useState<Honor[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(true);

  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [favSubTab, setFavSubTab] = useState<FavoritesSubTab>('list');
  const [groups, setGroups] = useState<GroupWithCount[]>([]);
  const [ungroupedCount, setUngroupedCount] = useState(0);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null | 'all'>('all');
  const [selectedLetters, setSelectedLetters] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FavoriteGroup | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderLetter, setReminderLetter] = useState<FavLetter | null>(null);
  const [reminders, setReminders] = useState<ReminderWithLetter[]>([]);
  const [favStats, setFavStats] = useState<FavoriteStats | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    setEditName(user.username);
    setEditBio(user.bio || '');
    setEditAvatar(user.avatar);
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchAllData = async () => {
    if (!user) return;
    try {
      setLoadingLocal(true);
      const [lettersRes, favRes, statsRes, excRes, honorsRes, groupsRes, favStatsRes, remindersRes] = await Promise.all([
        userApi.getUserLetters(user.id),
        favoritesApi.getFavoriteLetters(user.id),
        userApi.getStats(user.id),
        lettersApi.getExceptionLetters(user.id),
        activitiesApi.getUserHonors(user.id),
        favoritesApi.getGroups(user.id),
        favoritesApi.getStats(user.id),
        favoritesApi.getReminders(user.id),
      ]);
      if (lettersRes.success) setUserLetters(lettersRes.data);
      if (favRes.success) setFavorites(favRes.data as FavLetter[]);
      if (statsRes.success) setStats(statsRes.data);
      if (excRes.success) setExceptionLetters(excRes.data);
      if (honorsRes.data.success) setHonors(honorsRes.data.data || []);
      if (groupsRes.success) {
        setGroups(groupsRes.data);
        setUngroupedCount(groupsRes.ungroupedCount);
      }
      if (favStatsRes.success) setFavStats(favStatsRes.data);
      if (remindersRes.success) setReminders(remindersRes.data as ReminderWithLetter[]);
    } catch (err) {
      showToast({ type: 'error', message: '加载数据失败' });
    } finally {
      setLoadingLocal(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setEditSaving(true);
      setLoading(true);
      const res = await userApi.updateProfile(user.id, {
        username: editName.trim(),
        bio: editBio.trim(),
        avatar: editAvatar,
      });
      if (res.success && res.data) {
        updateUser(res.data);
        showToast({ type: 'success', message: '资料已更新 ✨' });
        setActiveTab('letters');
      } else {
        showToast({ type: 'error', message: res.message || '更新失败' });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '更新失败' });
    } finally {
      setEditSaving(false);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast({ type: 'success', message: '下次再见啦，愿你星空常伴 ✨' });
    setTimeout(() => navigate('/login'), 500);
  };

  const refreshFavorites = async () => {
    if (!user) return;
    try {
      const [favRes, groupsRes, favStatsRes, remindersRes] = await Promise.all([
        favoritesApi.getFavoriteLetters(user.id, selectedGroupId === 'all' ? undefined : selectedGroupId || undefined),
        favoritesApi.getGroups(user.id),
        favoritesApi.getStats(user.id),
        favoritesApi.getReminders(user.id),
      ]);
      if (favRes.success) setFavorites(favRes.data as FavLetter[]);
      if (groupsRes.success) {
        setGroups(groupsRes.data);
        setUngroupedCount(groupsRes.ungroupedCount);
      }
      if (favStatsRes.success) setFavStats(favStatsRes.data);
      if (remindersRes.success) setReminders(remindersRes.data as ReminderWithLetter[]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGroupFilter = async (groupId: string | null | 'all') => {
    if (!user) return;
    setSelectedGroupId(groupId);
    setSelectedLetters(new Set());
    setSelectMode(false);
    try {
      setLoadingLocal(true);
      const res = await favoritesApi.getFavoriteLetters(
        user.id,
        groupId === 'all' ? undefined : groupId || undefined
      );
      if (res.success) setFavorites(res.data as FavLetter[]);
    } catch (err) {
      showToast({ type: 'error', message: '加载失败' });
    } finally {
      setLoadingLocal(false);
    }
  };

  const toggleSelectLetter = (letterId: string) => {
    const newSelected = new Set(selectedLetters);
    if (newSelected.has(letterId)) {
      newSelected.delete(letterId);
    } else {
      newSelected.add(letterId);
    }
    setSelectedLetters(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedLetters.size === favorites.length) {
      setSelectedLetters(new Set());
    } else {
      setSelectedLetters(new Set(favorites.map((l) => l.id)));
    }
  };

  const handleCreateGroup = async (data: { name: string; icon: string; color: string; description: string }) => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await favoritesApi.createGroup(user.id, data);
      if (res.success) {
        showToast({ type: 'success', message: res.message });
        refreshFavorites();
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '创建失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async (data: { name: string; icon: string; color: string; description: string }) => {
    if (!user || !editingGroup) return;
    try {
      setLoading(true);
      const res = await favoritesApi.updateGroup(user.id, editingGroup.id, data);
      if (res.success) {
        showToast({ type: 'success', message: res.message });
        refreshFavorites();
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '更新失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!user) return;
    if (!confirm('确定要删除此分组吗？分组内的收藏将移至未分组。')) return;
    try {
      setLoading(true);
      const res = await favoritesApi.deleteGroup(user.id, groupId);
      if (res.success) {
        showToast({ type: 'success', message: res.message });
        if (selectedGroupId === groupId) {
          handleGroupFilter('all');
        } else {
          refreshFavorites();
        }
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '删除失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchMove = async (targetGroupId: string | null) => {
    if (!user || selectedLetters.size === 0) return;
    try {
      setLoading(true);
      const res = await favoritesApi.moveFavorites(
        user.id,
        Array.from(selectedLetters),
        targetGroupId
      );
      if (res.success) {
        showToast({ type: 'success', message: res.message });
        setSelectedLetters(new Set());
        setSelectMode(false);
        refreshFavorites();
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '操作失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchRemove = async () => {
    if (!user || selectedLetters.size === 0) return;
    if (!confirm(`确定要取消收藏选中的 ${selectedLetters.size} 封信件吗？`)) return;
    try {
      setLoading(true);
      const res = await favoritesApi.batchRemove(user.id, Array.from(selectedLetters));
      if (res.success) {
        showToast({ type: 'success', message: res.message });
        setSelectedLetters(new Set());
        setSelectMode(false);
        refreshFavorites();
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '操作失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async (data: { remindAt: string; note: string }) => {
    if (!user || !reminderLetter) return;
    try {
      setLoading(true);
      const res = await favoritesApi.createReminder(user.id, {
        letterId: reminderLetter.id,
        ...data,
      });
      if (res.success) {
        showToast({ type: 'success', message: res.message });
        setShowReminderModal(false);
        setReminderLetter(null);
        refreshFavorites();
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '设置失败' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingLocal && activeTab !== 'favorites') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-cosmic-400/30 border-t-starlight animate-spin" />
          <p className="text-white/60">正在连接你的星阁...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const favSubTabs = [
    { key: 'list', label: '收藏列表', icon: Bookmark },
    { key: 'groups', label: '分组管理', icon: FolderOpen },
    { key: 'reminders', label: '回看提醒', icon: Bell },
    { key: 'stats', label: '收藏统计', icon: BarChart3 },
  ];

  const groupFilterOptions = [
    { id: 'all' as const, name: '全部收藏', icon: '📚', count: favStats?.totalFavorites || 0 },
    { id: null, name: '未分组', icon: '📁', count: ungroupedCount },
    ...groups.map((g) => ({ id: g.id, name: g.name, icon: g.icon, count: g.count })),
  ];

  return (
    <div className="relative z-10 py-8 sm:py-12">
      <div className="container max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 animate-fade-in-up">
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6 sm:p-7 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-cosmic-500/30 via-nebula-purple/20 to-aurora/20" />
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-nebula-purple via-cosmic-400 to-aurora opacity-50" />

              <div className="relative pt-12 text-center">
                <div className="relative inline-block">
                  <div
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-cosmic-400 via-nebula-purple to-aurora p-1 shadow-glow-lg">
                    <div className="w-full h-full rounded-full bg-cosmic-950 flex items-center justify-center">
                      <span className="text-5xl">{user.avatar}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('edit')}
                    className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-cosmic-500 border-2 border-cosmic-950 flex items-center justify-center hover:bg-cosmic-400 transition-colors"
                    title="编辑资料"
                  >
                    <Edit3 className="w-4 h-4 text-white" />
                  </button>
                </div>

                <h2 className="mt-4 font-serif-sc text-2xl font-bold text-white">
                  {user.username}
                </h2>
                <p className="text-sm text-white/50 mt-1">{user.email}</p>
                {user.bio && (
                  <p className="mt-3 text-sm text-white/70 font-serif-sc italic">
                    「{user.bio}」
                  </p>
                )}

                <div className="mt-5 pt-5 border-t border-white/10 flex items-center justify-center gap-4 text-xs text-white/50">
                  <Calendar className="w-4 h-4" />
                  <span>加入于 {formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {statItems.map((item) => {
                const Icon = item.icon;
                const value = stats ? (stats as any)[item.key] : 0;
                return (
                  <div key={item.key} className="glass-card p-4 text-center">
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-xl ${item.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div className="text-2xl font-bold text-white mb-0.5">
                      {value || 0}
                    </div>
                    <div className="text-xs text-white/60">{item.label}</div>
                  </div>
                );
              })}
            </div>

            <div className="glass-card p-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">退出星阁</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-1.5 inline-flex w-full flex-wrap">
              {[
                { key: 'letters', label: '我写的信', icon: Mail },
                { key: 'mailroute', label: '邮路追踪', icon: Route },
                { key: 'favorites', label: '我的收藏', icon: Bookmark },
                { key: 'honors', label: '我的荣誉', icon: Trophy },
                { key: 'edit', label: '编辑资料', icon: Settings },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const showBadge = tab.key === 'mailroute' && exceptionLetters.filter(e => e.tracking?.hasActiveException).length > 0;
                const badgeCount = exceptionLetters.filter(e => e.tracking?.hasActiveException).length;
                const honorsBadge = tab.key === 'honors' && honors.length > 0;
                const favBadge = tab.key === 'favorites' && favStats?.pendingReminders && favStats.pendingReminders > 0;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as TabType)}
                    className={`relative flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.key
                        ? 'bg-gradient-to-r from-cosmic-500/20 to-aurora/20 text-white shadow-inner'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {showBadge && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-nebula-orange text-white text-[10px] font-bold flex items-center justify-center shadow-glow-sm">
                        {badgeCount}
                      </span>
                    )}
                    {honorsBadge && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-glow-sm">
                        {honors.length}
                      </span>
                    )}
                    {favBadge && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-nebula-orange text-white text-[10px] font-bold flex items-center justify-center shadow-glow-sm">
                        {favStats?.pendingReminders}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {activeTab === 'letters' && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif-sc text-xl font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-aurora" />
                    我寄出的信
                  </h3>
                  <Link
                    to="/write"
                    className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5"
                  >
                    <PenLine className="w-4 h-4" />
                    再写一封
                  </Link>
                </div>

                {loadingLocal ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-72 rounded-2xl bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : userLetters.length === 0 ? (
                  <div className="glass-card p-12 sm:p-16 text-center">
                    <div className="text-5xl mb-4">✉️</div>
                    <p className="text-lg text-white/70 font-serif-sc mb-2">
                      你还没有寄出任何信件...
                    </p>
                    <p className="text-sm text-white/50 mb-6">
                      第一封信，也许可以写给未来的自己
                    </p>
                    <Link to="/write" className="btn-primary inline-flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      开始写第一封信
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {userLetters.map((letter, index) => (
                      <LetterCard
                        key={letter.id}
                        letter={{
                          id: letter.id,
                          senderName: letter.senderName,
                          recipient: letter.recipient,
                          recipientType: letter.recipientType,
                          title: letter.title,
                          content: letter.content.substring(0, 100),
                          emotions: letter.emotions,
                          likes: letter.likes,
                          repliesCount: letter.replies?.length || 0,
                          createdAt: letter.createdAt,
                        }}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="animate-fade-in space-y-6">
                <div className="glass-card p-1.5 inline-flex w-full flex-wrap">
                  {favSubTabs.map((tab) => {
                    const TabIcon = tab.icon;
                    const badge = tab.key === 'reminders' && favStats?.pendingReminders && favStats.pendingReminders > 0;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setFavSubTab(tab.key as FavoritesSubTab)}
                        className={`relative flex-1 min-w-[90px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          favSubTab === tab.key
                            ? 'bg-starlight/20 text-starlight shadow-inner'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <TabIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        {badge && (
                          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-nebula-orange text-white text-[10px] font-bold flex items-center justify-center shadow-glow-sm">
                            {favStats?.pendingReminders}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {favSubTab === 'list' && (
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {groupFilterOptions.map((opt) => (
                          <button
                            key={String(opt.id)}
                            onClick={() => handleGroupFilter(opt.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              selectedGroupId === opt.id
                                ? 'bg-aurora/20 text-aurora border border-aurora/40'
                                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <span>{opt.icon}</span>
                            {opt.name}
                            <span className="opacity-60">({opt.count})</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectMode(!selectMode);
                            if (selectMode) setSelectedLetters(new Set());
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                            selectMode
                              ? 'bg-nebula-purple/20 text-nebula-purple border border-nebula-purple/40'
                              : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {selectMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          {selectMode ? '取消选择' : '批量管理'}
                        </button>
                      </div>
                    </div>

                    {selectMode && (
                      <div className="glass-card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={toggleSelectAll}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/70 hover:bg-white/10 transition-all"
                          >
                            {selectedLetters.size === favorites.length && favorites.length > 0
                              ? <CheckSquare className="w-3.5 h-3.5 text-aurora" />
                              : <Square className="w-3.5 h-3.5" />}
                            全选 ({selectedLetters.size}/{favorites.length})
                          </button>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleBatchMove(e.target.value === 'ungrouped' ? null : e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-aurora/50"
                            disabled={selectedLetters.size === 0}
                          >
                            <option value="">移动到分组...</option>
                            <option value="ungrouped">📁 未分组</option>
                            {groups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.icon} {g.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleBatchRemove}
                            disabled={selectedLetters.size === 0}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                            取消收藏
                          </button>
                        </div>
                      </div>
                    )}

                    {loadingLocal ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="h-72 rounded-2xl bg-white/5 animate-pulse" />
                        ))}
                      </div>
                    ) : favorites.length === 0 ? (
                      <div className="glass-card p-12 sm:p-16 text-center">
                        <div className="text-5xl mb-4">⭐</div>
                        <p className="text-lg text-white/70 font-serif-sc mb-2">
                          还没有收藏任何信件...
                        </p>
                        <p className="text-sm text-white/50 mb-6">
                          去信件广场逛逛，收藏那些打动你的信吧
                        </p>
                        <Link to="/" className="btn-secondary inline-flex items-center gap-2">
                          <ChevronRight className="w-4 h-4" />
                          去信件广场
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {favorites.map((letter, index) => {
                          const group = groups.find((g) => g.id === letter.groupId);
                          return (
                            <div key={letter.id} className="relative">
                              {selectMode && (
                                <button
                                  onClick={() => toggleSelectLetter(letter.id)}
                                  className="absolute top-3 left-3 z-10 p-1.5 rounded-lg bg-cosmic-950/80 backdrop-blur-sm border border-white/20 hover:bg-cosmic-900 transition-all"
                                >
                                  {selectedLetters.has(letter.id) ? (
                                    <CheckSquare className="w-4 h-4 text-aurora" />
                                  ) : (
                                    <Square className="w-4 h-4 text-white/60" />
                                  )}
                                </button>
                              )}
                              <div className="absolute top-3 right-3 z-10 flex gap-1.5">
                                {group && (
                                  <span className="px-2 py-1 rounded-lg bg-cosmic-950/80 backdrop-blur-sm text-[10px] text-white/70 flex items-center gap-1">
                                    <span>{group.icon}</span>
                                    {group.name}
                                  </span>
                                )}
                                <button
                                  onClick={() => {
                                    setReminderLetter(letter);
                                    setShowReminderModal(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-cosmic-950/80 backdrop-blur-sm border border-white/20 hover:bg-nebula-orange/20 hover:border-nebula-orange/40 transition-all"
                                  title="设置回看提醒"
                                >
                                  <Bell className="w-3.5 h-3.5 text-white/60 hover:text-nebula-orange" />
                                </button>
                              </div>
                              <LetterCard
                                letter={{
                                  id: letter.id,
                                  senderName: letter.isAnonymous ? '匿名星人' : letter.senderName,
                                  recipient: letter.recipient,
                                  recipientType: letter.recipientType,
                                  title: letter.title,
                                  content: letter.content.substring(0, 100),
                                  emotions: letter.emotions,
                                  likes: letter.likes,
                                  repliesCount: letter.replies?.length || 0,
                                  createdAt: letter.favoritedAt,
                                }}
                                index={index}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {favSubTab === 'groups' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif-sc text-xl font-semibold text-white flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-nebula-purple" />
                        收藏分组
                      </h3>
                      <button
                        onClick={() => {
                          setEditingGroup(null);
                          setShowGroupModal(true);
                        }}
                        className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        新建分组
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="glass-card p-5 border border-white/10 hover:border-aurora/30 transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">📁</span>
                            <div>
                              <h4 className="font-medium text-white">未分组</h4>
                              <p className="text-xs text-white/50 mt-0.5">
                                {ungroupedCount} 封信件
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {groups.map((group) => (
                        <div
                          key={group.id}
                          className="glass-card p-5 border border-white/10 hover:border-aurora/30 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{group.icon}</span>
                              <div>
                                <h4 className="font-medium text-white flex items-center gap-2">
                                  {group.name}
                                  {group.isDefault && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-starlight/20 text-starlight">
                                      默认
                                    </span>
                                  )}
                                </h4>
                                <p className="text-xs text-white/50 mt-0.5">
                                  {group.count} 封信件
                                </p>
                                {group.description && (
                                  <p className="text-xs text-white/40 mt-1">
                                    {group.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingGroup(group);
                                  setShowGroupModal(true);
                                }}
                                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
                                title="编辑分组"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {!group.isDefault && (
                                <button
                                  onClick={() => handleDeleteGroup(group.id)}
                                  className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                  title="删除分组"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {favSubTab === 'reminders' && (
                  <ReminderList reminders={reminders} onRefresh={refreshFavorites} />
                )}

                {favSubTab === 'stats' && (
                  <FavoritesStats stats={favStats} loading={loadingLocal} />
                )}
              </div>
            )}

            {activeTab === 'honors' && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif-sc text-xl font-semibold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-aurora" />
                    我的荣誉殿堂
                    <span className="text-sm font-normal text-white/50">
                      ({honors.length} 项荣誉)
                    </span>
                  </h3>
                  <Link
                    to="/activities"
                    className="btn-secondary py-2 px-4 text-sm flex items-center gap-1.5"
                  >
                    <Trophy className="w-4 h-4" />
                    参与活动
                  </Link>
                </div>

                {loadingLocal ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : honors.length === 0 ? (
                  <div className="glass-card p-12 sm:p-16 text-center">
                    <div className="text-5xl mb-4">🏆</div>
                    <p className="text-lg text-white/70 font-serif-sc mb-2">
                      还没有获得任何荣誉...
                    </p>
                    <p className="text-sm text-white/50 mb-6">
                      参与星球社群的主题征文活动，赢取属于你的荣誉
                    </p>
                    <Link to="/activities" className="btn-primary inline-flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      去参加活动
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {honors.map((honor) => (
                      <HonorCard key={honor.id} honor={honor} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'mailroute' && user && (
              <div className="animate-fade-in space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif-sc text-xl font-semibold text-white flex items-center gap-2">
                    <Route className="w-5 h-5 text-aurora" />
                    时空邮路总览
                  </h3>
                  <button
                    onClick={fetchAllData}
                    className="btn-secondary py-2 px-4 text-sm flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    刷新数据
                  </button>
                </div>

                <MailRouteStatsCard userId={user.id} />

                <div className="glass-card p-5 sm:p-6">
                  <h4 className="font-medium text-white mb-5 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-starlight" />
                    所有信件传送进度
                  </h4>
                  {loadingLocal ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : userLetters.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="text-4xl mb-3">✉️</div>
                      <p className="text-white/60">还没有寄出任何信件</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userLetters.map((letter) => {
                        const recipientInfo = getRecipientTypeLabel(letter.recipientType);
                        return (
                          <div
                            key={letter.id}
                            className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${recipientInfo.color}`}>
                                        <span>{recipientInfo.icon}</span>
                                        致{recipientInfo.label}的{letter.recipient}
                                      </span>
                                      <span className="text-xs text-white/40">
                                        {formatDate(letter.createdAt)}
                                      </span>
                                    </div>
                                    <h5 className="font-serif-sc font-semibold text-white truncate group-hover:text-aurora transition-colors">
                                      {letter.title}
                                    </h5>
                                  </div>
                                  <Link
                                    to={`/letter/${letter.id}`}
                                    className="shrink-0 p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-aurora hover:border-aurora/40 hover:bg-aurora/10 transition-all"
                                    title="查看详情"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </Link>
                                </div>
                                <MiniMailRouteStatus
                                  letterId={letter.id}
                                  createdAt={letter.createdAt}
                                  estimatedArrival={letter.deliverAt}
                                  showCountdown
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {exceptionLetters.length > 0 && (
                  <div className="glass-card p-5 sm:p-6 border-2 border-nebula-orange/20">
                    <h4 className="font-medium text-white mb-5 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-nebula-orange" />
                      需要处理的异常信件
                      <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-nebula-orange/20 text-nebula-orange">
                        {exceptionLetters.filter(e => e.tracking?.hasActiveException).length} 封待处理
                      </span>
                    </h4>
                    <div className="space-y-3">
                      {exceptionLetters.map((letter) => {
                        const activeExc = letter.tracking?.exceptions?.find((e: any) => !e.resolved);
                        const excInfo = activeExc ? (EXCEPTION_INFO as any)[activeExc.type] : null;
                        const recipientInfo = getRecipientTypeLabel(letter.recipientType);
                        return (
                          <div
                            key={letter.letterId}
                            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                              letter.tracking?.hasActiveException
                                ? 'bg-nebula-orange/8 border-nebula-orange/30'
                                : 'bg-white/5 border-white/10'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${recipientInfo.color}`}>
                                        <span>{recipientInfo.icon}</span>
                                        {letter.recipient}
                                      </span>
                                      {letter.tracking?.hasActiveException ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-nebula-orange/20 text-nebula-orange font-medium">
                                          <AlertTriangle className="w-3 h-3" />
                                          {excInfo?.label || '异常中'}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-nebula-mint/20 text-nebula-mint">
                                          已处理
                                        </span>
                                      )}
                                    </div>
                                    <h5 className="font-serif-sc font-semibold text-white truncate">
                                      {letter.title}
                                    </h5>
                                  </div>
                                  <Link
                                    to={`/letter/${letter.letterId}`}
                                    className={`shrink-0 py-2 px-4 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all ${
                                      letter.tracking?.hasActiveException
                                        ? 'bg-nebula-orange/15 border border-nebula-orange/40 text-nebula-orange hover:bg-nebula-orange/25'
                                        : 'btn-secondary'
                                    }`}
                                  >
                                    {letter.tracking?.hasActiveException ? (
                                      <>
                                        <Sparkles className="w-4 h-4" />
                                        立即处理
                                      </>
                                    ) : (
                                      <>
                                        <ExternalLink className="w-4 h-4" />
                                        查看详情
                                      </>
                                    )}
                                  </Link>
                                </div>
                                {activeExc && (
                                  <div className="p-3 rounded-xl bg-nebula-orange/8 border border-nebula-orange/20">
                                    <p className="text-sm text-nebula-orange/90 flex items-start gap-2">
                                      <span className="text-base">{excInfo?.icon}</span>
                                      <span>{activeExc.message}</span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'edit' && (
              <div className="glass-card p-6 sm:p-8 animate-fade-in">
                <h3 className="font-serif-sc text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-nebula-mint" />
                  编辑星际身份
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">选择你的星象徽记</label>
                    <div className="grid grid-cols-8 gap-2 sm:gap-3">
                      {avatarOptions.map((av) => (
                        <button
                          key={av}
                          onClick={() => setEditAvatar(av)}
                          className={`aspect-square rounded-xl text-2xl sm:text-3xl flex items-center justify-center transition-all ${
                            editAvatar === av
                              ? 'bg-gradient-to-br from-cosmic-500/30 to-aurora/30 border-2 border-aurora/60 shadow-glow-sm scale-110'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">星际昵称</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={20}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2 flex justify-between">
                      <span>个性签名</span>
                      <span className="text-xs text-white/40">{editBio.length}/80</span>
                    </label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value.slice(0, 80))}
                      rows={3}
                      placeholder="一句话介绍自己..."
                      className="input-field resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/10">
                    <button
                      onClick={() => {
                        setEditName(user.username);
                        setEditBio(user.bio || '');
                        setEditAvatar(user.avatar);
                        setActiveTab('letters');
                      }}
                      className="btn-secondary flex-1"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={editSaving}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {editSaving ? '保存中...' : '保存资料'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <GroupModal
        open={showGroupModal}
        onClose={() => {
          setShowGroupModal(false);
          setEditingGroup(null);
        }}
        onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup}
        editingGroup={editingGroup}
      />

      <ReminderModal
        open={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          setReminderLetter(null);
        }}
        onSubmit={handleCreateReminder}
        letterTitle={reminderLetter?.title}
      />
    </div>
  );
}
