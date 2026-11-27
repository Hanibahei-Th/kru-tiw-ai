import { ensureSession, supabase } from "@/client/supabase";
import type { Tables } from "@/types/types";

export type HistoryRow = Pick<
  Tables<"homework_history">,
  "id" | "subject" | "image_url" | "steps" | "hint" | "created_at"
>;

const BUCKET = "homework_images";

export async function fetchHistory(limit = 50): Promise<HistoryRow[]> {
  await ensureSession();
  const { data, error } = await supabase
    .from("homework_history")
    .select("id, subject, image_url, steps, hint, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data : [];
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const { error } = await supabase.from("homework_history").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function historyThumbnail(imageUrl: string | null): Promise<string | null> {
  if (!imageUrl) return null;

  if (imageUrl.startsWith("http")) return imageUrl;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(imageUrl, 3600, {
    transform: { width: 160, height: 160, resize: "cover", quality: 70 },
  });
  return error ? null : data.signedUrl;
}

export function toSteps(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}
