import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        localStorage.setItem('star_post_token', token);
        localStorage.setItem('star_post_user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('star_post_token');
        localStorage.removeItem('star_post_user');
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (data) =>
        set((state) => {
          const updated = state.user ? { ...state.user, ...data } : null;
          if (updated) {
            localStorage.setItem('star_post_user', JSON.stringify(updated));
          }
          return { user: updated };
        }),
    }),
    {
      name: 'star_post_auth',
    }
  )
);

export default useAuthStore;
