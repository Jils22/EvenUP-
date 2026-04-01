import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

// ────────────────────────────────────────────────────────────────
// Axios client — used by .ts API modules (auth.ts, groups.ts, etc.)
// ────────────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Inject auth token on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("evenup_auth_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 → logout
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const customError = {
      message: err.response?.data?.message || err.message || "Unknown error",
      status: err.response?.status,
      data: err.response?.data,
    };
    if (err.response?.status === 401) {
      localStorage.removeItem("evenup_auth_token");
      window.dispatchEvent(new Event("auth_unauthorized"));
      window.location.href = '/login';
    }
    return Promise.reject(customError);
  }
);

// ────────────────────────────────────────────────────────────────
// Legacy fetch-based client — used by Group.jsx and other .jsx files
// ────────────────────────────────────────────────────────────────
export function getToken() {
  return localStorage.getItem("evenup_auth_token");
}

export function setToken(token) {
  localStorage.setItem("evenup_auth_token", token);
}

export function clearToken() {
  localStorage.removeItem("evenup_auth_token");
}

/**
 * api(path, options)
 * - JSON body: pass a plain object in `body`
 * - Form body: pass `body` as URLSearchParams
 */
export async function api(
  path,
  { method = "GET", body, auth = true, headers: extraHeaders = {} } = {}
) {
  const headers = { ...extraHeaders };

  // Attach token
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  // Build body + set content-type
  let finalBody = undefined;

  if (body instanceof URLSearchParams) {
    finalBody = body.toString();
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    }
  } else if (body !== undefined) {
    finalBody = JSON.stringify(body);
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: finalBody,
  });

  // 204 No Content
  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const detail = data?.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : detail
        ? JSON.stringify(detail)
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}