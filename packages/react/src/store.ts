import { useEffect, useRef, useState } from 'react'
import { INITIALIZE_SYMBOL } from './const'
import { omitKey } from './util'

export interface Store<State> {
  createAction<Args extends unknown[], Return>(
    cb: (set: (newState: State) => State, get: () => State, ...args: [...Args]) => Return
  ): (...args: [...Args]) => Return
  useStore<Getter extends (state: State) => unknown = (state: State) => State>(
    getter?: Getter
  ): ReturnType<Getter>
  createDerivedStore<TransformedState>(
    name: string,
    transform: (state: State) => TransformedState
  ): DerivedStore<TransformedState>
  subscribe(fn: (state: State) => void): () => void
  set(newState: State): State
  get(): State
  initialize: (initial: State) => void
  [INITIALIZE_SYMBOL]: (initial: State) => void
  __mock(mockState: State): void
}

export type DerivedStore<TransformedState> = Omit<Store<TransformedState>, 'initialize'>

const resetCallbackMap = new Map<string, () => void>()

export function createStore<State>(name: string, initial: State): Store<State> {
  let storeState: State = initial

  resetCallbackMap.set(name, () => {
    storeState = initial
  })

  let listeners: ReadonlyArray<(state: State) => void> = []

  function _set(newState: State): State {
    storeState = newState
    for (const listener of listeners) {
      listener(storeState)
    }
    return storeState
  }

  function _get() {
    return storeState
  }

  const subscribe = (fn: (state: State) => void): (() => void) => {
    if (!listeners.includes(fn)) {
      listeners = [...listeners, fn]
    }
    return () => {
      listeners = listeners.filter((f) => f !== fn)
    }
  }

  const createAction = <Args extends unknown[], Return>(
    cb: (set: typeof _set, get: typeof _get, ...args: [...Args]) => Return
  ) => (...args: [...Args]): Return => cb(_set, _get, ...args)

  function useStore(): State
  function useStore<Return>(getter: (state: State) => Return): Return
  function useStore<Return>(getter?: (state: State) => Return): Return | State {
    // we only use the state to trigger a rerender.
    // we derive the actual return from the storeState
    const [, setState] = useState(0)
    const sliceRef = useRef<Return | State>()
    const getterRef = useRef<((state: State) => Return) | undefined>()
    getterRef.current = getter
    sliceRef.current = getterRef.current ? getterRef.current(storeState) : storeState

    useEffect(() => {
      // Just an easy way to subscribe only once for each hook
      const cb = (newState: State) => {
        const slice = getterRef.current ? getterRef.current(newState) : newState
        if (slice !== sliceRef.current) {
          sliceRef.current = slice
          setState(Math.random())
        }
      }
      return subscribe(cb)
    }, [])

    return sliceRef.current
  }

  function __mock(mockState: State) {
    storeState = mockState
  }

  const derivedStoreInitializers: Array<(state: State) => void> = []

  const initialize = (initialState: State) => {
    storeState = initialState
    initial = initialState
    for (const initializer of derivedStoreInitializers) {
      initializer(initialState)
    }
  }

  const store: Store<State> = {
    createAction,
    useStore,
    createDerivedStore<TransformedState>(
      derivedName: string,
      transform: (state: State) => TransformedState
    ): DerivedStore<TransformedState> {
      const initialState = transform(storeState)
      const derivedStore: DerivedStore<TransformedState> = omitKey(
        createStore(`${derivedName}(${name})`, initialState),
        'initialize'
      )
      // ignore return value, will never be unsubscribed, new store will not be garbage collected
      // until root store and all derived stores are released
      subscribe((state) => derivedStore.set(transform(state)))

      derivedStoreInitializers.push((state) => derivedStore[INITIALIZE_SYMBOL](transform(state)))

      return derivedStore
    },
    subscribe,
    set: createAction((set, _, newState: State) => set(newState)),
    get: _get,
    initialize,
    [INITIALIZE_SYMBOL]: initialize,
    __mock,
  }
  return store
}

export const resetStores = () => resetCallbackMap.forEach((cb) => cb())

export const useCubbyInitialize = <
  S extends Record<string, { initialize: (init: any) => void }>,
  I extends { [K in keyof S]: Parameters<S[K]['initialize']>[0] }
>(
  stores: S,
  initialData: I
): void => {
  const hasInitialized = useRef(false)
  if (!hasInitialized.current) {
    hasInitialized.current = true
    for (const key of Object.keys(stores)) {
      stores[key]?.initialize(initialData[key])
    }
  }
}
