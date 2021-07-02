import { initStore } from '@cubbyjs/common'
import { useEffect, useState, useRef } from 'preact/hooks'

export { Store } from '@cubbyjs/common'
export const { createStore, resetStores, useCubbyInitialize } = initStore(
  useEffect,
  useState,
  useRef
)
