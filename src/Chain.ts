import { Block } from "./Block";
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
}
