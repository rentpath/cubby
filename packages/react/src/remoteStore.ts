import { initRemoteStore } from '@cubbyjs/common'
import { createStore } from './store'
import * as React from 'react'

export {
  RemoteStore,
  RemoteStoreConfig,
  GetRemoteStoreReturn,
  UseRemoteStoreReturn,
  FetchedState,
} from '@cubbyjs/common'
const remoteStore = initRemoteStore(createStore, React.useCallback, React.useRef)

export const createRemoteStore = remoteStore.createRemoteStore
export const useUnwrap = remoteStore.useUnwrap
export const __mockIsClient__ = remoteStore.__mockIsClient__
