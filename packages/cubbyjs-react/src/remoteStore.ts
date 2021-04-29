import { initRemoteStore } from '@rentpath/cubbyjs-common'
import { createStore } from './store'
import * as React from 'react'

export { RemoteStore, RemoteStoreConfig } from '@rentpath/cubbyjs-common'
export const createRemoteStore = initRemoteStore(createStore, React.useCallback, React.useRef)