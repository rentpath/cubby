import React from 'react'

import { createStore, createRemoteStore, useCubbyInitialize, withCubby } from './index'

const store1 = createStore('1', { foo: 'string' })
const store2 = createStore('2', { bar: 5 })
const remoteStore1 = createRemoteStore('3', async (s: string) => {
  return {
    foo: s,
  }
})

const remoteStore2 = createRemoteStore('3', async (b: number, c: Record<string, unknown>) => {
  return {
    bar: b,
    baz: c,
  }
})

const test = useCubbyInitialize(
  {
    store1,
    remoteStore1,
    store2,
    remoteStore2,
  },
  {
    store1: {
      foo: 'jasd',
    },
    remoteStore1: [
      {
        args: ['abc'],
        result: {
          foo: 'abc',
        },
      },
    ],
    remoteStore2: [
      {
        args: [5, {}],
        result: {
          bar: 5,
          baz: {},
        },
      },
    ],
    store2: {
      bar: 8,
    },
  }
)

const Index = withCubby<ReturnType<typeof getServerSideProps>['props']>(
  {
    store1,
    // remoteStore1,
    // store2,
    // remoteStore2,
  },
  function Index(props: { foo: string }) {
    const storeState = store1.useStore()
    return <div>{storeState}</div>
  }
)

function getServerSideProps() {
  return {
    props: {
      cubbyState: {
        store1: {
          foo: '',
        },
      },
      foo: ''
    },
  }
}

const T = () => <Index cubbyState={{ store1: { foo: '' } }} foo="" />
