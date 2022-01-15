import { executeGiraffeql } from '~/services/giraffeql'
import { collectPaginatorData } from '~/services/base'

function memoize(memoizedFn) {
  const cache = {}

  return function () {
    // first arg is always gonna be that, so we will exclude it
    const [that, forceReload, ...otherArgs] = arguments
    const args = JSON.stringify(otherArgs)
    cache[args] = forceReload
      ? memoizedFn(that, false, ...otherArgs)
      : cache[args] || memoizedFn(that, false, ...otherArgs)
    return cache[args]
  }
}

export const getCurrentUser = function (that) {
  const user = that.$store.getters['auth/user']

  return Promise.resolve(
    user
      ? [
          {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
          },
        ]
      : []
  )
}

export const getUsers = <any>(
  memoize(function (that, _forceReload = false, filterBy = []) {
    return collectPaginatorData(
      that,
      'getUserPaginator',
      {
        id: true,
        name: true,
        avatar: true,
      },
      {
        filterBy,
      }
    )
  })
)

export const getEventEras = <any>(
  memoize(function (that, _forceReload = false, filterBy = []) {
    return collectPaginatorData(
      that,
      'getEventEraPaginator',
      {
        id: true,
        name: true,
        avatar: true,
        beginDate: true,
        endDate: true,
        isCurrent: true,
      },
      {
        filterBy,
        sortBy: [
          {
            field: 'beginDate',
            desc: true,
          },
        ],
      }
    )
  })
)

export const getEventsByGroup = <any>(
  memoize(async function (that, _forceReload = false, filterBy = []) {
    const eventGroups = await collectPaginatorData(
      that,
      'getEventGroupPaginator',
      {
        id: true,
        name: true,
        avatar: true,
        contents: true,
      },
      {
        filterBy,
        sortBy: [
          {
            field: 'sort',
            desc: false,
          },
        ],
      }
    )

    // get all the events, cuz they will probably mostly be needed
    const events = await collectPaginatorData(that, 'getEventPaginator', {
      id: true,
      name: true,
      avatar: true,
      backgroundImage: true,
      minParticipants: true,
      maxParticipants: true,
    })

    // create the lookup map
    const eventsMap: Map<string, any> = new Map()

    events.forEach((event) => {
      eventsMap.set(event.id, event)
    })

    // replace the contents
    eventGroups.forEach((eventGroup) => {
      eventGroup.contents = eventGroup.contents.map((eventId) =>
        eventsMap.get(eventId)
      )
    })

    const returnArray: any[] = []

    eventGroups.forEach((eventGroup) => {
      returnArray.push({
        header: eventGroup.name,
      })

      eventGroup.contents.forEach((event) => {
        returnArray.push(event)
      })

      returnArray.push({
        divider: true,
      })
    })

    return returnArray
  })
)

export const getEvents = <any>(
  memoize(function (that, _forceReload = false, filterBy = []) {
    return collectPaginatorData(
      that,
      'getEventPaginator',
      {
        id: true,
        name: true,
        avatar: true,
        backgroundImage: true,
      },
      {
        filterBy,
        sortBy: [
          {
            field: 'name',
            desc: false,
          },
        ],
      }
    )
  })
)

export const getUserRoles = memoize(async function (
  that,
  _forceReload = false
) {
  const data = await executeGiraffeql<'getUserRoleEnumPaginator'>(that, {
    getUserRoleEnumPaginator: {
      values: true,
    },
  })

  return data.values
})

export const getSubmissionStatuses = memoize(async function (
  that,
  _forceReload = false
) {
  const data = await executeGiraffeql<'getSubmissionStatusEnumPaginator'>(
    that,
    {
      getSubmissionStatusEnumPaginator: {
        values: true,
      },
    }
  )

  return data.values
})

export const getEventDifficulties = memoize(async function (
  that,
  _forceReload = false
) {
  const data = await executeGiraffeql<'getEventDifficultyEnumPaginator'>(that, {
    getEventDifficultyEnumPaginator: {
      values: true,
    },
  })

  return data.values
})

export const getEventEraModes = memoize(async function (
  that,
  _forceReload = false
) {
  const data = await executeGiraffeql<'getEventEraModeEnumPaginator'>(that, {
    getEventEraModeEnumPaginator: {
      values: true,
    },
  })

  return data.values
})
