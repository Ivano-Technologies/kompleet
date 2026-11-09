export interface CompatUser {
  id: string;
  email: string;
  email_confirmed_at: string;
  created_at: string;
  aud: "authenticated";
  role: "authenticated";
  app_metadata: { role?: string; provider: "convex" };
  user_metadata: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    company_name?: string;
  };
}

function platformRoleFromProfile(role: unknown): string {
  switch (role) {
    case "owner":
    case "admin":
    case "tax_consultant":
    case "user":
    case "viewer":
      return role;
    default:
      return "user";
  }
}

export function profileToCompatUser(profile: {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  created_at?: string;
  platform_role?: string | null;
}): CompatUser {
  const fullName = profile.full_name ?? "";
  const [firstName, ...rest] = fullName.split(" ").filter(Boolean);
  return {
    id: profile.id,
    email: profile.email,
    email_confirmed_at: new Date(0).toISOString(),
    created_at: profile.created_at ?? new Date(0).toISOString(),
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {
      role: platformRoleFromProfile(profile.platform_role),
      provider: "convex",
    },
    user_metadata: {
      full_name: profile.full_name ?? undefined,
      first_name: firstName,
      last_name: rest.join(" ") || undefined,
      company_name: profile.company_name ?? undefined,
    },
  };
}
