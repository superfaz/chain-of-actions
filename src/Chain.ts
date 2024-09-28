import { Block } from "./Block";
import { DelayedRoot } from "./DelayedNode";
import { Node } from "./Node";

export class Chain {
  static start(): Node<undefined, never, never>;
  static start<Data>(initial: Data): Node<Data, never, never>;
  static start<Data, Context>(
    initial: Data,
    context: Context,
  ): Node<Data, never, Context>;
  static start<Data, Context>(
    initial?: Data,
    context?: Context,
  ): Node<Data | undefined, never, Context | undefined> {
    return new Node(Block.succeed(initial), context);
  }

  static prepare<
    Data,
    Context extends object = Record<string, never>,
  >(): DelayedRoot<Data, Context> {
    return new DelayedRoot<Data, Context>();
  }
}
