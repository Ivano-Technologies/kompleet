import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { withRateLimit } from "@/lib/with-rate-limit";

async function handleGET() {
  const htmlContent = fs.readFileSync(
    path.join(process.cwd(), "public", "kompleet-privacy.html"),
    "utf-8",
  );

  return new NextResponse(htmlContent, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}

export const GET = withRateLimit(handleGET, { limit: 120 });
