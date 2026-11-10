/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import TeamManagementPage, { TEAM_EMPTY_COPY } from "./page";
import { readFileSync } from "node:fs";
import path from "node:path";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("admin team empty state", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ users: [] }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists existing accounts only: no invite CTA and no role-edit claim", async () => {
    render(<TeamManagementPage />);

    await waitFor(() => {
      expect(screen.getByText(TEAM_EMPTY_COPY.title)).toBeTruthy();
    });

    expect(screen.getAllByText(TEAM_EMPTY_COPY.description).length).toBeGreaterThan(0);
    expect(screen.getAllByText(TEAM_EMPTY_COPY.intro).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Invite member" })).toBeNull();
    expect(screen.queryByText("/signup")).toBeNull();
    expect(document.querySelector('a[href="/signup"]')).toBeNull();
  });

  it("matches /api/admin/users: listAll of accounts, PATCH is 501, no invite route", () => {
    const api = readFileSync(
      path.join(process.cwd(), "src/app/api/admin/users/route.ts"),
      "utf8",
    );
    expect(api).toContain("api.users.listAll");
    expect(api).toContain("status: 501");
    expect(api).not.toMatch(/invite/i);
    expect(TEAM_EMPTY_COPY.title).toBe("No accounts to display.");
    expect(TEAM_EMPTY_COPY.description).toContain("cannot send invitations");
    expect(TEAM_EMPTY_COPY.description).toContain("roles cannot be changed yet");
    expect(TEAM_EMPTY_COPY.intro).toContain("cannot send invitations");
    expect(TEAM_EMPTY_COPY.intro).toContain("roles cannot be changed yet");
    expect(TEAM_EMPTY_COPY.title).not.toMatch(/team members/i);
    expect(TEAM_EMPTY_COPY.description).not.toMatch(/creates one|appear here|sign up/i);
    expect(TEAM_EMPTY_COPY.intro).not.toMatch(/creates one|appear here|sign up/i);
    expect(TEAM_EMPTY_COPY.description).not.toMatch(/[\u2013\u2014]/);
    expect(TEAM_EMPTY_COPY.title).not.toMatch(/[\u2013\u2014]/);
    expect(TEAM_EMPTY_COPY.intro).not.toMatch(/[\u2013\u2014]/);
    expect(TEAM_EMPTY_COPY.description).not.toMatch(/(?<![A-Za-z])-(?![A-Za-z])/);
  });
});
