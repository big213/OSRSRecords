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

type LeaderboardInputs = {
  eventId: string | undefined
  eventEraId: string | undefined
  participants: number | undefined
}

export async function generateLeaderboardRoute(
  that,
  leaderboardInputs: LeaderboardInputs
) {
  return generateCrudRecordInterfaceRoute(
    '/leaderboard',
    await generateLeaderboardPageOptions(that, leaderboardInputs)
  )
}

export async function generateLeaderboardPageOptions(
  that,
  { eventId, eventEraId, participants }: LeaderboardInputs
) {
  let actualEventId = eventId
  let actualEventEraId = eventEraId
  let actualParticipants = participants

  // use the eventId or fall back to the first eventId
  if (!actualEventId) {
    const eventsByGroup = await getEventsByGroup(that)

    const firstEvent = eventsByGroup.find((ele) => ele.id)

    if (!firstEvent) throw new Error('No events configured')

    actualEventId = firstEvent.id
  }

  // use the eventEraId or fall back to the first eventId
  if (!actualEventEraId) {
    const eventEras = await getEventEras(that, false, [
      {
        'event.id': {
          eq: actualEventId,
        },
      },
    ])

    actualEventEraId = eventEras.find((ele) => ele.isCurrent)?.id
  }

  // use the participants or fall back to 1
  if (!actualParticipants) {
    actualParticipants = 1
  }

  return {
    search: '',
    filters: [
      {
        field: 'event',
        operator: 'eq',
        value: actualEventId,
      },
      {
        field: 'participants',
        operator: 'eq',
        value: actualParticipants,
      },
      {
        field: 'eventEra',
        operator: 'eq',
        value: actualEventEraId,
      },
    ],
    sort: {
      field: 'score',
      desc: false,
    },
  }
}

const specialTeamSizeNamesMap = {
  '1': 'Solo',
  '2': 'Duo',
  '3': 'Trio',
}

export function generateParticipantsOptions(
  minParticipants: number | null,
  maxParticipants: number | null
) {
  const returnOptions: any[] = []

  if (!minParticipants && !maxParticipants) {
    throw new Error('Either one of minParticipants or maxParticipants required')
  }

  // if maxParticipants is null, cap at 20
  const actualMaxParticipants = maxParticipants ?? 20

  for (
    let participantsCounter = minParticipants ?? 1;
    participantsCounter < actualMaxParticipants + 1;
    participantsCounter++
  ) {
    returnOptions.push({
      id: participantsCounter,
      name:
        specialTeamSizeNamesMap[participantsCounter] ??
        participantsCounter + '-Man',
    })
  }

  return returnOptions
}
