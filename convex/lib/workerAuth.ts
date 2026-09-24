export function assertDocumentWorkerToken(token: string): void {
  const expected = process.env.DOCUMENT_WORKER_TOKEN;
  if (!expected || expected.length < 16) {
    throw new Error("DOCUMENT_WORKER_TOKEN is not configured");
  }
  if (token !== expected) {
    throw new Error("Unauthorized");
  }
}
