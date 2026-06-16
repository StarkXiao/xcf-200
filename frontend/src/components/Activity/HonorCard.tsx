import { Calendar, Award } from 'lucide-react';
import type { Honor } from '@/types';

interface HonorCardProps {
  honor: Honor;
}

export default function HonorCard({ honor }: HonorCardProps) {
  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="text-4xl">{honor.badge}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-aurora" />
            <h4 className="font-bold text-white">{honor.honorTitle}</h4>
          </div>

          {honor.rank && (
            <div className="text-sm text-aurora mb-1">
              {honor.rankTitle} · 第{honor.rank}名
            </div>
          )}

          {honor.rankTitle && !honor.rank && (
            <div className="text-sm text-aurora/70 mb-1">
              {honor.rankTitle}
            </div>
          )}

          <p className="text-white/60 text-sm mb-2">
            {honor.description}
          </p>

          {honor.workTitle && (
            <p className="text-white/50 text-xs mb-2">
              作品：《{honor.workTitle}》
            </p>
          )}

          <div className="flex items-center gap-1 text-xs text-white/40">
            <Calendar className="w-3 h-3" />
            {new Date(honor.awardedAt).toLocaleDateString('zh-CN')}
          </div>
        </div>
      </div>
    </div>
  );
}
