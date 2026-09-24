"use client";

import { ConvexHttpClient } from "convex/browser";
import { api, createConvexHttpClient, getConvexUrl } from "./http";

export { api };

export async function getBrowserConvex(): Promise<ConvexHttpClient | null> {
  if (!getConvexUrl()) return null;
  try {
    const res = await fetch("/api/auth/ensure-profile", { method: "POST" });
    if (!res.ok) return null;
    return createConvexHttpClient();
  } catch {
    return null;
  }
}

export async function ensureConvexProfile(): Promise<void> {
  await fetch("/api/auth/ensure-profile", { method: "POST" }).catch(() => {});
}
