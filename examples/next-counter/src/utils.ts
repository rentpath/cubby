export const wait = (duration: number) =>
  new Promise<void>((res) =>
    setTimeout(() => {
      res()
    }, duration)
  )
