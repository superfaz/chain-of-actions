import Block from "./Block";
import { DelayedRoot } from "./DelayedNode";
import { Node } from "./Node";
import { NodeWithContext } from "./NodeWithContext";

export function start(): Node<undefined>;
export function start<Context extends object>(
  context: Context,
): NodeWithContext<object, never, Context>;
export function start<Context extends object>(
  context?: Context,
): Node<undefined> | NodeWithContext<object, never, Context> {
  if (context === undefined) {
    return new Node(Block.succeed(undefined));
  } else {
    return new NodeWithContext(Block.succeed({}), context);
  }
}

export function prepare<
  Value,
  Context extends object = Record<string, never>,
>(): DelayedRoot<Value, Context> {
  return new DelayedRoot<Value, Context>();
}

export default { start, prepare };
