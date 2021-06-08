import { initStore } from '@cubbyjs/common'
import * as React from 'react'

export { Store, Config } from '@cubbyjs/common'
export const {
  StoreCacheScript,
  __getCache__,
  __getClientSerializeIdsCache,
  __mockCache__,
  __mockIsClient__,
  clearClientSerializeIdsCache,
  createStore,
  resetStores,
  storeCacheKey,
} = initStore(React.createElement, React.useEffect, React.useState, React.useRef)
