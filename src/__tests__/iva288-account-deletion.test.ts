import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DELETE_ACCOUNT_PHRASE } from "@/lib/account-deletion";
import { DELETE_ACCOUNT_PHRASE as CONVEX_PHRASE } from "../../convex/lib/eraseAccount";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

describe("IVA-288 account deletion", () => {
  it("uses the same confirmation phrase in settings, the API and Convex", () => {
    expect(DELETE_ACCOUNT_PHRASE).toBe("delete my account");
    expect(CONVEX_PHRASE).toBe(DELETE_ACCOUNT_PHRASE);
    const modal = read("src/components/layout/dashboard/SettingsModal.tsx");
    const dialog = read("src/components/settings/DeleteAccountDialog.tsx");
    const api = read("src/app/api/auth/delete-account/route.ts");
    expect(modal).toMatch(/DeleteAccountDialog/);
    expect(modal).toMatch(/signOut/);
    expect(modal).not.toMatch(/Type DELETE to permanently/);
    expect(dialog).toMatch(/RETENTION_NOTE/);
    expect(dialog).toMatch(/Type \{DELETE_ACCOUNT_PHRASE\} to confirm/);
    expect(api).toMatch(/accountDeletion\.eraseMine/);
    expect(api).toMatch(/DELETE_ACCOUNT_PHRASE/);
  });

  it("nests the confirm in the settings portal and traps focus", () => {
    const modal = read("src/components/layout/dashboard/SettingsModal.tsx");
    const dialog = read("src/components/settings/DeleteAccountDialog.tsx");
    const confirmAt = modal.indexOf("<DeleteAccountDialog");
    const contentEnd = modal.indexOf("</DialogContent>");
    expect(confirmAt).toBeGreaterThan(-1);
    expect(confirmAt).toBeLessThan(contentEnd);
    expect(dialog).toMatch(/absolute inset-0 z-30/);
    expect(dialog).toMatch(/aria-modal="true"/);
    expect(dialog).toMatch(/addEventListener\("keydown"/);
    expect(dialog).toMatch(/addEventListener\("focusin"/);
  });
});
