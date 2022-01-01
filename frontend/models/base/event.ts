import type { RecordInfo } from '~/types'
import RecordColumn from '~/components/table/common/recordColumn.vue'
import TimeagoColumn from '~/components/table/common/timeagoColumn.vue'
import AvatarColumn from '~/components/table/common/avatarColumn.vue'
import UrlColumn from '~/components/table/common/urlColumn.vue'
import NameAvatarColumn from '~/components/table/common/nameAvatarColumn.vue'
import TimeStringColumn from '~/components/table/common/timeStringColumn.vue'
import {
  generateDateLocaleString,
  generateParseDateTimeStringFn,
} from '~/services/base'
import { getEventDifficulties } from '~/services/dropdown'
import { EventEra } from '.'

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
    avatarOverride: {
      text: 'Avatar (Override)',
      inputType: 'avatar',
      component: AvatarColumn,
    },
    avatar: {
      text: 'avatar',
      inputType: 'avatar',
      component: AvatarColumn,
    },
    backgroundImageOverride: {
      text: 'Background Image (Override)',
      inputType: 'single-image',
      component: UrlColumn,
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
    'eventClass.id': {},
    'eventClass.name': {},
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
      // YYYY-MM-DD to unix timestamp
      parseValue: generateParseDateTimeStringFn('startOfDay'),
      parseImportValue: (val: string) => {
        if (!val) return null

        // only works on certain browsers
        const msTimestamp = new Date(val).getTime()

        return msTimestamp / 1000
      },
      component: TimeStringColumn,
    },
    description: {
      text: 'Description',
      inputType: 'textarea',
    },
    difficulty: {
      text: 'Difficulty',
      getOptions: getEventDifficulties,
      inputType: 'select',
      default: () => 'NORMAL',
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
    hasSearch: true,
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
        sortable: true,
      },
      {
        field: 'difficulty',
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
    downloadOptions: {
      fields: [
        'id',
        'eventClass.id',
        'eventClass.name',
        'minParticipants',
        'maxParticipants',
        'releaseDate',
        'avatarOverride',
        'name',
        'description',
        'backgroundImageOverride',
        'difficulty',
      ],
    },
  },
  addOptions: {
    fields: [
      'eventClass',
      'minParticipants',
      'maxParticipants',
      'releaseDate',
      'avatarOverride',
      'name',
      'description',
      'backgroundImageOverride',
      'difficulty',
    ],
  },
  importOptions: {
    fields: [
      'eventClass.id',
      'minParticipants',
      'maxParticipants',
      'releaseDate',
      'avatarOverride',
      'name',
      'description',
      'backgroundImageOverride',
      'difficulty',
    ],
  },
  editOptions: {
    fields: ['avatarOverride', 'backgroundImageOverride', 'releaseDate'],
  },
  viewOptions: {
    fields: [
      'eventClassRecord',
      'minParticipants',
      'maxParticipants',
      'releaseDate',
      'avatar',
      'name',
      'description',
      'backgroundImage',
      'difficulty',
    ],
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [
    {
      recordInfo: EventEra,
      lockedFilters: (_that, item) => {
        return [
          {
            field: 'event',
            operator: 'eq',
            value: item.id,
          },
        ]
      },
      initialSortOptions: {
        field: 'beginDate',
        desc: false,
      },
    },
  ],
}
