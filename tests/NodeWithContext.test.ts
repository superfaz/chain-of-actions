import { describe, expect, test } from "vitest";
import Block from "../src/Block";
import { NodeWithContext } from "../src/NodeWithContext";
import { Result } from "../src/Result";

class TestError extends Error {
  constructor(message?: string) {
    super(message ?? "error");
  }
}

describe("NodeWithContext", () => {
  describe("runAsync()", () => {
    test("success", async () => {
      const start = Block.succeed({ value: 2 });
      const context = { a: 2 };
      const actual = new NodeWithContext(start, context);
      expect(await actual.runAsync()).toEqual({
        success: true,
        value: { value: 2 },
      });
    });

    test("fail", async () => {
      const start = Block.fail(new TestError());
      const context = { a: 2 };
      const actual = new NodeWithContext(start, context);
      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });
  });

  describe("run()", () => {
    test("success", async () => {
      const start = Block.succeed({ value: 2 });
      const context = { a: 2 };
      const addingContext = (
        previous: Result<{ value: number }, TestError>,
        context: { a: number },
      ) =>
        previous.success
          ? Block.succeed({ value: previous.value.value + context.a })
          : Block.fail(previous.error);

      const actual = new NodeWithContext(start, context).add(addingContext);

      expect(await actual.runAsync()).toEqual({
        success: true,
        value: { value: 4 },
      });
    });

    test("fail", async () => {
      const start = Block.fail(new TestError());
      const context = { a: 2 };
      const addingContext = (
        previous: Result<number, TestError>,
        context: { a: number },
      ) =>
        previous.success
          ? Block.succeed({ value: previous.value + context.a })
          : Block.fail(previous.error);

      const actual = new NodeWithContext(start, context).add(addingContext);

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });
  });

  describe("onSuccess()", () => {
    test("success", async () => {
      const start = Block.succeed({ value: 2 });
      const context = { a: 2 };
      const addingContext = ({ value, a }: { value: number; a: number }) =>
        Block.succeed({ value: value + a });

      const actual = new NodeWithContext(start, context).onSuccess(
        addingContext,
      );

      expect(await actual.runAsync()).toEqual({
        success: true,
        value: { value: 4 },
      });
    });

    test("fail", async () => {
      const start = Block.fail(new TestError());
      const context = { a: 2 };
      const addingContext = ({ value, a }: { value: number; a: number }) =>
        Block.succeed({ value: value + a });

      const actual = new NodeWithContext(start, context).onSuccess(
        addingContext,
      );

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });
  });

  describe("onError()", () => {
    test("success", async () => {
      const start = Block.succeed({ value: 2 });
      const context = { a: 2 };
      const converting = (error: TestError, context: { a: number }) =>
        Block.fail(new TestError(error.message + context.a.toString()));

      const actual = new NodeWithContext(start, context).onError(converting);

      expect(await actual.runAsync()).toEqual({
        success: true,
        value: { value: 2 },
      });
    });

    test("fail", async () => {
      const start = Block.fail(new TestError());
      const context = { a: 2 };
      const converting = (error: TestError, context: { a: number }) =>
        Block.fail(new TestError(error.message + context.a.toString()));

      const actual = new NodeWithContext(start, context).onError(converting);

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error2"),
      });
    });

    test("recover", async () => {
      const start = Block.succeed({ value: undefined });
      const context = { a: 2 };
      const error = (previous: { value: unknown }) =>
        previous.value
          ? Block.succeed({ value: "ok" })
          : Block.fail(new TestError());
      const converting = (error: TestError, context: { a: number }) =>
        Block.succeed({ value: error.message + context.a.toString() });

      const actual = new NodeWithContext(start, context)
        .onSuccess(error)
        .onError(converting);

      expect(await actual.runAsync()).toEqual({
        success: true,
        value: { value: "error2" },
      });
    });
  });

  describe("addData()", () => {
    test("success", async () => {
      const start = Block.succeed({ current: 2 });
      const context = { a: 2 };
      const extra = () => Block.succeed({ extra: 3 });

      const actual = new NodeWithContext(start, context).addData(extra);

      expect(await actual.runAsync()).toEqual({
        success: true,
        value: { extra: 3, current: 2 },
      });
    });

    test("fail", async () => {
      const start = Block.fail(new TestError());
      const context = { a: 2 };
      const extra = () => Block.succeed({ extra: 3 });

      const actual = new NodeWithContext(start, context).addData(extra);

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });

    test("failing data", async () => {
      const start = Block.succeed({ current: 2 });
      const context = { a: 2 };
      const extra = () => Block.fail(new TestError("data error"));

      const actual = new NodeWithContext(start, context).addData(extra);

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("data error"),
      });
    });
  });
});
