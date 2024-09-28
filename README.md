## Objectives

This project aims to provide a typed error management for typescript code.

## Basic usage

A method like this one:

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

- `{success: true, data: {...}}` where `data` will be a **User** instance
- `{success: false, error: {...}}` where `error` will be a **DatabaseError | MissingDataError** instance.

To code our method, we can use the two helpers from the `Block` class:

```typescript
async function getUser(
  id: number,
): PromisedResult<User, DatabaseError | MissingDataError> {
  try {
    const user = await database.get("User", id);
    return user
      ? Block.succeed(user)
      : Block.fail(new MissingDataError("User", id));
  } catch (e) {
    return Block.fail(new DatabaseError(e));
  }
}
```

The library provides helper classes to chain those actions and simplifies the code of the method.
Here is the same implementation, leveraging `Block.convert()` and `Chain.start()`:

```typescript
async function getUser(
  id: number,
): PromisedResult<User, DatabaseError | MissingDataError> {
  return Chain.start()
    .addData(id)
    .onSuccess((id) =>
      Block.convert({
        try: () => database.get("User", id),
        catch: (e) => new DatabaseError(e),
      }),
    )
    .onSuccess((user) =>
      user ? Block.succeed(user) : Block.fail(new MissingDataError("User", id)),
    );
}
```

- `Chain.start()`
  starts a chain of actions
- `.addData(id)`
  adds a new data block (would have been equivalent to `Chain.start(id)`)
- `.onSuccess(action)`
  adds a new action block that will execute if the previous block succeed
