import { create } from 'zustand';
import { favoritesApi, type GroupWithCount } from '@/api/favorites';
import { userApi } from '@/api/user';
import type { FavoriteStats } from '@/types';

interface FavoriteState {
  favoriteIds: Set<string>;
  groups: GroupWithCount[];
  ungroupedCount: number;
  stats: FavoriteStats | null;
  initialized: boolean;

  initIfNeeded: (userId: string) => Promise<void>;
  addFavorite: (userId: string, letterId: string, groupId?: string) => Promise<{ success: boolean; message: string }>;
  removeFavorite: (userId: string, letterId: string) => Promise<{ success: boolean; message: string }>;
  isFavorited: (letterId: string) => boolean;
  refreshGroups: (userId: string) => Promise<void>;
  refreshStats: (userId: string) => Promise<void>;
  refreshAll: (userId: string) => Promise<void>;
  reset: () => void;
}

const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favoriteIds: new Set<string>(),
  groups: [],
  ungroupedCount: 0,
  stats: null,
  initialized: false,

  initIfNeeded: async (userId: string) => {
    if (get().initialized) return;
    await get().refreshAll(userId);
  },

  addFavorite: async (userId: string, letterId: string, groupId?: string) => {
    const res = await userApi.addFavorite(userId, letterId, groupId);
    if (res.success) {
      set((state) => {
        const newIds = new Set(state.favoriteIds);
        newIds.add(letterId);
        return { favoriteIds: newIds };
      });
      get().refreshGroups(userId);
      get().refreshStats(userId);
    }
    return res;
  },

  removeFavorite: async (userId: string, letterId: string) => {
    const res = await userApi.removeFavorite(userId, letterId);
    if (res.success) {
      set((state) => {
        const newIds = new Set(state.favoriteIds);
        newIds.delete(letterId);
        return { favoriteIds: newIds };
      });
      get().refreshGroups(userId);
      get().refreshStats(userId);
    }
    return res;
  },

  isFavorited: (letterId: string) => {
    return get().favoriteIds.has(letterId);
  },

  refreshGroups: async (userId: string) => {
    try {
      const res = await favoritesApi.getGroups(userId);
      if (res.success) {
        set({ groups: res.data, ungroupedCount: res.ungroupedCount });
      }
    } catch (err) {
      console.error(err);
    }
  },

  refreshStats: async (userId: string) => {
    try {
      const res = await favoritesApi.getStats(userId);
      if (res.success) {
        set({ stats: res.data });
      }
    } catch (err) {
      console.error(err);
    }
  },

  refreshAll: async (userId: string) => {
    try {
      const [favRes, groupsRes, statsRes] = await Promise.all([
        favoritesApi.getFavoriteLetters(userId),
        favoritesApi.getGroups(userId),
        favoritesApi.getStats(userId),
      ]);
      const favoriteIds = new Set<string>();
      if (favRes.success) {
        favRes.data.forEach((l) => favoriteIds.add(l.id));
      }
      set({
        favoriteIds,
        groups: groupsRes.success ? groupsRes.data : [],
        ungroupedCount: groupsRes.success ? groupsRes.ungroupedCount : 0,
        stats: statsRes.success ? statsRes.data : null,
        initialized: true,
      });
    } catch (err) {
      console.error(err);
      set({ initialized: true });
    }
  },

  reset: () => {
    set({
      favoriteIds: new Set<string>(),
      groups: [],
      ungroupedCount: 0,
      stats: null,
      initialized: false,
    });
  },
}));

export default useFavoriteStore;
