import { apiClient } from './client';

// ─── Badges ─────────────────────────────────────────────────────────────────
export const badgesApi = {
  getMyBadges: async (): Promise<any> => {
    const { data } = await apiClient.get('/users/me/badges');
    return data;
  },
  getBadgeSummary: async (): Promise<any> => {
    const { data } = await apiClient.get('/users/me/badges/summary');
    return data;
  },
};

// ─── Recurring Expenses ─────────────────────────────────────────────────────
export const recurringApi = {
  list: async (groupId: string): Promise<any[]> => {
    const { data } = await apiClient.get(`/groups/${groupId}/recurring`);
    return data;
  },
  create: async (groupId: string, payload: any): Promise<any> => {
    const { data } = await apiClient.post(`/groups/${groupId}/recurring`, payload);
    return data;
  },
  update: async (groupId: string, recurringId: string, payload: any): Promise<any> => {
    const { data } = await apiClient.patch(`/groups/${groupId}/recurring/${recurringId}`, payload);
    return data;
  },
  delete: async (groupId: string, recurringId: string): Promise<void> => {
    await apiClient.delete(`/groups/${groupId}/recurring/${recurringId}`);
  },
};

// ─── Shopping List ───────────────────────────────────────────────────────────
export const shoppingApi = {
  list: async (groupId: string): Promise<any[]> => {
    const { data } = await apiClient.get(`/groups/${groupId}/shopping`);
    return data;
  },
  addItem: async (groupId: string, payload: { name: string; quantity?: string; assigned_to?: string }): Promise<any> => {
    const { data } = await apiClient.post(`/groups/${groupId}/shopping`, payload);
    return data;
  },
  updateItem: async (groupId: string, itemId: string, payload: { name?: string; quantity?: string; checked?: boolean; assigned_to?: string }): Promise<any> => {
    const { data } = await apiClient.patch(`/groups/${groupId}/shopping/${itemId}`, payload);
    return data;
  },
  deleteItem: async (groupId: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/groups/${groupId}/shopping/${itemId}`);
  },
  clearChecked: async (groupId: string): Promise<{ deleted: number }> => {
    const { data } = await apiClient.delete(`/groups/${groupId}/shopping`);
    return data;
  },
};

// ─── FX / Currency ───────────────────────────────────────────────────────────
// Uses the free Open Exchange Rates-compatible endpoint (no API key needed for base USD)
// We use exchangerate-api.com's free tier which returns rates relative to USD.
const FX_BASE_URL = 'https://open.er-api.com/v6/latest';

export const fxApi = {
  /** Get all rates relative to a base currency (default USD). */
  getRates: async (base = 'USD'): Promise<Record<string, number>> => {
    const res = await fetch(`${FX_BASE_URL}/${base}`);
    if (!res.ok) throw new Error('Failed to fetch exchange rates');
    const json = await res.json();
    return json.rates as Record<string, number>;
  },

  /** Convert an amount from one currency to another. */
  convert: async (amount: number, from: string, to: string): Promise<number> => {
    const rates = await fxApi.getRates(from);
    const rate = rates[to];
    if (!rate) throw new Error(`Unknown currency: ${to}`);
    return +(amount * rate).toFixed(2);
  },
};
