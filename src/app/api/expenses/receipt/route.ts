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
import { toFriendlyError, apiErrorBody } from "@/lib/friendly-error";
import { withRateLimit } from "@/lib/with-rate-limit";
import {
  inspectUpload,
  RECEIPT_MAX_BYTES,
} from "../../../../../convex/lib/uploadSafety";

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
        filename: file.name || "receipt",
        contentType: file.type,
        bytes,
        size: file.size,
        maxBytes: RECEIPT_MAX_BYTES,
        kind: "image",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please select an image file";
      return NextResponse.json({ ...apiErrorBody(message) }, { status: 400 });
    }

    const blob = new Blob([bytes], { type: safe.contentType });
    const storageId = await uploadToConvexStorage(convex, blob, safe.contentType);
    await convex.action(api.files.saveFileMetadata, {
      storageId,
      filename: safe.filename,
      contentType: safe.contentType,
      size: file.size,
      source: "expense_attach",
    });
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
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    const raw = error instanceof Error ? error.message : "";
    const { message, ref } = toFriendlyError(error, "Upload failed. Please try again.");
    const status = /not found/i.test(raw) ? 404 : 500;
    return NextResponse.json({ error: message, ref }, { status });
  }
}

export const POST = withRateLimit(handlePOST, { limit: 20 });
