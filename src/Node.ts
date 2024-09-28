import { Block } from "./Block";
import { PromisedResult, Result } from "./Result";

export class Node<Data, Err extends Error = never, Context = never> {
  constructor(
    private readonly node: PromisedResult<Data, Err>,
    private readonly context: Context,
  ) {}

  public add<DataB, ErrB extends Error>(
    node: (
      result: Result<Data, Err>,
      context: Context,
    ) => PromisedResult<DataB, ErrB>,
  ): Node<DataB, Err | ErrB, Context> {
    return new Node(
      this.node.then((r) => node(r, this.context)),
      this.context,
    );
  }

  public onSuccess<DataB, ErrB extends Error>(
    callback: (data: Data, context: Context) => PromisedResult<DataB, ErrB>,
  ): Node<DataB, Err | ErrB, Context> {
    return this.add(
      (r) =>
        (r.success
          ? callback(r.data, this.context)
          : Block.fail(r.error)) as PromisedResult<DataB, Err | ErrB>,
    );
  }

  public onError<DataB, ErrB extends Error>(
    callback: (error: Err, context: Context) => PromisedResult<DataB, ErrB>,
  ): Node<DataB, Err | ErrB, Context> {
    return this.add(
      (r) =>
        (r.success
          ? Block.succeed(r.data)
          : callback(r.error, this.context)) as PromisedResult<
          DataB,
          Err | ErrB
        >,
    );
  }

  public addData<DataB, ErrB extends Error>(
    callback: (data: Data, context: Context) => PromisedResult<DataB, ErrB>,
  ): Node<Data & DataB, Err | ErrB, Context> {
    return this.add((r) => {
      if (r.success) {
        return callback(r.data, this.context).then(
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
