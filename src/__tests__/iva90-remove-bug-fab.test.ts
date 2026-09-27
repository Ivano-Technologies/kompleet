import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

const clientSentry = read("instrumentation-client.ts");
const serverSentry = read("sentry.server.config.ts");
const edgeSentry = read("sentry.edge.config.ts");
const shell = read("src/components/layout/dashboard/DashboardShell.tsx");
const globals = read("src/app/globals.css");

describe("IVA-90 remove floating Report a Bug FAB", () => {
  it("does not register Sentry feedbackIntegration on the client", () => {
    expect(clientSentry).not.toMatch(/feedbackIntegration/);
    expect(clientSentry).not.toMatch(/buttonLabel:\s*"Report a Bug"/);
    expect(clientSentry).toMatch(/replayIntegration/);
    expect(serverSentry).not.toMatch(/feedbackIntegration/);
    expect(edgeSentry).not.toMatch(/feedbackIntegration/);
  });

  it("does not inject a floating Report a Bug overlay in the app shell", () => {
    expect(shell).not.toMatch(/Report a [Bb]ug/);
    expect(shell).not.toMatch(/contact\?subject=bug/);
    expect(shell).not.toMatch(/fixed bottom-20 right-4/);
    expect(globals).not.toMatch(/sentry-feedback/);
  });
});
