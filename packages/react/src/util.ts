export const sortMapEntries = (
  entries: [string, unknown][],
  cache: Map<unknown, string>,
  path: string
): [string, unknown][] => {
  const sortedEntries: [string, unknown][] = []
  for (const [key, v] of entries) {
    const previousUsage = cache.get(v)
    const newPath = `${path}.${key}`
    if (previousUsage) {
      throw new Error(
        `cannot create cache key from object with circular structure: value at ${newPath} is the same as the value at ${previousUsage}`
      )
    }
    sortedEntries.push([key, getSortedEntries(v, cache, newPath)])
  }
  sortedEntries.sort(([a], [b]) => {
    if (a < b) {
      return -1
    }
    if (a > b) {
      return 1
    }
    return 0
  })
  return sortedEntries
}

export const getSortedEntries = (
  val: unknown,
  cache: Map<unknown, string>,
  path: string
): unknown => {
  if (Array.isArray(val)) {
    cache.set(val, path)
    return val.map((v, i) => getSortedEntries(v, cache, `${path}.${i}`))
  } else if (val instanceof Map) {
    cache.set(val, path)
    return sortMapEntries(
      Array.from(val).map(([key, v]) => [
        JSON.stringify(getSortedEntries(key, cache, `${path}.map.${String(key)}`)),
        v,
      ]),
      cache,
      path
    )
  } else if (val instanceof Set) {
    cache.set(val, path)
    const entries = Array.from(val).map((v) =>
      JSON.stringify(getSortedEntries(v, cache, `${path}.set.${String(v)}`))
    )
    entries.sort()
    return entries
  } else if (val instanceof Object) {
    cache.set(val, path)
    return sortMapEntries(Object.entries(val), cache, path)
  } else {
    return val
  }
}

export const omitKey = <T, K extends keyof T>(obj: T, key: K): Omit<T, K> => {
  const omitted = { ...obj } as Partial<Pick<T, K>> & Omit<T, K>
  delete omitted[key]
  return omitted
}
