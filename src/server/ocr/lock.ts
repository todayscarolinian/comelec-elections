let tail: Promise<unknown> = Promise.resolve()

export function withOcrLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = tail.then(fn, fn)
  tail = run.catch(() => undefined)
  return run
}
