import { getUsers } from './pages/api/users'
import { InitialState } from '@cubbyjs/react'
import { headerStores } from './components/header'

export async function fetchHeaderData(userId?: string): Promise<InitialState<typeof headerStores>> {
  return {
    userIdStore: userId != null ? Number(userId) : null,
    usersStore: await getUsers(),
  }
}
