import { initStore } from '@cubbyjs/common'
import { h } from 'preact'
import { useEffect, useState, useRef } from 'preact/hooks'

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
} = initStore(h, useEffect, useState, useRef)
