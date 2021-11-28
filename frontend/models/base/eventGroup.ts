import type { RecordInfo } from '~/types'
import TimeagoColumn from '~/components/table/common/timeagoColumn.vue'
import AvatarColumn from '~/components/table/common/avatarColumn.vue'
import NameAvatarColumn from '~/components/table/common/nameAvatarColumn.vue'
import RecordColumn from '~/components/table/common/recordColumn.vue'

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
    eventClass: {
      text: 'Event Class',
      fields: ['eventClass.id'],
      inputType: 'server-autocomplete',
      inputOptions: {
        hasAvatar: true,
        typename: 'eventClass',
      },
    },
    eventClassRecord: {
      text: 'Event Class',
      fields: [
        'eventClass.name',
        'eventClass.id',
        'eventClass.__typename',
        'eventClass.avatar',
      ],
      pathPrefix: 'eventClass',
      component: RecordColumn,
    },

    nameWithAvatar: {
      text: 'Name',
      fields: ['name', 'avatar'],
      component: NameAvatarColumn,
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
    fields: ['eventClass', 'avatar', 'name'],
  },
  // importOptions: { fields: ['avatar', 'name', 'description', 'isPublic'] },
  editOptions: {
    fields: ['avatar', 'name'],
  },
  viewOptions: {
    fields: ['nameWithAvatar', 'eventClassRecord'],
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}
