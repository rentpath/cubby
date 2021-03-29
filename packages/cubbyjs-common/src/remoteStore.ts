// import { useCallback, useRef } from 'preact/hooks'
import { initStore } from './store'
type createStoreFn = ReturnType<typeof initStore>['createStore']

export interface RemoteStoreConfig {
  cacheMs?: number
  clientSerialize?: boolean
}

const createName = (name: string, base: string): string => {
  return `${base}_${name}`
}

const defaultCacheMs = 5000

type UseRemoteStoreReturn<T> = {
  result?: T
  fetching: boolean
  refetch: () => void
}

type GetRemoteStoreReturn<T> = {
  result?: T
  fetching: boolean
  error?: Error
}

type ObjectOf<T> = Partial<Record<string, T>>

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

export interface RemoteStore<T, A extends unknown[]> {
  fetchQuery: (...args: A) => Promise<T>
  forceFetchQuery: (...args: A) => Promise<T>
  cachedFetchQuery: (...args: A) => Promise<T>
  getRemoteStore: (...args: A) => GetRemoteStoreReturn<T>
  useRemoteStore: (...args: A) => UseRemoteStoreReturn<T | undefined>
  useRemoteStoreWithGetter: <R>(
    getter: (state: T | undefined) => R,
    ...args: A
  ) => UseRemoteStoreReturn<R>
  createDerivedRemoteStore: <NT>(
    derivedName: string,
    transform: (newState: T) => NT | Promise<NT>,
    derivedConfig?: Omit<RemoteStoreConfig, 'cacheMs'>
  ) => RemoteStore<NT, A> & { parent: RemoteStore<T, A> }
  __mockRequestSuccess: (arg: A, state: T) => void
  __mockRequestFailure: (arg: A, error: Error) => void
}

interface Cache<T> {
  result?: { state: T } | { error: Error }
  lastFetched?: number
  fetching?: boolean
}

export const initRemoteStore = (
  store: createStoreFn,
  useCallback: <CB extends (...args: any[]) => any>(callback: CB, inputs: readonly unknown[]) => CB,
  useRef: <I>(initialValue?: I | null | undefined) => { current: I }
) => {
  return function createRemoteStore<T, A extends unknown[]>(
    name: string,
    query: (...args: A) => Promise<T>,
    config: RemoteStoreConfig = {}
  ): RemoteStore<T, A> {
    let cacheMs = config.cacheMs ?? defaultCacheMs

    const cacheStore = store<ObjectOf<Cache<T>>>(
      createName('cacheStore', name),
      {},
      {
        clientSerialize: config.clientSerialize,
      }
    )

    const promises: ObjectOf<
      Promise<{ error: undefined; result: T } | { error: Error; result: undefined }>
    > = {}

    const setCache = (key: string, value: Cache<T>) =>
      cacheStore.set({
        ...cacheStore.get(),
        [key]: { ...(cacheStore.get()[key] ?? {}), ...value },
      })

    const _fetchQuery = async (args: A, force?: boolean) => {
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

    const fetchQueryBase = async (arg: A, force?: boolean) => {
      const queryReturn = await _fetchQuery(arg, force)
      if (queryReturn.error) {
        throw queryReturn.error
      }
      return queryReturn.result
    }

    const cachedFetchQuery = async (...args: A): Promise<T> => {
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

    function unpackResult(cache?: Cache<T>): { state?: T; error?: Error } {
      if (cache?.result == null) {
        return {}
      }
      return cache.result
    }

    function useRemoteStoreWithGetter<R>(
      getter: (state: T | undefined) => R,
      ...args: A
    ): UseRemoteStoreReturn<R> {
      const cacheKey = createCacheKey(args)
      const cache = cacheStore.useStore(
        useCallback(({ [cacheKey]: state }: ObjectOf<Cache<T>>) => state, [cacheKey])
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
        void _fetchQuery(args)
        fetching = true
      }

      const errorRef = useRef<Error | undefined>()
      const prevError = errorRef.current
      errorRef.current = error
      if (error && prevError !== error) {
        throw error
      }

      return {
        result,
        fetching,
        refetch() {
          void _fetchQuery(args, true)
        },
      }
    }

    const identity = (state: T | undefined) => state

    function useRemoteStore(...args: A): UseRemoteStoreReturn<T | undefined> {
      return useRemoteStoreWithGetter(identity, ...args)
    }

    function getRemoteStore(...args: A): GetRemoteStoreReturn<T> {
      const cacheKey = createCacheKey(args)
      const cache = cacheStore.get()[cacheKey]
      const { state, error } = unpackResult(cache)
      return {
        result: state,
        error: error,
        fetching: Boolean(cache?.fetching),
      }
    }

    function __mockRequestSuccess(args: unknown[], state: T) {
      const cacheKey = createCacheKey(args)
      cacheStore.__mock({
        [cacheKey]: {
          result: { state },
          lastFetched: 0,
          fetching: false,
        },
      })
      cacheMs = Infinity
    }

    function __mockRequestFailure(args: unknown[], error: Error) {
      const cacheKey = createCacheKey(args)
      cacheStore.__mock({
        [cacheKey]: {
          result: { error },
          lastFetched: 0,
          fetching: false,
        },
      })
      cacheMs = Infinity
    }

    const remoteStore = {
      fetchQuery: (...args: A) => fetchQueryBase(args, false),
      forceFetchQuery: (...args: A) => fetchQueryBase(args, true),
      cachedFetchQuery,
      getRemoteStore,
      useRemoteStore,
      useRemoteStoreWithGetter,
      createDerivedRemoteStore: <NT>(
        derivedName: string,
        transform: (newState: T) => NT | Promise<NT>,
        derivedConfig: Omit<RemoteStoreConfig, 'cacheMs'> = {}
      ) => {
        return Object.assign(
          createRemoteStore(
            `${derivedName}(${name})`,
            async (...args: A) => {
              const state = await cachedFetchQuery(...args)
              return await transform(state)
            },
            { cacheMs, ...derivedConfig }
          ),
          { parent: remoteStore }
        )
      },
      __mockRequestSuccess,
      __mockRequestFailure,
    }
    return remoteStore
  }
}
