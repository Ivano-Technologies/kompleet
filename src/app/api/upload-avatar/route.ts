import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";
import { uploadToConvexStorage } from "@/lib/convex/store-file";
import { apiErrorBody } from "@/lib/friendly-error";
import { withRateLimit } from "@/lib/with-rate-limit";

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ...apiErrorBody("No file provided") }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ ...apiErrorBody("Please select an image file") },
        { status: 400 },
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ ...apiErrorBody("Image size must be less than 5MB") },
        { status: 400 },
      );
    }

    const storageId = await uploadToConvexStorage(convex, file, file.type);
    await convex.mutation(api.users.updateMine, { avatarStorageId: storageId });
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
