import { Action, DataAction, ErrorAction } from "./Action";
import Block from "./Block";
import { PromisedResult, SuccessResult } from "./Result";

export class Node<Value, Err extends Error = never> {
  constructor(private readonly node: PromisedResult<Value, Err>) {}

  public add<Output, OutputErr extends Error>(
    node: Action<Value, Output, Err, OutputErr>,
  ): Node<Output, OutputErr> {
    return new Node(this.node.then((r) => node(r)));
  }

  public onSuccess<Output, OutputErr extends Error>(
    callback: DataAction<Value, Output, OutputErr>,
  ): Node<Output, Err | OutputErr> {
    return this.add(
      (r) =>
        (r.success ? callback(r.value) : Block.fail(r.error)) as PromisedResult<
          Output,
          Err | OutputErr
        >,
    );
  }

  public onError<OutputErr extends Error = never>(
    callback: ErrorAction<Err, Value, OutputErr>,
  ): Node<Value, OutputErr> {
    return this.add((r) =>
      r.success ? Block.succeed(r.value) : callback(r.error),
    );
  }

  /**
   * Executes the node.
   *
   * @returns A `PromisedResult` linked to the execution of the node. Or a `SuccessResult` if `Err` is `never`.
   */
  public runAsync(): [Err] extends [never]
    ? Promise<SuccessResult<Value>>
    : PromisedResult<Value, Err> {
    // 'as' used as an hack as PromisedResult can't use conditional type
    return this.node as [Err] extends [never]
      ? Promise<SuccessResult<Value>>
      : PromisedResult<Value, Err>;
  }
}
