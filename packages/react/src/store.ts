import { initStore } from '@cubbyjs/common'
import * as React from 'react'

export { Store } from '@cubbyjs/common'
export const { createStore, resetStores, useCubbyInitialize } = initStore(
  React.useEffect,
  React.useState,
  React.useRef
)
