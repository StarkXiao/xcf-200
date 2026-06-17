import api from '@/utils/api';
import type {
  Letter,
  LetterListItem,
  Reply,
  PaginatedResponse,
  ApiResponse,
  LetterFormData,
  DeliveryTracking,
  MailRouteStats,
  CompensationType,
  LetterCollaborationData,
  SubmitRelayReplyData,
} from '@/types';

interface LettersQueryParams {
  page?: number;
  limit?: number;
  emotion?: string;
  keyword?: string;
  sort?: 'latest' | 'popular' | 'most_replied';
  minLikes?: number;
  timeRange?: 'today' | 'week' | 'month' | 'year';
  recipientType?: string | string[];
  replyStatus?: 'has_reply' | 'no_reply';
}

interface LiveTrackingData {
  currentStage: string;
  actualStage: string;
  progress: number;
  estimatedArrival: string;
  hasActiveException: boolean;
  isDelayed: boolean;
  serverTime: string;
}

interface ExceptionLetterItem {
  letterId: string;
  title: string;
  recipient: string;
  recipientType: string;
  createdAt: string;
  tracking: {
    currentStage: string;
    exceptions: any[];
    hasActiveException: boolean;
    isDelayed: boolean;
    estimatedArrival: string;
  };
}

export const lettersApi = {
  getLetters: async (params: LettersQueryParams = {}): Promise<PaginatedResponse<LetterListItem[]>> => {
    const response = await api.get('/letters', { params });
    return response.data;
  },

  getLetterById: async (id: string, viewerId?: string): Promise<ApiResponse<Letter>> => {
    const response = await api.get(`/letters/${id}`, { params: viewerId ? { viewerId } : undefined });
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

  getTracking: async (letterId: string): Promise<ApiResponse<DeliveryTracking>> => {
    const response = await api.get(`/letters/${letterId}/tracking`);
    return response.data;
  },

  getLiveTracking: async (letterId: string): Promise<ApiResponse<LiveTrackingData>> => {
    const response = await api.get(`/letters/${letterId}/tracking/live`);
    return response.data;
  },

  compensateException: async (
    letterId: string,
    compensationType: CompensationType,
    userId: string
  ): Promise<ApiResponse<{ tracking: DeliveryTracking; letterId?: string }>> => {
    const response = await api.post(`/letters/${letterId}/compensate`, {
      compensationType,
      userId,
    });
    return response.data;
  },

  advanceStage: async (letterId: string): Promise<ApiResponse<DeliveryTracking>> => {
    const response = await api.post(`/letters/${letterId}/advance-stage`);
    return response.data;
  },

  getMailRouteStats: async (userId: string): Promise<ApiResponse<MailRouteStats>> => {
    const response = await api.get(`/letters/user/${userId}/mail-route-stats`);
    return response.data;
  },

  getExceptionLetters: async (userId: string): Promise<ApiResponse<ExceptionLetterItem[]>> => {
    const response = await api.get(`/letters/user/${userId}/exceptions`);
    return response.data;
  },

  relayReply: async (
    letterId: string,
    data: SubmitRelayReplyData
  ): Promise<ApiResponse<{ reply: Reply; replyTree: Reply[]; emotionChain: string[] }>> => {
    const response = await api.post(`/letters/${letterId}/reply-relay`, data);
    return response.data;
  },

  likeReply: async (
    letterId: string,
    replyId: string,
    userId?: string
  ): Promise<{ success: boolean; likes: number; message: string }> => {
    const response = await api.post(`/letters/${letterId}/replies/${replyId}/like`, { userId });
    return response.data;
  },

  featureReply: async (
    letterId: string,
    replyId: string,
    featured: boolean,
    userId?: string
  ): Promise<ApiResponse<Reply>> => {
    const response = await api.post(`/letters/${letterId}/replies/${replyId}/feature`, { featured, userId });
    return response.data;
  },

  getCollaboration: async (letterId: string): Promise<ApiResponse<LetterCollaborationData & { replyTree: Reply[] }>> => {
    const response = await api.get(`/letters/${letterId}/collaboration`);
    return response.data;
  },

  getReplyTree: async (letterId: string): Promise<ApiResponse<Reply[]>> => {
    const response = await api.get(`/letters/${letterId}/replies/tree`);
    return response.data;
  },
};
