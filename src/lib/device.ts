import "expo-sqlite/localStorage/install";

const DEVICE_KEY = "krutew_ai_device_id";

let cached: string | null = null;

export function getDeviceId(): string {
  if (cached) return cached;

  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) {
      cached = existing;
      return existing;
    }
    const created = `dev_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_KEY, created);
    cached = created;
    return created;
  } catch {
    cached = "dev_anonymous";
    return cached;
  }
}
