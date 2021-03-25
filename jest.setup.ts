/* eslint-disable testing-library/no-dom-import */
import '@testing-library/jest-dom'
import '@testing-library/jest-dom/extend-expect'
import { configure } from '@testing-library/dom'

configure({
  testIdAttribute: 'data-tid',
})
