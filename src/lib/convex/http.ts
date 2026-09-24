import { ConvexHttpClient } from "convex/browser";
import { api, internal } from "../../../convex/_generated/api";

export { api, internal };

export function getConvexUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url || url.trim() === "") return undefined;
  return url.replace(/\/$/, "");
}

export function createConvexHttpClient(accessToken?: string): ConvexHttpClient {
  const url = getConvexUrl();
  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_CONVEX_URL. Add the Convex deployment URL (path B).",
    );
  }
  const client = new ConvexHttpClient(url);
  if (accessToken) {
    client.setAuth(accessToken);
  }
  return client;
}
