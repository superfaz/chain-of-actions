import { describe, expect, test } from "vitest";
import { fail, succeed } from "../src/Block";
import { onError, onSuccess, passThrough, start } from "../src/Chain";
import { Node } from "../src/Node";
import { PromisedResult, SuccessResult } from "../src/Result";

class TestError extends Error {
  constructor(message?: string) {
    super(message ?? "error");
  }
}

describe("Chain", () => {
  test(start.name, async () => {
    const node = start();
    expect(node).toBeInstanceOf(Node);

    const actual: PromisedResult<undefined> = node.runAsync();
    const awaited = await actual;
    expect(awaited).toEqual({ success: true });
  });

  describe(onSuccess.name, () => {
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

  describe(passThrough.name, () => {
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

  describe(onError.name, () => {
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

    test("works with never", async () => {
      const error = (previous: unknown) =>
        previous ? succeed("ok") : fail(new TestError());
      const errorManagment = (error: TestError) => {
        throw error;
      };

      const actual = start()
        .add(onSuccess(() => succeed(2)))
        .add(onSuccess(error))
        .add(onError(errorManagment));

      // Will generate a type error if onError doesn't manage properly its type
      type Typecheck<T> =
        T extends Promise<SuccessResult<string>> ? true : false;
      const typecheck: Typecheck<ReturnType<typeof actual.runAsync>> = true;
      expect(typecheck).toBe(true);

      expect(await actual.runAsync()).toEqual({
        success: true,
        value: "ok",
      });
    });
  });
});
