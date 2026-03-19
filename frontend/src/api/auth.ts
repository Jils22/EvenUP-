import { apiClient } from './client';
import { User } from '../types/api';

export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: async (credentials: Record<string, any>): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);
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
