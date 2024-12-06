import { Action } from "./Action";
import { PromisedResult, SuccessResult } from "./Result";

export class Node<Value, Err = never, Context = undefined> {
  public constructor(
    private readonly action: PromisedResult<Value, Err>,
    private readonly context: Context,
  ) {}

  public add<Output, OutputErr>(
    action: Action<Value, Err, Output, OutputErr, Context>,
  ) {
    return new Node(
      this.action.then((r) => action(r, this.context)),
      this.context,
    );
  }

  public withContext<NewContext extends object>(context: NewContext) {
    return new Node(this.action, context);
  }

  public removeContext() {
    return new Node(this.action, undefined);
  }

  public runAsync(): [Err] extends [never]
    ? Promise<SuccessResult<Value>>
    : PromisedResult<Value, Err> {
    // 'as' used as an hack as PromisedResult can't use conditional type
    return this.action as [Err] extends [never]
      ? Promise<SuccessResult<Value>>
      : PromisedResult<Value, Err>;
  }
}
