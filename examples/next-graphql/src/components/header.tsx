import React from 'react'
import { createStore } from '@cubbyjs/react'
import cookie from 'cookie'
import Link from 'next/link'
import { UsersQuery } from '../generated/graphql'

export const usersStore = createStore<UsersQuery['users']>('users', [])
export const userIdStore = createStore<number | null>('userId', null)

const setUserId = userIdStore.createAction((set, get, newUserId: number) => {
  document.cookie = cookie.serialize('userId', String(newUserId), { path: '/' })
  set(newUserId)
})

export const headerStores = {
  usersStore,
  userIdStore,
}

export interface HeaderProps {}
export function Header({}: HeaderProps) {
  const users = usersStore.useStore()
  const userId = userIdStore.useStore()
  return (
    <header className="flex justify-between p-2 border-b-2 border-gray-100">
      <Link href="/">
        <a className="text-xl">Apartments</a>
      </Link>
      <select
        value={String(userId)}
        onChange={(e) => {
          setUserId(Number(e.target.value))
        }}
      >
        <option value="null" disabled>
          Select User
        </option>
        {users?.map((user) => (
          <option value={user?.id} key={user?.email}>
            {user?.email}
          </option>
        ))}
      </select>
    </header>
  )
}
