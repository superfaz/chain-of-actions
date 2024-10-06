import { describe, expect, test } from "vitest";
import { fail, start, succeed } from "../src";

class TestError extends Error {
  constructor(message?: string) {
    super(message ?? "error");
  }
}

describe("Usage", () => {
  test("Build data and executes 2 actions", async () => {
    const data1 = succeed({ a: 2 });
    const data2 = succeed({ b: 3 });
    const action1 = (data: { a: number; b: number }) =>
      data.b > 0
        ? succeed(data.a + data.b)
        : fail(new TestError("b is negative"));
    const action2 = (data: number) => succeed(data * 2);

    const actual = start()
      .addData(() => data1)
      .addData(() => data2)
      .onSuccess(action1)
      .onSuccess(action2);

    expect(await actual.runAsync()).toEqual({ success: true, data: 10 });
  });

  test("Add 2 services and executes 2 actions", async () => {
    interface TestContext {
      a: number;
      b: number;
    }
    const service1 = { a: 2 };
    const service2 = { b: 3 };
    const action1 = (data: number, context: TestContext) =>
      data > 0
        ? succeed(data + context.a + context.b)
        : fail(new TestError("negative"));
    const action2 = (data: number) => succeed(data * 2);

    const actual = start(2)
      .addContext(service1)
      .addContext(service2)
      .onSuccess(action1)
      .onSuccess(action1)
      .onSuccess(action2);

    expect(await actual.runAsync()).toEqual({ success: true, data: 24 });
  });

  test("Prepare 2 services and executes 2 actions", async () => {
    const service1 = succeed({ a: 2 });
    const service2 = succeed({ b: 3 });
    const action1 = (data: number, context: { a: number; b: number }) =>
      data > 0
        ? succeed(data + context.a + context.b)
        : fail(new TestError("negative"));
    const action2 = (data: number) => succeed(data * 2);

    const services = await start({})
      .addData(() => service1)
      .addData(() => service2)
      .runAsync();

    if (services.success) {
      const actual = start(2, services.data)
        .onSuccess(action1)
        .onSuccess(action1)
        .onSuccess(action2);
      expect(await actual.runAsync()).toEqual({ success: true, data: 24 });
    } else {
      expect.fail("services failed");
    }
  });

  test("Add 2 services and recover from an error", async () => {
    const service1 = { a: 2 };
    const service2 = { b: 3 };
    const action1 = (data: number, context: { a: number; b: number }) =>
      data > 0
        ? succeed(data + context.a + context.b)
        : fail(new TestError("negative"));
    const action2 = (data: number) => succeed(data * 2);

    const actual = start(-2)
      .addContext(service1)
      .addContext(service2)
      .onSuccess(action1)
      .onError(() => succeed(1))
      .onSuccess(action1)
      .onSuccess(action2);

    expect(await actual.runAsync()).toEqual({ success: true, data: 12 });
  });

  test("error handling", async () => {
    const actual = await start(-2)
      .add(() => fail(new Error("error")))
      .runAsync();

    expect(actual).toEqual({ success: false, error: new Error("error") });
  });
});
