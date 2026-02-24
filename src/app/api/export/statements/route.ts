import { withRateLimit } from "@/lib/with-rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient as createClient } from "@/lib/supabase/server";
import { exportFinancialStatementWord } from "@/lib/export-service";

async function handlePOST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { statement_type, tax_year } = body;

    if (
      !statement_type ||
      !["balance_sheet", "pnl", "tax_summary"].includes(statement_type)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid statement_type. Must be balance_sheet, pnl, or tax_summary",
        },
        { status: 400 },
      );
    }

    if (!tax_year) {
      return NextResponse.json(
        { error: "tax_year is required for statement export" },
        { status: 400 },
      );
    }

    // Log export action (fire-and-forget)
    supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "export",
      resource_type: "financial_statement",
      tax_year,
      metadata: { statement_type },
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    }).then(() => {}).catch(() => {});

    // Generate Word document
    const buffer = await exportFinancialStatementWord(
      user.id,
      tax_year,
      statement_type,
    );

    const statementNames: Record<string, string> = {
      balance_sheet: "Balance_Sheet",
      pnl: "Profit_Loss",
      tax_summary: "Tax_Summary",
    };

    const filename = `${statementNames[statement_type as string]}_${tax_year}.docx`;

    // Create export history record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days TTL

    await supabase.from("export_history").insert({
      user_id: user.id,
      export_type: "financial_statement",
      format: "word",
      tax_year,
      status: "complete",
      file_size: buffer.length,
      expires_at: expiresAt.toISOString(),
      completed_at: new Date().toISOString(),
      metadata: { statement_type },
    });

    // Convert Buffer to ReadableStream for Next.js 15 + TypeScript 5.9.3 compatibility
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(buffer);
        controller.close();
      },
    });

    // Return file
    return new NextResponse(stream, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error in /api/export/statements:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

// Apply rate limiting
export const POST = withRateLimit(handlePOST, { limit: 20 });
