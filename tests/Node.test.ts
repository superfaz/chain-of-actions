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
      const actual = new Node(start);
      expect(await actual.runAsync()).toEqual({ success: true, value: 2 });
    });

    test("fail", async () => {
      const start = Block.fail(new TestError());
      const actual = new Node(start);
      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });
  });

  describe("add()", () => {
    test("success", async () => {
      const start = Block.succeed(2);
      const converting = (previous: Result<number, TestError>) =>
        previous.success
          ? Block.succeed(previous.value + 2)
          : Block.fail(previous.error);

      const actual = new Node(start).add(converting);

      expect(await actual.runAsync()).toEqual({ success: true, value: 4 });
    });

    test("fail", async () => {
      const start = Block.fail(new TestError());
      const converting = (previous: Result<number, TestError>) =>
        previous.success
          ? Block.succeed(previous.value + 2)
          : Block.fail(previous.error);

      const actual = new Node(start).add(converting);

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

      const actual = new Node(start).onSuccess(converting);

      expect(await actual.runAsync()).toEqual({ success: true, value: 4 });
    });

    test("fail", async () => {
      const start = Block.fail(new TestError());
      const converting = (previous: number) => Block.succeed(previous + 2);

      const actual = new Node(start).onSuccess(converting);

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

      const actual = new Node(start).onError(converting);

      expect(await actual.runAsync()).toEqual({ success: true, value: 2 });
    });

    test("fail", async () => {
      const start = Block.fail(new TestError());
      const converting = (error: TestError) =>
        Block.fail(new TestError(error.message + "2"));

      const actual = new Node(start).onError(converting);

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error2"),
      });
    });

    test("recover", async () => {
      const start = Block.succeed(undefined);
      const error = (previous: unknown) =>
        previous ? Block.succeed("ok") : Block.fail(new TestError());
      const converting = (error: TestError) =>
        Block.succeed(error.message + "2");

      const actual = new Node(start).onSuccess(error).onError(converting);

      expect(await actual.runAsync()).toEqual({
        success: true,
        value: "error2",
      });
    });
  });
});
