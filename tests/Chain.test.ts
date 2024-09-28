import { describe, expect, test } from "vitest";
import { Chain } from "../src/Chain";
import { Node } from "../src/Node";
import { PromisedResult } from "../src/Result";

describe("Chain", () => {
  describe("start", () => {
    test("()", async () => {
      const node = Chain.start();
      expect(node).toBeInstanceOf(Node);

      const actual: PromisedResult<undefined> = node.runAsync();
      const awaited = await actual;
      expect(awaited).toEqual({ success: true });
    });

    test("(initialData)", async () => {
      const initialData = { key: "value" };
      const node = Chain.start(initialData);

      const actual: PromisedResult<{ key: string }> = node.runAsync();
      const awaited = await actual;
      expect(awaited).toEqual({ success: true, data: initialData });
    });

    test("(initialData, context)", async () => {
      const initialData = { key: "value" };
      const context = { user: "testUser" };
      const node = Chain.start(initialData, context);

      const actual: PromisedResult<{ key: string }> = node.runAsync();
      const awaited = await actual;
      expect(awaited).toEqual({ success: true, data: initialData });
    });
  });
});
