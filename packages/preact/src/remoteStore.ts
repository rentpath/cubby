import { initRemoteStore, RemoteStore, RemoteStoreConfig } from '@cubby/common'
import { createStore } from './store'
import { useRef, useCallback } from 'preact/hooks'

export { RemoteStore, RemoteStoreConfig } from '@cubby/common'
const remoteStore = initRemoteStore(createStore, useCallback, useRef)

export const createRemoteStore = remoteStore.createRemoteStore
export const useUnwrap = remoteStore.useUnwrap
