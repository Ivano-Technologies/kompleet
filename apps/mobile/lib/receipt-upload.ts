/**
 * Upload receipt image to Convex storage via Path B `/api/expenses/receipt`.
 * No-op if not signed in.
 */
import * as FileSystem from "expo-file-system/legacy";
import { apiFetch } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/convex-auth";

export async function getSignedInUserId(): Promise<string | null> {
  const token = await getAccessToken();
  return token ? "convex" : null;
}

/**
 * Upload receipt only when user is signed in. Returns public URL or null.
 */
export async function uploadReceipt(
  imageUri: string,
  _userId: string,
  expenseId: string,
): Promise<string | null> {
  try {
    const token = await getAccessToken();
    if (!token) return null;

    const form = new FormData();
    const ext = imageUri.split(".").pop()?.toLowerCase() || "jpg";
    const name = `${expenseId}.${ext}`;
    form.append("file", {
      uri: imageUri,
      name,
      type: ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`,
    } as unknown as Blob);
    form.append("expenseId", expenseId);

    const response = await apiFetch("/api/expenses/receipt", token, {
      method: "POST",
      body: form,
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { url?: string | null };
    return body.url ?? null;
  } catch {
    return null;
  }
}

/** Read local file as base64 if a caller still needs it (OCR). */
export async function readReceiptBase64(imageUri: string): Promise<string> {
  return FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}
