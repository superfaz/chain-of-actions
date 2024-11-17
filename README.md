## Objective

This project aims to provide a typed error management for typescript code.

## The Problem

Typescript error management is based on the `try`/`catch` statements and this approach doesn't provide a strong-type management for error handling.

```typescript
try {
  const user = await getUser("id");
} catch (error: unknown) {
  // error can be here of any type
}
```

## Quick Start

A method like:

```typescript
async function getUser(id: number): Promise<User> {
  /* */
}
```

Can be replaced by:

```typescript
async function getUser(
  id: number,
): PromisedResult<User, DatabaseError | MissingDataError> {
  /* */
}
```

Calling this method will return two possible results:

- `{success: true, value: {...}}` - A success result, where `value` will be a **User** instance
- `{success: false, error: {...}}` - a failed result, where `error` will be a **DatabaseError | MissingDataError** instance.

> [!NOTE]
> This approach ensures that the possible errors are typed and forces to manage them as the caller will have to check the `success` property.

A simple implementation using this approach would be the following:

```typescript
async function getUser(
  id: number,
): PromisedResult<User, DatabaseError | MissingDataError> {
  try {
    // Retrieve the user - mock a normal call to a datasource handler.
    const user = database.get("User", id);
    if (!user) {
      // Raise a typed error as the user doesn't exist
      return fail(new MissingDataError("User", id));
    } else {
      // Success result
      return success(user);
    }
  } catch (e: unknown) {
    // Raise a typed error as the datasource raises an error.
    return fail(new DatabaseError(e));
  }
}
```

| Helpers     | Explanation                  |
| ----------- | ---------------------------- |
| `succeed()` | Create a successful response |
| `fail()`    | Create a failed response     |

To implement this method, we can use a few helpers, namely `start`, `convert`, `succeed` and `fail` :

## Chain of Actions

Knowning if an action failed or not allows to chain actions based on their statuses. For this, this library provides a `start` function to create a chain of actions.

```typescript
async function getUser(
  id: number,
): PromisedResult<User, DatabaseError | MissingDataError> {
  return start()
    .add(() =>
      convert({
        try: () => database.get("User", id),
        catch: (e) => new DatabaseError(e),
      }),
    )
    .onSuccess((user) =>
      user ? succeed(user) : fail(new MissingDataError("User", id)),
    );
}
```

| Helpers              | Explanation                                                               |
| -------------------- | ------------------------------------------------------------------------- |
| `start()`            | starts a chain of actions with a specific data                            |
| `.add(action)`       | adds a new node to the chain                                              |
| `.onSuccess(action)` | adds a new node that will execute its action if the previous node succeed |
| `convert(fct, err)`  | Convert a standard `Promise` call to a `PromisedResult`                   |

> [!NOTE]
> This example can still be improved: the current implementation uses a `database` object : Where is it initialized? How are the error managed for it?

## Architecture

This library is based on the [Railway design pattern](https://blog.logrocket.com/what-is-railway-oriented-programming/).

Railway Oriented Programming is based on the metaphor of a railway track, where operations can either **succeed** (the "right track") or **fail** (the "wrong track"). The idea is to structure the code in such a way that successful operations continue down one path, while failures are handled separately, allowing for a clean separation of concerns.

In this library, we consider that three tracks should exist as our operations can either **succeed** (the "right track"), **raise an error** (the "error track") or endure an **unexpected failure** (the "failure track").

For instance, a call to an operation like `getUser(id)` could:

- **succeed** and return a `User` instance,
- **raise an error** when the id doesn't exist in the database or if the connection is not available,
- **failed unexpectingly** if the server run out of memory during the operation.

To achieve this, the library proposes the following result types:

- `SuccessResult<Data>` - represents the successful result of an operation
- `FailureResult<Error>` - represents the error raised by an operation
- `Result<Data, Error>` - the union of `SuccessResult` and `FailureResult`
- `PromisedResult<Data, Error>` - a `Promise` returning a `Result`

All those types don't contain methods and remain data type that can be serialized (to be usable as part of RPC flow for instance).

The notion of "Railway" is splited into 3 core concepts:

- The `Action`, a function that executes a process based on a specific data and context and returns a `PromisedResult`.
- The `Node` that encapsulates an action to provides extra methods.
- The `Chain` that groups various nodes to provide a service.
