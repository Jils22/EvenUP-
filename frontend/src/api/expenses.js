import { api, apiClient } from "./client";

// Individual exports used by Group.jsx
export const listExpenses = (groupId) => api(`/groups/${groupId}/expenses`);

export const createExpense = (groupId, payload) =>
  api(`/groups/${groupId}/expenses`, { method: "POST", body: payload });

export const getBalances = (groupId) => api(`/groups/${groupId}/balances`);

export const exportExpenses = (groupId) => api(`/groups/${groupId}/export`);

// ── Named object export for TypeScript hooks (useExpenses.ts) ──
export const expensesApi = {
  getGroupExpenses: async (groupId) => {
    const { data } = await apiClient.get(`/groups/${groupId}/expenses`);
    return data;
  },
  getExpense: async (expenseId) => {
    const { data } = await apiClient.get(`/expenses/${expenseId}`);
    return data;
  },
  createExpense: async (groupId, payload) => {
    const { data } = await apiClient.post(`/groups/${groupId}/expenses`, payload);
    return data;
  },
  updateExpense: async (expenseId, payload) => {
    const { data } = await apiClient.patch(`/expenses/${expenseId}`, payload);
    return data;
  },
  deleteExpense: async (expenseId) => {
    await apiClient.delete(`/expenses/${expenseId}`);
  },
  getBalances: async (groupId) => {
    const url = groupId ? `/groups/${groupId}/balances` : `/balances`;
    const { data } = await apiClient.get(url);
    return data;
  },
  getUserBalances: async () => {
    const { data } = await apiClient.get("/users/me/balances");
    return data;
  },
  getAnalytics: async () => {
    const { data } = await apiClient.get("/users/me/analytics");
    return data;
  },
};