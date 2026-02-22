/**
 * Upload receipt image to Supabase Storage (bucket: receipts, path: {userId}/{expenseId}.jpg).
 * Upload only when signed in: requires Supabase Auth session; no-op if not signed in.
 * Uses ArrayBuffer (React Native–compatible) per Supabase docs.
 */
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import { getSupabaseClient } from "@/lib/supabase/client";

/** Returns the current Supabase user id if signed in, otherwise null. */
export async function getSignedInUserId(): Promise<string | null> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Upload receipt only when user is signed in. Returns null if not signed in or on error.
 */
export async function uploadReceipt(
  imageUri: string,
  _userId: string,
  expenseId: string,
): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const ext = imageUri.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${expenseId}.${ext}`;
    const arrayBuffer = decode(base64);
    const { error } = await supabase.storage
      .from("receipts")
      .upload(path, arrayBuffer, {
        contentType: ext === "jpg" ? "image/jpeg" : `image/${ext}`,
        upsert: true,
      });

    if (error) return null;
    const { data: urlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(path);
    return urlData?.publicUrl ?? path;
  } catch {
    return null;
  }
}
