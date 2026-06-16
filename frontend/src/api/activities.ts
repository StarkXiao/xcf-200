import api from '@/utils/api';
import type {
  Activity,
  Registration,
  Work,
  Honor,
  RankingItem,
  ActivityStats,
  SubmitWorkData,
  ApiResponse,
  PaginatedResponse
} from '@/types';

export const activitiesApi = {
  getActivities: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    sort?: 'latest' | 'popular';
  }) =>
    api.get<PaginatedResponse<Activity[]>>('/activities', { params }),

  getActivity: (id: string) =>
    api.get<ApiResponse<Activity>>(`/activities/${id}`),

  getActivityStats: (id: string, userId?: string) =>
    api.get<ApiResponse<ActivityStats>>(`/activities/${id}/stats`, {
      params: userId ? { userId } : undefined
    }),

  registerActivity: (id: string, data: {
    userId: string;
    username: string;
    userAvatar: string;
    applyReason: string;
  }) =>
    api.post<ApiResponse<Registration>>(`/activities/${id}/register`, data),

  getRegistrations: (id: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<PaginatedResponse<Registration[]>>(`/activities/${id}/registrations`, { params }),

  reviewRegistration: (id: string, registrationId: string, data: {
    status: 'approved' | 'rejected';
    reviewComment?: string;
    reviewer?: string;
  }) =>
    api.post<ApiResponse<Registration>>(`/activities/${id}/registrations/${registrationId}/review`, data),

  submitWork: (id: string, data: {
    userId: string;
    username: string;
    userAvatar: string;
    title: string;
    content: string;
    emotions: string[];
    isAnonymous: boolean;
  }) =>
    api.post<ApiResponse<Work>>(`/activities/${id}/works`, data),

  getWorks: (id: string, params?: {
    page?: number;
    limit?: number;
    sort?: 'latest' | 'popular';
    userId?: string;
  }) =>
    api.get<PaginatedResponse<Work[]>>(`/activities/${id}/works`, { params }),

  getWork: (id: string, workId: string) =>
    api.get<ApiResponse<Work>>(`/activities/${id}/works/${workId}`),

  likeWork: (id: string, workId: string, userId: string) =>
    api.post<ApiResponse<{ likes: number; message: string }>>(
      `/activities/${id}/works/${workId}/like`,
      { userId }
    ),

  unlikeWork: (id: string, workId: string, userId: string) =>
    api.delete<ApiResponse<{ likes: number; message: string }>>(
      `/activities/${id}/works/${workId}/like`,
      { data: { userId } }
    ),

  getLikeStatus: (id: string, workId: string, userId?: string) =>
    api.get<ApiResponse<{ liked: boolean; likes: number }>>(
      `/activities/${id}/works/${workId}/like-status`,
      { params: userId ? { userId } : undefined }
    ),

  getRanking: (id: string, limit?: number) =>
    api.get<ApiResponse<RankingItem[]>>(`/activities/${id}/ranking`, {
      params: limit ? { limit } : undefined
    }),

  settleActivity: (id: string) =>
    api.post<ApiResponse<{
      totalWorks: number;
      honorsGenerated: number;
      top3: Array<{
        rank: number;
        workId: string;
        title: string;
        username: string;
        likes: number;
      }>;
    }>>(`/activities/${id}/settle`),

  getUserRegistrations: (userId: string, params?: {
    status?: string;
    activityId?: string;
  }) =>
    api.get<ApiResponse<Registration[]>>(`/activities/user/${userId}/registrations`, { params }),

  getUserWorks: (userId: string, params?: {
    activityId?: string;
    status?: string;
  }) =>
    api.get<ApiResponse<Work[]>>(`/activities/user/${userId}/works`, { params }),

  getUserHonors: (userId: string) =>
    api.get<ApiResponse<Honor[]>>(`/activities/user/${userId}/honors`)
};
