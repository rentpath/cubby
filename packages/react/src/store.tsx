import React, { ComponentType, useEffect, useRef, useState } from 'react'

export interface Store<State> {
  createAction<Args extends unknown[], Return>(
    cb: (set: (newState: State) => State, get: () => State, ...args: [...Args]) => Return
  ): (...args: [...Args]) => Return
  useStore<Getter extends (state: State) => unknown = (state: State) => State>(
    getter?: Getter
  ): ReturnType<Getter>
  subscribe(fn: (state: State) => void): () => void
  set(newState: State): State
  get(): State
  initialize: (initial: State) => void
  __mock(mockState: State): void
}

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

  const initialize = (initialState: State) => {
    storeState = initialState
    initial = initialState
  }

  const store: Store<State> = {
    createAction,
    useStore,
    subscribe,
    set: createAction((set, _, newState: State) => set(newState)),
    get: _get,
    initialize,
    __mock,
  }
  return store
}

export const resetStores = () => resetCallbackMap.forEach((cb) => cb())

export type InitialState<Stores extends Record<string, { initialize: (init: any) => void }>> = {
  [Key in keyof Stores]: Parameters<Stores[Key]['initialize']>[0]
}

export const useCubbyInitialize = <
  Stores extends Record<string, { initialize: (init: any) => void }>
>(
  stores: Stores,
  initialState: InitialState<Stores>
): void => {
  const lastProps = useRef<InitialState<Stores>>()
  if (initialState !== lastProps.current) {
    for (const key of Object.keys(stores)) {
      stores[key]?.initialize(initialState[key])
    }
  }

  lastProps.current = initialState
}

export type WithCubbyState<
  Props,
  Stores extends Record<string, { initialize: (init: any) => void }>
> = Props & {
  cubbyState: InitialState<Stores>
}

export function withCubby<
  Props extends {
    cubbyState: any
  }
>(
  stores: {
    [K in keyof Props['cubbyState']]: { initialize: (init: Props['cubbyState'][K]) => void }
  },
  Root: ComponentType<Omit<Props, 'cubbyState'>>
): ComponentType<Props> {
  return function CubbyRoot(props) {
    useCubbyInitialize(stores, props.cubbyState)
    return <Root {...props} />
  }
}
