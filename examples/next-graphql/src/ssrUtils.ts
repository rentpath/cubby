import { InitialState } from '@cubbyjs/react'
import { headerStores } from './components/header'
import sdk from './lib/sdk'

export async function fetchHeaderData(userId?: string): Promise<InitialState<typeof headerStores>> {
  return {
    userIdStore: userId != null ? Number(userId) : null,
    usersStore: await sdk.Users().then((res) => res.users),
  }
}
