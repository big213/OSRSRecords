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

export const getEras = <any>(
  memoize(function (that, _forceReload = false, filterBy = []) {
    return collectPaginatorData(
      that,
      'getEraPaginator',
      {
        id: true,
        name: true,
        avatar: true,
        isCurrent: true,
      },
      {
        filterBy,
        sortBy: ['beginDate'],
        sortDesc: [true],
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
      },
      {
        filterBy,
        sortBy: ['name'],
      }
    )

    const eventGroupsMap: Map<string, any> = new Map()

    const eventGroupsArray = eventGroups.map((eventGroup) => {
      const eventGroupObject: { data: any; childEvents: any[] } = {
        data: eventGroup,
        childEvents: [],
      }

      eventGroupsMap.set(eventGroupObject.data.id, eventGroupObject)

      return eventGroupObject
    })

    const events = await collectPaginatorData(
      that,
      'getEventPaginator',
      {
        id: true,
        name: true,
        avatar: true,
        backgroundImage: true,
        eventGroup: {
          id: true,
        },
      },
      {
        filterBy,
        sortBy: ['name'],
      }
    )

    events.forEach((event) => {
      eventGroupsMap.get(event.eventGroup?.id)?.childEvents.push(event)
    })

    const returnArray: any[] = []

    // generate the output from eventGroupsArray
    eventGroupsArray.forEach((eventGroupObject) => {
      returnArray.push({
        header: eventGroupObject.data.name,
      })

      eventGroupObject.childEvents.forEach((event) => {
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
        sortBy: ['name'],
      }
    ).then((res) => res.concat({ header: 'blah' }))
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
