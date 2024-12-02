interface SuccessResult<Value> {
  success: true;
  value: Value;
}

interface FailureResult<Err> {
  success: false;
  error: Err;
}

type Result<Value, Err = never> = SuccessResult<Value> | FailureResult<Err>;

type PromisedResult<Value, Err = never> = Promise<Result<Value, Err>>;

interface Action<Input, InputErr, Output, OutputErr, Context> {
  (
    previous: Result<Input, InputErr>,
    context: Context,
  ): PromisedResult<Output, OutputErr>;
}

interface ValueAction<Input, Output, OutputErr, Context> {
  (value: Input, context: Context): PromisedResult<Output, OutputErr>;
}

export function succeed<Value>(value: Value): PromisedResult<Value> {
  return Promise.resolve({ success: true, value });
}

export function fail<Err>(error: Err): PromisedResult<never, Err> {
  return Promise.resolve({ success: false, error });
}

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

  public withContext<NewContext>(context: NewContext) {
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

export function onError<Input, InputErr, OutputErr, Context>(
  failureAction: (
    error: InputErr,
    context?: Context,
  ) => PromisedResult<Input, OutputErr>,
): Action<Input, InputErr, Input, OutputErr, Context> {
  return (previous, context) => {
    if (previous.success) {
      return succeed(previous.value);
    }
    return failureAction(previous.error, context);
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

export function addData<
  Input extends Record<string, unknown>,
  InputErr,
  Data extends Record<string, unknown>,
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
  Input extends Record<string, unknown>,
  InputErr,
  Output,
  OutputErr,
  Context extends Record<string, unknown>,
>(
  groupedAction: (input: Input & Context) => PromisedResult<Output, OutputErr>,
): ValueAction<Input, Output, InputErr | OutputErr, Context> {
  return (previous, context) => {
    return groupedAction({ ...previous, ...context });
  };
}

export function onSuccessGroup<
  Input extends Record<string, unknown>,
  InputErr,
  Output,
  OutputErr,
  Context extends Record<string, unknown>,
>(
  successAction: (
    input: Record<string, unknown>,
  ) => PromisedResult<Output, OutputErr>,
): Action<Input, InputErr, Output, InputErr | OutputErr, Context> {
  return onSuccess(group(successAction));
}

export function passThroughGroup<
  Input extends Record<string, unknown>,
  InputErr,
  OutputErr,
  Context extends Record<string, unknown>,
>(
  passThroughAction: (
    input: Record<string, unknown>,
  ) => PromisedResult<void, OutputErr>,
): Action<Input, InputErr, Input, InputErr | OutputErr, Context> {
  return passThrough(group(passThroughAction));
}

export function addDataGroup<
  Input extends Record<string, unknown>,
  InputErr,
  Data extends Record<string, unknown>,
  OutputErr,
  Context extends Record<string, unknown>,
>(
  dataAction: (
    input: Record<string, unknown>,
  ) => PromisedResult<Data, OutputErr>,
): Action<Input, InputErr, Input & Data, InputErr | OutputErr, Context> {
  return addData(group(dataAction));
}

group.onSuccess = onSuccessGroup;
group.passThrough = passThroughGroup;
group.addData = addDataGroup;
