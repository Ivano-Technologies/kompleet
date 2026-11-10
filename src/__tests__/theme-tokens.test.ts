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
    expect(config).toMatch(/DEFAULT:\s*rgb\("--link"\)/);
    expect(config).toMatch(/fill:\s*rgb\("--primary"\)/);
    expect(config).toMatch(/link:\s*rgb\("--link"\)/);
  });

  it("keeps light cream channels and remaps html.dark to brand navy", () => {
    expect(globals).toMatch(/--background:\s*244 241 235;/);
    expect(globals).toMatch(/--surface:\s*255 253 248;/);
    expect(globals).toMatch(/--dark-bg:\s*15 30 46;/);
    expect(globals).toMatch(/--dark-surface:\s*22 36 56;/);
    expect(globals).toMatch(/#0F1E2E page/);
    expect(globals).toMatch(/#162438 cards/);
    expect(globals).toMatch(/html\.dark[\s\S]*--background:\s*var\(--dark-bg\)/);
    expect(globals).toMatch(/@custom-variant dark/);
  });

  it("points dark-mode links and text-buttons at teal-400, not navy", () => {
    expect(globals).toMatch(/--link:\s*11 58 92;/);
    expect(globals).toMatch(/html\.dark[\s\S]*--link:\s*45 212 191;/);
    expect(globals).toMatch(/#2DD4BF/);
  });

  it("keeps filled buttons on navy primary-fill, not the dark teal link token", () => {
    const button = readFileSync(
      resolve(process.cwd(), "src/components/ui/button.tsx"),
      "utf8",
    );
    expect(button).toMatch(/bg-primary-fill text-white/);
    expect(button).not.toMatch(/bg-primary text-white/);
    expect(globals).toMatch(/\.btn-primary[\s\S]*?background-color:\s*rgb\(var\(--primary\)\)/);
    expect(globals).toMatch(/--dark-text-4:\s*107 155 184;/);
  });
});
