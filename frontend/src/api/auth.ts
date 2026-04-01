import { apiClient } from './client';
import { User } from '../types/api';

export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  // Note: Login.tsx bypasses this and uses fetch() directly for more reliable
  // form-encoding. This is kept for compatibility with any other callers.
  login: async (credentials: Record<string, any>): Promise<LoginResponse> => {
    const body = new URLSearchParams();
    body.set('username', (credentials.email || '').trim().toLowerCase());
    body.set('password', credentials.password || '');

    const { data } = await apiClient.post<LoginResponse>('/auth/login', body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return data;
  },

  register: async (credentials: Record<string, any>): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/register', credentials);
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  }
};
