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
