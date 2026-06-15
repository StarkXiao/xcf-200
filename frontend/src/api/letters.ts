import api from '@/utils/api';
import type { Letter, LetterListItem, Reply, PaginatedResponse, ApiResponse, LetterFormData } from '@/types';

interface LettersQueryParams {
  page?: number;
  limit?: number;
  emotion?: string;
  keyword?: string;
  sort?: 'latest' | 'popular';
}

export const lettersApi = {
  getLetters: async (params: LettersQueryParams = {}): Promise<PaginatedResponse<LetterListItem[]>> => {
    const response = await api.get('/letters', { params });
    return response.data;
  },

  getLetterById: async (id: string): Promise<ApiResponse<Letter>> => {
    const response = await api.get(`/letters/${id}`);
    return response.data;
  },

  createLetter: async (
    senderId: string,
    senderName: string,
    data: LetterFormData
  ): Promise<ApiResponse<Letter>> => {
    const response = await api.post('/letters', {
      senderId,
      senderName,
      ...data,
    });
    return response.data;
  },

  likeLetter: async (id: string): Promise<{ success: boolean; likes: number; message: string }> => {
    const response = await api.post(`/letters/${id}/like`);
    return response.data;
  },

  replyLetter: async (
    id: string,
    data: { fromParallel?: string; senderName?: string; content: string; emotion?: string }
  ): Promise<ApiResponse<Reply>> => {
    const response = await api.post(`/letters/${id}/reply`, data);
    return response.data;
  },

  getUserLetters: async (userId: string, type: 'sent' | 'replies' = 'sent'): Promise<ApiResponse<Letter[]>> => {
    const response = await api.get(`/letters/user/${userId}`, { params: { type } });
    return response.data;
  },
};
