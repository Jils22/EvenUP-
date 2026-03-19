const API_BASE = "http://127.0.0.1:8000";

export function getToken() {
  return localStorage.getItem("access_token");
}

export function setToken(token) {
  localStorage.setItem("access_token", token);
}

export function clearToken() {
  localStorage.removeItem("access_token");
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