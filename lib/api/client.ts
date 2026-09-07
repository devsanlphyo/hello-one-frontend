/**
 * Centralized API Client for Next.js Frontend
 * Automatically routes requests through /api/proxy to forward httpOnly authentication cookies.
 */

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
      // Redirect to login if unauthenticated / session expired
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
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      ...init,
    });
    return handleResponse<T>(res);
  },

  async post<T>(endpoint: string, body?: unknown, init?: RequestInit): Promise<T> {
    const url = resolveUrl(endpoint);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    });
    return handleResponse<T>(res);
  },

  async patch<T>(endpoint: string, body?: unknown, init?: RequestInit): Promise<T> {
    const url = resolveUrl(endpoint);
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    });
    return handleResponse<T>(res);
  },

  async put<T>(endpoint: string, body?: unknown, init?: RequestInit): Promise<T> {
    const url = resolveUrl(endpoint);
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    });
    return handleResponse<T>(res);
  },

  async delete<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const url = resolveUrl(endpoint);
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      ...init,
    });
    return handleResponse<T>(res);
  },

  async upload<T>(endpoint: string, formData: FormData, init?: RequestInit): Promise<T> {
    const url = resolveUrl(endpoint);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        // Omitting Content-Type allows browser to generate multipart boundary
        ...init?.headers,
      },
      body: formData,
      ...init,
    });
    return handleResponse<T>(res);
  },
};
