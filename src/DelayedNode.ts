import Block from "./Block";
import { PromisedResult, Result } from "./Result";

interface IDelayedNode<
  Start,
  Context extends object,
  Output,
  Err extends Error,
> {
  runAsync(initial: Start, context: Context): PromisedResult<Output, Err>;
}

abstract class BaseDelayedNode<
  Start,
  Context extends object,
  Output,
  Err extends Error,
> implements IDelayedNode<Start, Context, Output, Err>
{
  public add<DataB, ErrB extends Error>(
    node: (
      previous: Result<Output, Err>,
      context: Context,
    ) => PromisedResult<DataB, ErrB>,
  ): DelayedNode<Start, Context, DataB, ErrB, Output, Err> {
    return new DelayedNode(node, this);
  }

  public onSuccess<DataB, ErrB extends Error>(
    callback: (data: Output, context: Context) => PromisedResult<DataB, ErrB>,
  ): DelayedNode<Start, Context, DataB, Err | ErrB, Output, Err> {
    return this.add(
      (r, c) =>
        (r.success
          ? callback(r.value, c)
          : Block.fail(r.error)) as PromisedResult<DataB, Err | ErrB>,
    );
  }

  public onError<DataB, ErrB extends Error>(
    callback: (error: Err, context: Context) => PromisedResult<DataB, ErrB>,
  ): DelayedNode<Start, Context, DataB, Err | ErrB, Output, Err> {
    return this.add(
      (r, c) =>
        (r.success
          ? Block.succeed(r.value)
          : callback(r.error, c)) as PromisedResult<DataB, Err | ErrB>,
    );
  }

  public addData<DataB, ErrB extends Error>(
    callback: (data: Output, context: Context) => PromisedResult<DataB, ErrB>,
  ): DelayedNode<Start, Context, Output & DataB, Err | ErrB, Output, Err> {
    return this.add((r, c) => {
      if (r.success) {
        return callback(r.value, c).then(
          (s) =>
            (s.success
              ? Block.succeed({ ...r.value, ...s.value })
              : Block.fail(s.error)) as PromisedResult<
              Output & DataB,
              Err | ErrB
            >,
        );
      } else {
        return Block.fail(r.error);
      }
    });
  }

  abstract runAsync(
    start: Start,
    context: Context,
  ): PromisedResult<Output, Err>;
}

export class DelayedNode<
    Start,
    Context extends object,
    Output,
    Err extends Error,
    PreviousData,
    PreviousErr extends Error,
  >
  extends BaseDelayedNode<Start, Context, Output, Err>
  implements IDelayedNode<Start, Context, Output, PreviousErr | Err>
{
  constructor(
    private readonly node: (
      result: Result<PreviousData, PreviousErr>,
      context: Context,
    ) => PromisedResult<Output, Err>,
    private readonly previous: IDelayedNode<
      Start,
      Context,
      PreviousData,
      PreviousErr
    >,
  ) {
    super();
  }

  public runAsync(start: Start, context: Context): PromisedResult<Output, Err> {
    return this.previous
      .runAsync(start, context)
      .then((result) => this.node(result, context));
  }
}

export class DelayedRoot<Start, Context extends object>
  extends BaseDelayedNode<Start, Context, Start, never>
  implements IDelayedNode<Start, Context, Start, never>
{
  public runAsync(
    start: Start,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: Context,
  ): PromisedResult<Start> {
    return Block.succeed(start);
  }
}
