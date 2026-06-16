import api from '@/utils/api';
import type {
  ArchiveLetter,
  ArchiveFilters,
  ArchiveTimelinePeriod,
  ArchiveQueryParams,
  UserArchiveStats,
  LetterTraceback,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export const archiveApi = {
  getLetters: async (
    params: ArchiveQueryParams = {}
  ): Promise<PaginatedResponse<ArchiveLetter[]>> => {
    const response = await api.get('/archive', { params });
    return response.data;
  },

  getTimeline: async (
    params: Omit<ArchiveQueryParams, 'page' | 'limit' | 'keyword' | 'sort'> = {}
  ): Promise<ApiResponse<ArchiveTimelinePeriod[]>> => {
    const response = await api.get('/archive/timeline', { params });
    return response.data;
  },

  getFilters: async (
    params: { scope?: string; userId?: string } = {}
  ): Promise<ApiResponse<ArchiveFilters>> => {
    const response = await api.get('/archive/filters', { params });
    return response.data;
  },

  getUserStats: async (
    userId: string
  ): Promise<ApiResponse<UserArchiveStats>> => {
    const response = await api.get(`/archive/user/${userId}/stats`);
    return response.data;
  },

  getLetterTraceback: async (
    letterId: string
  ): Promise<ApiResponse<LetterTraceback>> => {
    const response = await api.get(`/archive/letter/${letterId}/traceback`);
    return response.data;
  },
};
