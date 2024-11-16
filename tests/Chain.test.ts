import { describe, expect, test } from "vitest";
import Chain from "../src/Chain";
import { Node } from "../src/Node";
import { PromisedResult } from "../src/Result";
import { succeed } from "../src/Block";

describe("Chain", () => {
  describe("start", () => {
    test("()", async () => {
      const node = Chain.start();
      expect(node).toBeInstanceOf(Node);

      const actual: PromisedResult<undefined> = node.runAsync();
      const awaited = await actual;
      expect(awaited).toEqual({ success: true });
    });

    test("(context)", async () => {
      const initialData = { key: "value" };
      const context = { user: "testUser" };

      const firstNode = Chain.start(context);
      const first: PromisedResult<undefined> = firstNode.runAsync();
      expect(await first).toEqual({ success: true });

      const secondNode = firstNode.onSuccess(() => succeed(initialData));
      const second: PromisedResult<{ key: string }> = secondNode.runAsync();
      expect(await second).toEqual({ success: true, value: initialData });
    });
  });
});
