import api from '@/utils/api';
import type { FavoriteGroup, FavoriteReminder, FavoriteStats, Letter, ApiResponse } from '@/types';

export interface CreateGroupData {
  name: string;
  icon?: string;
  color?: string;
  description?: string;
}

export interface UpdateGroupData {
  name?: string;
  icon?: string;
  color?: string;
  description?: string;
}

export interface CreateReminderData {
  letterId: string;
  remindAt: string;
  note?: string;
}

export interface UpdateReminderData {
  remindAt?: string;
  note?: string;
  completed?: boolean;
}

export interface GroupWithCount extends FavoriteGroup {
  count: number;
}

export const favoritesApi = {
  getGroups: async (userId: string): Promise<{
    success: boolean;
    data: GroupWithCount[];
    ungroupedCount: number;
  }> => {
    const response = await api.get(`/favorites/${userId}/groups`);
    return response.data;
  },

  createGroup: async (userId: string, data: CreateGroupData): Promise<{
    success: boolean;
    message: string;
    data: GroupWithCount;
  }> => {
    const response = await api.post(`/favorites/${userId}/groups`, data);
    return response.data;
  },

  updateGroup: async (
    userId: string,
    groupId: string,
    data: UpdateGroupData
  ): Promise<{ success: boolean; message: string; data: FavoriteGroup }> => {
    const response = await api.put(`/favorites/${userId}/groups/${groupId}`, data);
    return response.data;
  },

  deleteGroup: async (userId: string, groupId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/favorites/${userId}/groups/${groupId}`);
    return response.data;
  },

  moveFavorites: async (
    userId: string,
    letterIds: string[],
    targetGroupId: string | null
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/favorites/${userId}/move`, {
      letterIds,
      targetGroupId
    });
    return response.data;
  },

  batchRemove: async (userId: string, letterIds: string[]): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/favorites/${userId}/batch-remove`, { letterIds });
    return response.data;
  },

  getReminders: async (userId: string): Promise<{
    success: boolean;
    data: (FavoriteReminder & { letter: Partial<Letter> | null })[];
    pendingCount: number;
  }> => {
    const response = await api.get(`/favorites/${userId}/reminders`);
    return response.data;
  },

  createReminder: async (
    userId: string,
    data: CreateReminderData
  ): Promise<{ success: boolean; message: string; data: FavoriteReminder }> => {
    const response = await api.post(`/favorites/${userId}/reminders`, data);
    return response.data;
  },

  updateReminder: async (
    userId: string,
    reminderId: string,
    data: UpdateReminderData
  ): Promise<{ success: boolean; message: string; data: FavoriteReminder }> => {
    const response = await api.put(`/favorites/${userId}/reminders/${reminderId}`, data);
    return response.data;
  },

  deleteReminder: async (userId: string, reminderId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/favorites/${userId}/reminders/${reminderId}`);
    return response.data;
  },

  getStats: async (userId: string): Promise<{ success: boolean; data: FavoriteStats }> => {
    const response = await api.get(`/favorites/${userId}/stats`);
    return response.data;
  },

  getFavoriteLetters: async (
    userId: string,
    groupId?: string | 'ungrouped'
  ): Promise<{ success: boolean; data: (Letter & { favoritedAt: string; favoriteId: string; groupId: string | null })[]; total: number }> => {
    const params = groupId ? { groupId } : {};
    const response = await api.get(`/favorites/${userId}/letters`, { params });
    return response.data;
  },
};
