import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";
import { uploadToConvexStorage } from "@/lib/convex/store-file";
import { apiErrorBody } from "@/lib/friendly-error";
import { withRateLimit } from "@/lib/with-rate-limit";
import {
  inspectUpload,
  AVATAR_MAX_BYTES,
} from "../../../../convex/lib/uploadSafety";

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ...apiErrorBody("No file provided") }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    let safe;
    try {
      safe = inspectUpload({
        filename: file.name || "avatar",
        contentType: file.type,
        bytes,
        size: file.size,
        maxBytes: AVATAR_MAX_BYTES,
        kind: "image",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please select an image file";
      return NextResponse.json({ ...apiErrorBody(message) }, { status: 400 });
    }

    const blob = new Blob([bytes], { type: safe.contentType });
    const storageId = await uploadToConvexStorage(convex, blob, safe.contentType);
    await convex.action(api.users.setMyAvatar, { storageId });
    const url = await convex.query(api.files.getUrl, { storageId });
    return NextResponse.json({ url, storageId });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    console.error("avatar upload:", error);
    return NextResponse.json({ ...apiErrorBody("Failed to upload avatar") }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePOST, { limit: 10 });
