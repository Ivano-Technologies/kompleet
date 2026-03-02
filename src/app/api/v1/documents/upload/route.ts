import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import { getDocumentControllerWithSupabase } from "@/modules/document-intelligence";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const result = await controller.uploadDocument({
      userId: user.id,
      body,
      request,
    });

    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("required") || error.message.includes("must be"))
    ) {
      return NextResponse.json(
        { error: "Validation error", message: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
