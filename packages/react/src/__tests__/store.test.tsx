/**
 * @jest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react-hooks'
import { createStore } from '../store'

describe('store', () => {
  it('gets the initial value', () => {
    const initial = { foo: 123 }
    const store = createStore('store', initial)
    expect(store.get()).toBe(initial)
  })

  it('gets the set state', () => {
    const store = createStore('store', { foo: 123 })
    const newState = { foo: 456 }
    store.set(newState)
    expect(store.get()).toBe(newState)
  })

  it('gets the mocked state', () => {
    const store = createStore('store', { foo: 123 })
    const newState = { foo: 456 }
    store.__mock(newState)
    expect(store.get()).toBe(newState)
  })

  it('calls the subscribed callback', () => {
    const cb = jest.fn()
    const store = createStore('store', { foo: 123 })
    store.subscribe(cb)
    const newState = { foo: 456 }
    store.set(newState)
    expect(cb).toBeCalledTimes(1)
    expect(cb).toBeCalledWith(newState)
  })

  it('doesnt subscribe twice', () => {
    const cb = jest.fn()
    const store = createStore('store', { foo: 123 })
    store.subscribe(cb)
    store.subscribe(cb)
    const newState = { foo: 456 }
    store.set(newState)
    expect(cb).toBeCalledTimes(1)
    expect(cb).toBeCalledWith(newState)
  })

  it('doesnt call the unsubscribed callback', () => {
    const cb = jest.fn()
    const store = createStore('store', { foo: 123 })
    const unsubscribe = store.subscribe(cb)
    unsubscribe()
    const newState = { foo: 456 }
    store.set(newState)
    expect(cb).toBeCalledTimes(0)
  })

  describe('createAction', () => {
    it('gets the set state', () => {
      const store = createStore('store', { foo: 123, bar: 'abc' })
      const returnVal = 'return'
      const a1 = 5
      const a2 = 9
      const action = store.createAction<[number, number], string>((set, get, arg1, arg2) => {
        const current = get()
        set({ ...current, foo: current.foo + arg1 + arg2 })
        return returnVal
      })
      action(a1, a2)
      expect(store.get()).toEqual({ foo: 123 + a1 + a2, bar: 'abc' })
    })

    it('gets the set state with hook', async () => {
      const store = createStore('store', { foo: 123, bar: 'abc' })
      const { result } = renderHook(() => store.useStore())
      const returnVal = 'return'
      const a1 = 5
      const a2 = 9
      const action = store.createAction<[number, number], string>((set, get, arg1, arg2) => {
        const current = get()
        set({ ...current, foo: current.foo + arg1 + arg2 })
        return returnVal
      })
      act(() => {
        action(a1, a2)
      })

      expect(result.current).toEqual({ foo: 123 + a1 + a2, bar: 'abc' })
    })
  })

  describe('createDerivedStore', () => {
    it('gets the transformed initial data', () => {
      const parent = createStore('parent', 1)
      const child = parent.createDerivedStore('child', (state) => state + 1)
      expect(child.get()).toBe(2)
    })

    it('gets the transformed data when the parent is set', () => {
      const parent = createStore('parent', 1)
      const child = parent.createDerivedStore('child', (state) => state + 1)
      parent.set(5)
      expect(child.get()).toBe(6)
    })
  })

  describe('hook', () => {
    it('gets the initial value', () => {
      const initial = { foo: 123 }
      const store = createStore('store', initial)
      const { result } = renderHook(() => store.useStore())
      expect(result.current).toBe(initial)
    })

    it('gets the set state', () => {
      const store = createStore('store', { foo: 123 })
      const newState = { foo: 456 }
      store.set(newState)
      const { result } = renderHook(() => store.useStore())
      expect(result.current).toBe(newState)
    })

    it('gets the mocked state', () => {
      const store = createStore('store', { foo: 123 })
      const newState = { foo: 456 }
      store.__mock(newState)
      const { result } = renderHook(() => store.useStore())
      expect(result.current).toBe(newState)
    })

    it('updates the state', () => {
      const store = createStore('store', { foo: 123 })
      const newState = { foo: 456 }
      const { result } = renderHook(() => store.useStore())
      expect(result.current).not.toBe(newState)
      act(() => {
        store.set(newState)
      })
      expect(result.current).toBe(newState)
    })

    it('gets using getter', () => {
      const initial = { a: { b: { c: { d: { e: 0 } } } } }
      const store = createStore('store', initial)
      const newState = { a: { b: { c: { d: { e: 5 } } } } }
      const { result } = renderHook(() => store.useStore((s) => s.a.b.c.d.e))
      expect(result.current).toBe(initial.a.b.c.d.e)
      act(() => {
        store.set(newState)
      })
      expect(result.current).toBe(newState.a.b.c.d.e)
    })

    describe('createDerivedStore', () => {
      it('updates when the parent updates', async () => {
        const parent = createStore('parent', 1)
        const child = parent.createDerivedStore('child', (state) => state + 1)
        const { result } = renderHook(() => child.useStore((s) => s))
        expect(result.current).toBe(2)
        act(() => {
          parent.set(5)
        })

        expect(result.current).toBe(6)
      })
    })
  })
})
