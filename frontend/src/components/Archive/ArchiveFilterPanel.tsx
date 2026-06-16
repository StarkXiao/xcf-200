import { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import EmotionTag from '@/components/Emotion/EmotionTag';
import { archiveApi } from '@/api/archive';
import useAuthStore from '@/store/useAuthStore';
import type { ArchiveFilters, ArchiveFilterEmotion, ArchiveFilterRecipientType } from '@/types';

interface ArchiveFilterPanelProps {
  selectedEmotions: string[];
  selectedRecipientTypes: string[];
  selectedTimePeriod: string | null;
  onEmotionChange: (emotions: string[]) => void;
  onRecipientTypeChange: (types: string[]) => void;
  onTimePeriodChange: (period: string | null) => void;
  scope?: 'public' | 'user' | 'favorites';
}

const TIME_PERIOD_LABELS: Record<string, string> = {
  today: '今天',
  yesterday: '昨天',
  this_week: '本周',
  this_month: '本月',
};

export default function ArchiveFilterPanel({
  selectedEmotions,
  selectedRecipientTypes,
  selectedTimePeriod,
  onEmotionChange,
  onRecipientTypeChange,
  onTimePeriodChange,
  scope = 'public',
}: ArchiveFilterPanelProps) {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<ArchiveFilters | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    emotions: true,
    recipientTypes: true,
    timePeriods: true,
  });

  useEffect(() => {
    fetchFilters();
  }, [scope]);

  const fetchFilters = async () => {
    try {
      setLoading(true);
      const params: any = { scope };
      if (scope !== 'public' && user) params.userId = user.id;
      const res = await archiveApi.getFilters(params);
      if (res.success) setFilters(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleEmotion = (name: string) => {
    if (selectedEmotions.includes(name)) {
      onEmotionChange(selectedEmotions.filter(e => e !== name));
    } else {
      onEmotionChange([...selectedEmotions, name]);
    }
  };

  const toggleRecipientType = (key: string) => {
    if (selectedRecipientTypes.includes(key)) {
      onRecipientTypeChange(selectedRecipientTypes.filter(t => t !== key));
    } else {
      onRecipientTypeChange([...selectedRecipientTypes, key]);
    }
  };

  const clearAll = () => {
    onEmotionChange([]);
    onRecipientTypeChange([]);
    onTimePeriodChange(null);
  };

  const hasFilters = selectedEmotions.length > 0 || selectedRecipientTypes.length > 0 || selectedTimePeriod;

  const getPeriodLabel = (key: string) => {
    if (TIME_PERIOD_LABELS[key]) return TIME_PERIOD_LABELS[key];
    if (/^\d{4}$/.test(key)) return `${key}年`;
    if (/^\d{4}_\d{1,2}$/.test(key)) {
      const parts = key.split('_');
      return `${parts[0]}年${parts[1]}月`;
    }
    return key;
  };

  if (loading) {
    return (
      <div className="glass-card p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-5 w-24 rounded bg-white/10 animate-pulse" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-8 w-20 rounded-full bg-white/5 animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!filters) return null;

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-aurora" />
          <h3 className="font-serif-sc text-base font-semibold text-white">归档筛选</h3>
        </div>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            <X className="w-3 h-3" />
            清除全部
          </button>
        )}
      </div>

      {hasFilters && (
        <div className="flex flex-wrap gap-1.5 mb-4 pb-4 border-b border-white/10">
          {selectedEmotions.map(e => (
            <span
              key={e}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-nebula-purple/20 text-nebula-purple/90 border border-nebula-purple/30"
            >
              {e}
              <button onClick={() => toggleEmotion(e)} className="hover:text-white transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {selectedRecipientTypes.map(t => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-aurora/20 text-aurora/90 border border-aurora/30"
            >
              {t === 'future' ? '🔮 未来' : t === 'past' ? '🕰️ 过去' : t === 'parallel' ? '🌌 平行世界' : '✨ 未知'}
              <button onClick={() => toggleRecipientType(t)} className="hover:text-white transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {selectedTimePeriod && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-starlight/20 text-starlight/90 border border-starlight/30">
              {getPeriodLabel(selectedTimePeriod)}
              <button onClick={() => onTimePeriodChange(null)} className="hover:text-white transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <button
            onClick={() => toggleSection('emotions')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <span className="text-sm font-medium text-white/80">按情绪归档</span>
            {expandedSections.emotions ? (
              <ChevronUp className="w-4 h-4 text-white/40" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/40" />
            )}
          </button>
          {expandedSections.emotions && (
            <div className="flex flex-wrap gap-2">
              {filters.emotions.map((emo: ArchiveFilterEmotion) => (
                <EmotionTag
                  key={emo.name}
                  name={emo.name}
                  icon={emo.icon}
                  color={emo.color}
                  count={emo.archiveCount}
                  selected={selectedEmotions.includes(emo.name)}
                  onClick={() => toggleEmotion(emo.name)}
                  size="sm"
                  showCount
                />
              ))}
              {filters.emotions.length === 0 && (
                <span className="text-sm text-white/40">暂无情绪标签</span>
              )}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => toggleSection('recipientTypes')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <span className="text-sm font-medium text-white/80">按收件人类型</span>
            {expandedSections.recipientTypes ? (
              <ChevronUp className="w-4 h-4 text-white/40" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/40" />
            )}
          </button>
          {expandedSections.recipientTypes && (
            <div className="flex flex-wrap gap-2">
              {filters.recipientTypes.map((rt: ArchiveFilterRecipientType) => {
                const isSelected = selectedRecipientTypes.includes(rt.key);
                return (
                  <button
                    key={rt.key}
                    onClick={() => toggleRecipientType(rt.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-aurora/25 text-aurora border border-aurora/50 shadow-glow-sm'
                        : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{rt.icon}</span>
                    <span>{rt.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-aurora/20' : 'bg-white/10'
                    }`}>
                      {rt.count}
                    </span>
                  </button>
                );
              })}
              {filters.recipientTypes.length === 0 && (
                <span className="text-sm text-white/40">暂无收件人类型</span>
              )}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => toggleSection('timePeriods')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <span className="text-sm font-medium text-white/80">按时间归档</span>
            {expandedSections.timePeriods ? (
              <ChevronUp className="w-4 h-4 text-white/40" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/40" />
            )}
          </button>
          {expandedSections.timePeriods && (
            <div className="flex flex-wrap gap-2">
              {filters.timePeriods.map((period: string) => {
                const isSelected = selectedTimePeriod === period;
                return (
                  <button
                    key={period}
                    onClick={() => onTimePeriodChange(isSelected ? null : period)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-starlight/25 text-starlight border border-starlight/50 shadow-glow-sm'
                        : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {getPeriodLabel(period)}
                  </button>
                );
              })}
              {filters.timePeriods.length === 0 && (
                <span className="text-sm text-white/40">暂无时间标签</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/10 text-center">
        <span className="text-xs text-white/40">
          共 {filters.totalLetters} 封信件可供归档
        </span>
      </div>
    </div>
  );
}
