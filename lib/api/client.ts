import { getOrCreateDeviceId } from "@/lib/device";

/**
 * Centralized API Client for Next.js Frontend
 * Automatically routes requests through /api/proxy to forward httpOnly authentication cookies.
 */

function buildHeaders(customHeaders?: HeadersInit, isMultipart = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  if (typeof window !== "undefined") {
    const deviceId = getOrCreateDeviceId();
    if (deviceId) {
      headers["x-device-id"] = deviceId;
    }
  }
  if (customHeaders) {
    if (customHeaders instanceof Headers) {
      customHeaders.forEach((val, key) => {
        headers[key] = val;
      });
    } else if (Array.isArray(customHeaders)) {
      customHeaders.forEach(([key, val]) => {
        headers[key] = val;
      });
    } else {
      Object.assign(headers, customHeaders);
    }
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  let data: any;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      // Redirect to login if unauthenticated / session revoked
      window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }

    const errorMsg =
      data?.message || data?.error || (typeof data === "string" ? data : `Request failed with status ${res.status}`);
    const finalMsg = Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg;
    throw new Error(finalMsg);
  }

  return data as T;
}

function resolveUrl(endpoint: string): string {
  if (endpoint.startsWith("/api/")) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `/api/proxy/${cleanEndpoint}`;
}

export const apiClient = {
  async get<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const url = resolveUrl(endpoint);
    const res = await fetch(url, {
      method: "GET",
      headers: buildHeaders(init?.headers),
      ...init,
    });
    return handleResponse<T>(res);
  },

  async post<T>(endpoint: string, body?: unknown, init?: RequestInit): Promise<T> {
    const url = resolveUrl(endpoint);
    const res = await fetch(url, {
      method: "POST",
      headers: buildHeaders(init?.headers),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    });
    return handleResponse<T>(res);
  },

  async patch<T>(endpoint: string, body?: unknown, init?: RequestInit): Promise<T> {
    const url = resolveUrl(endpoint);
    const res = await fetch(url, {
      method: "PATCH",
      headers: buildHeaders(init?.headers),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    });
    return handleResponse<T>(res);
  },

  async put<T>(endpoint: string, body?: unknown, init?: RequestInit): Promise<T> {
    const url = resolveUrl(endpoint);
    const res = await fetch(url, {
      method: "PUT",
      headers: buildHeaders(init?.headers),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    });
    return handleResponse<T>(res);
  },

  async delete<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const url = resolveUrl(endpoint);
    const res = await fetch(url, {
      method: "DELETE",
      headers: buildHeaders(init?.headers),
      ...init,
    });
    return handleResponse<T>(res);
  },

  async upload<T>(endpoint: string, formData: FormData, init?: RequestInit): Promise<T> {
    const url = resolveUrl(endpoint);
    const res = await fetch(url, {
      method: "POST",
      headers: buildHeaders(init?.headers, true),
      body: formData,
      ...init,
    });
    return handleResponse<T>(res);
  },
};

