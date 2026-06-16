import api from '@/utils/api';
import type {
  ReplyTask,
  MatchRule,
  AnonymousIdentity,
  ReplyReviewTags,
  StrangerReply,
  Notification,
  UserReplyStats,
  ReplyProfile,
  SubmitReplyData,
  SubmitReviewData,
  ApiResponse,
  PaginatedResponse,
  ReplyReview,
} from '@/types';

interface ReplyPoolResponse {
  success: boolean;
  data: ReplyTask[];
  total: number;
  matchRules: MatchRule[];
}

export const strangerReplyApi = {
  getReplyPool: async (filters: {
    limit?: number;
    emotion?: string;
    recipientType?: string;
    needReply?: boolean;
    userId?: string;
  } = {}): Promise<ReplyPoolResponse> => {
    const response = await api.get('/stranger-reply/pool', {
      params: {
        ...filters,
        needReply: filters.needReply ? 'true' : undefined,
      },
    });
    return response.data;
  },

  getMatchRules: async (): Promise<ApiResponse<MatchRule[]>> => {
    const response = await api.get('/stranger-reply/match-rules');
    return response.data;
  },

  submitReply: async (
    data: SubmitReplyData
  ): Promise<ApiResponse<{ reply: StrangerReply; anonymousIdentity: AnonymousIdentity }>> => {
    const response = await api.post('/stranger-reply/reply', data);
    return response.data;
  },

  getAnonymousIdentities: async (): Promise<ApiResponse<string[]>> => {
    const response = await api.get('/stranger-reply/anonymous-identities');
    return response.data;
  },

  generateIdentity: async (): Promise<ApiResponse<AnonymousIdentity>> => {
    const response = await api.post('/stranger-reply/generate-identity');
    return response.data;
  },

  submitReview: async (
    data: SubmitReviewData
  ): Promise<ApiResponse<{ review: ReplyReview }>> => {
    const response = await api.post('/stranger-reply/review', data);
    return response.data;
  },

  getReviewTags: async (): Promise<ApiResponse<ReplyReviewTags>> => {
    const response = await api.get('/stranger-reply/review-tags');
    return response.data;
  },

  getNotifications: async (params: {
    userId: string;
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Notification[]> & { unreadCount: number }> => {
    const response = await api.get('/stranger-reply/notifications', {
      params: {
        ...params,
        unreadOnly: params.unreadOnly ? 'true' : undefined,
      },
    });
    return response.data;
  },

  markNotificationRead: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.post(`/stranger-reply/notifications/${id}/read`);
    return response.data;
  },

  markAllNotificationsRead: async (userId: string): Promise<ApiResponse<void>> => {
    const response = await api.post('/stranger-reply/notifications/read-all', { userId });
    return response.data;
  },

  getUserReplyStats: async (userId: string): Promise<ApiResponse<UserReplyStats>> => {
    const response = await api.get(`/stranger-reply/user/${userId}/stats`);
    return response.data;
  },

  getLetterStrangerReplies: async (letterId: string): Promise<ApiResponse<StrangerReply[]> & { total: number }> => {
    const response = await api.get(`/stranger-reply/letter/${letterId}/replies`);
    return response.data;
  },

  getReplyProfile: async (userId: string): Promise<ApiResponse<ReplyProfile>> => {
    const response = await api.get(`/stranger-reply/profile/${userId}`);
    return response.data;
  },

  updateReplyProfile: async (
    userId: string,
    data: Partial<Pick<ReplyProfile, 'preferredEmotions' | 'preferredTypes' | 'bio'>>
  ): Promise<ApiResponse<ReplyProfile>> => {
    const response = await api.post('/stranger-reply/profile', { userId, ...data });
    return response.data;
  },
};
