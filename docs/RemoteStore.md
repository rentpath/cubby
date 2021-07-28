# Remote Stores

## Table of Contents

- [Creating](#create)
- [Consuming](#consume)
- [Updating](#update)
## Foreward

Remote stores are an abstraction over the top of normal stores. Please read the documentation on
stores and ensure you understand them first.

## <a id="create">Creating a Remote Store</a>

Unlike normal stores which accept an initial state, remote stores use a "query" that returns a promise. The
query can be any function that returns a promise. Note that remote stores require a name as well.

```ts
interface StoreType {
  foo: string
  bar: { baz: number }
}

export const aSimpleRemoteStore = remoteStore<StoreType, [string, number]>(
  'myRemoteData',
  async function query(stringArg, numberArg) {
    const raw = await someAsyncOperation(stringArg,  numberArg + 1)
    return raw.result
  }
)
```

Here, our query function accepts a two arguments, a string and a number. We can use this
to perform some asynchronous operation and return a promise with the new value. When resolved, the internal
state of the store will update and inform anything listening of the change.

The query can take in any number of arguments of any types. The types of the arguments are defined an array (or tuple)
in the second generic argument. You'll pass these values in yourself when you consume the remote store.

## <a id="consume">Consuming a Remote Store</a>

Consuming remote stores is slightly different from normal stores, as the state of the asynchronous data
is decorated with a "fetching" flag.

### Basic React Usage

Just like stores, remote stores expose a hook for subscribing to and consuming data.

```ts
const data = aSimpleRemoteStore.useRemoteStore('someArgument', 5)
```

Notice that the arguments to `useRemoteStore` match those of the query function.

The type of data is a `UseRemoteStoreReturn`, which exposes the following properties:

```ts
type UseRemoteStoreReturn<T> = {
  result?: T;
  fetching: boolean;
  refetch: () => void;
}
```

So a full example of consuming a remote store may look like:

```tsx
import { aSimpleRemoteStore } from 'src/stores/simpleRemoteStore'

export default function ExampleRemoteStore() {
  const data = aSimpleRemoteStore.useRemoteStore('someValue', 5)

  if (data.fetching) {
    return <p>Loading...</p>
  }

  return (
    <>
      <pre>{JSON.stringify(data.result)}</pre>
    </>
  )
}
```

Notice how we use the decorated data to account for the loading state in the asynchronous data.

### Using Subsets of Remote Stores in React

The React hook has an additional property that can be used on the argument object called "keys" which can be used
to specify a subset of the data you're interested in. For example, if we have a data set containing an object with
many properties but only care about one called "foo":

```tsx
const data = aSimpleRemoteStore.useRemoteStoreWithGetter((store) => store?.foo, 'someValue', 5)
```

The contents of `data.result` will be the slice of the underlying store at the "foo" index, or undefined if it doesnt have the data yet.
The getter function can be any function that takes in the type of the store or undefined as the first argument. It can return anything and the type of the `result` property of the return value of `useRemoteStoreWithGetter` will be that type. So if the getter returns a `string` then the return value of `useRemoteStoreWithGetter` will be `UseRemoteStoreReturn<string>`.

### Usage Outside of React

Just like a normal store, you can retrieve the value of the set outside of React. For remote stores, the method name
is `getRemoteStore`:

```ts
const result = aSimpleRemoteStore.getRemoteStore('foo', 12)

if (result.fetching) {
  // ...
}
```

It takes the same argument signature as the query function and the return type is the defined as follows
```ts
type GetRemoteStoreReturn<T> = {
    result?: T;
    fetching: boolean;
    error?: Error;
};
```

## <a id="update">Updating an Remote Store</a>

You cannot set a remote store's value directly. Instead, you must tell it to execute its query.

### Outside of React

Outside of React, you can directly execute a query using `fetchQuery`:

```ts
const result = await aSimpleRemoteStore.fetchQuery('someArg', 9)
```

The return type here is `Promise<T>` where `T` is whatever the query function returns.

### In React

When using the remote store's hooks, any time the arguments change, the query will re-run and new data will be fetched if
the query function has never been called for those arguments or if the time since it was last called for those arguments was longer
than the `cacheMs` defined in the config when the remote store was created (or 5 seconds if `cacheMs` was not defined). If there is already
a pending promise associated with those arguments it will not re-run and instead just wait for that to resolve, so there is no worry of
overfetching with the same arguments if the component is rerendered for other reasons.

A full example of this:
```tsx
export default function ExampleDataSet() {
  const [arg, setArg] = useState('initialArg')
  const data = aSimpleRemoteStore.useRemoteStore(arg, 5)

  return (
    <>
      <input type="text" onChange={(e) => setArg(e.currentTarget.value)} />
      {data.fetching ? <Loader /> : <pre>{JSON.stringify(data.result)}</pre>}
    </>
  )
}
```

Note that no debouncing is occuring and whenever the arguments change the hook may call the query function even if the promise is still
pending from the previous set of arguments. Make sure you dont accedentally fire off a query on every keypress! (Unless you want to do that
for some weird reason)
