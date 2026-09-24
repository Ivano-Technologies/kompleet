import { ConvexHttpClient } from "convex/browser";
import { getConvexUrl } from "./http";

export function getDocumentWorkerToken(): string {
  const token = process.env.DOCUMENT_WORKER_TOKEN;
  if (!token || token.length < 16) {
    throw new Error(
      "Missing DOCUMENT_WORKER_TOKEN (min 16 chars) for document workers.",
    );
  }
  return token;
}

export function createConvexWorkerClient(): ConvexHttpClient {
  const url = (process.env.CONVEX_URL ?? getConvexUrl())?.replace(/\/$/, "");
  if (!url) {
    throw new Error(
      "Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL for document workers.",
    );
  }
  getDocumentWorkerToken();
  return new ConvexHttpClient(url);
}
