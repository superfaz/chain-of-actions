import { describe, expect, test } from "vitest";
import { succeed, fail } from "../src/Block";
import { Node } from "../src/Node";
import { Result } from "../src/Result";

class TestError extends Error {
  constructor(message?: string) {
    super(message ?? "error");
  }
}

describe("Node", () => {
  describe("runAsync()", () => {
    test("success", async () => {
      const start = succeed(2);
      const actual = new Node(start, undefined);
      expect(await actual.runAsync()).toEqual({ success: true, value: 2 });
    });

    test("fail", async () => {
      const start = fail(new TestError());
      const actual = new Node(start, undefined);
      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });
  });

  describe("add()", () => {
    test("success", async () => {
      const start = succeed(2);
      const converting = (previous: Result<number, TestError>) =>
        previous.success ? succeed(previous.value + 2) : fail(previous.error);

      const actual = new Node(start, undefined).add(converting);

      expect(await actual.runAsync()).toEqual({ success: true, value: 4 });
    });

    test("fail", async () => {
      const start = fail(new TestError());
      const converting = (previous: Result<number, TestError>) =>
        previous.success ? succeed(previous.value + 2) : fail(previous.error);

      const actual = new Node(start, undefined).add(converting);

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });
  });
});
