import type { EmotionChainData } from '@/types';
import EmotionTag from '@/components/Emotion/EmotionTag';
import { ArrowRight, Sparkles } from 'lucide-react';

interface EmotionChainDisplayProps {
  chains: EmotionChainData[];
}

export default function EmotionChainDisplay({ chains }: EmotionChainDisplayProps) {
  if (!chains || chains.length === 0) return null;

  const longestChain = chains.reduce((prev, curr) =>
    curr.totalLength > prev.totalLength ? curr : prev
  , chains[0]);

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-starlight" />
        <h4 className="font-serif-sc text-lg font-semibold text-white">情绪接龙</h4>
        <span className="text-sm text-white/50">
          最长 {longestChain.totalLength} 棒
        </span>
      </div>

      <div className="space-y-4">
        {chains.filter(c => c.totalLength > 1).slice(0, 3).map((chain) => (
          <div key={chain.chainId} className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                {chain.totalLength} 棒接龙
              </span>
              <span>主导情绪：</span>
              <EmotionTag name={chain.dominantEmotion} size="sm" />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {chain.emotions.map((item, idx) => (
                <div key={item.replyId} className="flex items-center gap-1.5">
                  <div className="flex flex-col items-center">
                    <EmotionTag name={item.emotion} size="sm" />
                    <span className="text-[10px] text-white/40 mt-0.5 truncate max-w-[80px]">
                      {item.senderName}
                    </span>
                  </div>
                  {idx < chain.emotions.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-starlight/60 shrink-0 mx-0.5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {chains.filter(c => c.totalLength > 1).length === 0 && (
          <p className="text-sm text-white/50 text-center py-4">
            情绪接龙还没有开始，快来接力第一条吧 🌟
          </p>
        )}
      </div>
    </div>
  );
}
