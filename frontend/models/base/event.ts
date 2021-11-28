import type { RecordInfo } from '~/types'
import RecordColumn from '~/components/table/common/recordColumn.vue'
import TimeagoColumn from '~/components/table/common/timeagoColumn.vue'
import AvatarColumn from '~/components/table/common/avatarColumn.vue'
import BooleanColumn from '~/components/table/common/booleanColumn.vue'
import UrlColumn from '~/components/table/common/urlColumn.vue'
import NameAvatarColumn from '~/components/table/common/nameAvatarColumn.vue'
import {
  generateDateLocaleString,
  generateParseDateTimeStringFn,
} from '~/services/base'

export const Event = <RecordInfo<'event'>>{
  typename: 'event',
  pluralTypename: 'events',
  name: 'Event',
  pluralName: 'Events',
  icon: 'mdi-star-box',
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
    eventClass: {
      text: 'Event Class',
      fields: ['eventClass.id'],
      inputType: 'server-autocomplete',
      inputOptions: {
        hasAvatar: true,
        typename: 'eventClass',
      },
    },
    eventGroup: {
      text: 'Event Group',
      fields: ['eventGroup.id'],
      inputType: 'server-autocomplete',
      inputOptions: {
        hasAvatar: true,
        typename: 'eventGroup',
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
    minParticipants: {
      text: 'Min Participants',
    },
    maxParticipants: {
      text: 'Max Participants',
    },
    releaseDate: {
      text: 'Release Date',
      inputType: 'datepicker',
      hint: 'To specify the exact date and time, use format: YYYY-MM-DD 1:23 PM',
      // unix timestamp to YYYY-MM-DD HH:MM:SS
      serialize: generateDateLocaleString,
      // YYYY-MM-DD to unix timestamp
      parseValue: generateParseDateTimeStringFn('startOfDay'),
    },
    description: {
      text: 'Description',
      inputType: 'textarea',
    },
    isHardMode: {
      text: 'Is Hard Mode',
      inputType: 'switch',
      default: () => false,
      component: BooleanColumn,
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
        field: 'isHardMode',
        width: '150px',
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
    fields: [
      'eventClass',
      'eventGroup',
      'minParticipants',
      'maxParticipants',
      'releaseDate',
      'avatar',
      'name',
      'description',
      'backgroundImage',
      'isHardMode',
    ],
  },
  // importOptions: { fields: ['avatar', 'name', 'description', 'isPublic'] },
  editOptions: {
    fields: ['eventGroup'],
  },
  viewOptions: {
    fields: [
      'eventClassRecord',
      'eventGroup',
      'minParticipants',
      'maxParticipants',
      'releaseDate',
      'avatar',
      'name',
      'description',
      'backgroundImage',
      'isHardMode',
    ],
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}
