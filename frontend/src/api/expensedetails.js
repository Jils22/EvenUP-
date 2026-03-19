import { api } from "./client";
export const getExpense = (groupId, expenseId) =>
  api(`/groups/${groupId}/expenses/${expenseId}`);

    