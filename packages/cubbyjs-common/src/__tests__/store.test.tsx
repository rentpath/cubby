// import { h } from 'preact'
// import { render } from '@testing-library/preact'
// import { renderHook, act } from '@testing-library/preact-hooks'

// import {
//   dataSet,
//   __getClientSerializeIdsCache,
//   clearClientSerializeIdsCache,
//   __mockIsClient__,
//   DataSetCacheScript,
//   dataSetCacheKey,
//   __mockCache__,
//   __getCache__,
// } from '../store'

// describe('dataSet', () => {
//   beforeEach(() => {
//     __mockCache__({})
//   })

//   it('gets the initial value', () => {
//     const initial = { foo: 123 }
//     const ds = dataSet('ds', initial)
//     expect(ds.get()).toBe(initial)
//   })

//   it('gets the set state', () => {
//     const ds = dataSet('ds', { foo: 123 })
//     const newState = { foo: 456 }
//     ds.set(newState)
//     expect(ds.get()).toBe(newState)
//   })

//   it('gets the mocked state', () => {
//     const ds = dataSet('ds', { foo: 123 })
//     const newState = { foo: 456 }
//     ds.__mock(newState)
//     expect(ds.get()).toBe(newState)
//   })

//   it('calls the subscribed callback', () => {
//     const cb = jest.fn()
//     const ds = dataSet('ds', { foo: 123 })
//     ds.subscribe(cb)
//     const newState = { foo: 456 }
//     ds.set(newState)
//     expect(cb).toBeCalledTimes(1)
//     expect(cb).toBeCalledWith(newState)
//   })

//   it('doesnt subscribe twice', () => {
//     const cb = jest.fn()
//     const ds = dataSet('ds', { foo: 123 })
//     ds.subscribe(cb)
//     ds.subscribe(cb)
//     const newState = { foo: 456 }
//     ds.set(newState)
//     expect(cb).toBeCalledTimes(1)
//     expect(cb).toBeCalledWith(newState)
//   })

//   it('doesnt call the unsubscribed callback', () => {
//     const cb = jest.fn()
//     const ds = dataSet('ds', { foo: 123 })
//     const unsubscribe = ds.subscribe(cb)
//     unsubscribe()
//     const newState = { foo: 456 }
//     ds.set(newState)
//     expect(cb).toBeCalledTimes(0)
//   })

//   describe('createAction', () => {
//     it('gets the set state', () => {
//       const ds = dataSet('ds', { foo: 123, bar: 'abc' })
//       const returnVal = 'return'
//       const a1 = 5
//       const a2 = 9
//       const action = ds.createAction<[number, number], string>((set, get, arg1, arg2) => {
//         const current = get()
//         set({ ...current, foo: current.foo + arg1 + arg2 })
//         return returnVal
//       })
//       action(a1, a2)
//       expect(ds.get()).toEqual({ foo: 123 + a1 + a2, bar: 'abc' })
//     })

//     it('gets the set state with hook', async () => {
//       const ds = dataSet('ds', { foo: 123, bar: 'abc' })
//       const { result } = renderHook(() => ds.useDataSet())
//       const returnVal = 'return'
//       const a1 = 5
//       const a2 = 9
//       const action = ds.createAction<[number, number], string>((set, get, arg1, arg2) => {
//         const current = get()
//         set({ ...current, foo: current.foo + arg1 + arg2 })
//         return returnVal
//       })
//       await act(() => {
//         action(a1, a2)
//       })

//       expect(result.current).toEqual({ foo: 123 + a1 + a2, bar: 'abc' })
//     })
//   })

//   describe('createDerivedDataSet', () => {
//     it('gets the transformed initial data', () => {
//       const parent = dataSet('parent', 1)
//       const child = parent.createDerivedDataSet('child', (state) => state + 1)
//       expect(child.get()).toBe(2)
//     })

//     it('gets the transformed data when the parent is set', () => {
//       const parent = dataSet('parent', 1)
//       const child = parent.createDerivedDataSet('child', (state) => state + 1)
//       parent.set(5)
//       expect(child.get()).toBe(6)
//     })
//   })

//   describe('hook', () => {
//     it('gets the initial value', () => {
//       const initial = { foo: 123 }
//       const ds = dataSet('ds', initial)
//       const { result } = renderHook(() => ds.useDataSet())
//       expect(result.current).toBe(initial)
//     })

//     it('gets the set state', () => {
//       const ds = dataSet('ds', { foo: 123 })
//       const newState = { foo: 456 }
//       ds.set(newState)
//       const { result } = renderHook(() => ds.useDataSet())
//       expect(result.current).toBe(newState)
//     })

//     it('gets the mocked state', () => {
//       const ds = dataSet('ds', { foo: 123 })
//       const newState = { foo: 456 }
//       ds.__mock(newState)
//       const { result } = renderHook(() => ds.useDataSet())
//       expect(result.current).toBe(newState)
//     })

//     it('updates the state', async () => {
//       const ds = dataSet('ds', { foo: 123 })
//       const newState = { foo: 456 }
//       const { result } = renderHook(() => ds.useDataSet())
//       expect(result.current).not.toBe(newState)
//       await act(() => {
//         ds.set(newState)
//       })
//       expect(result.current).toBe(newState)
//     })

//     it('gets using getter', async () => {
//       const initial = { a: { b: { c: { d: { e: 0 } } } } }
//       const ds = dataSet('ds', initial)
//       const newState = { a: { b: { c: { d: { e: 5 } } } } }
//       const { result } = renderHook(() => ds.useDataSet((s) => s.a.b.c.d.e))
//       expect(result.current).toBe(initial.a.b.c.d.e)
//       await act(() => {
//         ds.set(newState)
//       })
//       expect(result.current).toBe(newState.a.b.c.d.e)
//     })

//     describe('createDerivedDataSet', () => {
//       it('updates when the parent updates', async () => {
//         const parent = dataSet('parent', 1)
//         const child = parent.createDerivedDataSet('child', (state) => state + 1)
//         const { result } = renderHook(() => child.useDataSet((s) => s))
//         expect(result.current).toBe(2)
//         await act(() => {
//           parent.set(5)
//         })

//         expect(result.current).toBe(6)
//       })
//     })
//   })

//   describe('clientSerialize', () => {
//     beforeEach(() => {
//       clearClientSerializeIdsCache()
//     })

//     afterEach(() => {
//       __mockIsClient__(true)
//     })

//     it('adds the name to clientSerializeIds when clientSerialize is true', () => {
//       dataSet('ds', { foo: 123, bar: 'abc' }, { clientSerialize: true })
//       const cache = __getClientSerializeIdsCache()
//       expect(cache.has('ds')).toBe(true)
//     })

//     it('throws when a two clientSerialize dataSets defined with the same name', () => {
//       dataSet('ds', { foo: 123, bar: 'abc' }, { clientSerialize: true })
//       expect(() => dataSet('ds', { foo: 123, bar: 'abc' }, { clientSerialize: true })).toThrow()
//     })

//     it('only includes serialized dataSets in cacheScript', () => {
//       __mockIsClient__(false)
//       const name1 = 'ds1'
//       const data1 = { foo: 123, bar: 'abc' }
//       dataSet(name1, data1, { clientSerialize: true })
//       const name2 = 'ds2'
//       const data2 = { baz: { foob: true } }
//       dataSet(name2, data2, { clientSerialize: true })
//       const name3 = 'ds3'
//       const data3 = { notIncluded: true }
//       dataSet(name3, data3, { clientSerialize: false })
//       const cache = JSON.parse(
//         render(<DataSetCacheScript />).getByTestId(dataSetCacheKey).textContent
//       )
//       expect(cache).toEqual({
//         [name1]: {
//           state: data1,
//         },
//         [name2]: {
//           state: data2,
//         },
//       })
//     })

//     it('sets the store from cache', () => {
//       const name = 'ds'
//       const cachedData = { foo: 567, bar: 'def' }
//       const initialData = { foo: 123, bar: 'abc' }
//       __mockCache__({
//         [name]: {
//           state: cachedData,
//         },
//       })
//       const ds = dataSet(name, initialData, { clientSerialize: true })
//       expect(ds.get()).toEqual(cachedData)
//     })

//     it('doesnt clear the cache script on client', () => {
//       __mockIsClient__(false)
//       const name = 'ds'
//       const cachedData = { foo: 567, bar: 'def' }
//       const initialData = { foo: 123, bar: 'abc' }
//       __mockCache__({
//         [name]: {
//           state: cachedData,
//         },
//       })
//       dataSet(name, initialData, { clientSerialize: true })
//       const serverCache = JSON.parse(
//         render(<DataSetCacheScript />).getByTestId(dataSetCacheKey).textContent
//       )

//       __mockIsClient__(true)
//       __mockCache__({})

//       const clientCache = JSON.parse(
//         render(<DataSetCacheScript />).getByTestId(dataSetCacheKey).textContent
//       )

//       expect(clientCache).toEqual(serverCache)
//     })

//     it('adds data to the server cache', () => {
//       __mockIsClient__(false)
//       expect(__getCache__()).toEqual({})
//       const name1 = 'ds1'
//       const data1 = { foo: 123, bar: 'abc' }
//       dataSet(name1, data1, { clientSerialize: true })
//       const name2 = 'ds2'
//       const data2 = { baz: { foob: true } }
//       dataSet(name2, data2, { clientSerialize: false })
//       expect(__getCache__()).toEqual({
//         [name1]: {
//           state: data1,
//         },
//       })
//     })

//     it('adds data to the server cache on set', () => {
//       __mockIsClient__(false)
//       expect(__getCache__()).toEqual({})
//       const name = 'ds'
//       const initialData = 'abc'
//       const newData = 'def'
//       const ds = dataSet(name, initialData, { clientSerialize: true })
//       ds.set(newData)
//       expect(__getCache__()).toEqual({
//         [name]: {
//           state: newData,
//         },
//       })
//     })

//     describe('createDerivedDataSet', () => {
//       it('only serializes the parent', () => {
//         __mockIsClient__(false)
//         const parentName = 'parent'
//         const parent = dataSet(parentName, 1, { clientSerialize: true })
//         parent.createDerivedDataSet('child', (state) => state + 1)
//         const parentData = 5
//         parent.set(parentData)

//         expect(__getCache__()).toEqual({
//           [parentName]: {
//             state: parentData,
//           },
//         })
//       })

//       it('only serializes the child', () => {
//         __mockIsClient__(false)
//         const parentName = 'parent'
//         const parent = dataSet(parentName, 1)
//         const childName = 'child'
//         const child = parent.createDerivedDataSet(childName, (state) => state + 1, {
//           clientSerialize: true,
//         })
//         parent.set(5)

//         expect(__getCache__()).toEqual({
//           [`${childName}(${parentName})`]: {
//             state: 6,
//           },
//         })
//       })

//       it('serializes both parent and child', () => {
//         __mockIsClient__(false)
//         const parentName = 'parent'
//         const parent = dataSet(parentName, 1, { clientSerialize: true })
//         const childName = 'child'
//         parent.createDerivedDataSet(childName, (state) => state + 1, {
//           clientSerialize: true,
//         })
//         parent.set(5)

//         expect(__getCache__()).toEqual({
//           [parentName]: {
//             state: 5,
//           },
//           [`${childName}(${parentName})`]: {
//             state: 6,
//           },
//         })
//       })
//     })
//   })
// })
