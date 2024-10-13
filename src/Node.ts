import { Action, ErrorAction, DataAction } from "./Action";
import Block from "./Block";
import { PromisedResult } from "./Result";

export class Node<Data, Err extends Error = never, Context = never> {
  constructor(
    private readonly node: PromisedResult<Data, Err>,
    private readonly context: Context,
  ) {}

  public add<Output, OutputErr extends Error>(
    node: Action<Data, Output, Err, OutputErr, Context>,
  ): Node<Output, OutputErr, Context> {
    return new Node(
      this.node.then((r) => node(r, this.context)),
      this.context,
    );
  }

  public onSuccess<Output, OutputErr extends Error>(
    callback: DataAction<Data, Output, OutputErr, Context>,
  ): Node<Output, Err | OutputErr, Context> {
    return this.add(
      (r) =>
        (r.success
          ? callback(r.data, this.context)
          : Block.fail(r.error)) as PromisedResult<Output, Err | OutputErr>,
    );
  }

  public onError<OutputErr extends Error = never>(
    callback: ErrorAction<Err, Data, OutputErr, Context>,
  ): Node<Data, OutputErr, Context> {
    return this.add((r) =>
      r.success ? Block.succeed(r.data) : callback(r.error, this.context),
    );
  }

  public addData<Output, OutputErr extends Error>(
    callback: DataAction<Data, Output, OutputErr, Context>,
  ): Node<Data & Output, Err | OutputErr, Context> {
    return this.add((r) => {
      if (r.success) {
        return callback(r.data, this.context).then(
          (s) =>
            (s.success
              ? Block.succeed({ ...r.data, ...s.data })
              : Block.fail(s.error)) as PromisedResult<
              Data & Output,
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
    Data,
    Err,
    [Context] extends [never] ? ContextB : Context & ContextB
  > {
    return new Node(this.node, { ...this.context, ...extra });
  }

  public runAsync(): PromisedResult<Data, Err> {
    return this.node;
  }
}
