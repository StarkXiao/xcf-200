import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmotionTag from './EmotionTag';
import { emotionsApi } from '@/api/emotions';
import type { Emotion } from '@/types';

interface EmotionCloudProps {
  selected?: string | null;
  onSelect?: (name: string | null) => void;
  showAll?: boolean;
  maxShow?: number;
}

export default function EmotionCloud({
  selected,
  onSelect,
  showAll = false,
  maxShow = 15,
}: EmotionCloudProps) {
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmotions() {
      try {
        setLoading(true);
        const res = await emotionsApi.getAll();
        if (res.success) {
          setEmotions(res.data.slice(0, showAll ? undefined : maxShow));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchEmotions();
  }, [showAll, maxShow]);

  const handleClick = (name: string) => {
    if (onSelect) {
      onSelect(selected === name ? null : name);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-white/10" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-stagger flex flex-wrap gap-2 sm:gap-2.5">
      {showAll && (
        <Link to="/emotions" className="contents">
          <EmotionTag
            name="全部"
            icon="🌠"
            color="#7a63ff"
            selected={!selected}
            onClick={() => handleClick('')}
          />
        </Link>
      )}
      {emotions.map((emo, index) => (
        <div
          key={emo.id}
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <Link to={`/emotions/${encodeURIComponent(emo.name)}`}>
            <EmotionTag
              name={emo.name}
              icon={emo.icon}
              color={emo.color}
              count={emo.count}
              selected={selected === emo.name}
              onClick={() => handleClick(emo.name)}
              showCount={showAll}
            />
          </Link>
        </div>
      ))}
    </div>
  );
}
