import { supabase } from "@/client/supabase";
import type { Tables } from "@/types/types";

export type HistoryRow = Pick<
  Tables<"homework_history">,
  "id" | "subject" | "image_url" | "steps" | "hint" | "created_at"
>;

const BUCKET = "homework_images";
const PUBLIC_MARKER = "/storage/v1/object/public/";

export async function fetchHistory(deviceId: string, limit = 50): Promise<HistoryRow[]> {
  const { data, error } = await supabase
    .from("homework_history")
    .select("id, subject, image_url, steps, hint, created_at")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data : [];
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const { error } = await supabase.from("homework_history").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function historyThumbnail(imageUrl: string | null): string | null {
  if (!imageUrl) return null;

  const markerIndex = imageUrl.indexOf(PUBLIC_MARKER);
  if (markerIndex === -1) return imageUrl;

  const path = imageUrl.slice(markerIndex + PUBLIC_MARKER.length);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path, {
    transform: { width: 160, height: 160, resize: "cover", quality: 70 },
  });
  return data.publicUrl;
}

export function toSteps(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}
