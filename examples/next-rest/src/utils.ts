import cookie from 'cookie'
import { GetServerSidePropsContext } from 'next'

export const wait = (duration: number) =>
  new Promise<void>((res) =>
    setTimeout(() => {
      res()
    }, duration)
  )

export type Unpromiseify<T> = T extends Promise<infer R> ? R : 'T must be a Promise'

export function parseCookies(req?: GetServerSidePropsContext['req']) {
  return cookie.parse(req ? req.headers.cookie || '' : document.cookie)
}
