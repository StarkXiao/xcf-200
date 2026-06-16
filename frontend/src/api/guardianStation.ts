import api from '@/utils/api';
import type {
  RiskLevelInfo,
  ContentAnalysisResult,
  ContentRating,
  ReplyReviewTask,
  GuardianSubmitReviewData,
  Intervention,
  InterventionTypeInfo,
  AddInterventionRecordData,
  GuardianProfile,
  GuardianRankingItem,
  GuardianStationStats,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export const guardianStationApi = {
  getRiskLevels: async (): Promise<ApiResponse<RiskLevelInfo[]>> => {
    const response = await api.get('/guardian-station/risk-levels');
    return response.data;
  },

  analyzeContent: async (data: {
    content: string;
    contentType?: string;
    targetId?: string;
  }): Promise<ApiResponse<ContentAnalysisResult>> => {
    const response = await api.post('/guardian-station/analyze', data);
    return response.data;
  },

  getContentRatings: async (params: {
    riskLevel?: string;
    targetType?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<ContentRating[]>> => {
    const response = await api.get('/guardian-station/ratings', { params });
    return response.data;
  },

  getContentRating: async (
    targetId: string,
    targetType = 'letter'
  ): Promise<ApiResponse<ContentRating | null>> => {
    const response = await api.get(`/guardian-station/rating/${targetId}`, {
      params: { targetType },
    });
    return response.data;
  },

  getReviewTasks: async (params: {
    status?: string;
    riskLevel?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<ReplyReviewTask[]>> => {
    const response = await api.get('/guardian-station/review/tasks', { params });
    return response.data;
  },

  submitReview: async (
    data: GuardianSubmitReviewData
  ): Promise<ApiResponse<ReplyReviewTask>> => {
    const response = await api.post('/guardian-station/review/submit', data);
    return response.data;
  },

  getInterventions: async (params: {
    status?: string;
    priority?: string;
    type?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<Intervention[]>> => {
    const response = await api.get('/guardian-station/interventions', { params });
    return response.data;
  },

  getInterventionDetail: async (id: string): Promise<ApiResponse<Intervention>> => {
    const response = await api.get(`/guardian-station/interventions/${id}`);
    return response.data;
  },

  addInterventionRecord: async (
    id: string,
    data: AddInterventionRecordData
  ): Promise<ApiResponse<Intervention>> => {
    const response = await api.post(
      `/guardian-station/interventions/${id}/record`,
      data
    );
    return response.data;
  },

  updateInterventionStatus: async (
    id: string,
    status: string,
    operatorId: string
  ): Promise<ApiResponse<Intervention>> => {
    const response = await api.post(
      `/guardian-station/interventions/${id}/status`,
      { status, operatorId }
    );
    return response.data;
  },

  getInterventionTypes: async (): Promise<ApiResponse<InterventionTypeInfo[]>> => {
    const response = await api.get('/guardian-station/intervention-types');
    return response.data;
  },

  getGuardianProfile: async (
    userId: string
  ): Promise<ApiResponse<GuardianProfile>> => {
    const response = await api.get(`/guardian-station/guardian/${userId}`);
    return response.data;
  },

  getGuardianRanking: async (
    limit = 20
  ): Promise<ApiResponse<GuardianRankingItem[]> & { total: number }> => {
    const response = await api.get('/guardian-station/guardians/ranking', {
      params: { limit },
    });
    return response.data;
  },

  getStats: async (): Promise<ApiResponse<GuardianStationStats>> => {
    const response = await api.get('/guardian-station/stats');
    return response.data;
  },

  applyGuardian: async (
    userId: string,
    reason?: string
  ): Promise<ApiResponse<GuardianProfile>> => {
    const response = await api.post('/guardian-station/apply-guardian', {
      userId,
      reason,
    });
    return response.data;
  },
};
