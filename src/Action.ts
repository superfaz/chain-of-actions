import { PromisedResult, Result } from "./Result";

export interface Action<
  Input,
  Output,
  InputErr extends Error = never,
  OutputErr extends Error = never,
> {
  (previous: Result<Input, InputErr>): PromisedResult<Output, OutputErr>;
}

export interface DataAction<Input, Output, OutputErr extends Error = never> {
  (data: Input): PromisedResult<Output, OutputErr>;
}

export interface ErrorAction<
  InputErr extends Error,
  Output,
  OutputErr extends Error = never,
> {
  (error: InputErr): PromisedResult<Output, OutputErr>;
}

export interface ActionWithContext<
  Input extends object,
  Output,
  InputErr extends Error = never,
  OutputErr extends Error = never,
  Context extends object = Record<string, never>,
> {
  (
    previous: Result<Input, InputErr>,
    context: Context,
  ): PromisedResult<Output, OutputErr>;
}

export interface DataActionWithContext<
  Input extends object,
  Output,
  OutputErr extends Error = never,
  Context extends object = Record<string, never>,
> {
  (data: Input & Context): PromisedResult<Output, OutputErr>;
}

export interface ErrorActionWithContext<
  InputErr extends Error,
  Output,
  OutputErr extends Error = never,
  Context extends object = Record<string, never>,
> {
  (error: InputErr, context: Context): PromisedResult<Output, OutputErr>;
}
