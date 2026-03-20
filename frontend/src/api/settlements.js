import { api } from "./client";
import { apiClient } from "./client";

// Individual exports used by Group.jsx
export const createSettlement = (groupId, payload) =>
  api(`/groups/${groupId}/settlements`, { method: "POST", body: payload });

export const listSettlements = (groupId) =>
  api(`/groups/${groupId}/settlements`);

export const updateSettlement = (groupId, settlementId, payload) =>
  api(`/groups/${groupId}/settlements/${settlementId}`, { method: "PATCH", body: payload });

export const deleteSettlement = (groupId, settlementId) =>
  api(`/groups/${groupId}/settlements/${settlementId}`, { method: "DELETE" });

// ── Named object export for TypeScript hooks (useSettlements.ts) ──
export const settlementsApi = {
  getSettlements: async (groupId) => {
    const url = groupId ? `/groups/${groupId}/settlements` : `/settlements`;
    const { data } = await apiClient.get(url);
    return data;
  },
  createSettlement: async (groupId, payload) => {
    const { data } = await apiClient.post(`/groups/${groupId}/settlements`, payload);
    return data;
  },
};
