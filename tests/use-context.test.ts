import { describe, expect, test } from "vitest";
import {
  addData,
  fail,
  grouped,
  onSuccess,
  onSuccessGrouped,
  start,
  succeed,
} from "../src";

class TestError extends Error {
  constructor(message?: string) {
    super(message ?? "error");
  }
}

describe("Usage - Context", () => {
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

  test("Context - Add 2 services and executes 2 data actions", async () => {
    const actual = start()
      .withContext({ ...service1, ...service2 })
      .add(onSuccess(() => succeed({ value: 2 })))
      .add(grouped.onSuccess(addAandB))
      .add(grouped.onSuccess(addAandB))
      .add(grouped.onSuccess(multiplyBy2));

    expect(await actual.runAsync()).toEqual({
      success: true,
      value: { value: 24 },
    });
  });

  test("Context - Prepare 2 services and executes 2 actions", async () => {
    const service1 = succeed({ a: 2 });
    const service2 = succeed({ b: 3 });

    const services = await start()
      .add(() => succeed({}))
      .add(addData(() => service1))
      .add(addData(() => service2))
      .runAsync();

    const actual = start()
      .withContext(services.value)
      .add(onSuccess(() => succeed({ value: 2 })))
      .add(onSuccessGrouped(addAandB))
      .add(onSuccessGrouped(addAandB))
      .add(onSuccessGrouped(multiplyBy2));

    expect(await actual.runAsync()).toEqual({
      success: true,
      value: { value: 24 },
    });
  });
});
