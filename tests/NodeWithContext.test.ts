import { describe, expect, test } from "vitest";
import { fail, succeed } from "../src/Block";
import { Node } from "../src/Node";
import { Result } from "../src/Result";

class TestError extends Error {
  constructor(message?: string) {
    super(message ?? "error");
  }
}

describe("Node - with context", () => {
  describe("runAsync()", () => {
    test("success", async () => {
      const start = succeed({ value: 2 });
      const context = { a: 2 };
      const actual = new Node(start, context);
      expect(await actual.runAsync()).toEqual({
        success: true,
        value: { value: 2 },
      });
    });

    test("fail", async () => {
      const start = fail(new TestError());
      const context = { a: 2 };
      const actual = new Node(start, context);
      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });
  });

  describe("run()", () => {
    test("success", async () => {
      const start = succeed({ value: 2 });
      const context = { a: 2 };
      const addingContext = (
        previous: Result<{ value: number }, TestError>,
        context: { a: number },
      ) =>
        previous.success
          ? succeed({ value: previous.value.value + context.a })
          : fail(previous.error);

      const actual = new Node(start, context).add(addingContext);

      expect(await actual.runAsync()).toEqual({
        success: true,
        value: { value: 4 },
      });
    });

    test("fail", async () => {
      const start = fail(new TestError());
      const context = { a: 2 };
      const addingContext = (
        previous: Result<number, TestError>,
        context: { a: number },
      ) =>
        previous.success
          ? succeed({ value: previous.value + context.a })
          : fail(previous.error);

      const actual = new Node(start, context).add(addingContext);

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });
  });
});
