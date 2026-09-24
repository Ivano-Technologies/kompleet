import { describe, expect, it } from "vitest";
import {
  getDocumentControllerWithConvex,
  getDocumentStatusControllerWithConvex,
  QueueConfigurationError,
} from "./index";

function withRedisUrl<T>(value: string | undefined, fn: () => T): T {
  const previous = process.env.REDIS_URL;
  if (value === undefined) {
    delete process.env.REDIS_URL;
  } else {
    process.env.REDIS_URL = value;
  }
  try {
    return fn();
  } finally {
    if (previous === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = previous;
    }
  }
}

describe("document-intelligence factories", () => {
  it("does not require REDIS_URL for status reads", () => {
    withRedisUrl(undefined, () => {
      expect(() =>
        getDocumentStatusControllerWithConvex({} as never),
      ).not.toThrow();
    });
  });

  it("fails closed on missing REDIS_URL only for the upload/queue factory", () => {
    withRedisUrl(undefined, () => {
      expect(() => getDocumentControllerWithConvex({} as never)).toThrow(
        QueueConfigurationError,
      );
      expect(() => getDocumentControllerWithConvex({} as never)).toThrow(
        /REDIS_URL is required/,
      );
    });
  });
});
