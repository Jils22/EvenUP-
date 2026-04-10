import axios from 'axios';

// Fallback to local 8000 port per requirement.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Inject Auth Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('evenup_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
