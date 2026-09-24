/**
 * Convex Auth for Expo: sign in via web Path B `/api/auth`, store Bearer token.
 */
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "@/lib/api/client";
import { setUserId } from "@/lib/auth/user-id";

const TOKEN_KEY = "convex_access_token";
const REFRESH_KEY = "convex_refresh_token";

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setAccessToken(
  token: string,
  refreshToken?: string,
): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  }
}

export async function clearAccessToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ token: string }> {
  const response = await apiFetch("/api/auth", null, {
    method: "POST",
    body: JSON.stringify({
      action: "auth:signIn",
      args: { email, password, flow: "signIn" },
    }),
  });
  const body = (await response.json().catch(() => ({}))) as {
    tokens?: { token?: string; refreshToken?: string };
    error?: string;
  };
  if (!response.ok || !body.tokens?.token) {
    throw new Error(body.error || "Sign in failed");
  }
  await setAccessToken(body.tokens.token, body.tokens.refreshToken);
  await ensureProfile(body.tokens.token);
  return { token: body.tokens.token };
}

export async function signOutRemote(): Promise<void> {
  const token = await getAccessToken();
  if (token) {
    await apiFetch("/api/auth", token, {
      method: "POST",
      body: JSON.stringify({ action: "auth:signOut", args: {} }),
    }).catch(() => {});
  }
  await clearAccessToken();
}

export async function ensureProfile(token: string): Promise<void> {
  const response = await apiFetch("/api/auth/ensure-profile", token, {
    method: "POST",
  });
  if (!response.ok) return;
  const body = (await response.json().catch(() => ({}))) as {
    user?: { id?: string };
    id?: string;
  };
  const id = body.user?.id ?? body.id;
  if (id) await setUserId(id);
}

export async function isSignedIn(): Promise<boolean> {
  return Boolean(await getAccessToken());
}
