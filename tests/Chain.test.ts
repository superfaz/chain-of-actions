import { describe, expect, test } from "vitest";
import { onError, onSuccess, passThrough, start } from "../src/Chain";
import { Node } from "../src/Node";
import { PromisedResult } from "../src/Result";
import { fail, succeed } from "../src/Block";

class TestError extends Error {
  constructor(message?: string) {
    super(message ?? "error");
  }
}

describe("Chain", () => {
  describe("start", () => {
    test("()", async () => {
      const node = start();
      expect(node).toBeInstanceOf(Node);

      const actual: PromisedResult<undefined> = node.runAsync();
      const awaited = await actual;
      expect(awaited).toEqual({ success: true });
    });
  });

  describe("onSuccess()", () => {
    const converting = (previous: number) => succeed(previous + 2);
    test("initial", async () => {
      const actual = start().add(onSuccess(() => succeed(2)));
      expect(await actual.runAsync()).toEqual({ success: true, value: 2 });
    });

    test("success", async () => {
      const actual = start()
        .add(onSuccess(() => succeed(2)))
        .add(onSuccess(converting));

      expect(await actual.runAsync()).toEqual({ success: true, value: 4 });
    });

    test("fail", async () => {
      const actual = start()
        .add(onSuccess(() => fail(new TestError())))
        .add(onSuccess(converting));

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });
  });

  describe("pathThrough()", () => {
    const converting = (
      input: unknown,
    ): PromisedResult<undefined, TestError> => {
      if (input) {
        console.log("converting");
        return succeed();
      } else {
        return fail(new TestError());
      }
    };

    test("success", async () => {
      const actual = start()
        .add(onSuccess(() => succeed(2)))
        .add(passThrough(converting));

      expect(await actual.runAsync()).toEqual({ success: true, value: 2 });
    });

    test("fail", async () => {
      const actual = start()
        .add(onSuccess(() => succeed(undefined)))
        .add(passThrough(converting));

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });

    test("skipped", async () => {
      const actual = start()
        .add(onSuccess(() => fail(new TestError())))
        .add(passThrough(converting));

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });
  });

  describe("onError()", () => {
    const converting = (error: TestError) =>
      fail(new TestError(error.message + "2"));

    test("success", async () => {
      const actual = start()
        .add(onSuccess(() => succeed(2)))
        .add((previous) =>
          previous.success && previous.value > 0
            ? succeed(previous.value)
            : fail(new TestError("error")),
        )
        .add(onError(converting));

      expect(await actual.runAsync()).toEqual({ success: true, value: 2 });
    });

    test("fail", async () => {
      const actual = start()
        .add(onSuccess(() => fail(new TestError())))
        .add(onError(converting));

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error2"),
      });
    });

    test("recover", async () => {
      const error = (previous: unknown) =>
        previous ? succeed("ok") : fail(new TestError());
      const fixing = (error: TestError) => succeed(error.message + "2");

      const actual = start()
        .add(onSuccess(() => succeed(undefined)))
        .add(onSuccess(error))
        .add(onError(fixing));

      expect(await actual.runAsync()).toEqual({
        success: true,
        value: "error2",
      });
    });
  });
});
