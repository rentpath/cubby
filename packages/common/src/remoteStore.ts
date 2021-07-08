// import { useCallback, useRef } from 'preact/hooks'
import { INITIALIZE_SYMBOL, initStore } from './store'
type createStoreFn = ReturnType<typeof initStore>['createStore']

export interface RemoteStoreConfig {
  cacheMs?: number
}

const createName = (name: string, base: string): string => {
  return `${base}_${name}`
}

const defaultCacheMs = 5000

export interface GetRemoteStoreReturn<Result> {
  result?: Result
  fetching: boolean
  error?: Error
}

export interface UseRemoteStoreReturn<Result> extends GetRemoteStoreReturn<Result> {
  refetch: () => void
}

type ObjectOf<T> = Record<string, T>

const sortMapEntries = (
  entries: [string, unknown][],
  cache: Map<unknown, string>,
  path: string
): [string, unknown][] => {
  const sortedEntries: [string, unknown][] = []
  for (const [key, v] of entries) {
    const previousUsage = cache.get(v)
    const newPath = `${path}.${key}`
    if (previousUsage) {
      throw new Error(
        `cannot create cache key from object with circular structure: value at ${newPath} is the same as the value at ${previousUsage}`
      )
    }
    sortedEntries.push([key, getSortedEntries(v, cache, newPath)])
  }
  sortedEntries.sort(([a], [b]) => {
    if (a < b) {
      return -1
    }
    if (a > b) {
      return 1
    }
    return 0
  })
  return sortedEntries
}

const getSortedEntries = (val: unknown, cache: Map<unknown, string>, path: string): unknown => {
  if (Array.isArray(val)) {
    cache.set(val, path)
    return val.map((v, i) => getSortedEntries(v, cache, `${path}.${i}`))
  } else if (val instanceof Map) {
    cache.set(val, path)
    return sortMapEntries(
      Array.from(val).map(([key, v]) => [
        JSON.stringify(getSortedEntries(key, cache, `${path}.map.${String(key)}`)),
        v,
      ]),
      cache,
      path
    )
  } else if (val instanceof Set) {
    cache.set(val, path)
    const entries = Array.from(val).map((v) =>
      JSON.stringify(getSortedEntries(v, cache, `${path}.set.${String(v)}`))
    )
    entries.sort()
    return entries
  } else if (val instanceof Object) {
    cache.set(val, path)
    return sortMapEntries(Object.entries(val), cache, path)
  } else {
    return val
  }
}

const createCacheKey = (vals: unknown[]): string =>
  JSON.stringify(vals.map((val) => getSortedEntries(val, new Map(), 'arg')))

export interface FetchedState<Args, Result> {
  args: Args
  result: Result
}

type OptionalInitializeRemoteStore<Args extends unknown[], Result> = Omit<
  RemoteStore<Args, Result>,
  'initialize'
> &
  Partial<Pick<RemoteStore<Args, Result>, 'initialize'>>

type DerivedRemoteStore<Args extends unknown[], TransformedResult> = Omit<
  RemoteStore<Args, TransformedResult>,
  'initialize'
> & {
  parent: OptionalInitializeRemoteStore<Args, TransformedResult>
}

export interface RemoteStore<Args extends unknown[], Result> {
  fetchQuery: (...args: Args) => Promise<Result>
  forceFetchQuery: (...args: Args) => Promise<Result>
  cachedFetchQuery: (...args: Args) => Promise<Result>
  getRemoteStore: (...args: Args) => GetRemoteStoreReturn<Result>
  useRemoteStore: (...args: Args) => UseRemoteStoreReturn<Result | undefined>
  useRemoteStoreWithGetter: <SubResult>(
    getter: (state: Result | undefined) => SubResult,
    ...args: Args
  ) => UseRemoteStoreReturn<SubResult>
  createDerivedRemoteStore: <TransformedResult>(
    derivedName: string,
    transform: (newState: Result) => TransformedResult
  ) => DerivedRemoteStore<Args, TransformedResult>
  initialize: (initial: FetchedState<Args, Result>[]) => void
  [INITIALIZE_SYMBOL]: (initial: FetchedState<Args, Result>[]) => void
  __mockRequestSuccess: (arg: Args, state: Result, fetching?: boolean) => void
  __mockRequestFailure: (arg: Args, error: Error, fetching?: boolean) => void
}

interface Cache<Result> {
  result?: { state: Result } | { error: Error }
  lastFetched?: number
  fetching?: boolean
}

export const initRemoteStore = (
  store: createStoreFn,
  useCallback: <Callback extends (...args: any[]) => any>(
    callback: Callback,
    inputs: readonly unknown[]
  ) => Callback,
  useRef: <InitialValue>(
    initialValue?: InitialValue | null | undefined
  ) => { current: InitialValue }
) => {
  let isClient: boolean = typeof window !== 'undefined'

  function createRemoteStore<Args extends unknown[], Result>(
    name: string,
    query: (...args: Args) => Promise<Result>,
    config: RemoteStoreConfig,
    isDerived: true,
    initial: ObjectOf<Cache<Result>>
  ): DerivedRemoteStore<Args, Result>

  function createRemoteStore<Args extends unknown[], Result>(
    name: string,
    query: (...args: Args) => Promise<Result>,
    config: RemoteStoreConfig,
    isDerived: false,
    initial: ObjectOf<Cache<Result>>
  ): RemoteStore<Args, Result>

  function createRemoteStore<Args extends unknown[], Result>(
    name: string,
    query: (...args: Args) => Promise<Result>,
    config: RemoteStoreConfig,
    isDerived: boolean,
    initial: ObjectOf<Cache<Result>>
  ): OptionalInitializeRemoteStore<Args, Result> {
    let cacheMs = config.cacheMs ?? defaultCacheMs

    const cacheStore = store<ObjectOf<Cache<Result>>>(createName('cacheStore', name), initial)

    const promises: ObjectOf<
      Promise<{ error: undefined; result: Result } | { error: Error; result: undefined }>
    > = {}

    const setCache = (key: string, value: Cache<Result>) =>
      cacheStore.set({
        ...cacheStore.get(),
        [key]: { ...(cacheStore.get()[key] ?? {}), ...value },
      })

    const _fetchQuery = async (args: Args, force?: boolean) => {
      const cacheKey = createCacheKey(args)
      let promise = promises[cacheKey]
      if (!force && cacheStore.get()[cacheKey]?.fetching && promise != null) {
        return promise
      }
      promise = (async () => {
        setCache(cacheKey, { fetching: true })
        try {
          const result = await query(...args)
          if (promise === promises[cacheKey]) {
            setCache(cacheKey, {
              result: { state: result },
              fetching: false,
              lastFetched: Date.now(),
            })
            delete promises[cacheKey]
          }
          return { result, error: undefined }
        } catch (err) {
          const error = err instanceof Error ? err : new Error(err)
          if (promise === promises[cacheKey]) {
            setCache(cacheKey, {
              result: { error },
              fetching: false,
              lastFetched: Date.now(),
            })
            delete promises[cacheKey]
          }
          return { result: undefined, error }
        }
      })()

      promises[cacheKey] = promise
      return promise
    }

    const fetchQueryBase = async (arg: Args, force?: boolean) => {
      const queryReturn = await _fetchQuery(arg, force)
      if (queryReturn.error) {
        throw queryReturn.error
      }
      return queryReturn.result
    }

    const cachedFetchQuery = async (...args: Args): Promise<Result> => {
      const cacheKey = createCacheKey(args)

      const cache = cacheStore.get()[cacheKey]
      const fetching = Boolean(cache?.fetching)
      const hasBeenFetched = Boolean(cache?.result)
      const lastFetched = cache?.lastFetched ?? 0

      // simple arg caching
      const cacheIsExpired = lastFetched != null ? cacheMs < Date.now() - lastFetched : true
      const shouldFetch = !fetching && (!hasBeenFetched || (hasBeenFetched && cacheIsExpired))
      if (shouldFetch || cache?.result == null) {
        return fetchQueryBase(args)
      } else if ('error' in cache.result) {
        throw cache.result.error
      } else {
        return cache.result.state
      }
    }

    function unpackResult(cache?: Cache<Result>): { state?: Result; error?: Error } {
      if (cache?.result == null) {
        return {}
      }
      return cache.result
    }

    function useRemoteStoreWithGetter<SubResult>(
      getter: (state: Result | undefined) => SubResult,
      ...args: Args
    ): UseRemoteStoreReturn<SubResult> {
      const cacheKey = createCacheKey(args)
      const cache = cacheStore.useStore(
        useCallback(({ [cacheKey]: state }: ObjectOf<Cache<Result>>) => state, [cacheKey])
      )
      let fetching = Boolean(cache?.fetching)
      const hasBeenFetched = Boolean(cache?.result)
      const lastFetched = cache?.lastFetched ?? 0

      const { state, error } = unpackResult(cache)
      const result = getter(state)

      // simple arg caching
      const cacheIsExpired = lastFetched != null ? cacheMs < Date.now() - lastFetched : true
      const shouldFetch = !fetching && (!hasBeenFetched || (hasBeenFetched && cacheIsExpired))

      if (shouldFetch) {
        if (isClient) {
          // do not actually fetch on the server
          void _fetchQuery(args)
        }
        fetching = true
      }

      return {
        result,
        fetching,
        error,
        refetch() {
          if (isClient) {
            // do not actually fetch on the server
            void _fetchQuery(args, true)
          }
        },
      }
    }

    const identity = (state: Result | undefined) => state

    function useRemoteStore(...args: Args): UseRemoteStoreReturn<Result | undefined> {
      return useRemoteStoreWithGetter(identity, ...args)
    }

    function getRemoteStore(...args: Args): GetRemoteStoreReturn<Result> {
      const cacheKey = createCacheKey(args)
      const cache = cacheStore.get()[cacheKey]
      const { state, error } = unpackResult(cache)
      return {
        result: state,
        error: error,
        fetching: Boolean(cache?.fetching),
      }
    }

    function __mockRequestSuccess(args: unknown[], state: Result, fetching = false) {
      const cacheKey = createCacheKey(args)
      cacheStore.__mock({
        ...cacheStore.get(),
        [cacheKey]: {
          result: { state },
          lastFetched: 0,
          fetching,
        },
      })
      cacheMs = Infinity
    }

    function __mockRequestFailure(args: unknown[], error: Error, fetching = false) {
      const cacheKey = createCacheKey(args)
      cacheStore.__mock({
        ...cacheStore.get(),
        [cacheKey]: {
          result: { error },
          lastFetched: 0,
          fetching,
        },
      })
      cacheMs = Infinity
    }

    const derivedStoreInitializers: Array<(state: FetchedState<Args, Result>[]) => void> = []

    const initialize = (initialState: FetchedState<Args, Result>[]) => {
      const now = Date.now()
      cacheStore[INITIALIZE_SYMBOL](
        Object.fromEntries(
          initialState.map<[string, Cache<Result>]>(({ args, result }) => [
            createCacheKey(args),
            {
              fetching: false,
              lastFetched: now,
              result: {
                state: result,
              },
            },
          ])
        )
      )
      for (const initializer of derivedStoreInitializers) {
        initializer(initialState)
      }
    }

    const remoteStore: OptionalInitializeRemoteStore<Args, Result> = {
      fetchQuery: (...args: Args) => fetchQueryBase(args, false),
      forceFetchQuery: (...args: Args) => fetchQueryBase(args, true),
      cachedFetchQuery,
      getRemoteStore,
      useRemoteStore,
      useRemoteStoreWithGetter,
      createDerivedRemoteStore: <TransformedResult>(
        derivedName: string,
        transform: (newState: Result) => TransformedResult
      ) => {
        const derivedStore: DerivedRemoteStore<Args, TransformedResult> = Object.assign(
          createRemoteStore(
            `${derivedName}(${name})`,
            async (...args: Args): Promise<TransformedResult> => {
              const state = await cachedFetchQuery(...args)
              return transform(state)
            },
            { cacheMs },
            true,
            Object.fromEntries(
              Object.entries(cacheStore.get()).map(([key, value]) => {
                let result: Cache<TransformedResult>['result']
                if (value.result) {
                  if ('error' in value.result) {
                    result = value.result
                  } else {
                    result = { state: transform(value.result.state) }
                  }
                }
                return [
                  key,
                  {
                    ...value,
                    result,
                  },
                ]
              })
            )
          ),
          { parent: remoteStore }
        )
        derivedStoreInitializers.push((state) =>
          derivedStore[INITIALIZE_SYMBOL](
            state.map(({ args, result }) => ({ args, result: transform(result) }))
          )
        )
        return derivedStore
      },
      [INITIALIZE_SYMBOL]: initialize,
      __mockRequestSuccess,
      __mockRequestFailure,
    }

    if (!isDerived) {
      remoteStore.initialize = initialize
    }

    return remoteStore
  }

  function useUnwrap<Result, Return extends GetRemoteStoreReturn<Result>>({
    error,
    ...rest
  }: Return): Omit<Return, 'error'> {
    const errorRef = useRef<Error | undefined>()
    const prevError = errorRef.current
    errorRef.current = error
    if (error && prevError !== error) {
      throw error
    }
    return rest
  }

  const __mockIsClient__ = (mockIsClient: boolean) => {
    isClient = mockIsClient
  }

  return {
    useUnwrap,
    createRemoteStore: <Args extends unknown[], Result>(
      name: string,
      query: (...args: Args) => Promise<Result>,
      config: RemoteStoreConfig = {}
    ) => createRemoteStore(name, query, config, false, {}),
    __mockIsClient__,
  }
}
