import type { RecordInfo } from '~/types'
import {
  generateDateLocaleString,
  generateParseDateTimeStringFn,
} from '~/services/base'
import NameAvatarColumn from '~/components/table/common/nameAvatarColumn.vue'
import TimeagoColumn from '~/components/table/common/timeagoColumn.vue'
import AvatarColumn from '~/components/table/common/avatarColumn.vue'
import TruthyOrNoneColumn from '~/components/table/common/truthyOrNoneColumn.vue'
import BooleanColumn from '~/components/table/common/booleanColumn.vue'
import { getEvents } from '~/services/dropdown'
import RecordColumn from '~/components/table/common/recordColumn.vue'

export const EventEra = <RecordInfo<'eventEra'>>{
  typename: 'eventEra',
  pluralTypename: 'eventEras',
  name: 'Event Era',
  pluralName: 'Event Eras',
  icon: 'mdi-calendar-star',
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
    event: {
      text: 'Event Category',
      fields: ['event.id'],
      inputType: 'autocomplete',
      inputOptions: {
        hasAvatar: true,
        typename: 'event',
      },
      getOptions: getEvents,
    },
    'event.id': {},
    'event.name': {},
    eventRecord: {
      text: 'Event Category',
      fields: ['event.name', 'event.avatar', 'event.id', 'event.__typename'],
      pathPrefix: 'event',
      component: RecordColumn,
    },

    beginDate: {
      text: 'Start Date',
      inputType: 'datepicker',
      hint: 'To specify the exact date and time, use format: YYYY-MM-DD 1:23 PM',
      // unix timestamp to YYYY-MM-DD HH:MM:SS
      serialize: generateDateLocaleString,
      // YYYY-MM-DD to unix timestamp
      parseValue: generateParseDateTimeStringFn('startOfDay'),
      parseImportValue: (val: string) => {
        if (!val) return null

        // only works on certain browsers
        const msTimestamp = new Date(val).getTime()

        return msTimestamp / 1000
      },

      component: TruthyOrNoneColumn,
    },
    endDate: {
      text: 'End Date',
      inputType: 'datepicker',
      hint: 'To specify the exact date and time, use format: YYYY-MM-DD 1:23 PM',
      // unix timestamp to YYYY-MM-DD HH:MM:SS
      serialize: generateDateLocaleString,
      // YYYY-MM-DD to unix timestamp
      parseValue: generateParseDateTimeStringFn('startOfDay'),
      parseImportValue: (val: string) => {
        if (!val) return null

        // only works on certain browsers
        const msTimestamp = new Date(val).getTime()

        return msTimestamp / 1000
      },

      component: TruthyOrNoneColumn,
    },
    isCurrent: {
      text: 'Is Current',
      inputType: 'switch',
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
    filterOptions: [],
    sortOptions: [
      {
        field: 'createdAt',
        desc: true,
      },
    ],
    headerOptions: [
      {
        field: 'nameWithAvatar',
        sortable: false,
      },
      {
        field: 'isCurrent',
        width: '150px',
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
    downloadOptions: {
      fields: [
        'id',
        'event.id',
        'event.name',
        'avatar',
        'name',
        'description',
        'beginDate',
        'endDate',
      ],
    },
  },
  addOptions: {
    fields: ['event', 'avatar', 'name', 'description', 'beginDate', 'endDate'],
  },
  importOptions: {
    fields: [
      'event.id',
      'avatar',
      'name',
      'description',
      'beginDate',
      'endDate',
    ],
  },
  editOptions: {
    fields: ['event', 'avatar', 'name', 'description', 'beginDate', 'endDate'],
  },
  viewOptions: {
    fields: [
      'eventRecord',
      'nameWithAvatar',
      'description',
      'beginDate',
      'endDate',
      'isCurrent',
    ],
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}
