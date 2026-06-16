import api from '@/utils/api';
import type {
  AchievementCenterData,
  AchievementBadge,
  ApiResponse
} from '@/types';

export const achievementsApi = {
  getAchievementCenter: (userId: string) =>
    api.get<ApiResponse<AchievementCenterData>>(`/achievements/center/${userId}`),

  claimReward: (userId: string, taskId: string) =>
    api.post<ApiResponse<{
      taskId: string;
      rewardStars: number;
      rewardBadgeId: string | null;
      totalStars: number;
    }>>(`/achievements/claim/${userId}/${taskId}`),

  getUserBadges: (userId: string) =>
    api.get<ApiResponse<AchievementBadge[]>>(`/achievements/badges/${userId}`),
};
