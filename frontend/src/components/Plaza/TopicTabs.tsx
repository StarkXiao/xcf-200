import { Flame } from 'lucide-react';
import type { PlazaTopic } from '@/types';

interface TopicTabsProps {
  topics: PlazaTopic[];
  selectedTopic: string;
  onSelect: (topicId: string) => void;
  loading?: boolean;
}

export default function TopicTabs({ topics, selectedTopic, onSelect, loading = false }: TopicTabsProps) {
  if (loading) {
    return (
      <div className="glass-card p-4 sm:p-5">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 h-10 w-24 rounded-full bg-white/5 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-starlight to-aurora" />
        <h3 className="font-serif-sc text-lg font-semibold text-white">
          主题广场
        </h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {topics.map((topic) => {
          const isSelected = selectedTopic === topic.id;
          return (
            <button
              key={topic.id}
              onClick={() => onSelect(topic.id)}
              className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                isSelected
                  ? 'text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              style={{
                backgroundColor: isSelected ? topic.color + '30' : undefined,
                borderColor: isSelected ? topic.color + '60' : 'transparent',
                borderWidth: isSelected ? '1px' : '1px',
                boxShadow: isSelected ? `0 0 20px ${topic.color}30` : undefined,
              }}
            >
              <span className="text-lg">{topic.icon}</span>
              <span>{topic.name}</span>
              {topic.letterCount > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'
                  }`}
                >
                  {topic.letterCount}
                </span>
              )}
              {topic.isHot && (
                <span className="absolute -top-1 -right-1">
                  <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {topics.map((topic) => {
        if (topic.id !== selectedTopic || topic.isDefault) return null;
        return (
          <div
            key={`desc-${topic.id}`}
            className="mt-4 pt-4 border-t border-white/10"
          >
            <p className="text-sm text-white/60">
              {topic.description}
            </p>
            {topic.relatedEmotions && topic.relatedEmotions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs text-white/50">相关情绪：</span>
                {topic.relatedEmotions.map((emo) => (
                  <span
                    key={emo}
                    className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/70"
                  >
                    {emo}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
