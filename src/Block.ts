import { PromisedResult } from "./Result";

/**
 * Returns a successful result with the given value.
 * @param value The value to be wrapped in a successful result.
 * @returns A successful result with the given value.
 * @template Value The type of the value.
 */
export function succeed(): PromisedResult<undefined>;
export function succeed<Value>(value: Value): PromisedResult<Value>;
export function succeed<Value>(
  value?: Value,
): PromisedResult<Value | undefined> {
  if (value === undefined) {
    return Promise.resolve({ success: true, value: undefined });
  } else {
    return Promise.resolve({ success: true, value });
  }
}

/**
 * Returns a failed result with the given error.
 * @param error The error to be wrapped in a failed result.
 * @returns A failed result with the given error.
 * @template Err The type of the error.
 */
export function fail<Err>(error: Err): PromisedResult<never, Err> {
  return Promise.resolve({ success: false, error });
}

/**
 * Converts a `Promise` instance into a promised result.
 * @param pair The pair of try and catch functions.
 * @returns A promised result.
 * @template Value The type of the value.
 * @template Err The type of the error.
 */
export async function convert<Value, Err>(pair: {
  try: () => Promise<Value>;
  catch: (e: unknown) => Err | Promise<Err>;
}): PromisedResult<Value, Err> {
  try {
    const result = await pair.try();
    return await succeed(result);
  } catch (e) {
    const result = await pair.catch(e);
    return await fail(result);
  }
}
