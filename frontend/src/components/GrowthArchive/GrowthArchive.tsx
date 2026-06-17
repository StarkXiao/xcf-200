import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Minus, Flame, Calendar, Clock,
  Heart, Users, BarChart3, Award, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import type { GrowthProfileData } from '@/types';
import { formatDate } from '@/utils/helpers';

type SubTab = 'frequency' | 'emotion' | 'recipient' | 'trend';

interface GrowthArchiveProps {
  data: GrowthProfileData;
  loading: boolean;
}

export default function GrowthArchive({ data, loading }: GrowthArchiveProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('frequency');

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="glass-card p-6 animate-pulse h-32" />
        <div className="glass-card p-6 animate-pulse h-64" />
        <div className="glass-card p-6 animate-pulse h-48" />
      </div>
    );
  }

  const subTabs = [
    { key: 'frequency', label: '写信频次', icon: BarChart3 },
    { key: 'emotion', label: '情绪分布', icon: Heart },
    { key: 'recipient', label: '常写对象', icon: Users },
    { key: 'trend', label: '阶段趋势', icon: TrendingUp },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="font-serif-sc text-xl font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-aurora" />
          成长档案
          <span className="text-sm font-normal text-white/50">
            (入驻 {data.accountAgeDays} 天)
          </span>
        </h3>
      </div>

      <div className="glass-card p-1.5 inline-flex w-full flex-wrap">
        {subTabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as SubTab)}
              className={`flex-1 min-w-[90px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeSubTab === tab.key
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

      {activeSubTab === 'frequency' && <FrequencySection data={data} />}
      {activeSubTab === 'emotion' && <EmotionSection data={data} />}
      {activeSubTab === 'recipient' && <RecipientSection data={data} />}
      {activeSubTab === 'trend' && <TrendSection data={data} />}
    </div>
  );
}

function FrequencySection({ data }: { data: GrowthProfileData }) {
  const { writingFrequency: wf } = data;
  const maxMonthly = Math.max(...wf.monthlyData.map(m => m.count), 1);
  const maxHourly = Math.max(...wf.hourlyDistribution.map(h => h.count), 1);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Flame} label="当前连写" value={`${wf.currentStreak} 天`} color="text-nebula-orange" bg="bg-nebula-orange/15" />
        <StatCard icon={Flame} label="最长连写" value={`${wf.longestStreak} 天`} color="text-aurora" bg="bg-aurora/15" />
        <StatCard icon={Calendar} label="月均写信" value={`${wf.averagePerMonth} 封`} color="text-starlight" bg="bg-starlight/15" />
        <StatCard icon={Clock} label="写作天数" value={`${wf.totalWritingDays} 天`} color="text-nebula-mint" bg="bg-nebula-mint/15" />
      </div>

      {wf.peakMonth && (
        <div className="glass-card p-4 flex items-center gap-3 border border-aurora/20">
          <span className="text-2xl">🏔️</span>
          <div>
            <div className="text-sm font-medium text-white">写信高峰月</div>
            <div className="text-xs text-white/60">
              {wf.peakMonth.month} 共写了 {wf.peakMonth.count} 封信
            </div>
          </div>
        </div>
      )}

      <div className="glass-card p-5 sm:p-6">
        <h4 className="font-serif-sc font-semibold text-white mb-5 flex items-center gap-2">
          <span className="text-xl">📊</span>
          月度写信频次
        </h4>
        {wf.monthlyData.length === 0 ? (
          <p className="text-white/50 text-sm text-center py-4">暂无写作数据</p>
        ) : (
          <div className="flex items-end justify-between gap-1.5 h-44">
            {wf.monthlyData.slice(-12).map((item, index) => {
              const height = (item.count / maxMonthly) * 100;
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="text-[10px] text-white/70 font-medium">{item.count}</div>
                  <div className="w-full relative flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-aurora to-cosmic-400 transition-all duration-700 ease-out relative group min-h-[4px]"
                      style={{ height: `${Math.max(height, 3)}%` }}
                    >
                      <div className="absolute inset-0 rounded-t-md bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="text-[9px] text-white/40 text-center leading-tight whitespace-nowrap">
                    {item.month.split('-')[1]}月
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="glass-card p-5 sm:p-6">
        <h4 className="font-serif-sc font-semibold text-white mb-5 flex items-center gap-2">
          <span className="text-xl">🕐</span>
          写信时段分布
        </h4>
        {wf.hourlyDistribution.every(h => h.count === 0) ? (
          <p className="text-white/50 text-sm text-center py-4">暂无时段数据</p>
        ) : (
          <div className="grid grid-cols-12 gap-1">
            {wf.hourlyDistribution.map((h) => {
              const intensity = maxHourly > 0 ? h.count / maxHourly : 0;
              return (
                <div key={h.hour} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full aspect-square rounded-sm transition-all duration-500"
                    style={{
                      backgroundColor: intensity > 0
                        ? `rgba(139, 92, 246, ${0.15 + intensity * 0.85})`
                        : 'rgba(255,255,255,0.05)',
                    }}
                    title={`${h.label}: ${h.count} 封`}
                  />
                  {h.hour % 4 === 0 && (
                    <span className="text-[8px] text-white/40">{h.hour}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EmotionSection({ data }: { data: GrowthProfileData }) {
  const { emotionProfile: ep } = data;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h4 className="font-serif-sc font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">🎭</span>
            当前主导情绪
          </h4>
          {ep.currentDominantEmotion ? (
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${ep.currentDominantEmotion.color}25` }}
              >
                {ep.currentDominantEmotion.icon}
              </div>
              <div>
                <div className="text-lg font-bold text-white">{ep.currentDominantEmotion.name}</div>
                <div className="text-sm text-white/60">
                  近期信件中占比 {ep.currentDominantEmotion.percentage}%
                </div>
              </div>
            </div>
          ) : (
            <p className="text-white/50 text-sm">暂无情绪数据</p>
          )}
        </div>

        <div className="glass-card p-5">
          <h4 className="font-serif-sc font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            情绪平衡指数
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>内向情绪</span>
              <span>{ep.emotionBalance}% 积极</span>
              <span>积极情绪</span>
            </div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-nebula-purple to-aurora transition-all duration-700"
                style={{ width: `${ep.emotionBalance}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/40">
              <span>遗憾·孤独·告别</span>
              <span>希望·治愈·温暖</span>
            </div>
          </div>
        </div>
      </div>

      {ep.emotionShift && (
        <div className="glass-card p-5 border border-nebula-purple/20">
          <h4 className="font-serif-sc font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-xl">🔄</span>
            情绪转向
          </h4>
          <div className="flex items-center gap-3">
            <div className="px-3 py-2 rounded-xl bg-white/5 text-white/70 text-sm">
              {ep.emotionShift.fromIcon} {ep.emotionShift.from}
            </div>
            <span className="text-white/40">→</span>
            <div className="px-3 py-2 rounded-xl bg-aurora/10 text-aurora text-sm font-medium">
              {ep.emotionShift.toIcon} {ep.emotionShift.to}
            </div>
          </div>
          <p className="text-xs text-white/50 mt-2">{ep.emotionShift.description}</p>
        </div>
      )}

      <div className="glass-card p-5 sm:p-6">
        <h4 className="font-serif-sc font-semibold text-white mb-5 flex items-center gap-2">
          <span className="text-xl">🌈</span>
          情绪分布
        </h4>
        {ep.topEmotions.length === 0 ? (
          <p className="text-white/50 text-sm text-center py-4">暂无情绪数据</p>
        ) : (
          <div className="space-y-4">
            {ep.topEmotions.map((emo) => (
              <div key={emo.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white flex items-center gap-2">
                    <span>{emo.icon}</span>
                    {emo.name}
                  </span>
                  <span className="text-xs text-white/50">{emo.count} 次 · {emo.percentage}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${emo.percentage}%`,
                      backgroundColor: emo.color,
                      opacity: 0.85,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ep.emotionTimeline.length > 0 && (
        <EmotionTimelineSection timeline={ep.emotionTimeline} />
      )}
    </div>
  );
}

function EmotionTimelineSection({ timeline }: { timeline: GrowthProfileData['emotionProfile']['emotionTimeline'] }) {
  const [expanded, setExpanded] = useState(false);
  const displayTimeline = expanded ? timeline : timeline.slice(-6);

  return (
    <div className="glass-card p-5 sm:p-6">
      <h4 className="font-serif-sc font-semibold text-white mb-5 flex items-center gap-2">
        <span className="text-xl">📅</span>
        情绪时间线
      </h4>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10" />
        <div className="space-y-4">
          {displayTimeline.map((period) => {
            const [year, month] = period.period.split('-');
            return (
              <div key={period.period} className="relative pl-10">
                <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-aurora/60 border-2 border-cosmic-950" />
                <div className="text-xs text-white/40 mb-2">{year}年{parseInt(month)}月</div>
                <div className="flex flex-wrap gap-1.5">
                  {period.emotions.map((emo) => (
                    <span
                      key={emo.name}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                      style={{
                        backgroundColor: `${emo.color}20`,
                        color: emo.color,
                      }}
                    >
                      <span>{emo.icon}</span>
                      {emo.name}
                      <span className="opacity-60">×{emo.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {timeline.length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 w-full flex items-center justify-center gap-1 text-xs text-white/50 hover:text-white/70 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? '收起' : `查看全部 ${timeline.length} 个月`}
        </button>
      )}
    </div>
  );
}

function RecipientSection({ data }: { data: GrowthProfileData }) {
  const { recipientProfile: rp } = data;
  const total = rp.typeDistribution.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="space-y-5">
      {rp.recentShift && (
        <div className="glass-card p-4 flex items-center gap-3 border border-nebula-purple/20">
          <span className="text-2xl">🔄</span>
          <div>
            <div className="text-sm font-medium text-white">对象偏好变化</div>
            <div className="text-xs text-white/60">{rp.recentShift}</div>
          </div>
        </div>
      )}

      <div className="glass-card p-5 sm:p-6">
        <h4 className="font-serif-sc font-semibold text-white mb-5 flex items-center gap-2">
          <span className="text-xl">📮</span>
          写信对象类型分布
        </h4>
        {total === 0 ? (
          <p className="text-white/50 text-sm text-center py-4">暂无数据</p>
        ) : (
          <>
            <div className="relative h-6 rounded-full bg-white/10 overflow-hidden mb-4 flex">
              {rp.typeDistribution.map((t, index) => {
                if (t.count === 0) return null;
                const width = (t.count / total) * 100;
                const colors = ['#9B59B6', '#F1C40F', '#2ECC71', '#3498DB'];
                return (
                  <div
                    key={t.key}
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${width}%`,
                      backgroundColor: colors[index % colors.length],
                      opacity: 0.8,
                    }}
                    title={`${t.label}: ${t.count} 封`}
                  />
                );
              })}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {rp.typeDistribution.map((t) => (
                <div key={t.key} className="glass-card p-3 text-center">
                  <div className="text-2xl mb-1">{t.icon}</div>
                  <div className="text-sm font-medium text-white">{t.label}</div>
                  <div className="text-xs text-white/50">{t.count} 封 · {t.percentage}%</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="glass-card p-5 sm:p-6">
        <h4 className="font-serif-sc font-semibold text-white mb-5 flex items-center gap-2">
          <span className="text-xl">👥</span>
          常写对象排行
        </h4>
        {rp.topRecipients.length === 0 ? (
          <p className="text-white/50 text-sm text-center py-4">暂无数据</p>
        ) : (
          <div className="space-y-3">
            {rp.topRecipients.map((r, idx) => (
              <div
                key={`${r.type}:${r.name}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  idx === 0 ? 'bg-aurora/20 text-aurora' :
                  idx === 1 ? 'bg-starlight/20 text-starlight' :
                  idx === 2 ? 'bg-nebula-orange/20 text-nebula-orange' :
                  'bg-white/10 text-white/50'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate flex items-center gap-1.5">
                    <span className="text-xs">{r.typeIcon}</span>
                    {r.name}
                    <span className="text-[10px] text-white/40">致{r.typeLabel}</span>
                  </div>
                  <div className="text-xs text-white/50">
                    {r.count} 封信 · {r.percentage}% · 最近 {formatDate(r.lastWrittenAt)}
                  </div>
                </div>
                <div className="h-2 w-20 rounded-full bg-white/10 overflow-hidden hidden sm:block">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-aurora to-cosmic-400"
                    style={{ width: `${r.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TrendSection({ data }: { data: GrowthProfileData }) {
  const { stageTrends: st, milestones } = data;

  const trendConfig = {
    rising: { icon: TrendingUp, color: 'text-aurora', bg: 'bg-aurora/15', label: '上升' },
    stable: { icon: Minus, color: 'text-starlight', bg: 'bg-starlight/15', label: '稳定' },
    declining: { icon: TrendingDown, color: 'text-nebula-orange', bg: 'bg-nebula-orange/15', label: '下降' },
  };
  const tc = trendConfig[st.trendDirection];
  const TrendIcon = tc.icon;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h4 className="font-serif-sc font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-xl">📈</span>
            当前趋势
          </h4>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${tc.bg} flex items-center justify-center`}>
              <TrendIcon className={`w-6 h-6 ${tc.color}`} />
            </div>
            <div>
              <div className={`text-lg font-bold ${tc.color}`}>{tc.label}趋势</div>
              <div className="text-xs text-white/60">{st.trendDescription}</div>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h4 className="font-serif-sc font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-xl">🌊</span>
            当前阶段
          </h4>
          {st.currentPhase ? (
            <div>
              <div className="text-lg font-bold text-white">{st.currentPhase.label}</div>
              <div className="text-xs text-white/60 mt-1">{st.currentPhase.description}</div>
              <div className="text-[10px] text-white/40 mt-1">
                自 {formatDate(st.currentPhase.since)}
              </div>
            </div>
          ) : (
            <p className="text-white/50 text-sm">暂无阶段数据</p>
          )}
        </div>
      </div>

      {st.phases.length > 0 && (
        <div className="glass-card p-5 sm:p-6">
          <h4 className="font-serif-sc font-semibold text-white mb-5 flex items-center gap-2">
            <span className="text-xl">🗺️</span>
            成长阶段历程
          </h4>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-aurora via-starlight to-nebula-purple/30" />
            <div className="space-y-6">
              {st.phases.map((phase, idx) => (
                <div key={phase.period} className="relative pl-10">
                  <div className={`absolute left-2 top-1 w-4 h-4 rounded-full border-2 ${
                    idx === st.phases.length - 1
                      ? 'bg-aurora border-aurora shadow-glow-sm'
                      : 'bg-cosmic-950 border-starlight/50'
                  }`} />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">{phase.label}</span>
                        <span className="text-[10px] text-white/40">{phase.period}</span>
                      </div>
                      <p className="text-xs text-white/60 mb-2">{phase.description}</p>
                      <div className="flex items-center gap-3 text-[11px] text-white/50">
                        <span>{phase.dominantEmotionIcon} 主导情绪: {phase.dominantEmotion}</span>
                        <span>·</span>
                        <span>致{phase.dominantRecipientType}</span>
                        <span>·</span>
                        <span>{phase.letterCount} 封信</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {milestones.length > 0 && (
        <div className="glass-card p-5 sm:p-6">
          <h4 className="font-serif-sc font-semibold text-white mb-5 flex items-center gap-2">
            <Award className="w-5 h-5 text-starlight" />
            成长里程碑
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-starlight/20 transition-all"
              >
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <div className="text-sm font-medium text-white">{m.description}</div>
                  <div className="text-[10px] text-white/40">{formatDate(m.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="glass-card p-4 text-center">
      <div className={`w-10 h-10 mx-auto mb-2 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="text-xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-xs text-white/60">{label}</div>
    </div>
  );
}
