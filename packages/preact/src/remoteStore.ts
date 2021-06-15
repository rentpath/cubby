import { initRemoteStore, RemoteStore, RemoteStoreConfig } from '@cubbyjs/common'
import { createStore } from './store'
import { useRef, useCallback } from 'preact/hooks'

export { RemoteStore, RemoteStoreConfig } from '@cubbyjs/common'
const remoteStore = initRemoteStore(createStore, useCallback, useRef)

export const createRemoteStore = remoteStore.createRemoteStore
export const useUnwrap = remoteStore.useUnwrap
