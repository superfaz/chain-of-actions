import { describe, expect, test } from "vitest";
import Block from "../src/Block";
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
      const start = Block.succeed(2);
      const actual = new Node(start, undefined);
      expect(await actual.runAsync()).toEqual({ success: true, data: 2 });
    });

    test("fail", async () => {
      const start = Block.fail(new TestError());
      const actual = new Node(start, undefined);
      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });
  });

  describe("run()", () => {
    test("success", async () => {
      const start = Block.succeed(2);
      const converting = (previous: Result<number, TestError>) =>
        previous.success
          ? Block.succeed(previous.data + 2)
          : Block.fail(previous.error);

      const actual = new Node(start, undefined).add(converting);

      expect(await actual.runAsync()).toEqual({ success: true, data: 4 });
    });

    test("fail", async () => {
      const start = Block.fail(new TestError());
      const converting = (previous: Result<number, TestError>) =>
        previous.success
          ? Block.succeed(previous.data + 2)
          : Block.fail(previous.error);

      const actual = new Node(start, undefined).add(converting);

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });
  });

  describe("onSuccess()", () => {
    test("success", async () => {
      const start = Block.succeed(2);
      const converting = (previous: number) => Block.succeed(previous + 2);

      const actual = new Node(start, undefined).onSuccess(converting);

      expect(await actual.runAsync()).toEqual({ success: true, data: 4 });
    });

    test("fail", async () => {
      const start = Block.fail(new TestError());
      const converting = (previous: number) => Block.succeed(previous + 2);

      const actual = new Node(start, undefined).onSuccess(converting);

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });
  });

  describe("onError()", () => {
    test("success", async () => {
      const start = Block.succeed(2);
      const converting = (error: TestError) =>
        Block.fail(new TestError(error.message + "2"));

      const actual = new Node(start, undefined).onError(converting);

      expect(await actual.runAsync()).toEqual({ success: true, data: 2 });
    });

    test("fail", async () => {
      const start = Block.fail(new TestError());
      const converting = (error: TestError) =>
        Block.fail(new TestError(error.message + "2"));

      const actual = new Node(start, undefined).onError(converting);

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error2"),
      });
    });

    test("recover", async () => {
      const start = Block.fail(new TestError());
      const converting = (error: TestError) =>
        Block.succeed(error.message + "2");

      const actual = new Node(start, undefined).onError(converting);

      expect(await actual.runAsync()).toEqual({
        success: true,
        data: "error2",
      });
    });
  });

  describe("addData()", () => {
    test("success", async () => {
      const start = Block.succeed({ current: 2 });
      const extra = () => Block.succeed({ extra: 3 });

      const actual = new Node(start, undefined).addData(extra);

      expect(await actual.runAsync()).toEqual({
        success: true,
        data: { extra: 3, current: 2 },
      });
    });

    test("fail", async () => {
      const start = Block.fail(new TestError());
      const extra = () => Block.succeed({ extra: 3 });

      const actual = new Node(start, undefined).addData(extra);

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });

    test("failing data", async () => {
      const start = Block.succeed({ current: 2 });
      const extra = () => Block.fail(new TestError("data error"));

      const actual = new Node(start, undefined).addData(extra);

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("data error"),
      });
    });
  });

  test("addContext() success", async () => {
    const start = Block.succeed(2);

    const actual = new Node(start, {})
      .addContext({ extra: 3 })
      .onSuccess((data, context) => Block.succeed(data + context.extra));

    expect(await actual.runAsync()).toEqual({ success: true, data: 5 });
  });
});
