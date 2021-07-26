import * as React from 'react'
import { createStore } from '@cubbyjs/react'

const counterStore = createStore('counter', { val: 0, str: '' })

function Display() {
  console.log('Rendered Display!')
  const { val } = counterStore.useStore()
  return <div>Count: {val}</div>
}

const IncVal = () => {
  counterStore.set({
    ...counterStore.get(),
    val: counterStore.get().val + 1,
  })
}

const UpdateStr = (newStr: string) => {
  counterStore.set({
    ...counterStore.get(),
    str: newStr,
  })
}

function Increment() {
  return (
    <button
      onClick={() => {
        IncVal()
      }}
    >
      + 1
    </button>
  )
}

function ChangeStr() {
  console.log('Render Str!')
  const { str } = counterStore.useStore()
  return (
    <div>
      <input
        type="text"
        value={str}
        onChange={(e) => {
          UpdateStr(e.target.value)
        }}
      />
    </div>
  )
}

function Counter() {
  return (
    <div>
      <Display />
      <div>
        <Increment />
      </div>
      <ChangeStr />
    </div>
  )
}

export default Counter
