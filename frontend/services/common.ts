type StringKeyObject = { [x: string]: any }

// tens digits only
export function serializeTime(ms: number | null): string | null {
  if (!ms) return null
  let totalCs = Number(ms) / 10

  const minutes = Math.floor(totalCs / (60 * 100))

  totalCs -= minutes * 60 * 100

  const seconds = Math.floor(totalCs / 100)

  totalCs -= seconds * 100

  const cs = totalCs

  return (
    (minutes ? minutes + ':' : '') +
    (minutes ? String(seconds).padStart(2, '0') : seconds) +
    '.' +
    String(Math.floor(cs / 10)).padStart(1, '0')
  )
}
