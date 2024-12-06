import { PromisedResult, Result } from "./Result";

export interface Action<Input, InputErr, Output, OutputErr, Context> {
  (
    previous: Result<Input, InputErr>,
    context: Context,
  ): PromisedResult<Output, OutputErr>;
}

export interface ValueAction<Input, Output, OutputErr, Context> {
  (value: Input, context: Context): PromisedResult<Output, OutputErr>;
}
