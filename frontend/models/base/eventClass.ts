import type { RecordInfo } from '~/types'
import NameAvatarColumn from '~/components/table/nameAvatarColumn.vue'
import TimeagoColumn from '~/components/table/timeagoColumn.vue'
import AvatarColumn from '~/components/table/avatarColumn.vue'
import UrlColumn from '~/components/table/urlColumn.vue'
import { Event } from './event'
import {
  generateJoinableField,
  generatePreviewableRecordField,
} from '~/services/recordInfo'

export const EventClass = <RecordInfo<'eventClass'>>{
  typename: 'eventClass',
  pluralTypename: 'eventClasses',
  name: 'Event Class',
  pluralName: 'Event Classes',
  icon: 'mdi-content-copy',
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
    parent: generateJoinableField({
      fieldname: 'parent',
      typename: 'eventClass',
      text: 'Event Class',
      hasAvatar: true,
    }),
    'parent.id': {},
    parentRecord: generatePreviewableRecordField({
      fieldname: 'parent',
      text: 'Parent Event Class',
    }),
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
    hasSearch: true,
    filterOptions: [
      {
        field: 'parent',
        operator: 'eq',
      },
    ],
    sortOptions: [
      {
        field: 'createdAt',
        desc: true,
      },
      {
        field: 'name',
        desc: true,
      },
      {
        field: 'name',
        desc: false,
      },
    ],
    headerOptions: [
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
    downloadOptions: {
      fields: [
        'id',
        'name',
        'description',
        'avatar',
        'backgroundImage',
        'parent.id',
      ],
    },
  },
  addOptions: {
    fields: ['avatar', 'name', 'description', 'backgroundImage', 'parent'],
  },
  importOptions: {
    fields: ['avatar', 'name', 'description', 'backgroundImage', 'parent.id'],
  },
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
  enterOptions: {
    routeType: 'a',
  },
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [
    {
      recordInfo: Event,
      lockedFilters: (_that, item) => {
        return [
          {
            field: 'eventClass',
            operator: 'eq',
            value: item.id,
          },
        ]
      },
    },
  ],
}
