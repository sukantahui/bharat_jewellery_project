import { create } from 'zustand';
import { UserProfile } from '../types';
import { api } from '../api/client';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('bharat_token'),
  user: (() => {
    try {
      const u = localStorage.getItem('bharat_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })(),
  isAuthenticated: Boolean(localStorage.getItem('bharat_token')),
  isLoading: false,

  login: (token: string, user: UserProfile) => {
    localStorage.setItem('bharat_token', token);
    localStorage.setItem('bharat_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } catch {
      // Continue cleanup on network failure
    } finally {
      localStorage.removeItem('bharat_token');
      localStorage.removeItem('bharat_user');
      set({ token: null, user: null, isAuthenticated: false });
    }
  },

  initAuth: async () => {
    const token = localStorage.getItem('bharat_token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    set({ isLoading: true });
    try {
      const user = await api.auth.me();
      localStorage.setItem('bharat_user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('bharat_token');
      localStorage.removeItem('bharat_user');
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
