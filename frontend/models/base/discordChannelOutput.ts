import type { RecordInfo } from '~/types'
import TimeagoColumn from '~/components/table/common/timeagoColumn.vue'
import { getEventsByGroup } from '~/services/dropdown'
import BooleanColumn from '~/components/table/common/booleanColumn.vue'
import {
  generateJoinableField,
  generatePreviewableRecordField,
} from '~/services/recordInfo'

export const DiscordChannelOutput = <RecordInfo<'discordChannelOutput'>>{
  typename: 'discordChannelOutput',
  pluralTypename: 'discordChannelOutputs',
  name: 'Discord Channel Output',
  pluralName: 'Discord Channel Outputs',
  icon: 'mdi-format-list-checkbox',
  routeName: 'a-view',
  renderItem: (item) => item.name,
  fields: {
    id: {
      text: 'ID',
    },
    discordChannel: generateJoinableField({
      fieldname: 'discordChannel',
      typename: 'discordChannel',
      text: 'Discord Channel',
      hasAvatar: false,
    }),
    'discordChannel.id': {},
    discordChannelName: {
      text: 'Discord Channel Name',
      fields: ['discordChannel.name'],
    },
    event: {
      ...generateJoinableField({
        fieldname: 'event',
        typename: 'event',
        text: 'Event Category',
        hasAvatar: true,
        inputType: 'autocomplete',
      }),
      getOptions: getEventsByGroup,
    },
    'event.id': {},
    eventRecord: generatePreviewableRecordField({
      fieldname: 'event',
      text: 'Event',
    }),
    eventEra: generateJoinableField({
      fieldname: 'eventEra',
      typename: 'eventEra',
      text: 'Event Era',
      hasAvatar: true,
      inputType: 'select',
    }),
    'eventEra.id': {},
    eventEraRecord: generatePreviewableRecordField({
      fieldname: 'eventEra',
      text: 'Event Era',
    }),
    useCurrentEventEra: {
      text: 'Use Current Era',
      inputType: 'switch',
      default: () => true,
      component: BooleanColumn,
      parseImportValue: (val: string) => {
        return val === 'TRUE'
      },
    },
    participants: {
      text: 'Team Size',
    },
    ranksToShow: {
      text: 'Ranks to Show',
      default: () => 1,
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
    filterOptions: [
      {
        field: 'discordChannel',
        operator: 'eq',
      },
    ],
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
        width: '150px',
      },
      {
        field: 'discordChannelName',
      },
      {
        field: 'eventRecord',
        width: '150px',
      },
      {
        field: 'participants',
        width: '150px',
      },
      {
        field: 'eventEraRecord',
        width: '150px',
      },
      {
        field: 'ranksToShow',
        width: '150px',
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
        'sort',
        'discordChannel.id',
        'event.id',
        'participants',
        'useCurrentEventEra',
        'eventEra.id',
        'ranksToShow',
      ],
    },
  },
  addOptions: {
    fields: [
      'sort',
      'discordChannel',
      'event',
      'participants',
      'useCurrentEventEra',
      'eventEra',
      'ranksToShow',
    ],
  },
  importOptions: {
    fields: [
      'sort',
      'discordChannel.id',
      'event.id',
      'participants',
      'useCurrentEventEra',
      'eventEra.id',
      'ranksToShow',
    ],
  },
  editOptions: {
    fields: [
      'sort',
      'discordChannel',
      'event',
      'participants',
      'useCurrentEventEra',
      'eventEra',
      'ranksToShow',
    ],
  },
  viewOptions: {
    fields: [
      'sort',
      'discordChannelName',
      'eventRecord',
      'participants',
      'useCurrentEventEra',
      'eventEraRecord',
      'ranksToShow',
    ],
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}
