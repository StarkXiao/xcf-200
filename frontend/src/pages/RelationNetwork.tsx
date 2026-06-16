import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, FolderPlus, UserPlus, Sparkles, Globe2,
  TrendingUp, History, CalendarDays, RefreshCw,
} from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import { relationNetworkApi } from '@/api/relationNetwork';
import type {
  RelationNetworkStats,
  RecipientGroup,
  RecipientRelation,
} from '@/types';

import StatsOverview from '@/components/RelationNetwork/StatsOverview';
import RecipientCard from '@/components/RelationNetwork/RecipientCard';
import GroupCard from '@/components/RelationNetwork/GroupCard';
import FestivalSuggestionCard from '@/components/RelationNetwork/FestivalSuggestionCard';
import EmotionPreferenceChart from '@/components/RelationNetwork/EmotionPreferenceChart';
import GroupDistribution from '@/components/RelationNetwork/GroupDistribution';
import WritingFrequencyChart from '@/components/RelationNetwork/WritingFrequencyChart';
import RecipientModal from '@/components/RelationNetwork/RecipientModal';
import GroupModal from '@/components/RelationNetwork/GroupModal';

type ViewMode = 'overview' | 'recipients' | 'groups' | 'festivals';

export default function RelationNetwork() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { showToast, setLoading } = useUIStore();

  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [stats, setStats] = useState<RelationNetworkStats | null>(null);
  const [groups, setGroups] = useState<RecipientGroup[]>([]);
  const [allRelations, setAllRelations] = useState<RecipientRelation[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loading, setLoadingLocal] = useState(true);

  const [recipientModalOpen, setRecipientModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<RecipientRelation | null>(null);
  const [editingGroup, setEditingGroup] = useState<RecipientGroup | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchAllData = async () => {
    if (!user) return;
    try {
      setLoadingLocal(true);
      const [statsRes, groupsRes, relationsRes] = await Promise.all([
        relationNetworkApi.getStats(user.id),
        relationNetworkApi.getGroups(user.id),
        relationNetworkApi.getRelations(user.id),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (groupsRes.success) setGroups(groupsRes.data);
      if (relationsRes.success) setAllRelations(relationsRes.data);
    } catch (err) {
      showToast({ type: 'error', message: '加载数据失败' });
    } finally {
      setLoadingLocal(false);
    }
  };

  const filteredRelations = useMemo(() => {
    if (!selectedGroupId) return allRelations;
    return allRelations.filter((r) => r.groupId === selectedGroupId);
  }, [allRelations, selectedGroupId]);

  const handleSaveRecipient = async (data: {
    name: string;
    groupId: string;
    avatar: string;
    note: string;
  }) => {
    if (!user) return;
    try {
      setLoading(true);
      if (editingRecipient) {
        const res = await relationNetworkApi.updateRelation(
          user.id,
          editingRecipient.id,
          data
        );
        if (res.success) {
          showToast({ type: 'success', message: '收信人已更新' });
        } else {
          showToast({ type: 'error', message: res.message || '更新失败' });
        }
      } else {
        const res = await relationNetworkApi.createRelation(user.id, data);
        if (res.success) {
          showToast({ type: 'success', message: '收信人添加成功' });
        } else {
          showToast({ type: 'error', message: res.message || '添加失败' });
        }
      }
      setRecipientModalOpen(false);
      setEditingRecipient(null);
      fetchAllData();
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '操作失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecipient = async (id: string) => {
    if (!user) return;
    if (!window.confirm('确定要删除这个收信人吗？')) return;
    try {
      setLoading(true);
      const res = await relationNetworkApi.deleteRelation(user.id, id);
      if (res.success) {
        showToast({ type: 'success', message: '收信人已删除' });
        fetchAllData();
      } else {
        showToast({ type: 'error', message: res.message || '删除失败' });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '删除失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGroup = async (data: {
    name: string;
    icon: string;
    color: string;
    description: string;
  }) => {
    if (!user) return;
    try {
      setLoading(true);
      if (editingGroup) {
        const res = await relationNetworkApi.updateGroup(user.id, editingGroup.id, data);
        if (res.success) {
          showToast({ type: 'success', message: '分组已更新' });
        } else {
          showToast({ type: 'error', message: res.message || '更新失败' });
        }
      } else {
        const res = await relationNetworkApi.createGroup(user.id, data);
        if (res.success) {
          showToast({ type: 'success', message: '分组创建成功' });
        } else {
          showToast({ type: 'error', message: res.message || '创建失败' });
        }
      }
      setGroupModalOpen(false);
      setEditingGroup(null);
      fetchAllData();
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '操作失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!user) return;
    if (!window.confirm('删除分组后，该分组下的收信人会自动移到其他分组，确定继续吗？')) return;
    try {
      setLoading(true);
      const res = await relationNetworkApi.deleteGroup(user.id, id);
      if (res.success) {
        showToast({ type: 'success', message: '分组已删除' });
        if (selectedGroupId === id) setSelectedGroupId(null);
        fetchAllData();
      } else {
        showToast({ type: 'error', message: res.message || '删除失败' });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '删除失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleWriteLetter = (recipient?: RecipientRelation) => {
    navigate('/write', {
      state: recipient
        ? {
            prefillRecipient: recipient.name,
          }
        : undefined,
    });
  };

  const viewTabs = [
    { key: 'overview', label: '总览', icon: Globe2 },
    { key: 'recipients', label: '收信人', icon: Users },
    { key: 'groups', label: '分组管理', icon: FolderPlus },
    { key: 'festivals', label: '节日提醒', icon: CalendarDays },
  ] as const;

  if (loading || !stats) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-cosmic-400/30 border-t-starlight animate-spin" />
          <p className="text-white/60">正在构建你的关系星图...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 py-8 sm:py-12">
      <div className="container max-w-7xl">
        <div className="text-center mb-8 sm:mb-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 mb-4">
            <Globe2 className="w-8 h-8 text-aurora animate-float" />
          </div>
          <h1 className="font-serif-sc text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            你的<span className="bg-gradient-to-r from-starlight via-aurora to-nebula-pink bg-clip-text text-transparent"> 关系星图</span>
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            沉淀每一段珍贵的关系，记录你写给Ta的每一份心意
          </p>
        </div>

        <div className="glass-card p-1.5 inline-flex w-full flex-wrap mb-6">
          {viewTabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className={`relative flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  viewMode === tab.key
                    ? 'bg-gradient-to-r from-cosmic-500/20 to-aurora/20 text-white shadow-inner'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}

          <div className="flex-1 flex justify-end min-w-[200px] gap-2 p-1">
            <button
              onClick={fetchAllData}
              className="px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5"
              title="刷新数据"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {viewMode === 'recipients' && (
              <button
                onClick={() => {
                  setEditingRecipient(null);
                  setRecipientModalOpen(true);
                }}
                className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">添加收信人</span>
                <span className="sm:hidden">添加</span>
              </button>
            )}
            {viewMode === 'groups' && (
              <button
                onClick={() => {
                  setEditingGroup(null);
                  setGroupModalOpen(true);
                }}
                className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5"
              >
                <FolderPlus className="w-4 h-4" />
                <span className="hidden sm:inline">创建分组</span>
                <span className="sm:hidden">创建</span>
              </button>
            )}
          </div>
        </div>

        {viewMode === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <StatsOverview stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-card p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-serif-sc text-lg font-semibold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-starlight" />
                      常写对象 Top 5
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {stats.topRecipients.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-3">💌</div>
                        <p className="text-white/60 text-sm">还没有写信记录</p>
                      </div>
                    ) : (
                      stats.topRecipients.map((recipient, index) => (
                        <RecipientCard
                          key={recipient.id}
                          recipient={recipient}
                          rank={index + 1}
                          onClick={() => handleWriteLetter(recipient)}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GroupDistribution distribution={stats.groupDistribution} />
                  <WritingFrequencyChart data={stats.writingFrequency} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-card p-5 sm:p-6">
                  <h3 className="font-serif-sc text-lg font-semibold text-white mb-5 flex items-center gap-2">
                    <History className="w-5 h-5 text-aurora" />
                    最近写过
                  </h3>
                  <div className="space-y-3">
                    {stats.recentRecipients.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="text-3xl mb-2">📭</div>
                        <p className="text-white/50 text-xs">暂无记录</p>
                      </div>
                    ) : (
                      stats.recentRecipients.slice(0, 4).map((recipient) => (
                        <button
                          key={recipient.id}
                          onClick={() => handleWriteLetter(recipient)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl shrink-0">
                            {recipient.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate group-hover:text-aurora transition-colors">
                              {recipient.name}
                            </p>
                            <p className="text-xs text-white/40">
                              {recipient.letterCount} 封信
                            </p>
                          </div>
                          <Sparkles className="w-4 h-4 text-white/30 group-hover:text-starlight transition-colors" />
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <EmotionPreferenceChart
                  preferences={stats.emotionPreferences}
                  recipients={allRelations}
                />
              </div>
            </div>

            {stats.festivalSuggestions.length > 0 && (
              <div>
                <h3 className="font-serif-sc text-xl font-semibold text-white mb-5 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-nebula-orange" />
                  即将到来的节日提醒
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.festivalSuggestions.map((suggestion) => (
                    <FestivalSuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'recipients' && (
          <div className="animate-fade-in space-y-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedGroupId(null)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  selectedGroupId === null
                    ? 'bg-aurora/20 text-aurora border border-aurora/40'
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                }`}
              >
                全部 ({allRelations.length})
              </button>
              {groups.map((group) => {
                const count = allRelations.filter((r) => r.groupId === group.id).length;
                return (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`px-4 py-2 rounded-full text-sm transition-all flex items-center gap-1.5 ${
                      selectedGroupId === group.id
                        ? 'border'
                        : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                    }`}
                    style={
                      selectedGroupId === group.id
                        ? {
                            background: `${group.color}20`,
                            color: group.color,
                            borderColor: `${group.color}60`,
                          }
                        : undefined
                    }
                  >
                    <span>{group.icon}</span>
                    {group.name} ({count})
                  </button>
                );
              })}
            </div>

            {filteredRelations.length === 0 ? (
              <div className="glass-card p-12 sm:p-16 text-center">
                <div className="text-5xl mb-4">👥</div>
                <p className="text-lg text-white/70 font-serif-sc mb-2">
                  {selectedGroupId ? '该分组下还没有收信人' : '还没有添加任何收信人'}
                </p>
                <p className="text-sm text-white/50 mb-6">
                  记录下那些你想写信的人吧
                </p>
                <button
                  onClick={() => {
                    setEditingRecipient(null);
                    setRecipientModalOpen(true);
                  }}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  添加第一个收信人
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRelations.map((recipient) => {
                  const group = groups.find((g) => g.id === recipient.groupId);
                  return (
                    <RecipientCard
                      key={recipient.id}
                      recipient={{ ...recipient, group }}
                      onEdit={(r) => {
                        setEditingRecipient(r);
                        setRecipientModalOpen(true);
                      }}
                      onDelete={handleDeleteRecipient}
                      onClick={() => handleWriteLetter(recipient)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {viewMode === 'groups' && (
          <div className="animate-fade-in">
            {groups.length === 0 ? (
              <div className="glass-card p-12 sm:p-16 text-center">
                <div className="text-5xl mb-4">📁</div>
                <p className="text-lg text-white/70 font-serif-sc mb-2">
                  还没有创建任何分组
                </p>
                <p className="text-sm text-white/50 mb-6">
                  创建分组来更好地管理你的收信人
                </p>
                <button
                  onClick={() => {
                    setEditingGroup(null);
                    setGroupModalOpen(true);
                  }}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <FolderPlus className="w-4 h-4" />
                  创建第一个分组
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => {
                  const count = allRelations.filter((r) => r.groupId === group.id).length;
                  return (
                    <GroupCard
                      key={group.id}
                      group={group}
                      count={count}
                      onEdit={(g) => {
                        setEditingGroup(g);
                        setGroupModalOpen(true);
                      }}
                      onDelete={handleDeleteGroup}
                      onClick={() => {
                        setSelectedGroupId(group.id);
                        setViewMode('recipients');
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {viewMode === 'festivals' && (
          <div className="animate-fade-in">
            {stats.festivalSuggestions.length === 0 ? (
              <div className="glass-card p-12 sm:p-16 text-center">
                <div className="text-5xl mb-4">🎊</div>
                <p className="text-lg text-white/70 font-serif-sc mb-2">
                  暂时没有节日提醒
                </p>
                <p className="text-sm text-white/50">
                  节日来临时，这里会提醒你给重要的人写信
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.festivalSuggestions.map((suggestion) => (
                  <FestivalSuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <RecipientModal
        isOpen={recipientModalOpen}
        onClose={() => {
          setRecipientModalOpen(false);
          setEditingRecipient(null);
        }}
        onSave={handleSaveRecipient}
        groups={groups}
        editingRecipient={editingRecipient}
      />

      <GroupModal
        isOpen={groupModalOpen}
        onClose={() => {
          setGroupModalOpen(false);
          setEditingGroup(null);
        }}
        onSave={handleSaveGroup}
        editingGroup={editingGroup}
      />
    </div>
  );
}
