import type { RecordInfo } from '~/types'
import NameAvatarColumn from '~/components/table/common/nameAvatarColumn.vue'
import TimeagoColumn from '~/components/table/common/timeagoColumn.vue'
import AvatarColumn from '~/components/table/common/avatarColumn.vue'

export const EventClass = <RecordInfo<'eventClass'>>{
  typename: 'eventClass',
  pluralTypename: 'eventClasses',
  name: 'Event Class',
  pluralName: 'Event Classes',
  icon: 'mdi-content-copy',
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
    description: {
      text: 'Description',
      inputType: 'textarea',
    },
    'createdBy.id': {
      text: 'Created By',
    },
    isSubEvent: {
      text: 'Sub Event',
      inputType: 'switch',
      default: () => false,
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
    fields: ['avatar', 'name', 'description', 'isSubEvent'],
  },
  // importOptions: { fields: ['avatar', 'name', 'description', 'isPublic'] },
  editOptions: {
    fields: ['avatar', 'name', 'description', 'isSubEvent'],
  },
  viewOptions: {
    fields: ['nameWithAvatar', 'description', 'isSubEvent'],
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}
