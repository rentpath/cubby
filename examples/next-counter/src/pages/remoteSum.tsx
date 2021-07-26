import React, { FC, useState } from 'react'
import { createRemoteStore, withCubby } from '@cubbyjs/react'
import { wait } from '../utils'

const remoteSum = createRemoteStore('remoteSum', async (...nums: number[]) => {
  await wait(1000)
  if (nums.length === 0) {
    throw new Error('No numbers to sum!')
  }
  return nums.reduce((prev, curr) => prev + curr, 0)
})

const Sum: FC<{ nums: number[] }> = ({ nums }) => {
  const result = remoteSum.useRemoteStore(...nums)
  if (result.fetching && result.result == null) {
    return <div>Calculating...</div>
  } else if (result.error) {
    return <div>ERROR: {result.error.message}</div>
  } else {
    return (
      <div>
        The sum of {nums.join(', ')} is {result.result} {result.fetching ? '(Updating...)' : ''}
        <button
          onClick={() => {
            result.refetch()
          }}
        >
          Refetch
        </button>
      </div>
    )
  }
}

function Remote() {
  const [sets, setSets] = useState<number[][]>([])
  const [inputVal, setInputVal] = useState('')

  const submit = () => {
    const nums = inputVal
      .split(',')
      .filter((str) => str !== '')
      .map((val) => Number(val.trim()))
    console.log(nums)
    setSets((curr) => [...curr, nums])
    setInputVal('')
  }

  return (
    <div>
      <div>
        <input
          type="text"
          onChange={(e) => {
            setInputVal(e.target.value)
          }}
          onKeyUp={(e) => {
            if (e.code === 'Enter') {
              submit()
            }
          }}
          value={inputVal}
        />
        <button onClick={submit}>Calculate</button>
      </div>
      <div>Sums</div>
      {sets.map((nums, i) => (
        <Sum nums={nums} key={`key${i}`} />
      ))}
    </div>
  )
}

export default Remote
