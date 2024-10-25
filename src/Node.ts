import { Action, ErrorAction, DataAction } from "./Action";
import Block from "./Block";
import { PromisedResult } from "./Result";

export class Node<Value, Err extends Error = never, Context = never> {
  constructor(
    private readonly node: PromisedResult<Value, Err>,
    private readonly context: Context,
  ) {}

  public add<Output, OutputErr extends Error>(
    node: Action<Value, Output, Err, OutputErr, Context>,
  ): Node<Output, OutputErr, Context> {
    return new Node(
      this.node.then((r) => node(r, this.context)),
      this.context,
    );
  }

  public onSuccess<Output, OutputErr extends Error>(
    callback: DataAction<Value, Output, OutputErr, Context>,
  ): Node<Output, Err | OutputErr, Context> {
    return this.add(
      (r) =>
        (r.success
          ? callback(r.value, this.context)
          : Block.fail(r.error)) as PromisedResult<Output, Err | OutputErr>,
    );
  }

  public onError<OutputErr extends Error = never>(
    callback: ErrorAction<Err, Value, OutputErr, Context>,
  ): Node<Value, OutputErr, Context> {
    return this.add((r) =>
      r.success ? Block.succeed(r.value) : callback(r.error, this.context),
    );
  }

  public addData<Output, OutputErr extends Error>(
    callback: DataAction<Value, Output, OutputErr, Context>,
  ): Node<Value & Output, Err | OutputErr, Context> {
    return this.add((r) => {
      if (r.success) {
        return callback(r.value, this.context).then(
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

  public addContext<ContextB>(
    extra: ContextB,
  ): Node<
    Value,
    Err,
    [Context] extends [never] ? ContextB : Context & ContextB
  > {
    return new Node(this.node, { ...this.context, ...extra });
  }

  public runAsync(): PromisedResult<Value, Err> {
    return this.node;
  }
}
