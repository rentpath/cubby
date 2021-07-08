/**
 * @jest-environment jsdom
 */

import * as React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import { createRemoteStore, __mockIsClient__ } from '../remoteStore'

describe('remoteStore', () => {
  it('fires a fetch on the client', async () => {
    __mockIsClient__(true)
    const query = jest.fn(async (num: number) => num)
    const remoteStore = createRemoteStore('fetchingStore', query)
    const TEST_ID = 'fetching-test'
    const Component = () => {
      const { fetching, result } = remoteStore.useRemoteStore(5)
      return <span data-testid={TEST_ID} data-obj={JSON.stringify({ fetching, result })}></span>
    }
    render(<Component />)
    let el = screen.getByTestId(TEST_ID)
    let obj = JSON.parse(el.dataset['obj'] ?? '')
    expect(obj.fetching).toBe(true)
    expect(query).toHaveBeenCalledWith(5)
    expect(query).toHaveBeenCalledTimes(1)
    el = await waitFor(() => screen.getByTestId(TEST_ID))
    obj = JSON.parse(el.dataset['obj'] ?? '')
    expect(obj).toEqual({ fetching: false, result: 5 })
  })

  it('does not fire a fetch on the server', async () => {
    __mockIsClient__(false)
    const query = jest.fn(async (num: number) => num)
    const remoteStore = createRemoteStore('fetchingStore', query)
    const TEST_ID = 'fetching-test'
    const Component = () => {
      const { fetching, result } = remoteStore.useRemoteStore(5)
      return <span data-testid={TEST_ID} data-obj={JSON.stringify({ fetching, result })}></span>
    }
    render(<Component />)
    let el = screen.getByTestId(TEST_ID)
    let obj = JSON.parse(el.dataset['obj'] ?? '')
    expect(obj.fetching).toBe(true)
    expect(query).toHaveBeenCalledTimes(0)
  })
})
