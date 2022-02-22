import { generateCrudRecordInterfaceRoute } from './base'
import { getEventEras, getEventsByGroup } from '~/services/dropdown'
import { participantsTextMap } from './constants'
import { CrudRawFilterObject } from '~/types/misc'

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
    (minutes ? minutes + ':' : '0:') +
    String(seconds).padStart(2, '0') +
    '.' +
    String(Math.floor(cs / 10)).padStart(1, '0')
  )
}

type LeaderboardInputs = {
  eventId: string | undefined
  eventEraId: string | undefined
  eventEraMode: 'NORMAL' | 'CURRENT_ERA' | 'RELEVANT_ERAS' | undefined
  participants: number | '__undefined' | undefined
  isSoloPersonalBest: boolean | undefined
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
  {
    eventId,
    eventEraId,
    eventEraMode,
    participants,
    isSoloPersonalBest,
  }: LeaderboardInputs
) {
  let actualEventId = eventId
  let actualEventEraId = eventEraId
  let actualParticipants = participants

  const filters: CrudRawFilterObject[] = []

  // use the eventId or fall back to the first eventId
  if (!actualEventId) {
    const eventsByGroup = await getEventsByGroup(that)

    const firstEvent = eventsByGroup.find((ele) => ele.id)

    if (!firstEvent) throw new Error('No events configured')

    actualEventId = firstEvent.id
  }

  filters.push({
    field: 'event',
    operator: 'eq',
    value: actualEventId,
  })

  // use the eventEraId or fall back to the eventEra.isRelevant = true
  if (eventEraMode === 'RELEVANT_ERAS') {
    filters.push({
      field: 'eventEra.isRelevant',
      operator: 'eq',
      value: true,
    })
  } else {
    if (eventEraMode === 'CURRENT_ERA') {
      // fetch the eras for the eventId
      const eventEras = await getEventEras(that, false, [
        {
          'event.id': {
            eq: actualEventId,
          },
        },
      ])

      actualEventEraId = eventEras.find((ele) => ele.isCurrent)?.id
    }

    filters.push({
      field: 'eventEra',
      operator: 'eq',
      value: actualEventEraId ?? '__undefined',
    })
  }

  // use the participants or fall back to '__undefined' for "any"
  if (!actualParticipants) {
    actualParticipants = 1
  }

  filters.push({
    field: 'participants',
    operator: 'eq',
    value: Number(actualParticipants),
  })

  if (isSoloPersonalBest !== undefined) {
    filters.push({
      field: 'isSoloPersonalBest',
      operator: 'eq',
      value: isSoloPersonalBest,
    })
  }

  return {
    search: '',
    filters,
    sort: {
      field: 'score',
      desc: false,
    },
  }
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
      name: generateParticipantsText(participantsCounter),
    })

    // for any set of options with a solo option, also add a special Solo PB option
    if (participantsCounter === 1) {
      returnOptions.push({
        id: '__solopb',
        name: 'Solo PB',
      })
    }
  }

  return returnOptions
}

// unixTimestamp in seconds
export function daysDiff(unixTimestampFrom: number, unixTimestampTo: number) {
  return Math.floor((unixTimestampTo - unixTimestampFrom) / (60 * 60 * 24))
}

export function generateParticipantsText(participants: number | null) {
  if (participants === null) return 'Fastest Completion'

  return participantsTextMap[participants] ?? participants + '-Man'
}

export function generateEventText(
  eventName: string,
  participants: number | null,
  maxParticipants: number | null
) {
  return `${eventName}${
    maxParticipants === 1 ? '' : ' - ' + generateParticipantsText(participants)
  }`
}

// currently only Imgur/Streamable/YT links supported
export function isValidEvidenceLink(link: string) {
  return link.match(/youtu|streamable|imgur/)
}
