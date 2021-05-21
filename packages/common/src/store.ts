export interface Store<T> {
  createAction<A extends unknown[], R>(
    cb: (set: (newState: T) => T, get: () => T, ...args: [...A]) => R
  ): (...args: [...A]) => R
  useStore<F extends (state: T) => unknown = (state: T) => T>(getter?: F): ReturnType<F>
  createDerivedStore<R>(
    name: string,
    transform: (state: T) => R,
    config?: Config
  ): Omit<Store<R>, 'set'> & { parent: Store<T> }
  subscribe(fn: (state: T) => void): () => void
  set(newState: T): T
  get(): T
  __mock(mockState: T): void
}

export type Config = {
  clientSerialize?: boolean
}

export const initStore = (
  h: <Children, Return>(
    type: string,
    props: Record<string, any>,
    ...children: Children[]
  ) => Return,
  useEffect: (cb: () => () => any | void, inputs: readonly unknown[]) => void,
  useState: <S>(initialState: S | (() => S)) => [S, (value: S | ((prevState: S) => S)) => void],
  useRef: <I>(initialValue?: I | null | undefined) => { current: I }
) => {
  const storeCacheKey = '__CUBBY_STORE_CACHE__'
  let cache: Record<string, { state: unknown }> = (typeof document !== 'undefined'
    ? JSON.parse(document.getElementById(storeCacheKey)?.innerHTML || '{}')
    : {}) as Record<string, { state: unknown }>
  const clientSerializeIds = new Set<string>()
  const resetCallbackMap = new Map<string, () => void>()

  let isClient: boolean = typeof window !== 'undefined'

  function createStore<T>(name: string, initial: T, config: Config = {}): Store<T> {
    const { clientSerialize } = config
    if (clientSerialize) {
      if (clientSerializeIds.has(name)) {
        throw new Error(`store with name ${name} redefined`)
      } else {
        clientSerializeIds.add(name)
      }
    }
    let storeState: T = initial

    resetCallbackMap.set(name, () => {
      storeState = initial
    })

    if (isClient && clientSerialize && cache[name] != null) {
      const cacheState = cache[name] as { state: T }
      storeState = cacheState.state
    }

    if (!isClient && clientSerialize) {
      cache[name] = { state: storeState }
    }

    let listeners: ReadonlyArray<(state: T) => void> = []

    function _set(newState: T): T {
      storeState = newState
      if (!isClient && clientSerialize) {
        cache[name] = { state: storeState }
      }
      for (const listener of listeners) {
        listener(storeState)
      }
      return storeState
    }

    function _get() {
      return storeState
    }

    const subscribe = (fn: (state: T) => void): (() => void) => {
      if (!listeners.includes(fn)) {
        listeners = [...listeners, fn]
      }
      return () => {
        listeners = listeners.filter((f) => f !== fn)
      }
    }

    const createAction = <A extends unknown[], R>(
      cb: (set: typeof _set, get: typeof _get, ...args: [...A]) => R
    ) => (...args: [...A]): R => cb(_set, _get, ...args)

    function useStore(): T
    function useStore<R>(getter: (state: T) => R): R
    function useStore<R>(getter?: (state: T) => R): R | T {
      // we only use the state to trigger a rerender.
      // we derive the actual return from the storeState
      const [, setState] = useState(0)
      const sliceRef = useRef<R | T>()
      const getterRef = useRef<((state: T) => R) | undefined>()
      getterRef.current = getter
      sliceRef.current = getterRef.current ? getterRef.current(storeState) : storeState

      useEffect(() => {
        // Just an easy way to subscribe only once for each hook
        const cb = (newState: T) => {
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

    function __mock(mockState: T) {
      storeState = mockState
    }

    const store = {
      createAction,
      useStore,
      createDerivedStore<R>(
        derivedName: string,
        transform: (state: T) => R,
        derivedConfig: Config = {}
      ): Omit<Store<R>, 'set'> & { parent: Store<T> } {
        const initialState = transform(storeState)
        const newStore = Object.assign(
          createStore(`${derivedName}(${name})`, initialState, derivedConfig),
          { parent: store }
        )
        // ignore return value, will never be unsubscribed, new store will not be garbage collected
        // until root store and all derived stores are released
        subscribe((state) => newStore.set(transform(state)))
        return newStore
      },
      subscribe,
      set: createAction((set, _, newState: T) => set(newState)),
      get: _get,
      __mock,
    }
    return store
  }

  const StoreCacheScript = () => {
    return h('script', {
      id: storeCacheKey,
      'data-tid': storeCacheKey,
      type: 'application/json',
      crossOrigin: 'anonymous',
      dangerouslySetInnerHTML: {
        __html: JSON.stringify(cache),
      },
    })
  }

  const clearClientSerializeIdsCache = (): void => {
    clientSerializeIds.clear()
  }

  const resetStores = () => resetCallbackMap.forEach((cb) => cb())

  const __getClientSerializeIdsCache = () => new Set(clientSerializeIds)

  const __mockIsClient__ = (mockIsClient: boolean) => {
    isClient = mockIsClient
  }

  const __mockCache__ = (mockCache: Record<string, { state: unknown }>) => {
    cache = mockCache
  }

  const __getCache__ = () => cache

  return {
    storeCacheKey,
    createStore,
    StoreCacheScript,
    clearClientSerializeIdsCache,
    resetStores,
    __getClientSerializeIdsCache,
    __mockIsClient__,
    __mockCache__,
    __getCache__,
  }
}
