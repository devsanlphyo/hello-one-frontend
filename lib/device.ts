/**
 * Utility to identify and fingerprint client devices for authentication & security tracking.
 */

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "server-device";

  const STORAGE_KEY = "app_device_id";
  let deviceId = localStorage.getItem(STORAGE_KEY);

  if (!deviceId) {
    deviceId = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, deviceId);
  }

  return deviceId;
}

export function getDeviceName(): string {
  if (typeof window === "undefined") return "Web Client";

  const ua = navigator.userAgent || "";

  // Determine Browser
  let browser = "Browser";
  if (ua.includes("Edg/")) {
    browser = "Edge";
  } else if (ua.includes("Chrome/") && !ua.includes("Edg/")) {
    browser = "Chrome";
  } else if (ua.includes("Safari/") && !ua.includes("Chrome/")) {
    browser = "Safari";
  } else if (ua.includes("Firefox/")) {
    browser = "Firefox";
  } else if (ua.includes("OPR/") || ua.includes("Opera/")) {
    browser = "Opera";
  }

  // Determine OS / Platform
  let os = "Device";
  if (ua.includes("Windows NT 10.0")) os = "Windows 10/11";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Macintosh") || ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("iPhone")) os = "iPhone (iOS)";
  else if (ua.includes("iPad")) os = "iPad (iPadOS)";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Linux")) os = "Linux";

  return `${browser} on ${os}`;
}
