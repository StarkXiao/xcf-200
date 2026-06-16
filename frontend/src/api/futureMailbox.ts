import api from '@/utils/api';
import type {
  ScheduledLetter,
  LetterVersion,
  CreateScheduledLetterData,
  FutureMailboxStats,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

interface ScheduledLettersQueryParams {
  status?: string;
  page?: number;
  limit?: number;
}

export const futureMailboxApi = {
  getScheduledLetters: async (
    userId: string,
    params: ScheduledLettersQueryParams = {}
  ): Promise<PaginatedResponse<ScheduledLetter[]>> => {
    const response = await api.get(`/future-mailbox/user/${userId}`, { params });
    return response.data;
  },

  getScheduledLetter: async (id: string): Promise<ApiResponse<ScheduledLetter>> => {
    const response = await api.get(`/future-mailbox/${id}`);
    return response.data;
  },

  createScheduledLetter: async (
    data: CreateScheduledLetterData
  ): Promise<ApiResponse<{ scheduledLetter: ScheduledLetter; letter: any }>> => {
    const response = await api.post('/future-mailbox/schedule', data);
    return response.data;
  },

  cancelScheduledLetter: async (
    id: string,
    reason?: string
  ): Promise<ApiResponse<ScheduledLetter>> => {
    const response = await api.post(`/future-mailbox/${id}/cancel`, { reason });
    return response.data;
  },

  rescheduleLetter: async (
    id: string,
    newDeliverAt: string,
    reason?: string
  ): Promise<ApiResponse<ScheduledLetter>> => {
    const response = await api.post(`/future-mailbox/${id}/reschedule`, {
      newDeliverAt,
      reason,
    });
    return response.data;
  },

  resendLetter: async (
    id: string,
    newDeliverAt?: string,
    updateContent?: {
      title?: string;
      content?: string;
      emotions?: string[];
      recipient?: string;
    }
  ): Promise<ApiResponse<{ scheduledLetter: ScheduledLetter; letter: any }>> => {
    const response = await api.post(`/future-mailbox/${id}/resent`, {
      newDeliverAt,
      updateContent,
    });
    return response.data;
  },

  getLetterVersions: async (scheduledId: string): Promise<ApiResponse<LetterVersion[]>> => {
    const response = await api.get(`/future-mailbox/${scheduledId}/versions`);
    return response.data;
  },

  getVersionById: async (versionId: string): Promise<ApiResponse<LetterVersion>> => {
    const response = await api.get(`/future-mailbox/versions/${versionId}`);
    return response.data;
  },

  saveVersion: async (
    scheduledId: string,
    data: {
      title?: string;
      content?: string;
      emotions?: string[];
      recipient?: string;
      versionNote?: string;
    }
  ): Promise<ApiResponse<{ version: LetterVersion; versionCount: number }>> => {
    const response = await api.post(`/future-mailbox/${scheduledId}/save-version`, data);
    return response.data;
  },

  restoreVersion: async (
    scheduledId: string,
    versionId: string
  ): Promise<ApiResponse<{ letter: any; version: LetterVersion; versionCount: number }>> => {
    const response = await api.post(`/future-mailbox/${scheduledId}/restore-version/${versionId}`);
    return response.data;
  },

  getStats: async (userId: string): Promise<ApiResponse<FutureMailboxStats>> => {
    const response = await api.get(`/future-mailbox/stats/${userId}`);
    return response.data;
  },

  checkReminders: async (): Promise<ApiResponse<{
    checked: number;
    remindersSent: number;
    reminders: { scheduledId: string; type: string; title: string }[];
  }>> => {
    const response = await api.get('/future-mailbox/reminders/check');
    return response.data;
  },
};
