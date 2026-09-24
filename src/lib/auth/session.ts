import { api, createConvexHttpClient } from "@/lib/convex/http";
import {
  profileToCompatUser,
  type CompatUser,
} from "@/lib/auth/compat-user";
import { rethrowIfNextControlFlow } from "@/lib/next-control-flow";

export async function getConvexAccessToken(
  request?: Request,
): Promise<string | null> {
  if (request) {
    const header = request.headers.get("Authorization");
    if (header?.startsWith("Bearer ")) {
      const bearer = header.slice(7).trim();
      if (bearer) return bearer;
    }
  }

  try {
    const { convexAuthNextjsToken } = await import(
      "@convex-dev/auth/nextjs/server"
    );
    const token = await convexAuthNextjsToken();
    return token ?? null;
  } catch (error) {
    // cookies() / postpone must escape — swallowing it 500s cold isolates.
    rethrowIfNextControlFlow(error);
    return null;
  }
}

export async function getCompatUser(
  request?: Request,
): Promise<CompatUser | null> {
  const token = await getConvexAccessToken(request);
  if (!token) return null;
  try {
    const convex = createConvexHttpClient(token);
    const profile = await convex.query(api.users.getMine, {});
    if (!profile) return null;
    return profileToCompatUser(profile);
  } catch (error) {
    rethrowIfNextControlFlow(error);
    return null;
  }
}
