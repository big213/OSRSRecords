import type { RecordInfo } from '~/types'
import TimeagoColumn from '~/components/table/common/timeagoColumn.vue'
import { getEventsByGroup } from '~/services/dropdown'
import RecordColumn from '~/components/table/common/recordColumn.vue'
import BooleanColumn from '~/components/table/common/booleanColumn.vue'

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
    discordChannel: {
      text: 'Discord Channel',
      fields: ['discordChannel.id'],
      inputType: 'server-autocomplete',
      inputOptions: {
        hasAvatar: false,
        typename: 'discordChannel',
      },
    },
    'discordChannel.id': {},
    discordChannelName: {
      text: 'Discord Channel Name',
      fields: ['discordChannel.name'],
    },
    event: {
      text: 'Event Category',
      fields: ['event.id'],
      inputType: 'autocomplete',
      inputOptions: {
        hasAvatar: true,
        typename: 'event',
      },
      getOptions: getEventsByGroup,
    },
    'event.id': {},
    eventRecord: {
      text: 'Event',
      fields: ['event.name', 'event.avatar', 'event.id', 'event.__typename'],
      pathPrefix: 'event',
      component: RecordColumn,
    },
    eventEra: {
      text: 'Event Era',
      fields: ['eventEra.id'],
      inputType: 'select',
      inputOptions: {
        hasAvatar: true,
        typename: 'eventEra',
      },
    },
    'eventEra.id': {},
    eventEraRecord: {
      text: 'Event Era',
      fields: [
        'eventEra.name',
        'eventEra.avatar',
        'eventEra.id',
        'eventEra.__typename',
      ],
      pathPrefix: 'eventEra',
      component: RecordColumn,
    },
    useCurrentEventEra: {
      text: 'Use Current Era',
      inputType: 'switch',
      default: () => true,
      component: BooleanColumn,
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
    ],
    headerOptions: [
      {
        field: 'sort',
        sortable: true,
        width: '150px',
      },
      {
        field: 'discordChannelName',
        sortable: false,
      },
      {
        field: 'eventRecord',
        sortable: false,
        width: '150px',
      },
      {
        field: 'participants',
        sortable: false,
        width: '150px',
      },
      {
        field: 'eventEraRecord',
        sortable: false,
        width: '150px',
      },
      {
        field: 'ranksToShow',
        sortable: false,
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
        'sort',
        'discordChannel.id',
        'event.id',
        'participants',
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
