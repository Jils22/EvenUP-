// src/api/settlements.ts
import { apiClient } from './client';
import { Settlement } from '../types/api';

export const settlementsApi = {
  // Get settlements for a specific group
  getGroupSettlements: async (groupId: string): Promise<Settlement[]> => {
    const { data } = await apiClient.get<Settlement[]>(`/groups/${groupId}/settlements`);
    return data;
  },

  // Create a settlement in a specific group
  createSettlement: async (groupId: string, payload: Partial<Settlement>): Promise<Settlement> => {
    const { data } = await apiClient.post<Settlement>(`/groups/${groupId}/settlements`, payload);
    return data;
  },

  // Update a settlement in a specific group
  updateSettlement: async (groupId: string, id: string, payload: Partial<Settlement>): Promise<Settlement> => {
    const { data } = await apiClient.patch<Settlement>(`/groups/${groupId}/settlements/${id}`, payload);
    return data;
  },

  // Delete a settlement in a specific group
  deleteSettlement: async (groupId: string, id: string): Promise<void> => {
    await apiClient.delete(`/groups/${groupId}/settlements/${id}`);
  }
};
