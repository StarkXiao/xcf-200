import api from '@/utils/api';
import type {
  RecipientRelation,
  RecipientGroup,
  RelationNetworkStats,
  ApiResponse,
} from '@/types';

interface CreateGroupData {
  name: string;
  icon?: string;
  color?: string;
  description?: string;
}

interface UpdateGroupData {
  name?: string;
  icon?: string;
  color?: string;
  description?: string;
}

interface CreateRelationData {
  name: string;
  groupId?: string;
  avatar?: string;
  note?: string;
}

interface UpdateRelationData {
  name?: string;
  groupId?: string;
  avatar?: string;
  note?: string;
}

export interface RelationDetail extends RecipientRelation {
  group?: RecipientGroup;
  letters: any[];
  emotionStats: Record<string, number>;
}

export const relationNetworkApi = {
  getStats: async (userId: string): Promise<ApiResponse<RelationNetworkStats>> => {
    const response = await api.get(`/relation-network/${userId}/stats`);
    return response.data;
  },

  getGroups: async (userId: string): Promise<ApiResponse<RecipientGroup[]>> => {
    const response = await api.get(`/relation-network/${userId}/groups`);
    return response.data;
  },

  createGroup: async (userId: string, data: CreateGroupData): Promise<ApiResponse<RecipientGroup>> => {
    const response = await api.post(`/relation-network/${userId}/groups`, data);
    return response.data;
  },

  updateGroup: async (
    userId: string,
    groupId: string,
    data: UpdateGroupData
  ): Promise<ApiResponse<RecipientGroup>> => {
    const response = await api.put(`/relation-network/${userId}/groups/${groupId}`, data);
    return response.data;
  },

  deleteGroup: async (userId: string, groupId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/relation-network/${userId}/groups/${groupId}`);
    return response.data;
  },

  getRelations: async (
    userId: string,
    groupId?: string
  ): Promise<ApiResponse<RecipientRelation[]>> => {
    const params = groupId ? { groupId } : {};
    const response = await api.get(`/relation-network/${userId}/relations`, { params });
    return response.data;
  },

  getRelationDetail: async (
    userId: string,
    relationId: string
  ): Promise<ApiResponse<RelationDetail>> => {
    const response = await api.get(`/relation-network/${userId}/relations/${relationId}`);
    return response.data;
  },

  createRelation: async (
    userId: string,
    data: CreateRelationData
  ): Promise<ApiResponse<RecipientRelation>> => {
    const response = await api.post(`/relation-network/${userId}/relations`, data);
    return response.data;
  },

  updateRelation: async (
    userId: string,
    relationId: string,
    data: UpdateRelationData
  ): Promise<ApiResponse<RecipientRelation>> => {
    const response = await api.put(`/relation-network/${userId}/relations/${relationId}`, data);
    return response.data;
  },

  deleteRelation: async (userId: string, relationId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/relation-network/${userId}/relations/${relationId}`);
    return response.data;
  },
};
