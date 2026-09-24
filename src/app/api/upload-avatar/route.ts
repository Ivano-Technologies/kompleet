import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";
import { uploadToConvexStorage } from "@/lib/convex/store-file";

export async function POST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please select an image file" },
        { status: 400 },
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image size must be less than 5MB" },
        { status: 400 },
      );
    }

    const storageId = await uploadToConvexStorage(convex, file, file.type);
    await convex.mutation(api.users.updateMine, { avatarStorageId: storageId });
    const url = await convex.query(api.files.getUrl, { storageId });
    return NextResponse.json({ url, storageId });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("avatar upload:", error);
    return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
  }
}
