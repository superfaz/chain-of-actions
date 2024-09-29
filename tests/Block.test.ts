import { describe, expect, test } from "vitest";
import Block from "../src/Block";
import { PromisedResult } from "../src/Result";

class TestError extends Error {
  constructor(message?: string) {
    super(message ?? "error");
  }
}

describe("Block", () => {
  test("succeed()", async () => {
    const actual: PromisedResult<string> = Block.succeed("Hello, World!");

    expect(await actual).toEqual({ success: true, data: "Hello, World!" });
  });

  test("fail()", async () => {
    const actual: PromisedResult<never, TestError> = Block.fail(
      new TestError(),
    );

    expect(await actual).toEqual({
      success: false,
      error: new TestError("error"),
    });
  });

  describe("convert()", () => {
    test("success", async () => {
      const actual = Block.convert({
        try: () => Promise.resolve("result"),
        catch: () => new TestError(),
      });

      expect(await actual).toEqual({ success: true, data: "result" });
    });

    test("fail", async () => {
      const actual = Block.convert({
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
