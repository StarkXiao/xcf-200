import api from '@/utils/api';
import type { User, Letter, UserStats, ApiResponse, Interaction, InteractionTypeStats, InteractionEmotionStat, InteractionQueryParams } from '@/types';

interface ProfileData {
  username?: string;
  bio?: string;
  avatar?: string;
}

export const userApi = {
  getProfile: async (userId: string): Promise<ApiResponse<User & { letters: Letter[]; favorites: Letter[] }>> => {
    const response = await api.get(`/user/${userId}`);
    return response.data;
  },

  updateProfile: async (userId: string, data: ProfileData): Promise<ApiResponse<User>> => {
    const response = await api.put(`/user/${userId}`, data);
    return response.data;
  },

  getUserLetters: async (
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ success: boolean; data: Letter[]; total: number; page: number; totalPages: number }> => {
    const response = await api.get(`/user/${userId}/letters`, { params: { page, limit } });
    return response.data;
  },

  getFavorites: async (userId: string): Promise<{ success: boolean; data: Letter[]; total: number }> => {
    const response = await api.get(`/user/${userId}/favorites`);
    return response.data;
  },

  addFavorite: async (userId: string, letterId: string, groupId?: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/user/${userId}/favorites/${letterId}`, { groupId });
    return response.data;
  },

  removeFavorite: async (userId: string, letterId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/${userId}/favorites/${letterId}`);
    return response.data;
  },

  getStats: async (userId: string): Promise<{ success: boolean; data: UserStats }> => {
    const response = await api.get(`/user/${userId}/stats`);
    return response.data;
  },

  getInteractions: async (
    userId: string,
    params?: InteractionQueryParams
  ): Promise<{
    success: boolean;
    data: Interaction[];
    stats: InteractionTypeStats;
    emotionStats: InteractionEmotionStat[];
    total: number;
  }> => {
    const response = await api.get(`/user/${userId}/interactions`, { params });
    return response.data;
  },
};
