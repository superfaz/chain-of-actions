import { Action, ValueAction } from "./Action";
import { fail, succeed } from "./Block";
import { onSuccess, passThrough } from "./Chain";
import { PromisedResult } from "./Result";

export function addData<
  Input extends object,
  InputErr,
  Data extends object,
  OutputErr,
  Context,
>(
  dataAction: ValueAction<Input, Data, OutputErr, Context>,
): Action<Input, InputErr, Input & Data, InputErr | OutputErr, Context> {
  return async (previous, context) => {
    if (previous.success) {
      const result = await dataAction(previous.value, context);
      if (result.success) {
        return succeed({ ...previous.value, ...result.value });
      }
      return fail(result.error);
    }
    return fail(previous.error);
  };
}

export function group<
  Input extends object,
  InputErr,
  Output,
  OutputErr,
  Context extends object,
>(
  groupedAction: (input: Input & Context) => PromisedResult<Output, OutputErr>,
): ValueAction<Input, Output, InputErr | OutputErr, Context> {
  return (previous, context) => {
    return groupedAction({ ...previous, ...context });
  };
}

export function onSuccessGroup<
  Input extends object,
  InputErr,
  Output,
  OutputErr,
  Context extends object,
>(
  successAction: (input: Input & Context) => PromisedResult<Output, OutputErr>,
): Action<Input, InputErr, Output, InputErr | OutputErr, Context> {
  return onSuccess(group(successAction));
}

export function passThroughGroup<
  Input extends object,
  InputErr,
  OutputErr,
  Context extends object,
>(
  passThroughAction: (
    input: Input & Context,
  ) => PromisedResult<void, OutputErr>,
): Action<Input, InputErr, Input, InputErr | OutputErr, Context> {
  return passThrough(group(passThroughAction));
}

export function addDataGroup<
  Input extends object,
  InputErr,
  Data extends object,
  OutputErr,
  Context extends object,
>(
  dataAction: (input: Input & Context) => PromisedResult<Data, OutputErr>,
): Action<Input, InputErr, Input & Data, InputErr | OutputErr, Context> {
  return addData(group(dataAction));
}

group.onSuccess = onSuccessGroup;
group.passThrough = passThroughGroup;
group.addData = addDataGroup;
