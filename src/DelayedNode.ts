import { Block } from "./Block";
import { PromisedResult, Result } from "./Result";

interface IDelayedNode<Start, Context extends object, Data, Err extends Error> {
  runAsync(start: Start, context: Context): PromisedResult<Data, Err>;
}

abstract class BaseDelayedNode<
  Start,
  Context extends object,
  Data,
  Err extends Error,
> implements IDelayedNode<Start, Context, Data, Err>
{
  public add<DataB, ErrB extends Error>(
    node: (
      previous: Result<Data, Err>,
      context: Context,
    ) => PromisedResult<DataB, ErrB>,
  ): DelayedNode<Start, Context, DataB, ErrB, Data, Err> {
    return new DelayedNode(node, this);
  }

  public onSuccess<DataB, ErrB extends Error>(
    callback: (data: Data, context: Context) => PromisedResult<DataB, ErrB>,
  ): DelayedNode<Start, Context, DataB, Err | ErrB, Data, Err> {
    return this.add(
      (r, c) =>
        (r.success
          ? callback(r.data, c)
          : Block.fail(r.error)) as PromisedResult<DataB, Err | ErrB>,
    );
  }

  public onError<DataB, ErrB extends Error>(
    callback: (error: Err, context: Context) => PromisedResult<DataB, ErrB>,
  ): DelayedNode<Start, Context, DataB, Err | ErrB, Data, Err> {
    return this.add(
      (r, c) =>
        (r.success
          ? Block.succeed(r.data)
          : callback(r.error, c)) as PromisedResult<DataB, Err | ErrB>,
    );
  }

  public addData<DataB, ErrB extends Error>(
    callback: (data: Data, context: Context) => PromisedResult<DataB, ErrB>,
  ): DelayedNode<Start, Context, Data & DataB, Err | ErrB, Data, Err> {
    return this.add((r, c) => {
      if (r.success) {
        return callback(r.data, c).then(
          (s) =>
            (s.success
              ? Block.succeed({ ...r.data, ...s.data })
              : Block.fail(s.error)) as PromisedResult<
              Data & DataB,
              Err | ErrB
            >,
        );
      } else {
        return Block.fail(r.error);
      }
    });
  }

  abstract runAsync(start: Start, context: Context): PromisedResult<Data, Err>;
}

export class DelayedNode<
    Start,
    Context extends object,
    Data,
    Err extends Error,
    PreviousData,
    PreviousErr extends Error,
  >
  extends BaseDelayedNode<Start, Context, Data, Err>
  implements IDelayedNode<Start, Context, Data, PreviousErr | Err>
{
  constructor(
    private readonly node: (
      result: Result<PreviousData, PreviousErr>,
      context: Context,
    ) => PromisedResult<Data, Err>,
    private readonly previous: IDelayedNode<
      Start,
      Context,
      PreviousData,
      PreviousErr
    >,
  ) {
    super();
  }

  public runAsync(start: Start, context: Context): PromisedResult<Data, Err> {
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
  ): PromisedResult<Start, never> {
    return Block.succeed(start);
  }
}
