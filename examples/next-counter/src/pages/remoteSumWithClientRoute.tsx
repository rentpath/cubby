import React, { FC, useRef, useState } from 'react'
import { createRemoteStore, withCubby } from '@cubbyjs/react'
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'

const wait = (duration: number) =>
  new Promise<void>((res) =>
    setTimeout(() => {
      res()
    }, duration)
  )

const remoteSumFetcher = async (...nums: number[]) => {
  await wait(1000)

  if (nums.length === 0) {
    throw new Error('No numbers to sum!')
  }
  return nums.reduce((prev, curr) => prev + curr, 0)
}
const remoteSum = createRemoteStore('asyncSum', remoteSumFetcher)

const stores = {
  remoteSum,
}

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
      </div>
    )
  }
}

const ClientRoute = () => {
  const [query, setQuery] = useState('')

  return (
    <div>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
        }}
      />
      <Link href={`/remoteSumWithClientRoute?extra=${String(query)}`}>Go</Link>
    </div>
  )
}


function useStateWithReinit<T>(val: T) {
  const ref = useRef(val)
  const [stateVal, setStateVal] = useState<T>(ref.current)
  if (ref.current !== val) {
    console.log('val change', val)
    ref.current = val
    setStateVal(val)
  }
  return [stateVal, setStateVal] as const
}
const CubbyRemote = withCubby<InferGetServerSidePropsType<typeof getServerSideProps>>(
  stores,
  function Remote({ nums }) {
    const [sets, setSets] = useStateWithReinit<number[][]>(nums)
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
        <ClientRoute />
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
)

export default CubbyRemote

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const nums = [
    [1, 1, 1],
    [1, 2, 3],
  ]

  console.log(context.query)
  if (context.query['extra']) {
    nums[0]?.push(Number(context.query['extra']))
  }

  return {
    props: {
      nums,
      cubbyState: {
        remoteSum: await Promise.all(
          nums.map(async (n) => ({
            args: n,
            result: await remoteSumFetcher(...n),
          }))
        ),
      },
    },
  }
}
