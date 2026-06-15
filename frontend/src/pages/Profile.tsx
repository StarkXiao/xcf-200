import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail, Heart, Bookmark, Settings, Calendar, Sparkles, PenLine,
  User as UserIcon, Edit3, LogOut, ChevronRight, FileText, MessageCircle
} from 'lucide-react';
import LetterCard from '@/components/Letter/LetterCard';
import { userApi } from '@/api/user';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import type { Letter, UserStats } from '@/types';
import { formatDate } from '@/utils/helpers';

type TabType = 'letters' | 'favorites' | 'edit';

const avatarOptions = ['🌟', '🌙', '🌈', '🦋', '🌸', '🌊', '⭐', '🐱', '🦄', '🌻', '☕', '🎨', '🍀', '🌠', '🔮', '🌌'];

const statItems = [
  { key: 'totalLetters', label: '寄出信件', icon: Mail, color: 'text-aurora', bg: 'bg-aurora/15' },
  { key: 'totalLikes', label: '收到星星', icon: Heart, color: 'text-nebula-pink', bg: 'bg-nebula-pink/15' },
  { key: 'totalReplies', label: '收到回信', icon: MessageCircle, color: 'text-starlight', bg: 'bg-starlight/15' },
  { key: 'totalFavorites', label: '收藏信件', icon: Bookmark, color: 'text-nebula-mint', bg: 'bg-nebula-mint/15' },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateUser } = useAuthStore();
  const { showToast, setLoading } = useUIStore();

  const [activeTab, setActiveTab] = useState<TabType>('letters');
  const [userLetters, setUserLetters] = useState<Letter[]>([]);
  const [favorites, setFavorites] = useState<Letter[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingLocal, setLoadingLocal] = useState(true);

  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editSaving, setEditSaving] = useState(false);

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
      const [lettersRes, favRes, statsRes] = await Promise.all([
        userApi.getUserLetters(user.id),
        userApi.getFavorites(user.id),
        userApi.getStats(user.id),
      ]);
      if (lettersRes.success) setUserLetters(lettersRes.data);
      if (favRes.success) setFavorites(favRes.data);
      if (statsRes.success) setStats(statsRes.data);
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

  if (loadingLocal) {
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
            <div className="glass-card p-1.5 inline-flex w-full">
              {[
                { key: 'letters', label: '我写的信', icon: Mail },
                { key: 'favorites', label: '我的收藏', icon: Bookmark },
                { key: 'edit', label: '编辑资料', icon: Settings },
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as TabType)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.key
                        ? 'bg-gradient-to-r from-cosmic-500/20 to-aurora/20 text-white shadow-inner'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
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
              <div className="animate-fade-in">
                <h3 className="font-serif-sc text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-starlight" />
                  星之集邮册
                  <span className="text-sm font-normal text-white/50">
                    ({favorites.length} 封收藏
                  </span>
                </h3>

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
                    {favorites.map((letter, index) => (
                      <LetterCard
                        key={letter.id}
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
                          createdAt: letter.createdAt,
                        }}
                        index={index}
                      />
                    ))}
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
    </div>
  );
}
