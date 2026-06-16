import { useState, useEffect } from 'react';
import { Mail, Heart, MessageCircle, Lock, Globe, BarChart3, Tag, Compass } from 'lucide-react';
import { archiveApi } from '@/api/archive';
import EmotionTag from '@/components/Emotion/EmotionTag';
import type { UserArchiveStats, UserEmotionStat, UserRecipientStat, UserPersonaTag } from '@/types';

interface ArchiveStatsPanelProps {
  userId: string;
}

export default function ArchiveStatsPanel({ userId }: ArchiveStatsPanelProps) {
  const [stats, setStats] = useState<UserArchiveStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await archiveApi.getUserStats(userId);
      if (res.success && res.data) setStats(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-6 animate-pulse">
            <div className="h-5 w-32 rounded bg-white/10 mb-4" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-20 rounded-xl bg-white/5" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-white/60">暂无统计数据</p>
      </div>
    );
  }

  const overviewCards = [
    { key: 'totalLetters', label: '总信件', icon: Mail, value: stats.overview.totalLetters, color: 'text-aurora', bg: 'bg-aurora/15' },
    { key: 'publicLetters', label: '公开信', icon: Globe, value: stats.overview.publicLetters, color: 'text-nebula-mint', bg: 'bg-nebula-mint/15' },
    { key: 'privateLetters', label: '私密信', icon: Lock, value: stats.overview.privateLetters, color: 'text-nebula-purple', bg: 'bg-nebula-purple/15' },
    { key: 'totalLikes', label: '获赞数', icon: Heart, value: stats.overview.totalLikes, color: 'text-nebula-pink', bg: 'bg-nebula-pink/15' },
    { key: 'totalReplies', label: '回信数', icon: MessageCircle, value: stats.overview.totalReplies, color: 'text-starlight', bg: 'bg-starlight/15' },
    { key: 'replyRate', label: '回信率', icon: BarChart3, value: `${stats.overview.replyRate}%`, color: 'text-nebula-orange', bg: 'bg-nebula-orange/15' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="font-serif-sc text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-aurora" />
          数据总览
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {overviewCards.map(card => {
            const Icon = card.icon;
            return (
              <div key={card.key} className="glass-card p-4 text-center">
                <div className={`w-10 h-10 mx-auto mb-2 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-white">{card.value}</div>
                <div className="text-xs text-white/50 mt-0.5">{card.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-serif-sc text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5 text-nebula-pink" />
          情绪画像
        </h3>
        <div className="glass-card p-5">
          {stats.topEmotions.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-4">暂无情绪数据</p>
          ) : (
            <div className="space-y-3">
              {stats.topEmotions.map((emo: UserEmotionStat, idx: number) => (
                <div key={emo.name} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white/30 w-5 text-right">{idx + 1}</span>
                  <EmotionTag name={emo.name} icon={emo.icon} color={emo.color} size="sm" />
                  <div className="flex-1 h-2.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${emo.percentage}%`,
                        backgroundColor: emo.color,
                        boxShadow: `0 0 8px ${emo.color}50`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-white/50 w-8 text-right">{emo.count}封</span>
                  <span className="text-xs text-white/30 w-10 text-right">{emo.percentage}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-serif-sc text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Compass className="w-5 h-5 text-nebula-orange" />
          收件人分布
        </h3>
        <div className="glass-card p-5">
          {stats.recipientStats.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-4">暂无收件人数据</p>
          ) : (
            <div className="space-y-3">
              {stats.recipientStats.map((rs: UserRecipientStat) => (
                <div key={rs.key} className="flex items-center gap-3">
                  <span className="text-base">{rs.icon}</span>
                  <span className="text-sm text-white/80 w-16">{rs.label}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${rs.percentage}%`,
                        backgroundColor: rs.key === 'future' ? '#4cc9f0' : rs.key === 'past' ? '#ff7b00' : rs.key === 'parallel' ? '#7a63ff' : '#ffd166',
                      }}
                    />
                  </div>
                  <span className="text-xs text-white/50 w-8 text-right">{rs.count}封</span>
                  <span className="text-xs text-white/30 w-10 text-right">{rs.percentage}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {stats.monthlyTimeline.length > 0 && (
        <div>
          <h3 className="font-serif-sc text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-starlight" />
            月度活跃
          </h3>
          <div className="glass-card p-5">
            <div className="flex items-end gap-1.5 h-32">
              {stats.monthlyTimeline.map((item) => {
                const maxCount = Math.max(...stats.monthlyTimeline.map(m => m.count));
                const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-white/50">{item.count}</span>
                    <div className="w-full rounded-t-sm bg-gradient-to-t from-aurora/60 to-starlight/60 transition-all duration-500"
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    />
                    <span className="text-[10px] text-white/40 truncate w-full text-center">
                      {item.month.split('-')[1]?.replace(/^0/, '') || item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {stats.personaTags.length > 0 && (
        <div>
          <h3 className="font-serif-sc text-lg font-semibold text-white mb-4 flex items-center gap-2">
            ✨ 星际身份
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {stats.personaTags.map((tag: UserPersonaTag) => (
              <div
                key={tag.label}
                className="glass-card px-4 py-2.5 flex items-center gap-2 hover:bg-white/10 transition-all cursor-default group"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">{tag.icon}</span>
                <div>
                  <div className="text-sm font-medium text-white">{tag.label}</div>
                  <div className="text-[11px] text-white/40">{tag.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
