import {
  ActionWithContext,
  DataActionWithContext,
  ErrorActionWithContext,
} from "./Action";
import Block from "./Block";
import { PromisedResult, SuccessResult } from "./Result";

export class NodeWithContext<
  Value extends object,
  Err extends Error = never,
  Context extends object = Record<string, never>,
> {
  constructor(
    private readonly node: PromisedResult<Value, Err>,
    private readonly context: Context,
  ) {}

  public add<Output extends object, OutputErr extends Error>(
    node: ActionWithContext<Value, Output, Err, OutputErr, Context>,
  ): NodeWithContext<Output, OutputErr, Context> {
    return new NodeWithContext(
      this.node.then((r) => node(r, this.context)),
      this.context,
    );
  }

  public onSuccess<Output extends object, OutputErr extends Error>(
    callback: DataActionWithContext<Value, Output, OutputErr, Context>,
  ): NodeWithContext<Output, Err | OutputErr, Context> {
    return this.add(
      (r) =>
        (r.success
          ? callback({ ...r.value, ...this.context })
          : Block.fail(r.error)) as PromisedResult<Output, Err | OutputErr>,
    );
  }

  public onError<OutputErr extends Error = never>(
    callback: ErrorActionWithContext<Err, Value, OutputErr, Context>,
  ): NodeWithContext<Value, OutputErr, Context> {
    return this.add((r) =>
      r.success ? Block.succeed(r.value) : callback(r.error, this.context),
    );
  }

  public addData<Output, OutputErr extends Error>(
    callback: DataActionWithContext<Value, Output, OutputErr, Context>,
  ): NodeWithContext<Value & Output, Err | OutputErr, Context> {
    return this.add((r) => {
      if (r.success) {
        return callback({ ...r.value, ...this.context }).then(
          (s) =>
            (s.success
              ? Block.succeed({ ...r.value, ...s.value })
              : Block.fail(s.error)) as PromisedResult<
              Value & Output,
              Err | OutputErr
            >,
        );
      } else {
        return Block.fail(r.error);
      }
    });
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
