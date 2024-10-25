import Block from "./Block";
import { DelayedRoot } from "./DelayedNode";
import { Node } from "./Node";

export function start(): Node<undefined>;
export function start<Value>(initial: Value): Node<Value>;
export function start<Value, Context>(
  initial: Value,
  context: Context,
): Node<Value, never, Context>;
export function start<Data, Context>(
  initial?: Data,
  context?: Context,
): Node<Data | undefined, never, Context | undefined> {
  return new Node(Block.succeed(initial), context);
}

export function prepare<
  Value,
  Context extends object = Record<string, never>,
>(): DelayedRoot<Value, Context> {
  return new DelayedRoot<Value, Context>();
}

export default { start, prepare };
