import { initRemoteStore } from '@rentpath/cubbyjs-common'
import { createStore } from './store'
import * as React from 'react'

export { RemoteStore, RemoteStoreConfig } from '@rentpath/cubbyjs-common'
const remoteStore = initRemoteStore(createStore, React.useCallback, React.useRef)

export const createRemoteStore = remoteStore.createRemoteStore
export const useUnwrap = remoteStore.useUnwrap
