import { generateCrudRecordInterfaceRoute } from './base'

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

export function generateLeaderboardRoute(that) {
  return generateCrudRecordInterfaceRoute('/public-submissions', {
    sortBy: ['score'],
    sortDesc: [false],
    filters: [
      {
        field: 'event',
        operator: 'eq',
        value: 'c3xnykl6', // COX CM on prod db
      },
      {
        field: 'participants',
        operator: 'eq',
        value: 1,
      },
      {
        field: 'status',
        operator: 'eq',
        value: 'APPROVED',
      },
      {
        field: 'era',
        operator: 'eq',
        value: that.$store.getters['era/currentEra']?.id,
      },
    ],
  })
}
