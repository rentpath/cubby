/**
 * @jest-environment jsdom
 */

import * as React from 'react'
import { render, act } from '@testing-library/react'
import { createRemoteStore, __mockIsClient__ } from '../remoteStore'
import { createStore, InitialState, withCubby } from '../store'

describe('initialize', () => {
  describe('withCubby', () => {
    describe('store', () => {
      it('initializes the state once', () => {
        const store1 = createStore('1', { foo: 'bar' })

        const stores = {
          store1,
        }

        const IndexWithCubby = withCubby(stores, function Index() {
          return <div></div>
        })

        const initialState: InitialState<typeof stores> = {
          store1: {
            foo: 'baz',
          },
        }

        render(<IndexWithCubby cubbyState={initialState} />)

        expect(store1.get()).toEqual({
          foo: 'baz',
        })
      })

      it('does not reinitialize with same initialState', () => {
        const store1 = createStore('1', { foo: 'bar' })

        const stores = {
          store1,
        }

        const IndexWithCubby = withCubby(stores, function Index() {
          return <div></div>
        })

        const initialState: InitialState<typeof stores> = {
          store1: {
            foo: 'baz',
          },
        }

        const renderHook = render(<IndexWithCubby cubbyState={initialState} />)

        act(() => {
          store1.set({ foo: 'qwe' })
        })

        renderHook.rerender(<IndexWithCubby cubbyState={initialState} />)

        expect(store1.get()).toEqual({
          foo: 'qwe',
        })
      })

      it('reinitialize with different initialState', () => {
        const store1 = createStore('1', { foo: 'bar' })

        const stores = {
          store1,
        }

        const IndexWithCubby = withCubby(stores, function Index() {
          return <div></div>
        })

        const initialState1: InitialState<typeof stores> = {
          store1: {
            foo: 'baz',
          },
        }

        const renderHook = render(<IndexWithCubby cubbyState={initialState1} />)

        act(() => {
          store1.set({ foo: 'qwe' })
        })

        const initialState2: InitialState<typeof stores> = {
          store1: {
            foo: 'zxc',
          },
        }

        renderHook.rerender(<IndexWithCubby cubbyState={initialState2} />)

        expect(store1.get()).toEqual({
          foo: 'zxc',
        })
      })
    })

    describe('remoteStore', () => {
      describe('on client', () => {
        beforeEach(() => {
          __mockIsClient__(true)
        })

        it('initializes the state once', () => {
          const remoteStore1 = createRemoteStore('1', async (arg: string) => ({ foo: 'bar', arg }))

          const stores = {
            remoteStore1,
          }

          const IndexWithCubby = withCubby(stores, function Index() {
            return <div></div>
          })

          const initialState: InitialState<typeof stores> = {
            remoteStore1: [
              {
                args: ['a'],
                result: {
                  foo: 'baz',
                  arg: 'a',
                },
              },
              {
                args: ['b'],
                result: {
                  foo: 'zxc',
                  arg: 'b',
                },
              },
            ],
          }

          render(<IndexWithCubby cubbyState={initialState} />)

          expect(remoteStore1.getRemoteStore('a')).toEqual({
            fetching: false,
            result: {
              foo: 'baz',
              arg: 'a',
            },
          })
          expect(remoteStore1.getRemoteStore('b')).toEqual({
            fetching: false,
            result: {
              foo: 'zxc',
              arg: 'b',
            },
          })
          expect(remoteStore1.getRemoteStore('c')).toEqual({
            fetching: false,
          })
        })
      })

      describe('on server', () => {
        beforeEach(() => {
          __mockIsClient__(false)
        })

        it('initializes the state once', () => {
          const remoteStore1 = createRemoteStore('1', async (arg: string) => ({ foo: 'bar', arg }))

          const stores = {
            remoteStore1,
          }

          const IndexWithCubby = withCubby(stores, function Index() {
            return <div></div>
          })

          const initialState: InitialState<typeof stores> = {
            remoteStore1: [
              {
                args: ['a'],
                result: {
                  foo: 'baz',
                  arg: 'a',
                },
              },
              {
                args: ['b'],
                result: {
                  foo: 'zxc',
                  arg: 'b',
                },
              },
            ],
          }

          render(<IndexWithCubby cubbyState={initialState} />)

          expect(remoteStore1.getRemoteStore('a')).toEqual({
            fetching: false,
            result: {
              foo: 'baz',
              arg: 'a',
            },
          })
          expect(remoteStore1.getRemoteStore('b')).toEqual({
            fetching: false,
            result: {
              foo: 'zxc',
              arg: 'b',
            },
          })
          expect(remoteStore1.getRemoteStore('c')).toEqual({
            fetching: true,
          })
        })
      })

      it('does not reinitialize with same initialState', async () => {
        const remoteStore1 = createRemoteStore('1', async (arg: string) => ({ foo: 'bar', arg }))

        const stores = {
          remoteStore1,
        }

        const IndexWithCubby = withCubby(stores, function Index() {
          return <div></div>
        })

        const initialState: InitialState<typeof stores> = {
          remoteStore1: [
            {
              args: ['a'],
              result: {
                foo: 'baz',
                arg: 'a',
              },
            },
          ],
        }

        const renderHook = render(<IndexWithCubby cubbyState={initialState} />)

        await act(async () => {
          await remoteStore1.fetchQuery('a')
        })

        renderHook.rerender(<IndexWithCubby cubbyState={initialState} />)

        expect(remoteStore1.getRemoteStore('a')).toEqual({
          fetching: false,
          result: {
            foo: 'bar',
            arg: 'a',
          },
        })
      })

      it('reinitialize with different initialState', async () => {
        const remoteStore1 = createRemoteStore('1', async (arg: string) => ({ foo: 'bar', arg }))

        const stores = {
          remoteStore1,
        }

        const IndexWithCubby = withCubby(stores, function Index() {
          return <div></div>
        })

        const initialState1: InitialState<typeof stores> = {
          remoteStore1: [
            {
              args: ['a'],
              result: {
                foo: 'baz',
                arg: 'a',
              },
            },
          ],
        }

        const renderHook = render(<IndexWithCubby cubbyState={initialState1} />)

        await act(async () => {
          await remoteStore1.fetchQuery('a')
        })

        const initialState2: InitialState<typeof stores> = {
          remoteStore1: [
            {
              args: ['a'],
              result: {
                foo: 'lkj',
                arg: 'c',
              },
            },
          ],
        }

        renderHook.rerender(<IndexWithCubby cubbyState={initialState2} />)

        expect(remoteStore1.getRemoteStore('a')).toEqual({
          fetching: false,
          result: {
            foo: 'lkj',
            arg: 'c',
          },
        })
      })
    })

    describe('mixed', () => {
      describe('on client', () => {
        beforeEach(() => {
          __mockIsClient__(true)
        })

        it('initializes the state once', () => {
          const remoteStore1 = createRemoteStore('rs1', async (arg: string) => ({
            foo: 'bar',
            arg,
          }))
          const store1 = createStore('s1', { foo: 'bar' })

          const stores = {
            remoteStore1,
            store1,
          }

          const IndexWithCubby = withCubby(stores, function Index() {
            return <div></div>
          })

          const initialState: InitialState<typeof stores> = {
            store1: {
              foo: 'baz',
            },
            remoteStore1: [
              {
                args: ['a'],
                result: {
                  foo: 'baz',
                  arg: 'a',
                },
              },
              {
                args: ['b'],
                result: {
                  foo: 'zxc',
                  arg: 'b',
                },
              },
            ],
          }

          render(<IndexWithCubby cubbyState={initialState} />)

          expect(remoteStore1.getRemoteStore('a')).toEqual({
            fetching: false,
            result: {
              foo: 'baz',
              arg: 'a',
            },
          })
          expect(remoteStore1.getRemoteStore('b')).toEqual({
            fetching: false,
            result: {
              foo: 'zxc',
              arg: 'b',
            },
          })
          expect(remoteStore1.getRemoteStore('c')).toEqual({
            fetching: false,
          })

          expect(store1.get()).toEqual({
            foo: 'baz',
          })
        })
      })

      describe('on server', () => {
        beforeEach(() => {
          __mockIsClient__(false)
        })

        it('initializes the state once', () => {
          const remoteStore1 = createRemoteStore('rs1', async (arg: string) => ({
            foo: 'bar',
            arg,
          }))
          const store1 = createStore('s2', { foo: 'bar' })

          const stores = {
            remoteStore1,
            store1,
          }

          const IndexWithCubby = withCubby(stores, function Index() {
            return <div></div>
          })

          const initialState: InitialState<typeof stores> = {
            store1: {
              foo: 'baz',
            },
            remoteStore1: [
              {
                args: ['a'],
                result: {
                  foo: 'baz',
                  arg: 'a',
                },
              },
              {
                args: ['b'],
                result: {
                  foo: 'zxc',
                  arg: 'b',
                },
              },
            ],
          }

          render(<IndexWithCubby cubbyState={initialState} />)

          expect(remoteStore1.getRemoteStore('a')).toEqual({
            fetching: false,
            result: {
              foo: 'baz',
              arg: 'a',
            },
          })
          expect(remoteStore1.getRemoteStore('b')).toEqual({
            fetching: false,
            result: {
              foo: 'zxc',
              arg: 'b',
            },
          })
          expect(remoteStore1.getRemoteStore('c')).toEqual({
            fetching: true,
          })

          expect(store1.get()).toEqual({
            foo: 'baz',
          })
        })
      })

      it('does not reinitialize with same initialState', async () => {
        const remoteStore1 = createRemoteStore('rs1', async (arg: string) => ({ foo: 'bar', arg }))
        const store1 = createStore('s2', { foo: 'bar' })

        const stores = {
          remoteStore1,
          store1,
        }

        const IndexWithCubby = withCubby(stores, function Index() {
          return <div></div>
        })

        const initialState: InitialState<typeof stores> = {
          store1: {
            foo: 'baz',
          },
          remoteStore1: [
            {
              args: ['a'],
              result: {
                foo: 'baz',
                arg: 'a',
              },
            },
          ],
        }

        const renderHook = render(<IndexWithCubby cubbyState={initialState} />)

        await act(async () => {
          store1.set({ foo: 'qwe' })
          await remoteStore1.fetchQuery('a')
        })

        renderHook.rerender(<IndexWithCubby cubbyState={initialState} />)

        expect(remoteStore1.getRemoteStore('a')).toEqual({
          fetching: false,
          result: {
            foo: 'bar',
            arg: 'a',
          },
        })

        expect(store1.get()).toEqual({
          foo: 'qwe',
        })
      })

      it('reinitialize with different initialState', async () => {
        const remoteStore1 = createRemoteStore('rs1', async (arg: string) => ({ foo: 'bar', arg }))
        const store1 = createStore('s1', { foo: 'bar' })

        const stores = {
          remoteStore1,
          store1,
        }

        const IndexWithCubby = withCubby(stores, function Index() {
          return <div></div>
        })

        const initialState1: InitialState<typeof stores> = {
          store1: {
            foo: 'baz',
          },
          remoteStore1: [
            {
              args: ['a'],
              result: {
                foo: 'baz',
                arg: 'a',
              },
            },
          ],
        }

        const renderHook = render(<IndexWithCubby cubbyState={initialState1} />)

        await act(async () => {
          store1.set({ foo: 'qwe' })
          await remoteStore1.fetchQuery('a')
        })

        const initialState2: InitialState<typeof stores> = {
          store1: {
            foo: 'zxc',
          },
          remoteStore1: [
            {
              args: ['a'],
              result: {
                foo: 'lkj',
                arg: 'c',
              },
            },
          ],
        }

        renderHook.rerender(<IndexWithCubby cubbyState={initialState2} />)

        expect(remoteStore1.getRemoteStore('a')).toEqual({
          fetching: false,
          result: {
            foo: 'lkj',
            arg: 'c',
          },
        })

        expect(store1.get()).toEqual({
          foo: 'zxc',
        })
      })
    })
  })
})
