import { api } from "./client";

export async function updateExpense(groupId, expenseId, payload) {
  return api(`/groups/${groupId}/expenses/${expenseId}`, {
    method: "PATCH",
    body: payload,          // ✅ pass object
  });
}

export async function deleteExpense(groupId, expenseId) {
  return api(`/groups/${groupId}/expenses/${expenseId}`, {
    method: "DELETE",
  });
}