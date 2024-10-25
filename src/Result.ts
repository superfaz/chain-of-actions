export interface SuccessResult<Value> {
  success: true;
  value: Value;
}

export interface FailureResult<Err extends Error> {
  success: false;
  error: Err;
}

export type Result<Value, Err extends Error = never> =
  | SuccessResult<Value>
  | FailureResult<Err>;

export type PromisedResult<Value, Err extends Error = never> = Promise<
  Result<Value, Err>
>;
