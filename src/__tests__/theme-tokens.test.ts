import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const config = readFileSync(resolve(process.cwd(), "tailwind.config.cjs"), "utf8");
const globals = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

describe("theme colour tokens", () => {
  it("points surface tokens at CSS variables so html.dark can switch them", () => {
    expect(config).toMatch(/bg:\s*rgb\("--background"\)/);
    expect(config).toMatch(/background:\s*rgb\("--background"\)/);
    expect(config).toMatch(/bg:\s*rgb\("--dark-bg"\)/);
    expect(config).toMatch(/function rgb\(channelVar\)/);
    expect(config).toMatch(/<alpha-value>/);

    expect(config).not.toMatch(/bg:\s*"#F4F1EB"/);
    expect(config).not.toMatch(/background:\s*"#F4F1EB"/);
    expect(config).not.toMatch(/bg:\s*"#080F18"/);
    expect(config).not.toMatch(/surface:\s*"#FFFDF8"/);
    expect(config).not.toMatch(/DEFAULT:\s*"#0F1E2E"/);
  });

  it("keeps light cream channels and remaps html.dark to brand navy", () => {
    expect(globals).toMatch(/--background:\s*244 241 235;/);
    expect(globals).toMatch(/--surface:\s*255 253 248;/);
    expect(globals).toMatch(/--dark-bg:\s*8 15 24;/);
    expect(globals).toMatch(/--dark-surface:\s*15 30 46;/);
    expect(globals).toMatch(/html\.dark[\s\S]*--background:\s*var\(--dark-bg\)/);
    expect(globals).toMatch(/@custom-variant dark/);
  });
});
