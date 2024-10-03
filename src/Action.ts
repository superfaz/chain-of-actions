import { PromisedResult, Result } from "./Result";

export interface Action<
  Input,
  Output,
  InputErr extends Error = never,
  OutputErr extends Error = never,
  Context = never,
> {
  (
    previous: Result<Input, InputErr>,
    context: Context,
  ): PromisedResult<Output, OutputErr>;
}

export interface DataAction<
  Input,
  Output,
  OutputErr extends Error = never,
  Context = never,
> {
  (data: Input, context: Context): PromisedResult<Output, OutputErr>;
}

export interface ErrorAction<
  InputErr extends Error,
  Output,
  OutputErr extends Error = never,
  Context = never,
> {
  (error: InputErr, context: Context): PromisedResult<Output, OutputErr>;
}
