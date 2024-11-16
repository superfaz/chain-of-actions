import Block from "./Block";
import { DelayedRoot } from "./DelayedNode";
import { Node } from "./Node";

export function start(): Node<undefined>;
export function start<Context>(
  context: Context,
): Node<undefined, never, Context>;
export function start<Context>(
  context?: Context,
): Node<undefined, never, Context | undefined> {
  return new Node(Block.succeed(undefined), context);
}

export function prepare<
  Value,
  Context extends object = Record<string, never>,
>(): DelayedRoot<Value, Context> {
  return new DelayedRoot<Value, Context>();
}

export default { start, prepare };
