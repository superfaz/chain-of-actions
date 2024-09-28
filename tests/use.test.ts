import { describe, expect, test } from "vitest";
import { Block } from "../src/Block";
import { Chain } from "../src/Chain";

class TestError extends Error {
  constructor(message?: string) {
    super(message ?? "error");
  }
}

describe("Usage", () => {
  test("Build data and executes 2 actions", async () => {
    const data1 = Block.succeed({ a: 2 });
    const data2 = Block.succeed({ b: 3 });
    const action1 = (data: { a: number; b: number }) =>
      data.b > 0
        ? Block.succeed(data.a + data.b)
        : Block.fail(new TestError("b is negative"));
    const action2 = (data: number) => Block.succeed(data * 2);

    const actual = Chain.start()
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
        ? Block.succeed(data + context.a + context.b)
        : Block.fail(new TestError("negative"));
    const action2 = (data: number) => Block.succeed(data * 2);

    const actual = Chain.start(2)
      .addContext(service1)
      .addContext(service2)
      .onSuccess(action1)
      .onSuccess(action1)
      .onSuccess(action2);

    expect(await actual.runAsync()).toEqual({ success: true, data: 24 });
  });
});
