import { useCallback, useRef } from 'react'
import { createStore } from './store'
import { getSortedEntries } from './util'

export interface RemoteStoreConfig {
  cacheMs?: number
}

const defaultCacheMs = 5000

/**
 * The current state of a fetch.
 *
 * @remarks
 * This object will correspond to the state for a unique set of arguments,
 * not the whole remote store.
 */
export interface GetRemoteStoreReturn<Result> {
  /**
   * The result of the fetch. Will be `undefined` if the store has never
   * completed the fetch, or if the fetch has never been initiated.
   */
  result?: Result
  fetching: boolean
  error?: Error
}

export interface UseRemoteStoreReturn<Result> extends GetRemoteStoreReturn<Result> {
  refetch(): void
}

const createCacheKey = (vals: unknown[]): string =>
  JSON.stringify(vals.map((val) => getSortedEntries(val, new Map(), 'arg')))

export interface FetchedState<Args, Result> {
  args: Args
  result: Result
}

export interface RemoteStore<Args extends unknown[], Result> {
  fetchQuery(...args: Args): Promise<Result>
  forceFetchQuery(...args: Args): Promise<Result>
  cachedFetchQuery(...args: Args): Promise<Result>
  getRemoteStore(...args: Args): GetRemoteStoreReturn<Result>
  useRemoteStore(...args: Args): UseRemoteStoreReturn<Result | undefined>
  useRemoteStoreWithGetter<SubResult>(
    getter: (state: Result | undefined) => SubResult,
    ...args: Args
  ): UseRemoteStoreReturn<SubResult>
  initialize(initial: FetchedState<Args, Result>[]): void
  __mockRequestSuccess(arg: Args, state: Result, fetching?: boolean): void
  __mockRequestFailure(arg: Args, error: Error, fetching?: boolean): void
}

interface Cache<Result> {
  result?: { state: Result } | { error: Error }
  lastFetched?: number
  fetching?: boolean
}

let isClient: boolean = typeof window !== 'undefined'

export function createRemoteStore<Args extends unknown[], Result>(
  name: string,
  query: (...args: Args) => Promise<Result>,
  config: RemoteStoreConfig = {}
): RemoteStore<Args, Result> {
  let cacheMs = config.cacheMs ?? defaultCacheMs

  const cacheStore = createStore<Record<string, Cache<Result>>>(`cacheStore_${name}`, {})

  const promises: Record<
    string,
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
      useCallback(({ [cacheKey]: state }: Record<string, Cache<Result>>) => state, [cacheKey])
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
    let fetching = Boolean(cache?.fetching)
    if (!isClient) {
      // if we are on the server we should always report that we are fetching the args
      // have not been prefetched we dont have the data
      if (cache == null) {
        fetching = true
      }
    }
    return {
      result: state,
      error: error,
      fetching,
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

  const initialize = (initialState: FetchedState<Args, Result>[]) => {
    const now = Date.now()
    cacheStore.initialize(
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
  }

  const remoteStore: RemoteStore<Args, Result> = {
    fetchQuery: (...args: Args) => fetchQueryBase(args, false),
    forceFetchQuery: (...args: Args) => fetchQueryBase(args, true),
    cachedFetchQuery,
    getRemoteStore,
    useRemoteStore,
    useRemoteStoreWithGetter,
    initialize,
    __mockRequestSuccess,
    __mockRequestFailure,
  }

  return remoteStore
}

export function useUnwrap<Result, Return extends GetRemoteStoreReturn<Result>>({
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

export function __mockIsClient__(mockIsClient: boolean) {
  isClient = mockIsClient
}
