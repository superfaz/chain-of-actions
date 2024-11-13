import { describe, expect, test } from "vitest";
import { fail, Result, start, succeed } from "../src";

class TestError extends Error {
  constructor(message?: string) {
    super(message ?? "error");
  }
}

describe("Usage", () => {
  test("Build data and executes 2 actions", async () => {
    const data1 = succeed({ a: 2 });
    const data2 = succeed({ b: 3 });
    const action1 = (value: { a: number; b: number }) =>
      value.b > 0
        ? succeed(value.a + value.b)
        : fail(new TestError("b is negative"));
    const action2 = (value: number) => succeed(value * 2);

    const actual = start()
      .addData(() => data1)
      .addData(() => data2)
      .onSuccess(action1)
      .onSuccess(action2);

    expect(await actual.runAsync()).toEqual({ success: true, value: 10 });
  });

  test("Add 2 services and executes 2 actions", async () => {
    interface TestContext {
      a: number;
      b: number;
    }
    const service1 = { a: 2 };
    const service2 = { b: 3 };
    const action1 = (value: number, context: TestContext) =>
      value > 0
        ? succeed(value + context.a + context.b)
        : fail(new TestError("negative"));
    const action2 = (value: number) => succeed(value * 2);

    const actual = start(2)
      .addContext(service1)
      .addContext(service2)
      .onSuccess(action1)
      .onSuccess(action1)
      .onSuccess(action2);

    expect(await actual.runAsync()).toEqual({ success: true, value: 24 });
  });

  test("Prepare 2 services and executes 2 actions", async () => {
    const service1 = succeed({ a: 2 });
    const service2 = succeed({ b: 3 });
    const action1 = (value: number, context: { a: number; b: number }) =>
      value > 0
        ? succeed(value + context.a + context.b)
        : fail(new TestError("negative"));
    const action2 = (value: number) => succeed(value * 2);

    const services = await start({})
      .addData(() => service1)
      .addData(() => service2)
      .runAsync();

    const actual = start(2, services.value)
      .onSuccess(action1)
      .onSuccess(action1)
      .onSuccess(action2);
    expect(await actual.runAsync()).toEqual({ success: true, value: 24 });
  });

  test("Add 2 services and recover from an error", async () => {
    const service1 = { a: 2 };
    const service2 = { b: 3 };
    const action1 = (value: number, context: { a: number; b: number }) =>
      value > 0
        ? succeed(value + context.a + context.b)
        : fail(new TestError("negative"));
    const action2 = (value: number) => succeed(value * 2);

    const actual = start(-2)
      .addContext(service1)
      .addContext(service2)
      .onSuccess(action1)
      .onError(() => succeed(1))
      .onSuccess(action1)
      .onSuccess(action2);

    expect(await actual.runAsync()).toEqual({ success: true, value: 12 });
  });

  test("onError to catch and manage errors during process (success)", async () => {
    const manageError = function (): never {
      throw new Error("error");
    };

    const actual: Result<number> = await start(2)
      .onSuccess((value) =>
        value < 2 ? fail(new TestError()) : succeed(value),
      )
      .onError(manageError)
      .onSuccess((value) => succeed(value * 2))
      .runAsync();

    expect(actual).toEqual({ success: true, value: 4 });
  });

  test("onError to catch and manage errors during process (failure)", async () => {
    const manageError = function (): never {
      throw new Error("error");
    };

    const actual = start(1)
      .onSuccess((value) =>
        value < 2 ? fail(new TestError()) : succeed(value),
      )
      .onError(manageError)
      .onSuccess((value) => succeed(value * 2))
      .runAsync();

    await expect(actual).rejects.toThrow(new Error("error"));
  });

  test("error handling", async () => {
    const actual = await start(-2)
      .add(() => fail(new Error("error")))
      .runAsync();

    expect(actual).toEqual({ success: false, error: new Error("error") });
  });
});
