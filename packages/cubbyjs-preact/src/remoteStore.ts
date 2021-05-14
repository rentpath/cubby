import { initRemoteStore, RemoteStore, RemoteStoreConfig } from '@rentpath/cubbyjs-common'
import { createStore } from './store'
import { useRef, useCallback } from 'preact/hooks'

export { RemoteStore, RemoteStoreConfig } from '@rentpath/cubbyjs-common'
const remoteStore = initRemoteStore(createStore, useCallback, useRef)

export const createRemoteStore = remoteStore.createRemoteStore
export const useUnwrap = remoteStore.useUnwrap
