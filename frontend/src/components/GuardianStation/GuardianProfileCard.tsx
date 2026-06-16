import { Award, Star, Shield, TrendingUp } from 'lucide-react';
import type { GuardianProfile } from '@/types';

interface GuardianProfileCardProps {
  profile: GuardianProfile | null;
  loading?: boolean;
  onApply?: () => void;
  applying?: boolean;
}

export default function GuardianProfileCard({
  profile,
  loading,
  onApply,
  applying,
}: GuardianProfileCardProps) {
  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-pulse">
        <div className="h-20 bg-white/5 rounded-xl mb-4" />
        <div className="h-6 bg-white/5 rounded w-1/2 mb-2" />
        <div className="h-4 bg-white/5 rounded w-3/4" />
      </div>
    );
  }

  if (!profile?.isGuardian && profile) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-aurora/20 flex items-center justify-center">
          <Shield className="w-10 h-10 text-aurora" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">加入匿名守护站</h3>
        <p className="text-white/60 text-sm mb-6 max-w-xs mx-auto">
          成为守护员，一起守护每一颗柔软的心。审核内容、参与干预，让星邮局更温暖。
        </p>
        <button
          onClick={onApply}
          disabled={applying}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-aurora to-nebula-pink text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {applying ? '申请中...' : '立即加入 ✨'}
        </button>
      </div>
    );
  }

  const progressWidth = profile?.nextLevelMin
    ? (profile.levelProgress / profile.nextLevelMin) * 100
    : 100;

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-aurora/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-aurora/30 to-nebula-pink/30 flex items-center justify-center text-3xl">
            {profile?.levelIcon || '🌱'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">{profile?.level}</h3>
              <span className="px-2 py-0.5 rounded-full bg-starlight/20 text-starlight text-xs">
                守护员
              </span>
            </div>
            <p className="text-sm text-white/50">
              加入时间：{profile?.joinedAt ? new Date(profile.joinedAt).toLocaleDateString('zh-CN') : '-'}
            </p>
          </div>
        </div>

        {profile?.nextLevelMin && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/60">升级进度</span>
              <span className="text-aurora">
                {profile.levelProgress} / {profile.nextLevelMin}
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-aurora to-nebula-pink rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressWidth, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white mb-1">
              {profile?.totalReviews || 0}
            </p>
            <p className="text-xs text-white/50 flex items-center justify-center gap-1">
              <Star className="w-3 h-3" />
              审核次数
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white mb-1">
              {profile?.totalInterventions || 0}
            </p>
            <p className="text-xs text-white/50 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" />
              干预次数
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-400 mb-1">
              {profile?.approvedCount || 0}
            </p>
            <p className="text-xs text-white/50">通过</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-400 mb-1">
              {profile?.rejectedCount || 0}
            </p>
            <p className="text-xs text-white/50">驳回</p>
          </div>
        </div>
      </div>
    </div>
  );
}
