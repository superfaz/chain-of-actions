import { PromisedResult } from "./Result";

export function succeed<Value>(value: Value): PromisedResult<Value> {
  return Promise.resolve({ success: true, value });
}

export function fail<Err extends Error>(
  error: Err,
): PromisedResult<never, Err> {
  return Promise.resolve({ success: false, error });
}

export async function convert<Value, Err extends Error>(pair: {
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

export default { succeed, fail, convert };
