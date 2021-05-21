import { initStore } from '@cubby/common'
import { h } from 'preact'
import { useEffect, useState, useRef } from 'preact/hooks'

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
} = initStore(h, useEffect, useState, useRef)
