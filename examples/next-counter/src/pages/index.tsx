import * as React from 'react'
import { createStore } from '@cubbyjs/react'

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

if (typeof window !== 'undefined') {
  setTimeout(() => {
    counterStore.set(100)
  }, 3000)
}

export default Counter
