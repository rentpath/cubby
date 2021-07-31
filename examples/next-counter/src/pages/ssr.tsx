import * as React from 'react'
import { createStore, withCubby } from '@cubbyjs/react'
import { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from 'next'
import { wait } from '../utils'

const counterStore = createStore('counter', 0)

function Display() {
  const count = counterStore.useStore()
  return <div>Count: {count}</div>
}

function Increment() {
  return (
    <button
      onClick={() => {
        counterStore.set(counterStore.get() + 1)
      }}
    >
      + 1
    </button>
  )
}

const stores = { counterStore }

const Counter = withCubby<InferGetServerSidePropsType<typeof getServerSideProps>>(
  stores,
  function Counter() {
    return (
      <div>
        <Display />
        <div>
          <Increment />
        </div>
      </div>
    )
  }
)

export default Counter

export async function getServerSideProps(_context: GetServerSidePropsContext) {
  await wait(500)
  return {
    props: {
      cubbyState: {
        counterStore: 10,
      },
    },
  }
}
