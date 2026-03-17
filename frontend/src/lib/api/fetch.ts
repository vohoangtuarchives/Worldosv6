/**
 * lib/api/fetch.ts
 * Core fetch utilities shared across all API modules.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let errText = "";
    try {
      const data = (await res.json()) as Record<string, unknown> & { message?: string; errors?: Record<string, string[]> };
      errText =
        (Array.isArray(data.errors?.email) && data.errors!.email[0]) ||
        (data.errors && typeof data.errors === "object" && Object.values(data.errors)[0]?.[0]) ||
        data.message ||
        JSON.stringify(data);
    } catch {
      errText = await res.text().catch(() => `HTTP ${res.status}`);
    }
    throw new Error(errText || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export async function publicFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers as Record<string, string> | undefined) },
  });
  if (!res.ok) {
    let errText = "";
    try {
      const data = await res.json();
      errText = data.message || JSON.stringify(data);
    } catch {
      errText = await res.text();
    }
    throw new Error(errText || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export function buildStreamUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "/api";
  const token = getToken();
  return token ? `${base}${path}?token=${encodeURIComponent(token)}` : `${base}${path}`;
}
