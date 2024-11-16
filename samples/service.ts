/**
 * Demonstrate how to use chain-of-actions to prepare services and execute actions.
 */

import { fail, prepare, PromisedResult, start, succeed } from "../src";

/**
 * Mocks process.env for the sample.
 */
const process = {
  env: {
    DATABASE_URL: "postgres://localhost:5432",
  },
};

/**
 * Mocks HttpResponse for the sample.
 */
class HttpResponse {
  constructor(
    public readonly status: number,
    public readonly body?: string,
  ) {}
}

/**
 * Mocks a custom DatabaseClient that use chain-of-actions.
 */
class DatabaseClient {
  constructor(public readonly url: string) {}

  getUser(id: string): PromisedResult<User, MissingDataError> {
    return id === "alice"
      ? succeed({ id: "alice", name: "Alice" })
      : fail(new MissingDataError("User", id));
  }
}

/**
 * Represents an error raised when a configuration is missing.
 */
class ConfigurationMissingError extends Error {
  constructor(public readonly missingField: string) {
    super(`Configuration missing: ${missingField}`);
  }
}

/**
 * Represents an error raised when a requested data is missing.
 */
class MissingDataError extends Error {
  constructor(
    public readonly entity: string,
    public readonly id: string,
  ) {
    super(`Missing data: ${entity} with id ${id}`);
  }
}

/**
 * Represents the configuration of the service.
 */
interface Configuration {
  databaseUrl: string;
}

/**
 * Represents the context of the service.
 */
interface Context {
  database: DatabaseClient;
}

/**
 * Represents a user model.
 */
interface User {
  id: string;
  name: string;
}

/**
 * Loads the configuration from the environment.
 */
function loadConfiguration(): PromisedResult<
  Configuration,
  ConfigurationMissingError
> {
  const config = prepare().addData(() =>
    process.env.DATABASE_URL
      ? succeed({ databaseUrl: process.env.DATABASE_URL })
      : fail(new ConfigurationMissingError("DATABASE_URL")),
  );

  return config.runAsync(undefined, {});
}

/**
 * Creates the context from the configuration.
 */
function createContext(configuration: Configuration): PromisedResult<Context> {
  const context = prepare<undefined, Configuration>().addData(
    (_, configuration) =>
      succeed({
        database: new DatabaseClient(configuration.databaseUrl),
      }),
  );

  return context.runAsync(undefined, configuration);
}

/**
 * Simulates the composition of an api using chain-of-actions.
 */
export async function apiLike() {
  const configuration = await loadConfiguration();
  if (!configuration.success) {
    console.error(configuration.error.message);
    return new HttpResponse(500);
  }

  const context = await createContext(configuration.value);
  if (!context.success) {
    console.error("Unexpected error while preparing context", context.error);
    return new HttpResponse(500);
  }

  const user = await start(context.value)
    .onSuccess(() => succeed("alice"))
    .onSuccess((id, { database }) => database.getUser(id))
    .runAsync();

  if (!user.success) {
    return new HttpResponse(404, "User not found");
  }

  return new HttpResponse(200, JSON.stringify(user.value));
}
