import { describe, expect, test } from "vitest";
import { onError, onSuccess, start } from "../src/Chain";
import { addData, onSuccessGroup } from "../src/ChainObject";
import { fail, succeed } from "../src/Block";

class TestError extends Error {
  constructor(message?: string) {
    super(message ?? "error");
  }
}

describe("ChainObject", () => {
  describe("onSuccessGroup()", () => {
    test("success", async () => {
      const initial = succeed({ value: 2 });
      const context = { a: 2 };
      const addingContext = ({ value, a }: { value: number; a: number }) =>
        succeed({ value: value + a });

      const actual = start()
        .add(onSuccess(() => initial))
        .withContext(context)
        .add(onSuccessGroup(addingContext));

      expect(await actual.runAsync()).toEqual({
        success: true,
        value: { value: 4 },
      });
    });

    test("fail", async () => {
      const initial = fail(new TestError());
      const context = { a: 2 };
      const addingContext = ({ value, a }: { value: number; a: number }) =>
        succeed({ value: value + a });

      const actual = start()
        .add(onSuccess(() => initial))
        .withContext(context)
        .add(onSuccessGroup(addingContext));

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });
  });

  describe("onError()", () => {
    test("success", async () => {
      const initial = succeed({ value: 2 });
      const context = { a: 2 };
      const converting = (error: TestError, context: { a: number }) =>
        fail(new TestError(error.message + context.a.toString()));

      const actual = start()
        .add(onSuccess(() => initial))
        .withContext(context)
        .add(onError(converting));

      expect(await actual.runAsync()).toEqual({
        success: true,
        value: { value: 2 },
      });
    });

    test("fail", async () => {
      const initial = fail(new TestError());
      const context = { a: 2 };
      const converting = (error: TestError, context: { a: number }) =>
        fail(new TestError(error.message + context.a.toString()));

      const actual = start()
        .add(onSuccess(() => initial))
        .withContext(context)
        .add(onError(converting));

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error2"),
      });
    });

    test("recover", async () => {
      const initial = succeed({ value: undefined });
      const context = { a: 2 };
      const error = (previous: { value: unknown }) =>
        previous.value ? succeed({ value: "ok" }) : fail(new TestError());
      const converting = (error: TestError, context: { a: number }) =>
        succeed({ value: error.message + context.a.toString() });

      const actual = start()
        .add(onSuccess(() => initial))
        .withContext(context)
        .add(onSuccess(error))
        .add(onError(converting));

      expect(await actual.runAsync()).toEqual({
        success: true,
        value: { value: "error2" },
      });
    });
  });

  describe("addData()", () => {
    test("success", async () => {
      const initial = succeed({ current: 2 });
      const context = { a: 2 };
      const extra = () => succeed({ extra: 3 });

      const actual = start()
        .add(onSuccess(() => initial))
        .withContext(context)
        .add(addData(extra));

      expect(await actual.runAsync()).toEqual({
        success: true,
        value: { extra: 3, current: 2 },
      });
    });

    test("fail", async () => {
      const initial = fail(new TestError());
      const context = { a: 2 };
      const extra = () => succeed({ extra: 3 });

      const actual = start()
        .add(onSuccess(() => initial))
        .withContext(context)
        .add(addData(extra));

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });

    test("failing data", async () => {
      const initial = succeed({ current: 2 });
      const context = { a: 2 };
      const extra = () => fail(new TestError("data error"));

      const actual = start()
        .add(onSuccess(() => initial))
        .withContext(context)
        .add(addData(extra));

      expect(await actual.runAsync()).toEqual({
        success: false,
        error: new TestError("data error"),
      });
    });
  });
});
