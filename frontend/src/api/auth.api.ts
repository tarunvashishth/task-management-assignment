import client from './client';
import { tokenStore } from './tokenStore';
import { User } from '../types';

interface AuthResponse {
  user: User;
  accessToken?: string;
  refreshToken?: string;
}

export const authApi = {
  async register(email: string, password: string): Promise<User> {
    const res = await client.post<AuthResponse>('/auth/register', { email, password });
    tokenStore.set(res.data.accessToken, res.data.refreshToken);
    return res.data.user;
  },

  async login(email: string, password: string): Promise<User> {
    const res = await client.post<AuthResponse>('/auth/login', { email, password });
    tokenStore.set(res.data.accessToken, res.data.refreshToken);
    return res.data.user;
  },

  async logout(): Promise<void> {
    try {
      await client.post('/auth/logout');
    } finally {
      tokenStore.clear();
    }
  },

  async getMe(): Promise<User> {
    const res = await client.get<{ user: User }>('/auth/me');
    return res.data.user;
  },

  async getSocketToken(): Promise<string> {
    const res = await client.post<{ token: string }>('/auth/socket-token');
    return res.data.token;
  },

  async refresh(): Promise<User | null> {
    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) return null;
    try {
      const res = await client.post<AuthResponse>('/auth/refresh', { refreshToken });
      tokenStore.set(res.data.accessToken, res.data.refreshToken);
      return res.data.user;
    } catch {
      tokenStore.clear();
      return null;
    }
  },
};
