import { afterEach, describe, expect, it } from "vitest";
import { serverOpenAiApiKey } from "./openai-api-key";

describe("serverOpenAiApiKey", () => {
  const originalOpenAi = process.env.OPENAI_API_KEY;
  const originalAlias = process.env.OPEN_AI_API_KEY;
  const originalPublic = process.env.NEXT_PUBLIC_OPEN_AI_API_KEY;

  afterEach(() => {
    if (originalOpenAi === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalOpenAi;
    if (originalAlias === undefined) delete process.env.OPEN_AI_API_KEY;
    else process.env.OPEN_AI_API_KEY = originalAlias;
    if (originalPublic === undefined) delete process.env.NEXT_PUBLIC_OPEN_AI_API_KEY;
    else process.env.NEXT_PUBLIC_OPEN_AI_API_KEY = originalPublic;
  });

  it("reads OPENAI_API_KEY and ignores NEXT_PUBLIC_OPEN_AI_API_KEY", () => {
    process.env.OPENAI_API_KEY = "sk-server";
    process.env.NEXT_PUBLIC_OPEN_AI_API_KEY = "sk-browser-must-not-win";
    delete process.env.OPEN_AI_API_KEY;
    expect(serverOpenAiApiKey()).toBe("sk-server");
  });

  it("does not fall back to NEXT_PUBLIC_OPEN_AI_API_KEY", () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPEN_AI_API_KEY;
    process.env.NEXT_PUBLIC_OPEN_AI_API_KEY = "sk-browser-must-not-win";
    expect(serverOpenAiApiKey()).toBeUndefined();
  });
});
