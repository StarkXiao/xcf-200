import { Link } from 'react-router-dom';
import { Calendar, Users, FileText, Heart, Clock } from 'lucide-react';
import type { Activity } from '@/types';
import { cn } from '@/utils/helpers';

interface ActivityCardProps {
  activity: Activity;
}

const statusConfig = {
  upcoming: {
    label: '即将开始',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: Clock
  },
  active: {
    label: '进行中',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: Calendar
  },
  voting: {
    label: '投票中',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: Heart
  },
  settled: {
    label: '已结束',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    icon: FileText
  }
};

export default function ActivityCard({ activity }: ActivityCardProps) {
  const status = statusConfig[activity.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;

  return (
    <Link
      to={`/activities/${activity.id}`}
      className="group block bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-glow"
    >
      <div className="relative h-48 bg-gradient-to-br from-cosmic-900/50 via-nebula-purple/20 to-aurora/20 flex items-center justify-center">
        <span className="text-7xl group-hover:scale-110 transition-transform duration-300">
          {activity.coverImage}
        </span>
        <div className="absolute top-3 right-3">
          <span className={cn(
            'px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5',
            status.color
          )}>
            <StatusIcon className="w-3.5 h-3.5" />
            {activity.stageLabel || status.label}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-full bg-aurora/20 text-aurora text-xs font-medium">
            #{activity.theme}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-aurora transition-colors line-clamp-2">
          {activity.title}
        </h3>

        <p className="text-white/60 text-sm mb-4 line-clamp-2">
          {activity.description}
        </p>

        <div className="flex items-center justify-between text-sm text-white/50">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {activity.participantCount}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {activity.workCount}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {activity.totalLikes}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
