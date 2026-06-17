import api from '@/utils/api';
import type {
  Report,
  ReportTypeInfo,
  ReportCheckResult,
  ReportStats,
  SubmitReportData,
  HandleReportData,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

interface ReportsQueryParams {
  status?: string;
  targetType?: string;
  reportType?: string;
  page?: number;
  limit?: number;
  sort?: 'latest' | 'oldest';
}

export const reportsApi = {
  getReportTypes: async (): Promise<ApiResponse<ReportTypeInfo[]>> => {
    const response = await api.get('/reports/types');
    return response.data;
  },

  submitReport: async (data: SubmitReportData): Promise<ApiResponse<Report>> => {
    const response = await api.post('/reports', data);
    return response.data;
  },

  getUserReports: async (
    userId: string,
    params: { status?: string; page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<Report[]>> => {
    const response = await api.get(`/reports/user/${userId}`, { params });
    return response.data;
  },

  getReports: async (params: ReportsQueryParams = {}): Promise<PaginatedResponse<Report[]>> => {
    const response = await api.get('/reports', { params });
    return response.data;
  },

  getReportById: async (id: string): Promise<ApiResponse<Report>> => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  handleReport: async (
    id: string,
    data: HandleReportData
  ): Promise<ApiResponse<Report>> => {
    const response = await api.post(`/reports/${id}/handle`, data);
    return response.data;
  },

  getReportStats: async (): Promise<ApiResponse<ReportStats>> => {
    const response = await api.get('/reports/stats');
    return response.data;
  },

  checkReported: async (
    targetId: string,
    targetType: 'letter' | 'reply',
    userId?: string
  ): Promise<ApiResponse<ReportCheckResult>> => {
    const response = await api.get(`/reports/check-reported/${targetId}`, {
      params: { targetType, userId },
    });
    return response.data;
  },
};
