import * as React from 'react'
import { createStore } from '@cubbyjs/react'

const counterStore = createStore('counter', 0)

const MultAction = (num: number) => {
  counterStore.set(counterStore.get() * num)
}

const DecAction = counterStore.createAction((set, get, num: number) => {
  set(get() - num)
})

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
        <button onClick={() => DecAction(1)}>- 1</button>
        <button onClick={() => MultAction(2)}>* 2</button>
      </div>
    </div>
  )
}

export default Counter
