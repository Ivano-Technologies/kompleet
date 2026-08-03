import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextResponse } from "next/server";
import { isAllowedCorsOrigin, addCorsHeaders } from "./cors";

describe("isAllowedCorsOrigin", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalMobileUrl = process.env.NEXT_PUBLIC_MOBILE_APP_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_MOBILE_APP_URL = "https://app.kompleet.techivano.com";
  });

  afterEach(() => {
    vi.stubEnv("NODE_ENV", originalNodeEnv ?? "test");
    process.env.NEXT_PUBLIC_MOBILE_APP_URL = originalMobileUrl;
  });

  it("allows explicit allowlist origins in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(isAllowedCorsOrigin("https://app.kompleet.techivano.com")).toBe(true);
  });

  it("allows the canonical production host", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(isAllowedCorsOrigin("https://kompleet.techivano.com")).toBe(true);
  });

  it("rejects the retired ivanotechnologies.com hosts in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(isAllowedCorsOrigin("https://ivanotechnologies.com")).toBe(false);
    expect(isAllowedCorsOrigin("https://www.ivanotechnologies.com")).toBe(false);
  });

  it("rejects Expo Metro localhost origins in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(isAllowedCorsOrigin("http://localhost:8081")).toBe(false);
    expect(isAllowedCorsOrigin("exp://localhost:8081")).toBe(false);
  });

  it("allows Expo Metro localhost origins in non-production", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(isAllowedCorsOrigin("http://localhost:8081")).toBe(true);
    expect(isAllowedCorsOrigin("exp://localhost:8081")).toBe(true);
  });

  it("rejects localhost and LAN prefix origins in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(isAllowedCorsOrigin("http://localhost:3000")).toBe(false);
    expect(isAllowedCorsOrigin("http://192.168.1.42:8081")).toBe(false);
    expect(isAllowedCorsOrigin("http://10.0.0.5:8081")).toBe(false);
    expect(isAllowedCorsOrigin("exp://192.168.1.42:8081")).toBe(false);
  });

  it("allows localhost and LAN prefix origins in non-production", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(isAllowedCorsOrigin("http://localhost:3000")).toBe(true);
    expect(isAllowedCorsOrigin("http://192.168.1.42:8081")).toBe(true);
    expect(isAllowedCorsOrigin("http://10.0.0.5:8081")).toBe(true);
    expect(isAllowedCorsOrigin("exp://192.168.1.42:8081")).toBe(true);
  });
});

describe("addCorsHeaders", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalMobileUrl = process.env.NEXT_PUBLIC_MOBILE_APP_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_MOBILE_APP_URL = "https://app.kompleet.techivano.com";
  });

  afterEach(() => {
    vi.stubEnv("NODE_ENV", originalNodeEnv ?? "test");
    process.env.NEXT_PUBLIC_MOBILE_APP_URL = originalMobileUrl;
  });

  it("sets credentialed CORS headers for allowed production origins", () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = new NextResponse();

    addCorsHeaders(response, "https://app.kompleet.techivano.com");

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://app.kompleet.techivano.com",
    );
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBe(
      "true",
    );
  });

  it("sets credentialed CORS headers for the canonical production host", () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = new NextResponse();

    addCorsHeaders(response, "https://kompleet.techivano.com");

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://kompleet.techivano.com",
    );
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBe(
      "true",
    );
  });

  it("does not set credentialed CORS headers for disallowed production origins", () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = new NextResponse();

    addCorsHeaders(response, "http://192.168.1.42:8081");

    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBeNull();
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
  });

  it("does not set credentialed CORS headers for Expo Metro in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = new NextResponse();

    addCorsHeaders(response, "http://localhost:8081");

    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBeNull();
  });
});
