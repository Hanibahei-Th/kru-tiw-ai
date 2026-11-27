import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "krutew_gemini_api_key";
const isWeb = process.env.EXPO_OS === "web";

export async function getApiKey(): Promise<string> {
  try {
    if (isWeb) {
      return localStorage.getItem(STORAGE_KEY) ?? "";
    }
    return (await SecureStore.getItemAsync(STORAGE_KEY)) ?? "";
  } catch {
    return "";
  }
}

export async function saveApiKey(value: string): Promise<void> {
  const trimmed = value.trim();

  if (isWeb) {
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    return;
  }

  if (trimmed) {
    await SecureStore.setItemAsync(STORAGE_KEY, trimmed);
  } else {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  }
}

export function maskApiKey(value: string): string {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••••••${value.slice(-4)}`;
}
