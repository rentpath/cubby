/**
 * @jest-environment jsdom
 */

import * as React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import { act, renderHook } from '@testing-library/react-hooks/'
import { createRemoteStore, __mockIsClient__ } from '../remoteStore'

jest.useFakeTimers()
const DEFAULT = 'default'
const TEST_ID = 'fetching-test'

/*
  We use this when we want to render multiple hooks in the same react tree at the same time.

  Rational:
  For most of this file we use `renderHook` from `@testing-libary/react-hooks` to render the hook.
  When `renderHook` is called it creates a new container div and wrapper component and calls `ReactDOM.render`
  with them, creating an isolated React tree. This works fine when we are only testing one hook per test, but
  because of the global nature of cubby we sometimes need to test how the hooks work when they are used by
  different components in the same tree at the same time, which `@testing-library/react-hooks` doesnt let you do.
  For that reason this function exists. It creates a wrapper component for a component and functions to get its return value
  but does not render it, allowing us to create multiple components and render them in the same tree

  Example:
  ```
  const fn = async () => {
    return 'foo'
  }
  const rs = createRemoteStore('rs', fn)
  const { Component: Component1, ...hookHandle1 } = runHook(rs.useRemoteStore)
  const { Component: Component2, ...hookHandle2 } = runHook(rs.useRemoteStore)

  render(
    <div key="d">
      <Component1 key="C1" />
      <Component2 key="C2" />
    </div>
  )

  await waitFor(() => {
    const hook1 = hookHandle1.getResult()
    expect(hook1.fetching).toBe(true)
    expect(hook1.result).toBeUndefined()

    const hook2 = hookHandle2.getResult()
    expect(hook2.fetching).toBe(true)
    expect(hook2.result).toBeUndefined()
  })
  ```
*/
const runHook = <Args extends unknown[], Results extends { refetch: () => void; error?: Error }>(
  hook: (...args: Args) => Results,
  ...args: Args
) => {
  const THIS_TEST_ID = `${TEST_ID}_${Math.floor(Math.random() * Math.pow(2, 32)).toString(16)}`

  let _refetch: () => void = () => {}
  const transform = ({ error, ...results }: Omit<Results, 'refetch'>) => ({
    ...results,
    errorMessage: error?.message,
    isError: error instanceof Error,
  })
  const Component = () => {
    const { refetch, ...results } = hook(...args)
    _refetch = refetch
    return <span data-testid={THIS_TEST_ID} data-obj={JSON.stringify(transform(results))}></span>
  }
  Component.displayName = name

  return {
    getResult: () =>
      JSON.parse(screen.getByTestId(THIS_TEST_ID).dataset['obj'] ?? '{}') as Partial<
        ReturnType<typeof transform>
      >,
    refetch: () => act(() => _refetch()),
    Component,
  }
}

const wait = (timeout: number) => new Promise((res) => setTimeout(() => res(undefined), timeout))
describe('remoteStore', () => {
  beforeEach(() => {
    __mockIsClient__(true)
  })

  it('fires a fetch on the client', async () => {
    const query = jest.fn(async (num: number) => num)
    const remoteStore = createRemoteStore('fetchingStore', query)

    const Component = () => {
      const { fetching, result } = remoteStore.useRemoteStore(5)
      return <span data-testid={TEST_ID} data-obj={JSON.stringify({ fetching, result })}></span>
    }
    render(<Component />)
    let el = screen.getByTestId(TEST_ID)
    let obj = JSON.parse(el.dataset['obj'] ?? '')
    expect(obj.fetching).toBe(true)
    expect(query).toHaveBeenCalledWith(5)
    expect(query).toHaveBeenCalledTimes(1)
    el = await waitFor(() => screen.getByTestId(TEST_ID))
    obj = JSON.parse(el.dataset['obj'] ?? '')
    expect(obj).toEqual({ fetching: false, result: 5 })
  })

  it('does not fire a fetch on the server', async () => {
    __mockIsClient__(false)
    const query = jest.fn(async (num: number) => num)
    const remoteStore = createRemoteStore('fetchingStore', query)
    const Component = () => {
      const { fetching, result } = remoteStore.useRemoteStore(5)
      return <span data-testid={TEST_ID} data-obj={JSON.stringify({ fetching, result })}></span>
    }
    render(<Component />)
    let el = screen.getByTestId(TEST_ID)
    let obj = JSON.parse(el.dataset['obj'] ?? '')
    expect(obj.fetching).toBe(true)
    expect(query).toHaveBeenCalledTimes(0)
  })

  it('fetchQuery fetches the query', async () => {
    const fn = jest.fn(async (arg?: string) => arg ?? DEFAULT)
    const ds = createRemoteStore('ds', fn)
    const [resWithoutArg, resWithArg] = await Promise.all([ds.fetchQuery(), ds.fetchQuery('arg')])

    expect(fn.mock.calls).toHaveLength(2)
    expect(resWithoutArg).toBe(DEFAULT)
    expect(resWithArg).toBe('arg')
  })

  it('gets the async data set', async () => {
    const fn = jest.fn(async (arg?: string) => arg ?? DEFAULT)
    const ds = createRemoteStore('ds', fn)
    await Promise.all([ds.fetchQuery(), ds.fetchQuery('arg')])

    expect(ds.getRemoteStore()).toEqual({
      result: DEFAULT,
      fetching: false,
      error: undefined,
    })

    expect(ds.getRemoteStore('arg')).toEqual({
      result: 'arg',
      fetching: false,
      error: undefined,
    })

    expect(ds.getRemoteStore('other')).toEqual({
      result: undefined,
      fetching: false,
      error: undefined,
    })
  })

  describe('createDerivedRemoteStore', () => {
    it('fetches the transformed data, sync transform', async () => {
      const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
      const parent = createRemoteStore('parent', fn)
      const child = parent.createDerivedRemoteStore('child', (state) => state + 1)
      const result = await child.fetchQuery(1, 2)
      expect(result).toBe(4)
      expect(fn).toBeCalledTimes(1)
    })

    it('fetches the transformed data, async transform', async () => {
      const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
      const parent = createRemoteStore('parent', fn)

      // there are a few nested async functions inside of fetchQuery, so we need to queue the timeout before we create the
      // derived createRemoteStore
      const timeout = wait(500)
      const child = parent.createDerivedRemoteStore('child', async (state) => {
        await timeout
        return state + 1
      })
      const resultPromise = child.fetchQuery(1, 2)
      jest.runAllTimers()
      expect(await resultPromise).toBe(4)
      expect(fn).toBeCalledTimes(1)
    })
  })

  describe('hook', () => {
    describe('fetch', () => {
      it('fetches with no arg', async () => {
        const fn = jest.fn(async () => DEFAULT)
        const ds = createRemoteStore('ds', fn)
        const { result, waitForNextUpdate } = renderHook(() => ds.useRemoteStore())

        expect(result.current?.fetching).toBe(true)
        expect(result.current?.result).toBeUndefined()

        await waitForNextUpdate()

        expect(result.current?.fetching).toBe(false)
        expect(result.current?.result).toBe(DEFAULT)
      })

      it('fetches with arg', async () => {
        const fn = jest.fn(async (arg: string) => arg)
        const ds = createRemoteStore('ds', fn)
        const { result, waitForNextUpdate } = renderHook(() => ds.useRemoteStore('arg'))

        expect(result.current?.fetching).toBe(true)
        expect(result.current?.result).toBeUndefined()

        await waitForNextUpdate()

        expect(result.current?.fetching).toBe(false)
        expect(result.current?.result).toBe('arg')
      })

      it('fetches with getter function', async () => {
        const fn = jest.fn(async () => ({
          a: {
            b: {
              c: 5,
            },
          },
        }))
        const ds = createRemoteStore('ds', fn)
        const { result, waitForNextUpdate } = renderHook(() =>
          ds.useRemoteStoreWithGetter((state) => state?.a.b.c)
        )

        expect(result.current?.fetching).toBe(true)
        expect(result.current?.result).toBeUndefined()

        await waitForNextUpdate()

        expect(result.current?.fetching).toBe(false)
        expect(result.current?.result).toBe(5)
      })

      it('throws when fetch fails', async () => {
        const fn = jest.fn(async () => {
          throw new Error('error')
        })

        const ds = createRemoteStore('ds', fn)
        const { result, waitForNextUpdate } = renderHook(() => ds.useRemoteStore())

        await waitForNextUpdate()
        expect(result.current.error).not.toBeUndefined()
      })
    })

    describe('refetch', () => {
      it('refetches with no arg', async () => {
        let counter = 0
        const fn = jest.fn(() => new Promise((res) => setTimeout(() => res(++counter), 10)))
        const ds = createRemoteStore('ds', fn)
        const { result, waitFor } = renderHook(() => ds.useRemoteStore())

        jest.runAllTimers()

        await waitFor(() => {
          expect(result.current?.fetching).toBe(false)
          expect(result.current?.result).toBe(1)
        })

        act(() => result.current?.refetch())

        await waitFor(() => {
          expect(result.current?.fetching).toBe(true)
          expect(result.current?.result).toBe(1)
        })

        jest.runAllTimers()

        await waitFor(() => {
          expect(result.current?.fetching).toBe(false)
          expect(result.current?.result).toBe(2)
        })
      })

      it('refetches with arg', async () => {
        let counter = 0
        const fn = jest.fn(
          (arg: number) => new Promise((res) => setTimeout(() => res(++counter + arg), 10))
        )
        const ds = createRemoteStore('ds', fn)
        const { result, waitFor } = renderHook(() => ds.useRemoteStore(5))

        jest.runAllTimers()

        await waitFor(() => {
          expect(result.current?.fetching).toBe(false)
          expect(result.current?.result).toBe(6)
        })

        act(() => result.current?.refetch())

        await waitFor(() => {
          expect(result.current?.fetching).toBe(true)
          expect(result.current?.result).toBe(6)
        })

        jest.runAllTimers()

        await waitFor(() => {
          expect(result.current?.fetching).toBe(false)
          expect(result.current?.result).toBe(7)
        })
      })
    })

    describe('cache', () => {
      it('only fetches once when request with same args is in flight', async () => {
        let counter = 0
        const fn = jest.fn(async () => {
          await wait(Math.random() * 100 + 60)
          return ++counter
        })
        const rs = createRemoteStore('rs', fn)
        const { Component: Component1, ...hookHandle1 } = runHook(rs.useRemoteStore)
        const { Component: Component2, ...hookHandle2 } = runHook(rs.useRemoteStore)

        render(
          <div key="d">
            <Component1 key="C1" />
            <Component2 key="C2" />
          </div>
        )
        {
          const hook1 = hookHandle1.getResult()
          expect(hook1.fetching).toBe(true)
          expect(hook1.result).toBeUndefined()

          const hook2 = hookHandle2.getResult()
          expect(hook2.fetching).toBe(true)
          expect(hook2.result).toBeUndefined()
        }

        jest.runAllTimers()

        await waitFor(() => {
          const hook1 = hookHandle1.getResult()
          expect(hook1.fetching).toBe(false)
          expect(hook1.result).toBe(1)

          const hook2 = hookHandle2.getResult()
          expect(hook2.fetching).toBe(false)
          expect(hook2.result).toBe(1)
        })

        expect(fn.mock.calls).toHaveLength(1)
      })

      it('fetches concurrently with different args', async () => {
        const fn = jest.fn(async (arg: number) => {
          await wait(Math.random() * 300 + 60)
          return Math.pow(arg, 2)
        })
        const rs = createRemoteStore('rs', fn)
        const { Component: Component1, ...hookHandle1 } = runHook(rs.useRemoteStore, 2)
        const { Component: Component2, ...hookHandle2 } = runHook(rs.useRemoteStore, 2)
        const { Component: Component3, ...hookHandle3 } = runHook(rs.useRemoteStore, 3)

        render(
          <div key="d">
            <Component1 key="C1" />
            <Component2 key="C2" />
            <Component3 key="C3" />
          </div>
        )

        {
          const hook1 = hookHandle1.getResult()
          expect(hook1.fetching).toBe(true)
          expect(hook1.result).toBeUndefined()

          const hook2 = hookHandle2.getResult()
          expect(hook2.fetching).toBe(true)
          expect(hook2.result).toBeUndefined()

          const hook3 = hookHandle3.getResult()
          expect(hook3.fetching).toBe(true)
          expect(hook3.result).toBeUndefined()
        }

        jest.runAllTimers()

        await waitFor(() => {
          const hook1 = hookHandle1.getResult()
          expect(hook1.fetching).toBe(false)
          expect(hook1.result).toBe(4)

          const hook2 = hookHandle2.getResult()
          expect(hook2.fetching).toBe(false)
          expect(hook2.result).toBe(4)

          const hook3 = hookHandle3.getResult()
          expect(hook3.fetching).toBe(false)
          expect(hook3.result).toBe(9)
        })

        expect(fn.mock.calls).toHaveLength(2)
      })

      it('does not fetch if cache is not stale', async () => {
        const fn = jest.fn(async () => 5)
        const rs = createRemoteStore('rs', fn, { cacheMs: 1000000 })

        const { Component: Component1, ...hookHandle1 } = runHook(rs.useRemoteStore)
        const renderResult = render(
          <div key="d">
            <Component1 key="C1" />
          </div>
        )

        {
          const hook1 = hookHandle1.getResult()
          expect(hook1.fetching).toBe(true)
          expect(hook1.result).toBeUndefined()
        }

        jest.runAllTimers()

        await waitFor(() => {
          const hook1 = hookHandle1.getResult()
          expect(hook1.fetching).toBe(false)
          expect(hook1.result).toBe(5)
        })

        jest.advanceTimersByTime(1000)

        const { Component: Component2, ...hookHandle2 } = runHook(rs.useRemoteStore)
        renderResult.rerender(
          <div key="d">
            <Component1 key="C1" />
            <Component2 key="C2" />
          </div>
        )

        {
          const hook2 = hookHandle2.getResult()
          expect(hook2.fetching).toBe(false)
          expect(hook2.result).toBe(5)
        }

        expect(fn.mock.calls).toHaveLength(1)
      })

      it('fetches again on rerender when cache is stale', async () => {
        let i = 0
        const fn = jest.fn(async () => 5 * ++i)
        const ds = createRemoteStore('ds', fn, { cacheMs: 500 })

        const hook1 = renderHook(() => ds.useRemoteStore())

        expect(hook1.result.current?.fetching).toBe(true)
        expect(hook1.result.current?.result).toBeUndefined()

        await hook1.waitFor(() => {
          expect(hook1.result.current?.fetching).toBe(false)
          expect(hook1.result.current?.result).toBe(5)
        })

        jest.advanceTimersByTime(10000)

        act(() => hook1.rerender())

        expect(hook1.result.current?.fetching).toBe(true)
        expect(hook1.result.current?.result).toBe(5)

        await hook1.waitFor(() => {
          expect(hook1.result.current?.fetching).toBe(false)
          expect(hook1.result.current?.result).toBe(10)
        })

        expect(fn.mock.calls).toHaveLength(2)
      })

      it('fetches again on new component mount when cache is stale', async () => {
        const fn = jest.fn(async () => 5)
        const rs = createRemoteStore('rs', fn, { cacheMs: 500 })

        const { Component: Component1, ...hookHandle1 } = runHook(rs.useRemoteStore)

        const renderResult = render(
          <div key="d">
            <Component1 key="C1" />
          </div>
        )

        {
          const hook1 = hookHandle1.getResult()
          expect(hook1.fetching).toBe(true)
          expect(hook1.result).toBeUndefined()
        }

        await waitFor(() => {
          const hook1 = hookHandle1.getResult()
          expect(hook1.fetching).toBe(false)
          expect(hook1.result).toBe(5)
        })

        jest.advanceTimersByTime(10000)

        const { Component: Component2, ...hookHandle2 } = runHook(rs.useRemoteStore)

        renderResult.rerender(
          <div key="d">
            <Component1 key="C1" />
            <Component2 key="C2" />
          </div>
        )

        {
          const hook1 = hookHandle1.getResult()
          expect(hook1.fetching).toBe(true)
          expect(hook1.result).toBe(5)

          const hook2 = hookHandle2.getResult()
          expect(hook2.fetching).toBe(true)
          expect(hook2.result).toBe(5)
        }

        await waitFor(() => {
          const hook1 = hookHandle1.getResult()
          expect(hook1.fetching).toBe(false)
          expect(hook1.result).toBe(5)

          const hook2 = hookHandle2.getResult()
          expect(hook2.fetching).toBe(false)
          expect(hook2.result).toBe(5)
        })

        expect(fn.mock.calls).toHaveLength(2)
      })

      describe('argument types', () => {
        it('caches correctly with an object as the argument', async () => {
          const fn = jest.fn(async (arg: { b: number; a: string }) => arg.a)
          const rs = createRemoteStore('rs', fn, { cacheMs: 500 })

          const { Component: Component1, ...hookHandle1 } = runHook(rs.useRemoteStore, {
            b: 1,
            a: 'a',
          })
          const { Component: Component2, ...hookHandle2 } = runHook(rs.useRemoteStore, {
            a: 'a',
            b: 1,
          })
          const { Component: Component3, ...hookHandle3 } = runHook(rs.useRemoteStore, {
            a: 'b',
            b: 1,
          })

          render(
            <div key="d">
              <Component1 key="C1" />
              <Component2 key="C2" />
              <Component3 key="C3" />
            </div>
          )

          await waitFor(() => {
            expect(hookHandle1.getResult().result).toBe('a')
            expect(hookHandle2.getResult().result).toBe('a')
            expect(hookHandle3.getResult().result).toBe('b')
          })

          expect(fn).toBeCalledTimes(2)
        })

        it('caches correctly with a Map as the argument', async () => {
          const fn = jest.fn(async (arg: Map<string, number>) => arg.get('abc'))
          const rs = createRemoteStore('rs', fn, { cacheMs: 500 })

          const map1 = new Map()
          map1.set('abc', 1)
          map1.set('cde', 2)
          const map2 = new Map()
          map2.set('cde', 2)
          map2.set('abc', 1)
          const map3 = new Map()
          map3.set('cde', 2)
          map3.set('abc', 1)
          map3.set('abcd', 11)

          const { Component: Component1, ...hookHandle1 } = runHook(rs.useRemoteStore, map1)
          const { Component: Component2, ...hookHandle2 } = runHook(rs.useRemoteStore, map2)
          const { Component: Component3, ...hookHandle3 } = runHook(rs.useRemoteStore, map3)

          render(
            <div key="d">
              <Component1 key="C1" />
              <Component2 key="C2" />
              <Component3 key="C3" />
            </div>
          )

          await waitFor(() => {
            expect(hookHandle1.getResult().result).toBe(1)
            expect(hookHandle2.getResult().result).toBe(1)
            expect(hookHandle3.getResult().result).toBe(1)
          })

          expect(fn).toBeCalledTimes(2)
        })

        it('caches correctly with a Set as the argument', async () => {
          const fn = jest.fn(async (arg: Set<string>) => arg.has('abc'))
          const rs = createRemoteStore('rs', fn, { cacheMs: 500 })

          const set1 = new Set<string>()
          set1.add('abc')
          set1.add('cde')
          const set2 = new Set<string>()
          set2.add('cde')
          set2.add('abc')
          const set3 = new Set<string>()
          set3.add('cde')
          set3.add('abc')
          set3.add('abcd')

          const { Component: Component1, ...hookHandle1 } = runHook(rs.useRemoteStore, set1)
          const { Component: Component2, ...hookHandle2 } = runHook(rs.useRemoteStore, set2)
          const { Component: Component3, ...hookHandle3 } = runHook(rs.useRemoteStore, set3)

          render(
            <div key="d">
              <Component1 key="C1" />
              <Component2 key="C2" />
              <Component3 key="C3" />
            </div>
          )

          await waitFor(() => {
            expect(hookHandle1.getResult().result).toBe(true)
            expect(hookHandle2.getResult().result).toBe(true)
            expect(hookHandle3.getResult().result).toBe(true)
          })
          expect(fn).toBeCalledTimes(2)
        })

        it('caches correctly with an Array as the argument', async () => {
          const fn = jest.fn(async (arg: string[]) => arg[0])
          const rs = createRemoteStore('rs', fn, { cacheMs: 500 })

          const { Component: Component1, ...hookHandle1 } = runHook(rs.useRemoteStore, [
            'abc',
            'cde',
          ])
          const { Component: Component2, ...hookHandle2 } = runHook(rs.useRemoteStore, [
            'abc',
            'cde',
          ])
          const { Component: Component3, ...hookHandle3 } = runHook(rs.useRemoteStore, [
            'abc',
            'cde',
            'edg',
          ])

          render(
            <div key="d">
              <Component1 key="C1" />
              <Component2 key="C2" />
              <Component3 key="C3" />
            </div>
          )

          await waitFor(() => {
            expect(hookHandle1.getResult().result).toBe('abc')
            expect(hookHandle2.getResult().result).toBe('abc')
            expect(hookHandle3.getResult().result).toBe('abc')
          })

          expect(fn).toBeCalledTimes(2)
        })

        it('caches with all types', async () => {
          const fn = jest.fn(
            async (
              num: number,
              _string: string,
              _bool: boolean,
              _arr: string[],
              _obj: { num: number; string: string },
              _set: Set<string>,
              _map: Map<string, number>
            ) => num
          )
          const rs = createRemoteStore('rs', fn, { cacheMs: 500 })

          const map1 = new Map()
          map1.set('abc', 1)
          map1.set('cde', 2)
          const map2 = new Map()
          map2.set('cde', 2)
          map2.set('abc', 1)
          const map3 = new Map()
          map3.set('cde', 2)
          map3.set('abc', 1)
          map3.set('abcd', 11)

          const set1 = new Set<string>()
          set1.add('abc')
          set1.add('cde')
          const set2 = new Set<string>()
          set2.add('cde')
          set2.add('abc')
          const set3 = new Set<string>()
          set3.add('cde')
          set3.add('abc')
          set3.add('abcd')

          const { Component: Component1, ...hookHandle1 } = runHook(
            rs.useRemoteStore,
            1,
            'a',
            true,
            ['abc', 'cde'],
            { string: 'a', num: 1 },
            set1,
            map1
          )
          const { Component: Component2, ...hookHandle2 } = runHook(
            rs.useRemoteStore,
            1,
            'a',
            true,
            ['abc', 'cde'],
            { num: 1, string: 'a' },
            set2,
            map2
          )
          const { Component: Component3, ...hookHandle3 } = runHook(
            rs.useRemoteStore,
            2,
            'b',
            false,
            ['abc', 'cde', 'zxc'],
            { string: 'b', num: 1 },
            set3,
            map3
          )

          render(
            <div key="d">
              <Component1 key="C1" />
              <Component2 key="C2" />
              <Component3 key="C3" />
            </div>
          )

          await waitFor(() => {
            expect(hookHandle1.getResult().result).toBe(1)
            expect(hookHandle2.getResult().result).toBe(1)
            expect(hookHandle3.getResult().result).toBe(2)
          })

          expect(fn).toBeCalledTimes(2)
        })
      })
    })

    describe('createDerivedRemoteStore', () => {
      describe('prefetch', () => {
        it('uses the parent cache', async () => {
          const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
          const parent = createRemoteStore('parent', fn, { cacheMs: 1000 })

          const child = parent.createDerivedRemoteStore('child', async (state) => {
            return state + 1
          })
          await parent.fetchQuery(1, 2)

          jest.advanceTimersByTime(500)

          const { result, waitForNextUpdate } = renderHook(() => child.useRemoteStore(1, 2))
          await waitForNextUpdate()

          expect(result.current?.fetching).toBe(false)
          expect(result.current?.result).toBe(4)
          expect(fn).toBeCalledTimes(1)
        })

        it('uses the parent cache triggered by second child', async () => {
          const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
          const parent = createRemoteStore('parent', fn, { cacheMs: 1000 })

          const child1 = parent.createDerivedRemoteStore('child', async (state) => {
            return state + 1
          })
          const child2 = parent.createDerivedRemoteStore('child', async (state) => {
            return state + 2
          })
          expect(await child1.fetchQuery(1, 2)).toEqual(4)

          jest.advanceTimersByTime(500)

          const { result, waitForNextUpdate } = renderHook(() => child2.useRemoteStore(1, 2))
          await waitForNextUpdate()

          expect(result.current?.fetching).toBe(false)
          expect(result.current?.result).toBe(5)
          expect(fn).toBeCalledTimes(1)
        })

        it('doesnt uses the parent if stale cache', async () => {
          const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
          const parent = createRemoteStore('parent', fn, { cacheMs: 1000 })

          const child = parent.createDerivedRemoteStore('child', async (state) => {
            return state + 1
          })
          await parent.fetchQuery(1, 2)

          jest.advanceTimersByTime(2000)

          const { result, waitForNextUpdate } = renderHook(() => child.useRemoteStore(1, 2))
          await waitForNextUpdate()

          expect(result.current?.fetching).toBe(false)
          expect(result.current?.result).toBe(4)
          expect(fn).toBeCalledTimes(2)
        })

        it('doesnt uses the parent cache triggered by second child if stale cache', async () => {
          const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
          const parent = createRemoteStore('parent', fn, { cacheMs: 1000 })

          const child1 = parent.createDerivedRemoteStore('child', async (state) => {
            return state + 1
          })
          const child2 = parent.createDerivedRemoteStore('child', async (state) => {
            return state + 2
          })
          expect(await child1.fetchQuery(1, 2)).toEqual(4)

          jest.advanceTimersByTime(2000)

          const { result, waitForNextUpdate } = renderHook(() => child2.useRemoteStore(1, 2))
          await waitForNextUpdate()

          expect(result.current?.fetching).toBe(false)
          expect(result.current?.result).toBe(5)
          expect(fn).toBeCalledTimes(2)
        })

        it('fetches once if fetch is in flight', async () => {
          const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
          const parent = createRemoteStore('parent', fn, { cacheMs: 0 })

          const child = parent.createDerivedRemoteStore('child', async (state) => {
            return state + 1
          })
          const { result, waitForNextUpdate } = renderHook(() => child.useRemoteStore(1, 2))
          const [parentResult] = await Promise.all([parent.fetchQuery(1, 2), waitForNextUpdate()])
          expect(parentResult).toEqual(3)

          expect(result.current?.fetching).toBe(false)
          expect(result.current?.result).toBe(4)
          expect(fn).toBeCalledTimes(1)
        })
      })

      describe('hook', () => {
        it('uses the parent cache', async () => {
          const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
          const parent = createRemoteStore('parent', fn, { cacheMs: 1000 })

          const child = parent.createDerivedRemoteStore('child', async (state) => {
            return state + 1
          })

          const { Component: ParentComponent, ...parentHookHandle } = runHook(
            parent.useRemoteStore,
            1,
            2
          )
          const renderHandle = render(
            <div key="d">
              <ParentComponent key="Parent" />
            </div>
          )

          await waitFor(() => {
            const { result } = parentHookHandle.getResult()
            expect(result).toEqual(3)
          })

          jest.advanceTimersByTime(500)

          const { Component: ChildComponent, ...childHookHandle } = runHook(
            child.useRemoteStore,
            1,
            2
          )

          renderHandle.rerender(
            <div key="d">
              <ParentComponent key="Parent" />
              <ChildComponent key="Child" />
            </div>
          )

          await waitFor(() => {
            expect(parentHookHandle.getResult().result).toEqual(3)

            const { result, fetching } = childHookHandle.getResult()
            expect(fetching).toBe(false)
            expect(result).toBe(4)
          })

          expect(fn).toBeCalledTimes(1)
        })

        it('uses the parent cache when triggered by second child', async () => {
          const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
          const parent = createRemoteStore('parent', fn, { cacheMs: 1000 })

          const child1 = parent.createDerivedRemoteStore('child', async (state) => {
            return state + 1
          })
          const child2 = parent.createDerivedRemoteStore('child', async (state) => {
            return state + 2
          })

          const { Component: Child1Component, ...child1HookHandle } = runHook(
            child1.useRemoteStore,
            1,
            2
          )

          const renderHandle = render(
            <div key="d">
              <Child1Component key="Child1" />
            </div>
          )

          await waitFor(() => {
            const { result } = child1HookHandle.getResult()
            expect(result).toEqual(4)
          })

          jest.advanceTimersByTime(500)

          const { Component: Child2Component, ...child2HookHandle } = runHook(
            child2.useRemoteStore,
            1,
            2
          )

          renderHandle.rerender(
            <div key="d">
              <Child1Component key="Child1" />
              <Child2Component key="Child2" />
            </div>
          )

          await waitFor(() => {
            const { result, fetching } = child2HookHandle.getResult()
            expect(fetching).toBe(false)
            expect(result).toBe(5)
          })

          expect(fn).toBeCalledTimes(1)
        })

        it('doesnt uses the parent if stale cache', async () => {
          const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
          const parent = createRemoteStore('parent', fn, { cacheMs: 1000 })

          const child = parent.createDerivedRemoteStore('child', async (state) => {
            return state + 1
          })

          const { Component: ParentComponent, ...parentHookHandle } = runHook(
            parent.useRemoteStore,
            1,
            2
          )
          const renderHandle = render(
            <div key="d">
              <ParentComponent key="Parent" />
            </div>
          )

          await waitFor(() => {
            const { result } = parentHookHandle.getResult()
            expect(result).toEqual(3)
          })

          jest.advanceTimersByTime(2000)

          const { Component: ChildComponent, ...childHookHandle } = runHook(
            child.useRemoteStore,
            1,
            2
          )

          renderHandle.rerender(
            <div key="d">
              <ParentComponent key="Parent" />
              <ChildComponent key="Child" />
            </div>
          )

          await waitFor(() => {
            const { result, fetching } = childHookHandle.getResult()
            expect(result).toEqual(4)
            expect(fetching).toEqual(false)
          })

          expect(fn).toBeCalledTimes(2)
        })

        it('doesnt uses the parent cache triggered by second child if stale cache', async () => {
          const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
          const parent = createRemoteStore('parent', fn, { cacheMs: 1000 })

          const child1 = parent.createDerivedRemoteStore('child', async (state) => {
            return state + 1
          })
          const child2 = parent.createDerivedRemoteStore('child', async (state) => {
            return state + 2
          })

          const { Component: Child1Component, ...child1HookHandle } = runHook(
            child1.useRemoteStore,
            1,
            2
          )

          const renderHandle = render(
            <div key="d">
              <Child1Component key="Child1" />
            </div>
          )

          await waitFor(() => {
            const { result } = child1HookHandle.getResult()
            expect(result).toEqual(4)
          })

          jest.advanceTimersByTime(2000)
          const { Component: Child2Component, ...child2HookHandle } = runHook(
            child2.useRemoteStore,
            1,
            2
          )

          renderHandle.rerender(
            <div key="d">
              <Child1Component key="Child1" />
              <Child2Component key="Child2" />
            </div>
          )

          await waitFor(() => {
            const { result, fetching } = child2HookHandle.getResult()
            expect(fetching).toBe(false)
            expect(result).toBe(5)
          })

          expect(fn).toBeCalledTimes(2)
        })

        it('fetches once if fetch is in flight', async () => {
          const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
          const parent = createRemoteStore('parent', fn, { cacheMs: 0 })

          const child = parent.createDerivedRemoteStore('child', async (state) => {
            return state + 1
          })

          const { Component: ParentComponent, ...parentHookHandle } = runHook(
            parent.useRemoteStore,
            1,
            2
          )

          const { Component: ChildComponent, ...childHookHandle } = runHook(
            child.useRemoteStore,
            1,
            2
          )

          const renderHandle = render(
            <div key="d">
              <ParentComponent key="Parent" />
              <ChildComponent key="Child" />
            </div>
          )

          await waitFor(() => {
            expect(parentHookHandle.getResult().result).toEqual(3)

            const childResult = childHookHandle.getResult()
            expect(childResult.fetching).toBe(false)
            expect(childResult.result).toBe(4)
          })

          expect(fn).toBeCalledTimes(1)
        })
      })
    })
  })
})
