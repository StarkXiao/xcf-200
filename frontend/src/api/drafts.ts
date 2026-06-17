import api from '@/utils/api';
import type {
  Draft,
  DraftVersion,
  DraftCreateData,
  DraftUpdateData,
  DraftSubmitData,
  DraftValidationResult,
  DraftStats,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

interface DraftsQueryParams {
  page?: number;
  limit?: number;
  sort?: 'updated' | 'created' | 'wordcount';
  search?: string;
}

export const draftsApi = {
  getDrafts: async (
    userId: string,
    params: DraftsQueryParams = {}
  ): Promise<PaginatedResponse<Draft[]>> => {
    const response = await api.get(`/drafts/user/${userId}`, { params });
    return response.data;
  },

  getDraft: async (id: string): Promise<ApiResponse<Draft>> => {
    const response = await api.get(`/drafts/${id}`);
    return response.data;
  },

  getStats: async (userId: string): Promise<ApiResponse<DraftStats>> => {
    const response = await api.get(`/drafts/stats/${userId}`);
    return response.data;
  },

  createDraft: async (data: DraftCreateData): Promise<ApiResponse<Draft>> => {
    const response = await api.post('/drafts', data);
    return response.data;
  },

  updateDraft: async (
    id: string,
    data: DraftUpdateData & { autoSave?: boolean }
  ): Promise<ApiResponse<Draft>> => {
    const response = await api.put(`/drafts/${id}`, data);
    return response.data;
  },

  saveVersion: async (
    id: string,
    note?: string
  ): Promise<ApiResponse<{ version: DraftVersion; versionCount: number }>> => {
    const response = await api.post(`/drafts/${id}/save-version`, { note });
    return response.data;
  },

  getVersions: async (draftId: string): Promise<ApiResponse<DraftVersion[]>> => {
    const response = await api.get(`/drafts/${draftId}/versions`);
    return response.data;
  },

  getVersion: async (versionId: string): Promise<ApiResponse<DraftVersion>> => {
    const response = await api.get(`/drafts/versions/${versionId}`);
    return response.data;
  },

  restoreVersion: async (
    draftId: string,
    versionId: string
  ): Promise<ApiResponse<{ draft: Draft; version: DraftVersion; versionCount: number }>> => {
    const response = await api.post(`/drafts/${draftId}/restore-version/${versionId}`);
    return response.data;
  },

  validateSubmit: async (
    id: string
  ): Promise<ApiResponse<DraftValidationResult & { riskAnalysis?: any }>> => {
    const response = await api.post(`/drafts/${id}/validate-submit`);
    return response.data;
  },

  submitDraft: async (
    id: string,
    data: { senderName?: string; scheduledDeliveryAt?: string } = {}
  ): Promise<ApiResponse<{ letter: any; isScheduled: boolean; scheduledDeliverAt?: string }>> => {
    const response = await api.post(`/drafts/${id}/submit`, data);
    return response.data;
  },

  deleteDraft: async (id: string): Promise<ApiResponse<{ id: string; title: string }>> => {
    const response = await api.delete(`/drafts/${id}`);
    return response.data;
  },

  batchDelete: async (ids: string[]): Promise<ApiResponse<{ deletedCount: number }>> => {
    const response = await api.delete('/drafts/batch', { data: { ids } });
    return response.data;
  },
};
