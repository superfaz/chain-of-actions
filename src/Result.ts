export interface SuccessResult<Data> {
  success: true;
  value: Data;
}

export interface FailureResult<Err extends Error> {
  success: false;
  error: Err;
}

export type Result<Data, Err extends Error = never> =
  | SuccessResult<Data>
  | FailureResult<Err>;

export type PromisedResult<Data, Err extends Error = never> = Promise<
  Result<Data, Err>
>;
