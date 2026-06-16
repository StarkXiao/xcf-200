import type { RecipientEmotionPreference, RecipientRelation } from '@/types';

interface EmotionPreferenceChartProps {
  preferences: RecipientEmotionPreference[];
  recipients: RecipientRelation[];
}

export default function EmotionPreferenceChart({
  preferences,
  recipients,
}: EmotionPreferenceChartProps) {
  const emotionMap = new Map<string, { count: number; recipients: Set<string> }>();

  preferences.forEach((pref) => {
    if (!emotionMap.has(pref.emotion)) {
      emotionMap.set(pref.emotion, { count: 0, recipients: new Set() });
    }
    const data = emotionMap.get(pref.emotion)!;
    data.count += pref.count;
    const recipient = recipients.find((r) => r.id === pref.recipientId);
    if (recipient) {
      data.recipients.add(recipient.name);
    }
  });

  const sortedEmotions = Array.from(emotionMap.entries())
    .map(([emotion, data]) => ({
      emotion,
      count: data.count,
      recipients: Array.from(data.recipients),
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = sortedEmotions.length > 0 ? sortedEmotions[0].count : 1;

  if (sortedEmotions.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-4xl mb-3">💭</div>
        <p className="text-white/60 text-sm">还没有足够的情绪偏好数据</p>
        <p className="text-white/40 text-xs mt-1">多写几封信，这里会展示你对不同人的情绪倾向</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 sm:p-6">
      <h4 className="font-serif-sc font-semibold text-white mb-5 flex items-center gap-2">
        <span className="text-xl">🎭</span>
        情绪偏好分析
      </h4>

      <div className="space-y-4">
        {sortedEmotions.slice(0, 6).map((item, index) => {
          const percentage = (item.count / maxCount) * 100;
          const colors = [
            'from-aurora to-cosmic-400',
            'from-starlight to-nebula-orange',
            'from-nebula-pink to-nebula-purple',
            'from-nebula-mint to-aurora',
            'from-nebula-purple to-cosmic-500',
            'from-nebula-orange to-starlight',
          ];

          return (
            <div key={item.emotion}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{item.emotion}</span>
                <span className="text-xs text-white/50">{item.count} 次</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${colors[index % colors.length]} transition-all duration-1000 ease-out`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              {item.recipients.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {item.recipients.slice(0, 3).map((name) => (
                    <span
                      key={name}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white/50"
                    >
                      {name}
                    </span>
                  ))}
                  {item.recipients.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-white/40">
                      +{item.recipients.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
