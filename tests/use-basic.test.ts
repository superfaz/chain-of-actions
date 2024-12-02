import { describe, expect, test } from "vitest";
import { fail, Result, start, succeed } from "../src";

class TestError extends Error {
  constructor(message?: string) {
    super(message ?? "error");
  }
}

describe("Usage - Basic", () => {
  const multiplyBy2 = (value: number) => succeed(value * 2);

  test("Build data and executes 2 actions", async () => {
    const data1 = { a: 2 };
    const data2 = { b: 3 };
    const addAtoB = (value: { a: number; b: number }) =>
      value.b > 0
        ? succeed(value.a + value.b)
        : fail(new TestError("b is negative"));

    const actual = start()
      .onSuccess(() => succeed(data1))
      .onSuccess((data1) => succeed({ ...data1, ...data2 }))
      .onSuccess(addAtoB)
      .onSuccess(multiplyBy2);

    expect(await actual.runAsync()).toEqual({ success: true, value: 10 });
  });

  test("Recover from an error", async () => {
    const isPositive = (value: number) =>
      value > 0 ? succeed(value) : fail(new TestError("negative"));

    const actual = start()
      .onSuccess(() => succeed(-2))
      .onSuccess(isPositive)
      .onError(() => succeed(1))
      .onSuccess(isPositive)
      .onSuccess(multiplyBy2);

    expect(await actual.runAsync()).toEqual({ success: true, value: 2 });
  });

  test("Manage error", async () => {
    const actual = await start()
      .add(() => fail(new Error("error")))
      .runAsync();

    expect(actual).toEqual({ success: false, error: new Error("error") });
  });

  test("Use onError to catch and manage errors during process (success)", async () => {
    const manageError = function (): never {
      throw new Error("error");
    };

    const actual: Result<number> = await start()
      .onSuccess(() => succeed(2))
      .onSuccess((value) =>
        value < 2 ? fail(new TestError()) : succeed(value),
      )
      .onError(manageError)
      .onSuccess((value) => succeed(value * 2))
      .runAsync();

    expect(actual).toEqual({ success: true, value: 4 });
  });

  test("Use onError to catch and manage errors during process (failure)", async () => {
    const manageError = function (): never {
      throw new Error("error");
    };

    const actual = start()
      .onSuccess(() => succeed(1))
      .onSuccess((value) =>
        value < 2 ? fail(new TestError()) : succeed(value),
      )
      .onError(manageError)
      .onSuccess((value) => succeed(value * 2))
      .runAsync();

    await expect(actual).rejects.toThrow(new Error("error"));
  });
});