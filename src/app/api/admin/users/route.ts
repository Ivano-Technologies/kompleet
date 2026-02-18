import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';
import type { Role } from '@/lib/auth/rbac';

const VALID_ROLES: Role[] = ['owner', 'admin', 'tax_consultant', 'user', 'viewer'];

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/admin/users — List all users with their roles
 * Requires: owner role
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.app_metadata?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden — owner only' }, { status: 403 });
  }

  const admin = getAdminClient();
  const { data: { users }, error } = await admin.auth.admin.listUsers();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped = users.map(u => ({
    id: u.id,
    email: u.email,
    full_name: u.user_metadata?.full_name || u.user_metadata?.first_name
      ? `${u.user_metadata.first_name || ''} ${u.user_metadata.last_name || ''}`.trim()
      : u.email,
    role: u.app_metadata?.role || 'user',
    email_confirmed: !!u.email_confirmed_at,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
  }));

  return NextResponse.json({ users: mapped });
}

/**
 * PATCH /api/admin/users — Update a user's role
 * Requires: owner role
 * Body: { userId: string, role: Role }
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.app_metadata?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden — owner only' }, { status: 403 });
  }

  const body = await request.json();
  const { userId, role } = body as { userId: string; role: string };

  if (!userId || !role) {
    return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
  }

  if (!VALID_ROLES.includes(role as Role)) {
    return NextResponse.json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 });
  }

  // Prevent demoting yourself
  if (userId === user.id && role !== 'owner') {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
  }

  const admin = getAdminClient();
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, userId, role });
}
