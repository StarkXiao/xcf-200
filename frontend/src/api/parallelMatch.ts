import api from '@/utils/api';
import type {
  ParallelMatchData,
  ParallelTopic,
  ParallelMatchRule,
  ParallelMatchInteraction,
  SubmitInteractionData,
  ApiResponse,
} from '@/types';

export const parallelMatchApi = {
  getRecommendations: async (userId: string, limit = 6): Promise<ApiResponse<ParallelMatchData>> => {
    const response = await api.get(`/parallel-match/recommendations/${userId}`, {
      params: { limit },
    });
    return response.data;
  },

  getTopics: async (params: { userId?: string; limit?: number } = {}): Promise<ApiResponse<ParallelTopic[]>> => {
    const response = await api.get('/parallel-match/topics', {
      params,
    });
    return response.data;
  },

  getMatchRules: async (): Promise<ApiResponse<ParallelMatchRule[]>> => {
    const response = await api.get('/parallel-match/match-rules');
    return response.data;
  },

  submitInteraction: async (data: SubmitInteractionData): Promise<ApiResponse<ParallelMatchInteraction>> => {
    const response = await api.post('/parallel-match/interact', data);
    return response.data;
  },

  getInteractions: async (userId: string, params: { type?: string; limit?: number } = {}): Promise<ApiResponse<ParallelMatchInteraction[]> & { total: number }> => {
    const response = await api.get(`/parallel-match/interactions/${userId}`, {
      params,
    });
    return response.data;
  },

  getProfile: async (userId: string): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await api.get(`/parallel-match/profile/${userId}`);
    return response.data;
  },
};
