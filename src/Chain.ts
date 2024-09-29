import Block from "./Block";
import { DelayedRoot } from "./DelayedNode";
import { Node } from "./Node";

export function start(): Node<undefined>;
export function start<Data>(initial: Data): Node<Data>;
export function start<Data, Context>(
  initial: Data,
  context: Context,
): Node<Data, never, Context>;
export function start<Data, Context>(
  initial?: Data,
  context?: Context,
): Node<Data | undefined, never, Context | undefined> {
  return new Node(Block.succeed(initial), context);
}

export function prepare<
  Data,
  Context extends object = Record<string, never>,
>(): DelayedRoot<Data, Context> {
  return new DelayedRoot<Data, Context>();
}

export default { start, prepare };
