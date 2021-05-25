import { initStore } from '@cubby/common'
import * as React from 'react'

export { Store, Config } from '@cubby/common'
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
