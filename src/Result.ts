/**
 * A Result type that represents the result of an operation succeed.
 */
export interface SuccessResult<Value> {
  success: true;
  value: Value;
}

/**
 * A Result type that represents the result of an operation failed.
 */
export interface FailureResult<Err> {
  success: false;
  error: Err;
}

/**
 * A Result type that represents the result of an operation that can succeed or failed.
 */
export type Result<Value, Err = never> =
  | SuccessResult<Value>
  | FailureResult<Err>;

/**
 * A Promise that resolves to a typed `Result` for both success and failure.
 */
export type PromisedResult<Value, Err = never> = Promise<Result<Value, Err>>;
