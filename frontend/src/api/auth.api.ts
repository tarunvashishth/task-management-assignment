import client from './client';
import { User } from '../types';

export const authApi = {
  async register(email: string, password: string): Promise<User> {
    const res = await client.post<{ user: User }>('/auth/register', { email, password });
    return res.data.user;
  },

  async login(email: string, password: string): Promise<User> {
    const res = await client.post<{ user: User }>('/auth/login', { email, password });
    return res.data.user;
  },

  async logout(): Promise<void> {
    await client.post('/auth/logout');
  },

  async getMe(): Promise<User> {
    const res = await client.get<{ user: User }>('/auth/me');
    return res.data.user;
  },
};
