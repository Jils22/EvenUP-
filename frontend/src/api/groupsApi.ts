import { apiClient } from './client';
import { Group } from '../types/api';

export const groupsApi = {
  getGroups: async (): Promise<Group[]> => {
    const { data } = await apiClient.get<Group[]>('/groups');
    return data;
  },

  getGroup: async (id: string): Promise<Group> => {
    const { data } = await apiClient.get<Group>(`/groups/${id}`);
    return data;
  },

  createGroup: async (groupData: Partial<Group>): Promise<Group> => {
    const { data } = await apiClient.post<Group>('/groups', groupData);
    return data;
  },

  addMember: async (groupId: string, email: string): Promise<Group> => {
    const { data } = await apiClient.post<Group>(`/groups/${groupId}/members`, { email });
    return data;
  },

  listMembers: async (groupId: string): Promise<any[]> => {
    const { data } = await apiClient.get<any[]>(`/groups/${groupId}/members`);
    return data;
  }
};
