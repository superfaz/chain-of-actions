import { describe, expect, test } from "vitest";
import { convert, fail, succeed } from "../src/Block";
import { PromisedResult } from "../src/Result";

class TestError extends Error {
  constructor(message?: string) {
    super(message ?? "error");
  }
}

describe("Block", () => {
  test("succeed()", async () => {
    const actual: PromisedResult<string> = succeed("Hello, World!");

    expect(await actual).toEqual({ success: true, value: "Hello, World!" });
  });

  test("fail()", async () => {
    const actual: PromisedResult<never, TestError> = fail(new TestError());

    expect(await actual).toEqual({
      success: false,
      error: new TestError("error"),
    });
  });

  describe("convert()", () => {
    test("success", async () => {
      const actual = convert({
        try: () => Promise.resolve("result"),
        catch: () => new TestError(),
      });

      expect(await actual).toEqual({ success: true, value: "result" });
    });

    test("fail", async () => {
      const actual = convert({
        try: () => {
          throw new TestError();
        },
        catch: (e) => (e instanceof Error ? e : new TestError()),
      });

      expect(await actual).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });
  });
});
