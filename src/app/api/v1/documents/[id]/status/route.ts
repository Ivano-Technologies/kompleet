import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import {
  getDocumentControllerWithSupabase,
  NotFoundError,
} from "@/modules/document-intelligence";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await getSupabaseForRequest(request);
    const controller = getDocumentControllerWithSupabase(supabase);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const result = await controller.getDocumentStatus({
      userId: user.id,
      documentId: id,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: "Not found", message: error.message },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
