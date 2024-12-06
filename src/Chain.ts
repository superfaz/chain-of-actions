import { Action, ValueAction } from "./Action";
import { fail, succeed } from "./Block";
import { Node } from "./Node";
import { PromisedResult } from "./Result";

export function start(): Node<undefined> {
  return new Node(succeed(undefined), undefined);
}

export function onSuccess<Input, InputErr, Output, OutputErr, Context>(
  successAction: ValueAction<Input, Output, OutputErr, Context>,
): Action<Input, InputErr, Output, InputErr | OutputErr, Context> {
  return (previous, context) => {
    if (previous.success) {
      return successAction(previous.value, context);
    }
    return fail(previous.error);
  };
}

export function passThrough<Input, InputErr, OutputErr, Context>(
  passThroughAction: ValueAction<Input, void, OutputErr, Context>,
): Action<Input, InputErr, Input, InputErr | OutputErr, Context> {
  return async (previous, context) => {
    if (previous.success) {
      const result = await passThroughAction(previous.value, context);
      if (result.success) {
        return succeed(previous.value);
      }
      return fail(result.error);
    }
    return fail(previous.error);
  };
}

export function onError<Input, InputErr, OutputErr, Context>(
  failureAction: (
    error: InputErr,
    context: Context,
  ) => PromisedResult<never, OutputErr> | PromisedResult<Input, OutputErr>,
): Action<Input, InputErr, Input, OutputErr, Context> {
  return (previous, context) => {
    if (previous.success) {
      return succeed(previous.value);
    }
    return failureAction(previous.error, context);
  };
}
