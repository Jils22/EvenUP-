// src/api/settlements.ts
import { apiClient } from './client';
import { Settlement } from '../types/api';

export const settlementsApi = {
  getSettlements: async (): Promise<Settlement[]> => {
    const { data } = await apiClient.get<Settlement[]>('/settlements');
    return data;
  },

  createSettlement: async (payload: Partial<Settlement>): Promise<Settlement> => {
    const { data } = await apiClient.post<Settlement>('/settlements', payload);
    return data;
  },

  updateSettlement: async (id: string, payload: Partial<Settlement>): Promise<Settlement> => {
    const { data } = await apiClient.patch<Settlement>(`/settlements/${id}`, payload);
    return data;
  }
};
