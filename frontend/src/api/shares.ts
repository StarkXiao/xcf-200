import api from '@/utils/api';
import type {
  ShareTargetType,
  PosterEmotionStyle,
  ShareRecord,
  ShareStats,
  ApiResponse,
} from '@/types';

interface CreateShareParams {
  targetType: ShareTargetType;
  targetId: string;
  shareChannel: string;
  emotionStyle: PosterEmotionStyle;
  isAnonymous: boolean;
  userId?: string;
}

interface RecordShareViewParams {
  targetType: ShareTargetType;
  targetId: string;
  shareId: string;
  shareUrl: string;
  viewerId?: string;
}

export const sharesApi = {
  createShare: async (
    params: CreateShareParams
  ): Promise<ApiResponse<ShareRecord & { shareUrl: string }>> => {
    const response = await api.post('/shares', params);
    return response.data;
  },

  recordShareView: async (
    params: RecordShareViewParams
  ): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await api.post('/shares/view', params);
    return response.data;
  },

  getUserShareStats: async (userId: string): Promise<ApiResponse<ShareStats>> => {
    const response = await api.get(`/shares/user/${userId}/stats`);
    return response.data;
  },

  getShareStatsByTarget: async (
    targetType: ShareTargetType,
    targetId: string
  ): Promise<
    ApiResponse<{
      totalShares: number;
      totalViews: number;
      emotionStyleBreakdown: Record<PosterEmotionStyle, number>;
    }>
  > => {
    const response = await api.get(`/shares/${targetType}/${targetId}/stats`);
    return response.data;
  },

  getUserRecentShares: async (
    userId: string,
    limit: number = 20
  ): Promise<ApiResponse<ShareRecord[]>> => {
    const response = await api.get(`/shares/user/${userId}/recent`, {
      params: { limit },
    });
    return response.data;
  },
};
