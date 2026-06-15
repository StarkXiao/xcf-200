import api from '@/utils/api';
import type { Emotion, Letter, ApiResponse, PaginatedResponse } from '@/types';

export const emotionsApi = {
  getAll: async (): Promise<{ success: boolean; data: Emotion[] }> => {
    const response = await api.get('/emotions');
    return response.data;
  },

  getTrending: async (): Promise<{ success: boolean; data: Omit<Emotion, 'id'>[] }> => {
    const response = await api.get('/emotions/trending');
    return response.data;
  },

  getLettersByEmotion: async (
    name: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Letter[]>> => {
    const response = await api.get(`/emotions/${encodeURIComponent(name)}/letters`, {
      params: { page, limit },
    });
    return response.data;
  },
};
