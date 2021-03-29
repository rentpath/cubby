import { initRemoteStore, RemoteStore, RemoteStoreConfig } from '@rentpath/cubbyjs-common'
import { createStore } from './store'
import { useRef, useCallback } from 'preact/hooks'

export { RemoteStore, RemoteStoreConfig } from '@rentpath/cubbyjs-common'
export const createRemoteStore = initRemoteStore(createStore, useCallback, useRef)
