import api from '@/utils/api';
import type {
  PlazaTopic,
  PlazaFeatured,
  HotRankingItem,
  HotRankingType,
  PlazaOverviewData,
  Activity,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export const plazaApi = {
  getTopics: async (): Promise<ApiResponse<PlazaTopic[]>> => {
    const response = await api.get('/plaza/topics');
    return response.data;
  },

  getTopicById: async (id: string): Promise<ApiResponse<PlazaTopic>> => {
    const response = await api.get(`/plaza/topics/${id}`);
    return response.data;
  },

  getFeatured: async (limit?: number): Promise<ApiResponse<PlazaFeatured[]>> => {
    const response = await api.get('/plaza/featured', {
      params: limit ? { limit } : undefined,
    });
    return response.data;
  },

  getHotRanking: async (
    type: HotRankingType = 'daily',
    limit?: number
  ): Promise<
    ApiResponse<HotRankingItem[]> & {
      data: HotRankingItem[];
      type: string;
      label: string;
    }
  > => {
    const response = await api.get('/plaza/hot-ranking', {
      params: { type, limit },
    });
    return response.data;
  },

  getActiveActivities: async (limit?: number): Promise<ApiResponse<Activity[]>> => {
    const response = await api.get('/plaza/active-activities', {
      params: limit ? { limit } : undefined,
    });
    return response.data;
  },

  getOverview: async (): Promise<ApiResponse<PlazaOverviewData>> => {
    const response = await api.get('/plaza/overview');
    return response.data;
  },
};
