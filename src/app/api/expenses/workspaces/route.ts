/**
 * GET /api/expenses/workspaces - List workspaces (user is owner or member). Premium gated (402).
 * POST /api/expenses/workspaces - Create workspace. Premium gated (402).
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import { requirePremium } from "@/lib/expense-premium";

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseForRequest(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const premium = await requirePremium(supabase, user.id);
    if (!premium.allowed) {
      return NextResponse.json(premium.body, { status: premium.status });
    }
    const { data: owned, error: e1 } = await supabase
      .from("workspaces")
      .select("id, name, owner_id, created_at")
      .eq("owner_id", user.id);
    if (e1) {
      return NextResponse.json({ error: e1.message }, { status: 500 });
    }
    const { data: memberRows } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id);
    const memberIds = [...new Set((memberRows ?? []).map((r) => r.workspace_id))];
    const workspaces = (owned ?? []) as { id: string; name: string; owner_id: string; created_at: string }[];
    const idsSeen = new Set(workspaces.map((w) => w.id));
    for (const wid of memberIds) {
      if (idsSeen.has(wid)) continue;
      const { data: w } = await supabase
        .from("workspaces")
        .select("id, name, owner_id, created_at")
        .eq("id", wid)
        .maybeSingle();
      if (w) {
        workspaces.push(w as { id: string; name: string; owner_id: string; created_at: string });
        idsSeen.add(wid);
      }
    }
    const data = workspaces;
    const error = null;
    return NextResponse.json({ workspaces: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseForRequest(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const premium = await requirePremium(supabase, user.id);
    if (!premium.allowed) {
      return NextResponse.json(premium.body, { status: premium.status });
    }
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }
    const { data, error } = await supabase
      .from("workspaces")
      .insert({ name, owner_id: user.id })
      .select("id, name, owner_id, created_at")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
