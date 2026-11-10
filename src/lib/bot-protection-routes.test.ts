import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("bot protection wiring", () => {
  it("checks BotID/Turnstile on Convex Auth POST and the contact form", () => {
    expect(read("src/app/api/auth/route.ts")).toMatch(/assertHumanRequest/);
    expect(read("src/app/api/contact/route.ts")).toMatch(/assertHumanRequest/);
    expect(read("instrumentation-client.ts")).toMatch(/initBotId/);
    expect(read("instrumentation-client.ts")).toMatch(/\/api\/auth/);
    expect(read("instrumentation-client.ts")).toMatch(/\/api\/contact/);
  });

  it("mounts Turnstile on sign-up, sign-in, password reset, and contact", () => {
    expect(read("src/app/signup/page.tsx")).toMatch(/TurnstileField/);
    expect(read("src/app/login/page.tsx")).toMatch(/TurnstileField/);
    expect(read("src/app/forgot-password/page.tsx")).toMatch(/TurnstileField/);
    expect(read("src/components/landing/HeroAuthCard.tsx")).toMatch(
      /TurnstileField/,
    );
    expect(read("src/components/contact/ContactFormClient.tsx")).toMatch(
      /TurnstileField/,
    );
  });
});
