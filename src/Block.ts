import { PromisedResult } from "./Result";

export class Block {
  static async succeed<Data>(result: Data): PromisedResult<Data, never> {
    return { success: true, data: result };
  }

  static async fail<Err extends Error>(error: Err): PromisedResult<never, Err> {
    return { success: false, error };
  }

  static async convert<Data, Err extends Error>(pair: {
    try: () => Promise<Data>;
    catch: (e: unknown) => Err | Promise<Err>;
  }): PromisedResult<Data, Err> {
    try {
      const result = await pair.try();
      return Block.succeed(result);
    } catch (e) {
      const result = await pair.catch(e);
      return Block.fail(result);
    }
  }
}
