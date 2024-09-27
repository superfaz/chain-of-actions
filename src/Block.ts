import { PromisedResult } from "./Result";

export class Block {
  static async succeed<Data>(result: Data): PromisedResult<Data, never> {
    return { success: true, data: result };
  }

  static async fail<Err extends Error>(error: Err): PromisedResult<never, Err> {
    return { success: false, error };
  }
}
