import { describe, expect, test } from "vitest";
import Block from "../src/Block";
import Chain from "../src/Chain";

class TestError extends Error {
  constructor(message?: string) {
    super(message ?? "error");
  }
}

describe("DelayedNode", () => {
  test("constructor", async () => {
    const chain = Chain.prepare<number>();

    const actual = await chain.runAsync(2, {});
    expect(actual).toEqual({ success: true, value: 2 });
  });

  describe("add()", () => {
    const chain = Chain.prepare<number>().add((result) =>
      result.success
        ? result.value < 0
          ? Block.fail(new TestError("negative"))
          : Block.succeed(result.value + 2)
        : Block.fail(result.error),
    );

    test("success", async () => {
      const actual = await chain.runAsync(2, {});
      expect(actual).toEqual({ success: true, value: 4 });
    });

    test("fail", async () => {
      const actual = await chain.runAsync(-2, {});
      expect(actual).toEqual({
        success: false,
        error: new TestError("negative"),
      });
    });
  });

  describe("onSuccess()", () => {
    const chain = Chain.prepare<number>()
      .onSuccess((value) =>
        value < 0
          ? Block.fail(new TestError("negative"))
          : Block.succeed(value + 2),
      )
      .onSuccess((value) => Block.succeed(value * 2));

    test("success", async () => {
      const actual = await chain.runAsync(2, {});
      expect(actual).toEqual({ success: true, value: 8 });
    });

    test("fail", async () => {
      const actual = await chain.runAsync(-2, {});
      expect(actual).toEqual({
        success: false,
        error: new TestError("negative"),
      });
    });
  });

  describe("onError()", () => {
    const chain = Chain.prepare<number>()
      .onSuccess((value) =>
        value < 0
          ? Block.fail(new TestError("negative"))
          : Block.succeed(value + 2),
      )
      .onError(() => Block.fail(new TestError("error")));

    test("success", async () => {
      const actual = await chain.runAsync(2, {});
      expect(actual).toEqual({ success: true, value: 4 });
    });

    test("fail", async () => {
      const actual = await chain.runAsync(-2, {});
      expect(actual).toEqual({ success: false, error: new TestError("error") });
    });
  });

  describe("addData()", () => {
    const chain = Chain.prepare<number>()
      .onSuccess((value) =>
        value < 0 ? Block.fail(new TestError("error")) : Block.succeed(value),
      )
      .addData((value) => Block.succeed({ a: value - 2 }))
      .addData((value) =>
        value.a < 0
          ? Block.fail(new TestError("negative"))
          : Block.succeed({ b: value.a * 2 }),
      );

    test("success", async () => {
      const actual = await chain.runAsync(4, {});
      expect(actual).toEqual({ success: true, value: { a: 2, b: 4 } });
    });

    test("fail", async () => {
      const actual = await chain.runAsync(-2, {});
      expect(actual).toEqual({
        success: false,
        error: new TestError("error"),
      });
    });

    test("failing", async () => {
      const actual = await chain.runAsync(1, {});
      expect(actual).toEqual({
        success: false,
        error: new TestError("negative"),
      });
    });
  });
});
