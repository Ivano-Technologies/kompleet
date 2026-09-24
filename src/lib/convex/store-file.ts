import type { ConvexHttpClient } from "convex/browser";
import { api } from "./http";
import type { Id } from "../../../convex/_generated/dataModel";

export async function uploadToConvexStorage(
  convex: ConvexHttpClient,
  file: Blob,
  contentType?: string,
): Promise<Id<"_storage">> {
  const uploadUrl = await convex.mutation(api.files.generateUploadUrl, {});
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": contentType || file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!response.ok) {
    throw new Error("Failed to upload file to Convex storage");
  }
  const body = (await response.json()) as { storageId: Id<"_storage"> };
  return body.storageId;
}
