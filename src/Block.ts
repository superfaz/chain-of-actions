import { PromisedResult } from "./Result";

export function succeed<Data>(result: Data): PromisedResult<Data> {
  return Promise.resolve({ success: true, data: result });
}

export function fail<Err extends Error>(
  error: Err,
): PromisedResult<never, Err> {
  return Promise.resolve({ success: false, error });
}

export async function convert<Data, Err extends Error>(pair: {
  try: () => Promise<Data>;
  catch: (e: unknown) => Err | Promise<Err>;
}): PromisedResult<Data, Err> {
  try {
    const result = await pair.try();
    return await succeed(result);
  } catch (e) {
    const result = await pair.catch(e);
    return await fail(result);
  }
}

export default { succeed, fail, convert };
