import Block from "./Block";
import { DelayedRoot } from "./DelayedNode";
import { Node } from "./Node";
import { NodeWithContext } from "./NodeWithContext";

export type Empty = Record<string, never>;

export const empty: Empty = {};

export function start(): Node<undefined>;
export function start<Context extends object>(
  context: Context,
): NodeWithContext<Empty, never, Context>;
export function start<Context extends object>(
  context?: Context,
): Node<undefined> | NodeWithContext<Empty, never, Context> {
  if (context === undefined) {
    return new Node(Block.succeed(undefined));
  } else {
    return new NodeWithContext(Block.succeed(empty), context);
  }
}

export function prepare<
  Value,
  Context extends object = Record<string, never>,
>(): DelayedRoot<Value, Context> {
  return new DelayedRoot<Value, Context>();
}

export default { start, prepare };
