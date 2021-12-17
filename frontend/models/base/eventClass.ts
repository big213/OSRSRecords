import type { RecordInfo } from '~/types'
import NameAvatarColumn from '~/components/table/common/nameAvatarColumn.vue'
import TimeagoColumn from '~/components/table/common/timeagoColumn.vue'
import AvatarColumn from '~/components/table/common/avatarColumn.vue'
import UrlColumn from '~/components/table/common/urlColumn.vue'
import RecordColumn from '~/components/table/common/recordColumn.vue'

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
    parent: {
      text: 'Parent Event Class',
      fields: ['parent.id'],
      inputType: 'server-autocomplete',
      inputOptions: {
        hasAvatar: true,
        typename: 'eventClass',
      },
    },
    parentRecord: {
      text: 'Parent Event Class',
      fields: [
        'parent.name',
        'parent.id',
        'parent.__typename',
        'parent.avatar',
      ],
      pathPrefix: 'parent',
      component: RecordColumn,
    },
    backgroundImage: {
      text: 'Background Image',
      inputType: 'single-image',
      component: UrlColumn,
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
    fields: ['avatar', 'name', 'description', 'backgroundImage', 'parent'],
  },
  // importOptions: { fields: ['avatar', 'name', 'description', 'isPublic'] },
  editOptions: {
    fields: ['avatar', 'name', 'description', 'backgroundImage', 'parent'],
  },
  viewOptions: {
    fields: [
      'nameWithAvatar',
      'description',
      'backgroundImage',
      'parentRecord',
    ],
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}
