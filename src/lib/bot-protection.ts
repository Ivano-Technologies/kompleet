/**
 * Bot protection for public auth and contact endpoints.
 *
 * Primary (Convex Auth): Vercel BotID. Invisible, no extra form fields, so it
 * does not fight `@convex-dev/auth` Password params. Enable with
 * NEXT_PUBLIC_BOTID_ENABLED=true (client challenge) plus BOTID_ENABLED=true
 * (server check). Local/CI stay open when those vars are absent.
 *
 * Alternative: Cloudflare Turnstile, env-gated on
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY. The widget is shown
 * when the site key is present; the server verifies the token. For Convex
 * Auth the token is sent as `x-turnstile-token` (see turnstile-fetch.ts).
 */

const TURNSTILE_SITEVERIFY =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const BOT_BLOCKED_MESSAGE =
  "We couldn't verify this request. Please try again.";

export type BotGateResult = { ok: true } | { ok: false; message: string };

export function botIdServerEnabled(): boolean {
  return process.env.BOTID_ENABLED === "true";
}

export function botIdClientEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BOTID_ENABLED === "true";
}

export function turnstileSiteKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  return key && key.length > 0 ? key : undefined;
}

export function turnstileSecretKey(): string | undefined {
  const key = process.env.TURNSTILE_SECRET_KEY;
  return key && key.length > 0 ? key : undefined;
}

export function turnstileExpected(): boolean {
  return Boolean(turnstileSiteKey());
}

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteip?: string | null,
): Promise<boolean> {
  const secret = turnstileSecretKey();
  if (!secret) {
    return false;
  }
  if (!token || token.length > 2048) {
    return false;
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (remoteip) {
    body.set("remoteip", remoteip);
  }

  const response = await fetch(TURNSTILE_SITEVERIFY, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    return false;
  }
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}

export async function checkVercelBotId(): Promise<boolean> {
  if (!botIdServerEnabled()) {
    return false;
  }
  const { checkBotId } = await import("botid/server");
  const verification = await checkBotId();
  return verification.isBot === true;
}

function clientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim();
  }
  return request.headers.get("x-real-ip") ?? undefined;
}

/**
 * Fail closed when Turnstile is advertised (site key set) but the secret or
 * token is missing. Skip both checks when no bot env is configured.
 */
export async function assertHumanRequest(
  request: Request,
  options: { turnstileToken?: string | null } = {},
): Promise<BotGateResult> {
  try {
    if (await checkVercelBotId()) {
      return { ok: false, message: BOT_BLOCKED_MESSAGE };
    }
  } catch {
    // Local / CI / missing Vercel routing: do not take the site down.
  }

  if (!turnstileExpected()) {
    return { ok: true };
  }

  if (!turnstileSecretKey()) {
    return { ok: false, message: BOT_BLOCKED_MESSAGE };
  }

  const token =
    options.turnstileToken ?? request.headers.get("x-turnstile-token");
  try {
    const valid = await verifyTurnstileToken(token, clientIp(request));
    if (!valid) {
      return { ok: false, message: BOT_BLOCKED_MESSAGE };
    }
  } catch {
    return { ok: false, message: BOT_BLOCKED_MESSAGE };
  }

  return { ok: true };
}

export function botGateResponse(result: BotGateResult): Response | null {
  if (result.ok) {
    return null;
  }
  return Response.json({ error: result.message }, { status: 403 });
}
