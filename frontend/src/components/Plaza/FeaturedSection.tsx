import { Link } from 'react-router-dom';
import { Sparkles, Crown, ChevronRight } from 'lucide-react';
import type { PlazaFeatured } from '@/types';

interface FeaturedSectionProps {
  items: PlazaFeatured[];
  loading?: boolean;
}

export default function FeaturedSection({ items, loading = false }: FeaturedSectionProps) {
  if (loading) {
    return (
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-nebula-pink to-starlight" />
          <div className="h-6 w-24 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-nebula-pink to-starlight" />
          <Crown className="w-5 h-5 text-starlight" />
          <h3 className="font-serif-sc text-lg font-semibold text-white">
            精选推荐
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((item, index) => (
          <FeaturedCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </div>
  );
}

function FeaturedCard({ item, index }: { item: PlazaFeatured; index: number }) {
  const isActivity = item.type === 'activity';
  
  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (isActivity && item.targetId) {
      return (
        <Link to={`/activity/${item.targetId}`} className="block group">
          {children}
        </Link>
      );
    }
    if (item.type === 'letter' && item.targetId) {
      return (
        <Link to={`/letter/${item.targetId}`} className="block group">
          {children}
        </Link>
      );
    }
    return <div className="group">{children}</div>;
  };

  return (
    <CardWrapper>
      <div
        className="relative h-44 sm:h-48 rounded-2xl overflow-hidden transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${item.tagColor}20 0%, ${item.tagColor}40 100%)`,
          border: `1px solid ${item.tagColor}30`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        <div
          className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: item.tagColor + '40',
            color: item.tagColor,
            border: `1px solid ${item.tagColor}60`,
          }}
        >
          <Sparkles className="w-3 h-3" />
          {item.tag}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h4 className="font-serif-sc text-base sm:text-lg font-semibold text-white mb-1.5 line-clamp-1">
            {item.title}
          </h4>
          <p className="text-xs sm:text-sm text-white/70 line-clamp-2 mb-2">
            {item.description}
          </p>
          <div className="flex items-center gap-1 text-xs text-white/60">
            <span>查看详情</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        <div className="absolute top-3 right-3 text-3xl sm:text-4xl opacity-80">
          {item.coverImage}
        </div>

        {index === 0 && (
          <div className="absolute top-3 right-3 -rotate-12">
            <div className="bg-starlight/90 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg">
              TOP 1
            </div>
          </div>
        )}
      </div>
    </CardWrapper>
  );
}
