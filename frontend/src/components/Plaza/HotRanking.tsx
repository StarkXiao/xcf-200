import { Link } from 'react-router-dom';
import { TrendingUp, Flame, Clock, Award, ChevronRight } from 'lucide-react';
import type { HotRankingItem, HotRankingType } from '@/types';
import EmotionTag from '@/components/Emotion/EmotionTag';

interface HotRankingProps {
  items: HotRankingItem[];
  type: HotRankingType;
  onTypeChange: (type: HotRankingType) => void;
  loading?: boolean;
}

const RANKING_TABS = [
  { key: 'daily', label: '今日', icon: Clock },
  { key: 'weekly', label: '本周', icon: TrendingUp },
  { key: 'monthly', label: '本月', icon: Flame },
  { key: 'all', label: '总榜', icon: Award },
] as const;

export default function HotRanking({ items, type, onTypeChange, loading = false }: HotRankingProps) {
  if (loading) {
    return (
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-orange-400 to-red-400" />
            <div className="h-6 w-24 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-orange-400 to-red-400" />
          <Flame className="w-5 h-5 text-orange-400" />
          <h3 className="font-serif-sc text-lg font-semibold text-white">
            内容热榜
          </h3>
        </div>
      </div>

      <div className="flex gap-1 mb-4 p-1 bg-white/5 rounded-xl">
        {RANKING_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = type === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTypeChange(tab.key as HotRankingType)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-orange-400/20 to-red-400/20 text-orange-300 border border-orange-400/30'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            <Flame className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">暂无热榜数据</p>
          </div>
        ) : (
          items.map((item) => (
            <RankingItem key={item.letterId} item={item} />
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <Link
            to="#"
            className="flex items-center justify-center gap-1 text-sm text-white/50 hover:text-white/70 transition-colors"
          >
            查看完整榜单
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

function RankingItem({ item }: { item: HotRankingItem }) {
  const rankColors = [
    'from-yellow-400 to-orange-400',
    'from-gray-300 to-gray-400',
    'from-amber-600 to-amber-700',
  ];
  const rankBg = item.rank <= 3 ? rankColors[item.rank - 1] : 'from-white/10 to-white/5';

  return (
    <Link
      to={`/letter/${item.letterId}`}
      className="block group"
    >
      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-300">
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${rankBg} flex items-center justify-center text-white font-bold text-sm shadow-md`}
        >
          {item.rank}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white line-clamp-1 group-hover:text-aurora transition-colors">
            {item.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex -space-x-1">
              {item.emotions.slice(0, 2).map((emo) => (
                <EmotionTag key={emo} name={emo} size="xs" />
              ))}
            </div>
            <span className="text-xs text-white/40">{item.senderName}</span>
          </div>
        </div>
        
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-1 text-xs text-orange-400 font-medium">
            <Flame className="w-3.5 h-3.5" />
            {item.heatScore}
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
            <span>❤ {item.likes}</span>
            <span>💬 {item.repliesCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
