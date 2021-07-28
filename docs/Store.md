# Store

## Table of Contents

- [Creating](#create)
- [Consuming](#consume)
- [Updating](#update)

## <a id="create">Creating a Store</a>

A Store is a container that provides access to some shared state from anywhere in the application.

To create a Store, we can use the `createStore` function. We need to define the shape of the data we want to store in the
Store as well as an initial state that the Store will be initialized with. The first argument is the Store's
name, which is required to be unique among all your other stores.

```ts
import { createStore } from 'cubbyjs-react'

interface StoreType {
  foo: string
  bar: { baz: number }
}

const initialState: StoreType = {
  foo: 'hello world',
  bar: { baz: 42 },
}

// The generic argument here is the type of the data in the Store
// It will be inferred if you skip it, but best practice is to always be explicit
export const aSimpleStore = createStore<StoreType>('myStore', initialState)
```

## <a id="consume">Consuming a Store</a>

### In React

To consume the store we've created in a React component, we can simply use the `useStore` hook that is exposed on our created Store:

```tsx
import { aSimpleStore } from '../stores/simpleStore'

export function Example() {
  const data = aSimpleStore.useStore()

  return (
    <>
      <p>Foo: {data.foo}</p>
      <p>Baz: {data.bar.baz}</p>
    </>
  )
}
```

Our hook will connect our component to the Store and cause it to update and re-render the component whenever the data inside the Store updates. You can think of this like "connecting" the component to the Store, to use Redux terms.

### Outside of React

The Store is a singleton available anywhere in the application, even outside React. To consume the data in the Store, simply use
the `get` method.

```ts
import { aSimpleStore } from '../stores/simpleStore'

const someData = aSimpleStore.get()
```

This will extract the current value of the Store. There's no smart subscription happening here like when using the hook in a
React component - it is one and done. _If you extract a value then use it later asynchronously, beware of stale data!_

## <a id="update">Updating a Store</a>

### Using Set

Stores expose a `set` method that can be used to pass a new state into the Store:

```ts
aSimpleStore.set({ ...aSimpleStore.get(), foo: 'goodbye world' })
```

Set can be useful for updating data outside of React, **but in React components it is generally more convenient to expose actions**.

### Using Actions

We can create actions on a store using `createAction`. You can think of these as analogous to Redux actions, but they don't need
to be bound to a dispatcher and can instead be used directly by importing them.

```ts
// store.ts file
export const aSimpleStore = store<StoreType>('myStore', initialState)

export const goodbye = aSimpleStore.createAction(function (set, get) {
  set({ ...get(), foo: 'goodbye world' })
})
```

```tsx
// component.tsx fle
import { aSimpleStore, goodbye } from '../stores/simpleStore'

// Later, in the markup...
;<button onClick={(_) => goodbye()}>Goodbye</button>
```

We can also create actions that accept arguments. Typescript will infer
the type of argument you supply (provided it's not `any`!) and provide the correct type information and type checking:

```tsx
// store.ts file
export const greet = aSimpleStore.createAction(function (set, getCurrent, name: string) {
  set({ ...current, foo: `hello ${name}` })
})

// Later...
<button onClick={_ => greet("John Doe")}>Greet John</button>

// This is a type error, because our argument is of type string
<button onClick={_ => greet(["Rick", "Morty"])}>Greet Invalid</button>
```

The arguments are variadic, so if you need more arguments simply add them to the callback. Make sure they're typed, though!
