import { fetch } from "expo/fetch";

import { supabase } from "@/client/supabase";

const BUCKET = "homework_images";

export async function uploadHomeworkImage(uri: string, ownerId: string): Promise<string> {
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  const path = `${ownerId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType: "image/jpeg" });

  if (error) throw new Error(error.message);

  return path;
}
