import api from '@/utils/api';
import type {
  EmotionAnalysisData,
  WritingTemplate,
  EmotionRecord,
  EmotionTimelineData,
  RecommendedLetter,
  ApiResponse,
} from '@/types';

export const healingApi = {
  getAnalysis: async (userId: string): Promise<ApiResponse<EmotionAnalysisData>> => {
    const response = await api.get(`/healing/analysis/${userId}`);
    return response.data;
  },

  getRecommendedLetters: async (emotion?: string, limit?: number): Promise<ApiResponse<RecommendedLetter[]>> => {
    const params: Record<string, string | number> = {};
    if (emotion) params.emotion = emotion;
    if (limit) params.limit = limit;
    const response = await api.get('/healing/recommended-letters', { params });
    return response.data;
  },

  getTemplates: async (emotion?: string): Promise<ApiResponse<WritingTemplate[]>> => {
    const params: Record<string, string> = {};
    if (emotion) params.emotion = emotion;
    const response = await api.get('/healing/templates', { params });
    return response.data;
  },

  getTemplateById: async (id: string): Promise<ApiResponse<WritingTemplate>> => {
    const response = await api.get(`/healing/templates/${id}`);
    return response.data;
  },

  createEmotionRecord: async (data: {
    userId: string;
    emotion: string;
    intensity: number;
    note?: string;
  }): Promise<ApiResponse<EmotionRecord>> => {
    const response = await api.post('/healing/emotion-record', data);
    return response.data;
  },

  getEmotionRecords: async (userId: string, limit?: number): Promise<ApiResponse<EmotionRecord[]>> => {
    const params: Record<string, number> = {};
    if (limit) params.limit = limit;
    const response = await api.get(`/healing/emotion-records/${userId}`, { params });
    return response.data;
  },

  getEmotionTimeline: async (userId: string): Promise<ApiResponse<EmotionTimelineData>> => {
    const response = await api.get(`/healing/emotion-timeline/${userId}`);
    return response.data;
  },
};
