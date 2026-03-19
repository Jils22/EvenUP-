import { api } from "./client";

export const listExpenses = (groupId) => api(`/groups/${groupId}/expenses`);

export const createExpense = (groupId, payload) =>
  api(`/groups/${groupId}/expenses`, { method: "POST", body: payload });

export const getBalances = (groupId) => api(`/groups/${groupId}/balances`);