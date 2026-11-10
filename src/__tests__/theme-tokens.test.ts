import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

function walkSource(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkSource(path));
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      out.push(path);
    }
  }
  return out;
}

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
    expect(config).toMatch(/DEFAULT:\s*rgb\("--primary-fill"\)/);
    expect(config).toMatch(/hover:\s*rgb\("--primary-fill-hover"\)/);
    expect(config).toMatch(/navy:\s*rgb\("--primary"\)/);
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

  it("keeps light --link and --primary at navy #0B3A5C", () => {
    expect(globals).toMatch(/--primary:\s*11 58 92;/);
    expect(globals).toMatch(/--link:\s*11 58 92;/);
    expect(globals).toMatch(/#0B3A5C light links \/ text-buttons/);
  });

  it("keeps filled buttons on --primary-fill teal, not --link or navy --primary", () => {
    const button = readFileSync(
      resolve(process.cwd(), "src/components/ui/button.tsx"),
      "utf8",
    );
    expect(button).toMatch(/bg-primary-fill text-white hover:bg-primary-fill-hover/);
    expect(button).toMatch(/focus-visible:ring-link/);
    expect(button).toMatch(/disabled:opacity-50/);
    expect(button).not.toMatch(/bg-primary text-white/);
    expect(globals).toMatch(/--primary-fill:\s*15 118 110;/);
    expect(globals).toMatch(/--primary-fill-hover:\s*16 128 120;/);
    expect(globals).toMatch(/html\.dark[\s\S]*--primary-fill:\s*15 118 110;/);
    expect(globals).toMatch(/\.btn-primary[\s\S]*?background-color:\s*rgb\(var\(--primary-fill\)\)/);
    expect(globals).toMatch(/\.btn-primary:focus-visible[\s\S]*?rgb\(var\(--link\)\)/);
    expect(globals).toMatch(/\.btn-primary:disabled[\s\S]*?opacity:\s*0\.5/);
    expect(globals).toMatch(/--dark-text-4:\s*107 155 184;/);
  });

  it("does not pair bg-primary (the link token) with white or primary-foreground", () => {
    const root = resolve(process.cwd(), "src");
    const bad =
      /bg-primary(?!-fill|-deep)(?:\/[^\s"'`]+)?[^\n]*text-(?:white|primary-foreground)|text-(?:white|primary-foreground)[^\n]*bg-primary(?!-fill|-deep)/;
    const hits: string[] = [];
    for (const file of walkSource(root)) {
      if (file.endsWith("theme-tokens.test.ts")) continue;
      if (bad.test(readFileSync(file, "utf8"))) {
        hits.push(relative(process.cwd(), file));
      }
    }
    expect(hits).toEqual([]);
  });
});
