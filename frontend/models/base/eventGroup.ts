import type { RecordInfo } from '~/types'
import TimeagoColumn from '~/components/table/timeagoColumn.vue'
import AvatarColumn from '~/components/table/avatarColumn.vue'
import NameAvatarColumn from '~/components/table/nameAvatarColumn.vue'

export const EventGroup = <RecordInfo<'eventGroup'>>{
  typename: 'eventGroup',
  pluralTypename: 'eventGroups',
  name: 'Event Group',
  pluralName: 'Event Groups',
  icon: 'mdi-folder-information',
  renderItem: (item) => item.name,
  fields: {
    id: {
      text: 'ID',
    },
    name: {
      text: 'Name',
    },
    avatar: {
      text: 'Avatar',
      inputType: 'avatar',
      component: AvatarColumn,
    },
    nameWithAvatar: {
      text: 'Name',
      fields: ['name', 'avatar'],
      component: NameAvatarColumn,
    },
    contents: {
      text: 'Contents',
      inputType: 'value-array',
      inputOptions: {
        nestedFields: [
          {
            key: 'main',
            inputType: 'server-autocomplete',
            text: 'Event',
            inputOptions: {
              typename: 'event',
              hasAvatar: true,
            },
          },
        ],
      },
      parseValue: (val) => {
        if (!Array.isArray(val)) throw new Error('Array expected')

        return val.map((ele) => ele.main)
      },
      serialize: (val) => {
        if (!Array.isArray(val)) return []

        return val.map((ele) => ({ main: ele }))
      },
    },
    sort: {
      text: 'Sort Order',
      default: (_that) => 10,
    },
    createdAt: {
      text: 'Created At',
      component: TimeagoColumn,
    },
    updatedAt: {
      text: 'Updated At',
      component: TimeagoColumn,
    },
  },
  paginationOptions: {
    hasSearch: false,
    filterOptions: [],
    sortOptions: [
      {
        field: 'createdAt',
        desc: true,
      },
      {
        field: 'sort',
        desc: false,
      },
      {
        field: 'sort',
        desc: true,
      },
    ],
    headerOptions: [
      {
        field: 'sort',
        width: '110px',
      },
      {
        field: 'nameWithAvatar',
      },
      {
        field: 'createdAt',
        width: '150px',
      },
      {
        field: 'updatedAt',
        width: '150px',
      },
    ],
    downloadOptions: {},
  },
  addOptions: {
    fields: ['sort', 'avatar', 'name', 'contents'],
  },
  importOptions: {
    fields: ['sort', 'avatar', 'name'],
  },
  editOptions: {
    fields: ['sort', 'avatar', 'name', 'contents'],
  },
  viewOptions: {
    fields: ['sort', 'nameWithAvatar', 'contents'],
  },
  enterOptions: {
    routeType: 'a',
  },
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}
