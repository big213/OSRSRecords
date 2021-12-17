import type { RecordInfo } from '~/types'
import TimeagoColumn from '~/components/table/common/timeagoColumn.vue'
import AvatarColumn from '~/components/table/common/avatarColumn.vue'
import NameAvatarColumn from '~/components/table/common/nameAvatarColumn.vue'

export const EventGroup = <RecordInfo<'eventGroup'>>{
  typename: 'eventGroup',
  pluralTypename: 'eventGroups',
  name: 'Event Group',
  pluralName: 'Event Groups',
  icon: 'mdi-folder-information',
  routeName: 'a-view',
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
        nestedInputType: 'server-autocomplete',
        nestedValueText: 'Event',
        typename: 'event',
        hasAvatar: true,
      },
    },
    sort: {
      text: 'Sort Order',
      default: (_that) => 10,
    },
    createdBy: {
      text: 'Created By',
      fields: ['createdBy.id'],
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
    filters: [],
    headers: [
      {
        field: 'sort',
        sortable: true,
        width: '110px',
      },
      {
        field: 'nameWithAvatar',
        sortable: false,
      },
      {
        field: 'createdAt',
        width: '150px',
        sortable: true,
      },
      {
        field: 'updatedAt',
        width: '150px',
        sortable: true,
      },
    ],
    downloadOptions: {},
  },
  addOptions: {
    fields: ['sort', 'avatar', 'name', 'contents'],
  },
  // importOptions: { fields: ['avatar', 'name', 'description', 'isPublic'] },
  editOptions: {
    fields: ['sort', 'avatar', 'name', 'contents'],
  },
  viewOptions: {
    fields: ['sort', 'nameWithAvatar', 'contents'],
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}
