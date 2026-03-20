import { api } from "./client";
import { apiClient } from "./client";

// Individual function exports used by Group.jsx
export const createGroup = (name) =>
  api("/groups", { method: "POST", body: { name } });

export const listGroups = () => api("/groups");

export const getGroup = (id) => api(`/groups/${id}`);
export const addMember = (id, email) =>
  api(`/groups/${id}/members`, { method: "POST", body: { email } });

// ── Named object export for TypeScript hooks (useGroups.ts) ──
export const groupsApi = {
  getGroups: async () => {
    const { data } = await apiClient.get("/groups");
    return data;
  },
  getGroup: async (id) => {
    const { data } = await apiClient.get(`/groups/${id}`);
    return data;
  },
  createGroup: async (groupData) => {
    const { data } = await apiClient.post("/groups", groupData);
    return data;
  },
  addMember: async (groupId, email) => {
    const { data } = await apiClient.post(`/groups/${groupId}/members`, { email });
    return data;
  },
};