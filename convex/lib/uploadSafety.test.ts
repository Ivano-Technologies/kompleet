/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import { inspectUpload, sanitizeFilename } from "./uploadSafety";

const png = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
]);
const pdf = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const html = new TextEncoder().encode("<!doctype html><script>alert(1)</script>");
const svg = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>");
const exe = Uint8Array.from([0x4d, 0x5a, 0x90, 0x00]);

describe("sanitizeFilename", () => {
  it("strips paths and control characters", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("in\\voice.pdf")).toBe("voice.pdf");
    expect(sanitizeFilename("a<script>.png")).toBe("a_script_.png");
    expect(sanitizeFilename("")).toBe("untitled");
  });
});

describe("inspectUpload", () => {
  it("accepts a PNG for library and image kinds", () => {
    const result = inspectUpload({
      filename: "logo.PNG",
      bytes: png,
      size: png.length,
      maxBytes: 10 * 1024 * 1024,
      kind: "image",
    });
    expect(result).toMatchObject({
      filename: "logo.PNG",
      contentType: "image/png",
      sniffed: "png",
    });
  });

  it("accepts a PDF statement", () => {
    const result = inspectUpload({
      filename: "bank.pdf",
      bytes: pdf,
      size: pdf.length,
      maxBytes: 10 * 1024 * 1024,
      kind: "statement",
    });
    expect(result.sniffed).toBe("pdf");
  });

  it("rejects HTML, SVG and executables even with a safe extension", () => {
    expect(() =>
      inspectUpload({
        filename: "ok.png",
        bytes: html,
        size: html.length,
        maxBytes: 10 * 1024 * 1024,
        kind: "library",
      }),
    ).toThrow(/not allowed|PDF, image, or CSV/i);
    expect(() =>
      inspectUpload({
        filename: "ok.png",
        bytes: svg,
        size: svg.length,
        maxBytes: 10 * 1024 * 1024,
        kind: "image",
      }),
    ).toThrow();
    expect(() =>
      inspectUpload({
        filename: "payload.exe",
        bytes: exe,
        size: exe.length,
        maxBytes: 10 * 1024 * 1024,
        kind: "library",
      }),
    ).toThrow(/not allowed/i);
  });

  it("rejects SVG by extension before bytes", () => {
    expect(() =>
      inspectUpload({
        filename: "logo.svg",
        bytes: jpeg,
        size: jpeg.length,
        maxBytes: 10 * 1024 * 1024,
        kind: "image",
      }),
    ).toThrow(/not allowed/i);
  });

  it("enforces the size cap", () => {
    expect(() =>
      inspectUpload({
        filename: "a.png",
        bytes: png,
        size: 9 * 1024 * 1024,
        maxBytes: 8 * 1024 * 1024,
        kind: "image",
      }),
    ).toThrow(/8MB/);
  });

  it("accepts a ZIP only on the ingest path", () => {
    const zip = Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);
    expect(
      inspectUpload({
        filename: "bundle.zip",
        bytes: zip,
        size: zip.length,
        maxBytes: 100 * 1024 * 1024,
        kind: "ingest",
      }).sniffed,
    ).toBe("zip");
    expect(() =>
      inspectUpload({
        filename: "bundle.zip",
        bytes: zip,
        size: zip.length,
        maxBytes: 10 * 1024 * 1024,
        kind: "statement",
      }),
    ).toThrow(/CSV, Excel, or PDF/i);
  });

  it("rejects a ZIP pretending to be a spreadsheet when the extension is not xlsx", () => {
    const zip = Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);
    expect(() =>
      inspectUpload({
        filename: "payload.docx",
        bytes: zip,
        size: zip.length,
        maxBytes: 10 * 1024 * 1024,
        kind: "library",
      }),
    ).toThrow(/PDF, image, or CSV/i);
  });
});
