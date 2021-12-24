import { generateCrudRecordInterfaceRoute } from './base'
import { getEventEras, getEventsByGroup } from '~/services/dropdown'

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

export async function generateLeaderboardRoute(that) {
  return generateCrudRecordInterfaceRoute(
    '/leaderboard',
    await generateLeaderboardPageOptions(that)
  )
}

export async function generateLeaderboardPageOptions(that) {
  // get the first eventId
  const eventsByGroup = await getEventsByGroup(that)

  const firstEvent = eventsByGroup.find((ele) => ele.id)

  if (!firstEvent) throw new Error('No events configured')

  const eventEras = await getEventEras(that, false, [
    {
      'event.id': {
        eq: firstEvent.id,
      },
    },
  ])

  const currentEventEra = eventEras.find((ele) => ele.isCurrent)

  return {
    search: '',
    filters: [
      {
        field: 'event',
        operator: 'eq',
        value: firstEvent.id,
      },
      {
        field: 'participants',
        operator: 'eq',
        value: 1,
      },
      {
        field: 'eventEra',
        operator: 'eq',
        value: currentEventEra?.id ?? null,
      },
    ],
    sort: {
      field: 'score',
      desc: false,
    },
  }
}
