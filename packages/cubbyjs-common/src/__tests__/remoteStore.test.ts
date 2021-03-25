// jest.useFakeTimers('modern')

// import { act, renderHook } from '@testing-library/preact-hooks'

// import { asyncDataSet } from '../remoteStore'
// import { clearClientSerializeIdsCache, __mockCache__ } from '../store'
// const DEFAULT = 'default'

// const wait = (ms: number) => new Promise<void>((res) => setTimeout(res, ms))

// describe('asyncDataSet', () => {
//   beforeEach(() => {
//     __mockCache__({})
//     clearClientSerializeIdsCache()
//   })

//   it('fetchQuery fetches the query', async () => {
//     const fn = jest.fn(async (arg?: string) => arg ?? DEFAULT)
//     const ds = asyncDataSet('ds', fn)
//     const [resWithoutArg, resWithArg] = await Promise.all([ds.fetchQuery(), ds.fetchQuery('arg')])

//     expect(fn.mock.calls).toHaveLength(2)
//     expect(resWithoutArg).toBe(DEFAULT)
//     expect(resWithArg).toBe('arg')
//   })

//   it('gets the async data set', async () => {
//     const fn = jest.fn(async (arg?: string) => arg ?? DEFAULT)
//     const ds = asyncDataSet('ds', fn)
//     await Promise.all([ds.fetchQuery(), ds.fetchQuery('arg')])

//     expect(ds.getAsyncDataSet()).toEqual({
//       result: DEFAULT,
//       fetching: false,
//       error: undefined,
//     })

//     expect(ds.getAsyncDataSet('arg')).toEqual({
//       result: 'arg',
//       fetching: false,
//       error: undefined,
//     })

//     expect(ds.getAsyncDataSet('other')).toEqual({
//       result: undefined,
//       fetching: false,
//       error: undefined,
//     })
//   })

//   describe('createDerivedAsyncDataSet', () => {
//     it('fetches the transformed data, sync transform', async () => {
//       const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
//       const parent = asyncDataSet('parent', fn)
//       const child = parent.createDerivedAsyncDataSet('child', (state) => state + 1)
//       const result = await child.fetchQuery(1, 2)
//       expect(result).toBe(4)
//       expect(fn).toBeCalledTimes(1)
//     })

//     it('fetches the transformed data, async transform', async () => {
//       const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
//       const parent = asyncDataSet('parent', fn)

//       // there are a few nested async functions inside of fetchQuery, so we need to queue the timeout before we create the
//       // derived asyncDataSet
//       const timeout = wait(500)
//       const child = parent.createDerivedAsyncDataSet('child', async (state) => {
//         await timeout
//         return state + 1
//       })
//       const resultPromise = child.fetchQuery(1, 2)
//       jest.runAllTimers()
//       expect(await resultPromise).toBe(4)
//       expect(fn).toBeCalledTimes(1)
//     })
//   })

//   describe('hook', () => {
//     describe('fetch', () => {
//       it('fetches with no arg', async () => {
//         const fn = jest.fn(async () => DEFAULT)
//         const ds = asyncDataSet('ds', fn)
//         const { result, waitForNextUpdate } = renderHook(() => ds.useAsyncDataSet())

//         expect(result.current?.fetching).toBe(true)
//         expect(result.current?.result).toBeUndefined()

//         await waitForNextUpdate()

//         expect(result.current?.fetching).toBe(false)
//         expect(result.current?.result).toBe(DEFAULT)
//       })

//       it('fetches with arg', async () => {
//         const fn = jest.fn(async (arg: string) => arg)
//         const ds = asyncDataSet('ds', fn)
//         const { result, waitForNextUpdate } = renderHook(() => ds.useAsyncDataSet('arg'))

//         expect(result.current?.fetching).toBe(true)
//         expect(result.current?.result).toBeUndefined()

//         await waitForNextUpdate()

//         expect(result.current?.fetching).toBe(false)
//         expect(result.current?.result).toBe('arg')
//       })

//       it('fetches with getter function', async () => {
//         const fn = jest.fn(async () => ({
//           a: {
//             b: {
//               c: 5,
//             },
//           },
//         }))
//         const ds = asyncDataSet('ds', fn)
//         const { result, waitForNextUpdate } = renderHook(() =>
//           ds.useAsyncDataSetWithGetter((state) => state?.a.b.c)
//         )

//         expect(result.current?.fetching).toBe(true)
//         expect(result.current?.result).toBeUndefined()

//         await waitForNextUpdate()

//         expect(result.current?.fetching).toBe(false)
//         expect(result.current?.result).toBe(5)
//       })

//       it('throws when fetch fails', async () => {
//         const fn = jest.fn(async () => {
//           throw new Error('error')
//         })

//         const ds = asyncDataSet('ds', fn)
//         const { result, waitForNextUpdate } = renderHook(() => {
//           ds.useAsyncDataSet()
//         })

//         await waitForNextUpdate()
//         expect(result.error).not.toBeUndefined()
//       })
//     })

//     describe('refetch', () => {
//       it('refetches with no arg', async () => {
//         let counter = 0
//         const fn = jest.fn(() => new Promise((res) => setTimeout(() => res(++counter), 10)))
//         const ds = asyncDataSet('ds', fn)
//         const { result, waitForNextUpdate } = renderHook(() => ds.useAsyncDataSet())

//         jest.runAllTimers()

//         await waitForNextUpdate()

//         expect(result.current?.fetching).toBe(false)
//         expect(result.current?.result).toBe(1)

//         result.current?.refetch()

//         await waitForNextUpdate()

//         expect(result.current?.fetching).toBe(true)
//         expect(result.current?.result).toBe(1)

//         jest.runAllTimers()

//         await waitForNextUpdate()

//         expect(result.current?.fetching).toBe(false)
//         expect(result.current?.result).toBe(2)
//       })

//       it('refetches with arg', async () => {
//         let counter = 0
//         const fn = jest.fn(
//           (arg: number) => new Promise((res) => setTimeout(() => res(++counter + arg), 10))
//         )
//         const ds = asyncDataSet('ds', fn)
//         const { result, waitForNextUpdate } = renderHook(() => ds.useAsyncDataSet(5))

//         jest.runAllTimers()

//         await waitForNextUpdate()

//         expect(result.current?.fetching).toBe(false)
//         expect(result.current?.result).toBe(6)

//         result.current?.refetch()

//         await waitForNextUpdate()

//         expect(result.current?.fetching).toBe(true)
//         expect(result.current?.result).toBe(6)

//         jest.runAllTimers()

//         await waitForNextUpdate()

//         expect(result.current?.fetching).toBe(false)
//         expect(result.current?.result).toBe(7)
//       })
//     })

//     describe('cache', () => {
//       it('only fetches once when request with same args is in flight', async () => {
//         let counter = 0
//         const fn = jest.fn(() => new Promise((res) => setTimeout(() => res(++counter), 10)))
//         const ds = asyncDataSet('ds', fn)
//         const hook1 = renderHook(() => ds.useAsyncDataSet())
//         const hook2 = renderHook(() => ds.useAsyncDataSet())

//         expect(hook1.result.current?.fetching).toBe(true)
//         expect(hook1.result.current?.result).toBeUndefined()
//         expect(hook2.result.current?.fetching).toBe(true)
//         expect(hook2.result.current?.result).toBeUndefined()
//         jest.runAllTimers()

//         await Promise.all([hook1.waitForNextUpdate(), hook2.waitForNextUpdate()])

//         expect(hook1.result.current?.fetching).toBe(false)
//         expect(hook1.result.current?.result).toBe(1)
//         expect(hook2.result.current?.fetching).toBe(false)
//         expect(hook2.result.current?.result).toBe(1)

//         expect(fn.mock.calls).toHaveLength(1)
//       })

//       it('fetches concurrently with different args', async () => {
//         const fn = jest.fn(
//           (arg: number) => new Promise((res) => setTimeout(() => res(Math.pow(arg, 2)), 50))
//         )
//         const ds = asyncDataSet('ds', fn)
//         const hook1 = renderHook(() => ds.useAsyncDataSet(2))
//         const hook2 = renderHook(() => ds.useAsyncDataSet(2))
//         const hook3 = renderHook(() => ds.useAsyncDataSet(3))

//         expect(hook1.result.current?.fetching).toBe(true)
//         expect(hook1.result.current?.result).toBeUndefined()
//         expect(hook2.result.current?.fetching).toBe(true)
//         expect(hook2.result.current?.result).toBeUndefined()
//         expect(hook3.result.current?.fetching).toBe(true)
//         expect(hook3.result.current?.result).toBeUndefined()
//         jest.runAllTimers()

//         await Promise.all([
//           hook1.waitForNextUpdate(),
//           hook2.waitForNextUpdate(),
//           hook3.waitForNextUpdate(),
//         ])

//         expect(hook1.result.current?.fetching).toBe(false)
//         expect(hook1.result.current?.result).toBe(4)
//         expect(hook2.result.current?.fetching).toBe(false)
//         expect(hook2.result.current?.result).toBe(4)
//         expect(hook3.result.current?.fetching).toBe(false)
//         expect(hook3.result.current?.result).toBe(9)

//         expect(fn.mock.calls).toHaveLength(2)
//       })

//       it('does not fetch if cache is not stale', async () => {
//         const fn = jest.fn(async () => 5)
//         const ds = asyncDataSet('ds', fn, { cacheMs: 1000000 })

//         const hook1 = renderHook(() => ds.useAsyncDataSet())
//         expect(hook1.result.current?.fetching).toBe(true)
//         expect(hook1.result.current?.result).toBeUndefined()

//         jest.runAllTimers()
//         await hook1.waitForNextUpdate()
//         expect(hook1.result.current?.fetching).toBe(false)
//         expect(hook1.result.current?.result).toBe(5)

//         jest.advanceTimersByTime(1000)

//         const hook2 = renderHook(() => ds.useAsyncDataSet())
//         expect(hook2.result.current?.fetching).toBe(false)
//         expect(hook2.result.current?.result).toBe(5)

//         expect(fn.mock.calls).toHaveLength(1)
//       })

//       // excluded due to failure caused by bug in preact-hooks-testing-library
//       // https://github.com/testing-library/preact-hooks-testing-library/issues/4
//       xit('fetches again on rerender when cache is stale', async () => {
//         let i = 0
//         const fn = jest.fn(async () => 5 * ++i)
//         const ds = asyncDataSet('ds', fn, { cacheMs: 500 })

//         const hook1 = renderHook(() => ds.useAsyncDataSet())

//         expect(hook1.result.current?.fetching).toBe(true)
//         expect(hook1.result.current?.result).toBeUndefined()
//         await hook1.waitForNextUpdate()

//         expect(hook1.result.current?.fetching).toBe(false)
//         expect(hook1.result.current?.result).toBe(5)

//         jest.advanceTimersByTime(10000)
//         hook1.rerender()

//         expect(hook1.result.current?.fetching).toBe(true)
//         expect(hook1.result.current?.result).toBe(5)

//         await hook1.waitForNextUpdate()

//         expect(hook1.result.current?.fetching).toBe(false)
//         expect(hook1.result.current?.result).toBe(10)

//         expect(fn.mock.calls).toHaveLength(2)
//       })

//       it('fetches again on new component mount when cache is stale', async () => {
//         const fn = jest.fn(async () => 5)
//         const ds = asyncDataSet('ds', fn, { cacheMs: 500 })

//         const hook1 = renderHook(() => ds.useAsyncDataSet())

//         expect(hook1.result.current?.fetching).toBe(true)
//         expect(hook1.result.current?.result).toBeUndefined()

//         await hook1.waitForNextUpdate()

//         expect(hook1.result.current?.fetching).toBe(false)
//         expect(hook1.result.current?.result).toBe(5)

//         jest.advanceTimersByTime(10000)

//         const hook2 = renderHook(() => ds.useAsyncDataSet())

//         expect(hook1.result.current?.fetching).toBe(true)
//         expect(hook1.result.current?.result).toBe(5)
//         expect(hook2.result.current?.fetching).toBe(true)
//         expect(hook2.result.current?.result).toBe(5)

//         await Promise.all([hook1.waitForNextUpdate(), hook2.waitForNextUpdate()])
//         expect(hook1.result.current?.fetching).toBe(false)
//         expect(hook1.result.current?.result).toBe(5)
//         expect(hook2.result.current?.fetching).toBe(false)
//         expect(hook2.result.current?.result).toBe(5)

//         expect(fn.mock.calls).toHaveLength(2)
//       })

//       describe('argument types', () => {
//         it('caches correctly with an object as the argument', async () => {
//           const fn = jest.fn(async (arg: { b: number; a: string }) => arg.a)
//           const ds = asyncDataSet('ds', fn, { cacheMs: 500 })

//           const hook1 = renderHook(() => ds.useAsyncDataSet({ b: 1, a: 'a' }))
//           const hook2 = renderHook(() => ds.useAsyncDataSet({ a: 'a', b: 1 }))
//           const hook3 = renderHook(() => ds.useAsyncDataSet({ a: 'b', b: 1 }))
//           await Promise.all([
//             hook1.waitForNextUpdate(),
//             hook2.waitForNextUpdate(),
//             hook3.waitForNextUpdate(),
//           ])

//           expect(hook1.result.current?.result).toBe('a')
//           expect(hook2.result.current?.result).toBe('a')
//           expect(hook3.result.current?.result).toBe('b')
//           expect(fn).toBeCalledTimes(2)
//         })

//         it('caches correctly with a Map as the argument', async () => {
//           const fn = jest.fn(async (arg: Map<string, number>) => arg.get('abc'))
//           const ds = asyncDataSet('ds', fn, { cacheMs: 500 })

//           const map1 = new Map()
//           map1.set('abc', 1)
//           map1.set('cde', 2)
//           const map2 = new Map()
//           map2.set('cde', 2)
//           map2.set('abc', 1)
//           const map3 = new Map()
//           map3.set('cde', 2)
//           map3.set('abc', 1)
//           map3.set('abcd', 11)
//           const hook1 = renderHook(() => ds.useAsyncDataSet(map1))
//           const hook2 = renderHook(() => ds.useAsyncDataSet(map2))
//           const hook3 = renderHook(() => ds.useAsyncDataSet(map3))
//           await Promise.all([
//             hook1.waitForNextUpdate(),
//             hook2.waitForNextUpdate(),
//             hook3.waitForNextUpdate(),
//           ])

//           expect(hook1.result.current?.result).toBe(1)
//           expect(hook2.result.current?.result).toBe(1)
//           expect(hook3.result.current?.result).toBe(1)
//           expect(fn).toBeCalledTimes(2)
//         })

//         it('caches correctly with a Set as the argument', async () => {
//           const fn = jest.fn(async (arg: Set<string>) => arg.has('abc'))
//           const ds = asyncDataSet('ds', fn, { cacheMs: 500 })

//           const set1 = new Set<string>()
//           set1.add('abc')
//           set1.add('cde')
//           const set2 = new Set<string>()
//           set2.add('cde')
//           set2.add('abc')
//           const set3 = new Set<string>()
//           set3.add('cde')
//           set3.add('abc')
//           set3.add('abcd')
//           const hook1 = renderHook(() => ds.useAsyncDataSet(set1))
//           const hook2 = renderHook(() => ds.useAsyncDataSet(set2))
//           const hook3 = renderHook(() => ds.useAsyncDataSet(set3))
//           await Promise.all([
//             hook1.waitForNextUpdate(),
//             hook2.waitForNextUpdate(),
//             hook3.waitForNextUpdate(),
//           ])

//           expect(hook1.result.current?.result).toBe(true)
//           expect(hook2.result.current?.result).toBe(true)
//           expect(hook3.result.current?.result).toBe(true)
//           expect(fn).toBeCalledTimes(2)
//         })

//         it('caches correctly with an Array as the argument', async () => {
//           const fn = jest.fn(async (arg: string[]) => arg[0])
//           const ds = asyncDataSet('ds', fn, { cacheMs: 500 })

//           const hook1 = renderHook(() => ds.useAsyncDataSet(['abc', 'cde']))
//           const hook2 = renderHook(() => ds.useAsyncDataSet(['abc', 'cde']))
//           const hook3 = renderHook(() => ds.useAsyncDataSet(['abc', 'cde', 'edg']))
//           await Promise.all([
//             hook1.waitForNextUpdate(),
//             hook2.waitForNextUpdate(),
//             hook3.waitForNextUpdate(),
//           ])

//           expect(hook1.result.current?.result).toBe('abc')
//           expect(hook2.result.current?.result).toBe('abc')
//           expect(hook3.result.current?.result).toBe('abc')
//           expect(fn).toBeCalledTimes(2)
//         })

//         it('caches with all types', async () => {
//           const fn = jest.fn(
//             async (
//               num: number,
//               _string: string,
//               _bool: boolean,
//               _arr: string[],
//               _obj: { num: number; string: string },
//               _set: Set<string>,
//               _map: Map<string, number>
//             ) => num
//           )
//           const ds = asyncDataSet('ds', fn, { cacheMs: 500 })

//           const map1 = new Map()
//           map1.set('abc', 1)
//           map1.set('cde', 2)
//           const map2 = new Map()
//           map2.set('cde', 2)
//           map2.set('abc', 1)
//           const map3 = new Map()
//           map3.set('cde', 2)
//           map3.set('abc', 1)
//           map3.set('abcd', 11)

//           const set1 = new Set<string>()
//           set1.add('abc')
//           set1.add('cde')
//           const set2 = new Set<string>()
//           set2.add('cde')
//           set2.add('abc')
//           const set3 = new Set<string>()
//           set3.add('cde')
//           set3.add('abc')
//           set3.add('abcd')

//           const hook1 = renderHook(() =>
//             ds.useAsyncDataSet(1, 'a', true, ['abc', 'cde'], { string: 'a', num: 1 }, set1, map1)
//           )
//           const hook2 = renderHook(() =>
//             ds.useAsyncDataSet(1, 'a', true, ['abc', 'cde'], { num: 1, string: 'a' }, set2, map2)
//           )
//           const hook3 = renderHook(() =>
//             ds.useAsyncDataSet(
//               2,
//               'b',
//               false,
//               ['abc', 'cde', 'zxc'],
//               { string: 'b', num: 1 },
//               set3,
//               map3
//             )
//           )
//           await Promise.all([
//             hook1.waitForNextUpdate(),
//             hook2.waitForNextUpdate(),
//             hook3.waitForNextUpdate(),
//           ])

//           expect(hook1.result.current?.result).toBe(1)
//           expect(hook2.result.current?.result).toBe(1)
//           expect(hook3.result.current?.result).toBe(2)
//           expect(fn).toBeCalledTimes(2)
//         })
//       })
//     })

//     describe('createDerivedAsyncDataSet', () => {
//       describe('prefetch', () => {
//         it('uses the parent cache', async () => {
//           const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
//           const parent = asyncDataSet('parent', fn, { cacheMs: 1000 })

//           const child = parent.createDerivedAsyncDataSet('child', async (state) => {
//             return state + 1
//           })
//           await parent.fetchQuery(1, 2)

//           jest.advanceTimersByTime(500)

//           const { result, waitForNextUpdate } = renderHook(() => child.useAsyncDataSet(1, 2))
//           await waitForNextUpdate()

//           expect(result.current?.fetching).toBe(false)
//           expect(result.current?.result).toBe(4)
//           expect(fn).toBeCalledTimes(1)
//         })

//         it('uses the parent cache triggered by second child', async () => {
//           const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
//           const parent = asyncDataSet('parent', fn, { cacheMs: 1000 })

//           const child1 = parent.createDerivedAsyncDataSet('child', async (state) => {
//             return state + 1
//           })
//           const child2 = parent.createDerivedAsyncDataSet('child', async (state) => {
//             return state + 2
//           })
//           expect(await child1.fetchQuery(1, 2)).toEqual(4)

//           jest.advanceTimersByTime(500)

//           const { result, waitForNextUpdate } = renderHook(() => child2.useAsyncDataSet(1, 2))
//           await waitForNextUpdate()

//           expect(result.current?.fetching).toBe(false)
//           expect(result.current?.result).toBe(5)
//           expect(fn).toBeCalledTimes(1)
//         })

//         it('doesnt uses the parent if stale cache', async () => {
//           const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
//           const parent = asyncDataSet('parent', fn, { cacheMs: 1000 })

//           const child = parent.createDerivedAsyncDataSet('child', async (state) => {
//             return state + 1
//           })
//           await parent.fetchQuery(1, 2)

//           jest.advanceTimersByTime(2000)

//           const { result, waitForNextUpdate } = renderHook(() => child.useAsyncDataSet(1, 2))
//           await waitForNextUpdate()

//           expect(result.current?.fetching).toBe(false)
//           expect(result.current?.result).toBe(4)
//           expect(fn).toBeCalledTimes(2)
//         })

//         it('doesnt uses the parent cache triggered by second child if stale cache', async () => {
//           const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
//           const parent = asyncDataSet('parent', fn, { cacheMs: 1000 })

//           const child1 = parent.createDerivedAsyncDataSet('child', async (state) => {
//             return state + 1
//           })
//           const child2 = parent.createDerivedAsyncDataSet('child', async (state) => {
//             return state + 2
//           })
//           expect(await child1.fetchQuery(1, 2)).toEqual(4)

//           jest.advanceTimersByTime(2000)

//           const { result, waitForNextUpdate } = renderHook(() => child2.useAsyncDataSet(1, 2))
//           await waitForNextUpdate()

//           expect(result.current?.fetching).toBe(false)
//           expect(result.current?.result).toBe(5)
//           expect(fn).toBeCalledTimes(2)
//         })

//         it('fetches once if fetch is in flight', async () => {
//           const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
//           const parent = asyncDataSet('parent', fn, { cacheMs: 0 })

//           const child = parent.createDerivedAsyncDataSet('child', async (state) => {
//             return state + 1
//           })
//           const { result, waitForNextUpdate } = renderHook(() => child.useAsyncDataSet(1, 2))
//           const [parentResult] = await Promise.all([parent.fetchQuery(1, 2), waitForNextUpdate()])
//           expect(parentResult).toEqual(3)

//           expect(result.current?.fetching).toBe(false)
//           expect(result.current?.result).toBe(4)
//           expect(fn).toBeCalledTimes(1)
//         })
//       })

//       describe('hook', () => {
//         it('uses the parent cache', async () => {
//           const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
//           const parent = asyncDataSet('parent', fn, { cacheMs: 1000 })

//           const child = parent.createDerivedAsyncDataSet('child', async (state) => {
//             return state + 1
//           })

//           const parentHook = renderHook(() => parent.useAsyncDataSet(1, 2))
//           await parentHook.waitForNextUpdate()

//           expect(parentHook.result.current?.result).toEqual(3)

//           jest.advanceTimersByTime(500)

//           const { result, waitForNextUpdate } = renderHook(() => child.useAsyncDataSet(1, 2))
//           await waitForNextUpdate()

//           expect(parentHook.result.current?.result).toEqual(3)

//           expect(result.current?.fetching).toBe(false)
//           expect(result.current?.result).toBe(4)
//           expect(fn).toBeCalledTimes(1)
//         })

//         it('uses the parent cache when triggered by second child', async () => {
//           const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
//           const parent = asyncDataSet('parent', fn, { cacheMs: 1000 })

//           const child1 = parent.createDerivedAsyncDataSet('child', async (state) => {
//             return state + 1
//           })
//           const child2 = parent.createDerivedAsyncDataSet('child', async (state) => {
//             return state + 2
//           })

//           const child1Hook = renderHook(() => child1.useAsyncDataSet(1, 2))
//           await child1Hook.waitForNextUpdate()
//           expect(child1Hook.result.current?.result).toEqual(4)

//           jest.advanceTimersByTime(500)

//           const { result, waitForNextUpdate } = renderHook(() => child2.useAsyncDataSet(1, 2))
//           await waitForNextUpdate()

//           expect(result.current?.fetching).toBe(false)
//           expect(result.current?.result).toBe(5)
//           expect(fn).toBeCalledTimes(1)
//         })

//         it('doesnt uses the parent if stale cache', async () => {
//           const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
//           const parent = asyncDataSet('parent', fn, { cacheMs: 1000 })

//           const child = parent.createDerivedAsyncDataSet('child', async (state) => {
//             return state + 1
//           })

//           const parentHook = renderHook(() => parent.useAsyncDataSet(1, 2))
//           await parentHook.waitForNextUpdate()

//           expect(parentHook.result.current?.result).toEqual(3)

//           jest.advanceTimersByTime(2000)

//           const { result, waitForNextUpdate } = renderHook(() => child.useAsyncDataSet(1, 2))
//           await waitForNextUpdate()

//           expect(result.current?.fetching).toBe(false)
//           expect(result.current?.result).toBe(4)
//           expect(fn).toBeCalledTimes(2)
//         })

//         it('doesnt uses the parent cache triggered by second child if stale cache', async () => {
//           const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
//           const parent = asyncDataSet('parent', fn, { cacheMs: 1000 })

//           const child1 = parent.createDerivedAsyncDataSet('child', async (state) => {
//             return state + 1
//           })
//           const child2 = parent.createDerivedAsyncDataSet('child', async (state) => {
//             return state + 2
//           })

//           const child1Hook = renderHook(() => child1.useAsyncDataSet(1, 2))
//           await child1Hook.waitForNextUpdate()
//           expect(child1Hook.result.current?.result).toEqual(4)

//           jest.advanceTimersByTime(2000)

//           const { result, waitForNextUpdate } = renderHook(() => child2.useAsyncDataSet(1, 2))
//           await waitForNextUpdate()

//           expect(result.current?.fetching).toBe(false)
//           expect(result.current?.result).toBe(5)
//           expect(fn).toBeCalledTimes(2)
//         })

//         it('fetches once if fetch is in flight', async () => {
//           const fn = jest.fn(async (foo: number, bar: number) => foo + bar)
//           const parent = asyncDataSet('parent', fn, { cacheMs: 0 })

//           const child = parent.createDerivedAsyncDataSet('child', async (state) => {
//             return state + 1
//           })
//           const parentHook = renderHook(() => parent.useAsyncDataSet(1, 2))
//           const { result, waitForNextUpdate } = renderHook(() => child.useAsyncDataSet(1, 2))
//           await Promise.all([parentHook.waitForNextUpdate(), waitForNextUpdate()])
//           expect(parentHook.result.current?.result).toEqual(3)

//           expect(result.current?.fetching).toBe(false)
//           expect(result.current?.result).toBe(4)
//           expect(fn).toBeCalledTimes(1)
//         })
//       })
//     })
//   })
// })
