import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Heart, Sparkles } from 'lucide-react';
import { healingApi } from '@/api/healing';
import type { EmotionAnalysisData } from '@/types';

interface EmotionAnalysisProps {
  userId: string;
  onEmotionSelect?: (emotion: string) => void;
}

const BALANCE_LABELS: Record<string, { label: string; emoji: string; desc: string }> = {
  high: { label: '阳光充盈', emoji: '🌈', desc: '你的情绪状态非常积极，继续保持！' },
  medium: { label: '星光渐明', emoji: '✨', desc: '你正在向积极的方向转变，加油！' },
  low: { label: '夜色笼罩', emoji: '🌙', desc: '给自己一些温暖和耐心，一切都会好的' },
  empty: { label: '待探索', emoji: '🌟', desc: '记录你的第一份情绪，开启疗愈之旅' },
};

function getBalanceInfo(balance: number) {
  if (balance === 0) return BALANCE_LABELS.empty;
  if (balance >= 70) return BALANCE_LABELS.high;
  if (balance >= 40) return BALANCE_LABELS.medium;
  return BALANCE_LABELS.low;
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
  if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-white/40" />;
}

export default function EmotionAnalysis({ userId, onEmotionSelect }: EmotionAnalysisProps) {
  const [data, setData] = useState<EmotionAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, [userId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const res = await healingApi.getAnalysis(userId);
      if (res.success && res.data) setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-40 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const balanceInfo = getBalanceInfo(data.emotionBalance);
  const dominant = data.dominantEmotion;
  const distribution = data.emotionDistribution.slice(0, 8);
  const maxCount = distribution.length > 0 ? Math.max(...distribution.map(d => d.count)) : 1;

  return (
    <div className="glass-card p-6 sm:p-8 space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <Heart className="w-6 h-6 text-nebula-pink" />
        <h3 className="font-serif-sc text-xl sm:text-2xl font-semibold text-white">情绪星图</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="relative rounded-xl p-5 overflow-hidden cursor-pointer hover:-translate-y-1 transition-all duration-300"
          style={{
            background: dominant
              ? `linear-gradient(135deg, ${dominant.color}30 0%, ${dominant.color}10 100%)`
              : 'rgba(255,255,255,0.05)',
            border: dominant ? `1px solid ${dominant.color}35` : '1px solid rgba(255,255,255,0.1)',
          }}
          onClick={() => dominant && onEmotionSelect?.(dominant.name)}
        >
          {dominant && (
            <div
              className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-30"
              style={{ backgroundColor: dominant.color }}
            />
          )}
          <div className="relative z-10">
            <p className="text-white/50 text-xs mb-2">主导情绪</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl">{dominant?.icon || '🌟'}</span>
              <span className="font-serif-sc text-lg font-semibold text-white">
                {dominant?.name || '待探索'}
              </span>
            </div>
            {dominant && (
              <p className="text-sm mt-1" style={{ color: dominant.color }}>
                {dominant.percentage}% 占比
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl p-5 bg-white/5 border border-white/10">
          <p className="text-white/50 text-xs mb-2">情绪平衡指数</p>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl">{balanceInfo.emoji}</span>
            <span className="font-serif-sc text-lg font-semibold text-white">{balanceInfo.label}</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${data.emotionBalance}%`,
                background: data.emotionBalance >= 70
                  ? 'linear-gradient(90deg, #2ECC71, #06d6a0)'
                  : data.emotionBalance >= 40
                    ? 'linear-gradient(90deg, #F1C40F, #FF9A8B)'
                    : 'linear-gradient(90deg, #7F8C8D, #34495E)',
              }}
            />
          </div>
          <p className="text-xs text-white/40 mt-2">{balanceInfo.desc}</p>
        </div>

        <div className="rounded-xl p-5 bg-white/5 border border-white/10">
          <p className="text-white/50 text-xs mb-2">记录统计</p>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-starlight" />
            <span className="font-serif-sc text-2xl font-bold text-white">{data.totalRecords}</span>
          </div>
          <p className="text-xs text-white/40">
            {data.recentEmotion ? `最近记录：${data.recentEmotion}` : '暂无记录'}
          </p>
        </div>
      </div>

      {distribution.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-white/60 mb-4">情绪分布</h4>
          <div className="space-y-3">
            {distribution.map((item) => (
              <div
                key={item.name}
                className="group cursor-pointer hover:bg-white/5 rounded-lg px-3 py-2 -mx-3 transition-all"
                onClick={() => onEmotionSelect?.(item.name)}
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium text-white flex-1">{item.name}</span>
                  <TrendIcon trend={item.trend} />
                  <span className="text-xs text-white/40 w-14 text-right">{item.count} 次</span>
                  <span className="text-xs font-medium w-12 text-right" style={{ color: item.color }}>
                    {item.percentage}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(item.count / maxCount) * 100}%`,
                      backgroundColor: item.color,
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.totalRecords === 0 && (
        <div className="text-center py-8">
          <div className="text-5xl mb-3">🌠</div>
          <p className="text-white/50 text-sm">开始记录你的第一份情绪，解锁情绪星图</p>
        </div>
      )}
    </div>
  );
}
