import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '') + '/';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Inject Auth Token & Handle Pathing
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('evenup_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ensure URL is relative to the baseURL path (e.g. /api/) 
    // Stripping leading slash prevents Axios from treating it as domain-root relative
    if (config.url && config.url.startsWith('/')) {
      config.url = config.url.substring(1);
    }

    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global Auth Errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Graceful error extraction
    const customError = {
      message: error.response?.data?.message || error.message || 'An unknown error occurred',
      status: error.response?.status,
      data: error.response?.data,
    };

    if (error.response?.status === 401) {
       // Token expired or invalid, trigger logout flow
       localStorage.removeItem('evenup_auth_token');
       window.dispatchEvent(new Event('auth_unauthorized'));
       // Fast failing UI redirect
       window.location.href = '/login';
    }

    return Promise.reject(customError);
  }
);

// Helper for Token Management
export function getToken() {
  return localStorage.getItem("evenup_auth_token");
}

export function setToken(token: string) {
  localStorage.setItem("evenup_auth_token", token);
}

export function clearToken() {
  localStorage.removeItem("evenup_auth_token");
}

/**
 * Legacy fetch-based client — used by some legacy .js/.jsx files.
 * Prefer using `apiClient` (axios) for new code.
 */
export async function api(
  path: string,
  { method = "GET", body, auth = true, headers: extraHeaders = {} }: any = {}
) {
  const headers: any = { ...extraHeaders };

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

  const res = await fetch(`${API_BASE_URL}${path}`, {
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
