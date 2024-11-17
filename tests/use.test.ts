import { describe, expect, test } from "vitest";
import { fail, Result, start, succeed } from "../src";

class TestError extends Error {
  constructor(message?: string) {
    super(message ?? "error");
  }
}

describe("Usage", () => {
  test("Basic - Build data and executes 2 actions", async () => {
    const data1 = { a: 2 };
    const data2 = { b: 3 };
    const action1 = (value: { a: number; b: number }) =>
      value.b > 0
        ? succeed(value.a + value.b)
        : fail(new TestError("b is negative"));
    const action2 = (value: number) => succeed(value * 2);

    const actual = start()
      .onSuccess(() => succeed(data1))
      .onSuccess((data1) => succeed({ ...data1, ...data2 }))
      .onSuccess(action1)
      .onSuccess(action2);

    expect(await actual.runAsync()).toEqual({ success: true, value: 10 });
  });

  test("Basic - Recover from an error", async () => {
    const isPositive = (value: number) =>
      value > 0 ? succeed(value) : fail(new TestError("negative"));
    const multiplyBy2 = (value: number) => succeed(value * 2);

    const actual = start()
      .onSuccess(() => succeed(-2))
      .onSuccess(isPositive)
      .onError(() => succeed(1))
      .onSuccess(isPositive)
      .onSuccess(multiplyBy2);

    expect(await actual.runAsync()).toEqual({ success: true, value: 2 });
  });

  test("Basic - error handling", async () => {
    const actual = await start()
      .add(() => fail(new Error("error")))
      .runAsync();

    expect(actual).toEqual({ success: false, error: new Error("error") });
  });

  test("Context - Add 2 services and executes 2 actions", async () => {
    const service1 = { a: 2 };
    const service2 = { b: 3 };
    const addAandB = ({
      value,
      a,
      b,
    }: {
      value: number;
      a: number;
      b: number;
    }) =>
      value > 0
        ? succeed({ value: value + a + b })
        : fail(new TestError("negative"));
    const multiplyBy2 = ({ value }: { value: number }) =>
      succeed({ value: value * 2 });

    const actual = start({ ...service1, ...service2 })
      .onSuccess(() => succeed({ value: 2 }))
      .onSuccess(addAandB)
      .onSuccess(addAandB)
      .onSuccess(multiplyBy2);

    expect(await actual.runAsync()).toEqual({
      success: true,
      value: { value: 24 },
    });
  });

  test("Context - Prepare 2 services and executes 2 actions", async () => {
    const service1 = succeed({ a: 2 });
    const service2 = succeed({ b: 3 });
    const addAandB = ({
      value,
      a,
      b,
    }: {
      value: number;
      a: number;
      b: number;
    }) =>
      value > 0
        ? succeed({ value: value + a + b })
        : fail(new TestError("negative"));
    const multiplyBy2 = ({ value }: { value: number }) =>
      succeed({ value: value * 2 });

    const services = await start({})
      .addData(() => service1)
      .addData(() => service2)
      .runAsync();

    const actual = start(services.value)
      .onSuccess(() => succeed({ value: 2 }))
      .onSuccess(addAandB)
      .onSuccess(addAandB)
      .onSuccess(multiplyBy2);

    expect(await actual.runAsync()).toEqual({
      success: true,
      value: { value: 24 },
    });
  });

  test("onError to catch and manage errors during process (success)", async () => {
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

  test("onError to catch and manage errors during process (failure)", async () => {
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
