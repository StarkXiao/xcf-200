import { Link } from 'react-router-dom';
import { Calendar, Users, FileText, ChevronRight, Zap } from 'lucide-react';
import type { Activity } from '@/types';
import { formatDate } from '@/utils/helpers';

interface ActivityBannerProps {
  activities: Activity[];
  loading?: boolean;
}

export default function ActivityBanner({ activities, loading = false }: ActivityBannerProps) {
  if (loading) {
    return (
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-nebula-purple to-aurora" />
          <div className="h-6 w-28 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="h-32 rounded-2xl bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (activities.length === 0) return null;

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-nebula-purple to-aurora" />
          <Zap className="w-5 h-5 text-aurora animate-pulse" />
          <h3 className="font-serif-sc text-lg font-semibold text-white">
            活动进行中
          </h3>
        </div>
        <Link
          to="/activities"
          className="text-sm text-aurora hover:text-aurora/80 flex items-center gap-1 transition-colors"
        >
          查看全部
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  const isActive = activity.status === 'active';
  
  return (
    <Link
      to={`/activity/${activity.id}`}
      className="block group"
    >
      <div className="relative flex gap-4 p-4 rounded-2xl bg-gradient-to-r from-nebula-purple/10 to-aurora/10 border border-nebula-purple/20 hover:border-nebula-purple/40 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-nebula-purple/10">
        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-nebula-purple/30 to-aurora/30 flex items-center justify-center text-3xl">
          {activity.coverImage}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-serif-sc text-base font-semibold text-white line-clamp-1 group-hover:text-aurora transition-colors">
              {activity.title}
            </h4>
            <span
              className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isActive
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}
            >
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
              {activity.stageLabel}
            </span>
          </div>
          
          <p className="text-xs sm:text-sm text-white/60 line-clamp-2 mt-1">
            {activity.description}
          </p>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {activity.participantCount}人参与
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {activity.workCount}篇作品
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
