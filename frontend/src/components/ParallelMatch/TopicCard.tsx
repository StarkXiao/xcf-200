import { Link } from 'react-router-dom';
import { BookOpen, Users } from 'lucide-react';
import EmotionTag from '@/components/Emotion/EmotionTag';
import type { ParallelTopic } from '@/types';

interface TopicCardProps {
  topic: ParallelTopic;
}

export default function TopicCard({ topic }: TopicCardProps) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-glow group">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: `${topic.color}20` }}
            >
              {topic.icon}
            </div>
            <div>
              <h3 className="font-serif-sc text-base font-semibold text-white">{topic.title}</h3>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="inline-flex items-center gap-1 text-xs text-white/40">
                  <BookOpen className="w-3 h-3" />
                  {topic.letterCount} 封信
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-white/40">
                  <Users className="w-3 h-3" />
                  {topic.participantCount} 人参与
                </span>
              </div>
            </div>
          </div>

          {topic.relevanceScore > 0 && (
            <div className="px-2.5 py-1 rounded-lg bg-starlight/10 text-starlight text-xs font-medium">
              匹配 {topic.relevanceScore}%
            </div>
          )}
        </div>

        <p className="text-sm text-white/55 mb-3 line-clamp-2">{topic.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {topic.emotions.map(emo => (
            <EmotionTag key={emo} name={emo} size="sm" />
          ))}
        </div>

        {topic.relevanceReason && (
          <div className="text-xs text-starlight/70 bg-starlight/5 px-3 py-1.5 rounded-lg mb-3">
            💡 {topic.relevanceReason}
          </div>
        )}

        {topic.sampleLetters.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-white/40">相关信件</p>
            {topic.sampleLetters.map(letter => (
              <Link
                key={letter.id}
                to={`/letter/${letter.id}`}
                className="block text-xs text-white/60 hover:text-aurora transition-colors truncate"
              >
                📮 {letter.title} — {letter.senderName}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
