/**
 * POST /api/expenses/receipt
 * Multipart receipt image → Convex storage. Optional expenseId links the file.
 */
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";
import { uploadToConvexStorage } from "@/lib/convex/store-file";
import type { Id } from "../../../../../convex/_generated/dataModel";

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
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image size must be less than 8MB" },
        { status: 400 },
      );
    }

    const storageId = await uploadToConvexStorage(convex, file, file.type);
    const url = await convex.query(api.files.getUrl, { storageId });

    const expenseId = formData.get("expenseId");
    if (typeof expenseId === "string" && expenseId.length > 0) {
      await convex.mutation(api.expenses.updateMine, {
        externalId: expenseId,
        receiptStorageId: storageId as Id<"_storage">,
        receiptUrl: url ?? undefined,
      });
    }

    return NextResponse.json({ url, storageId });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Upload failed";
    const status = /not found/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
