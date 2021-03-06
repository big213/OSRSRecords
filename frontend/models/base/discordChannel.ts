import type { RecordInfo } from '~/types'
import TimeagoColumn from '~/components/table/timeagoColumn.vue'
import { DiscordChannelOutput } from './discordChannelOutput'
import { refreshDiscordOutput } from '../actions'

export const DiscordChannel = <RecordInfo<'discordChannel'>>{
  typename: 'discordChannel',
  pluralTypename: 'discordChannels',
  name: 'Discord Channel',
  pluralName: 'Discord Channels',
  icon: 'mdi-format-list-checkbox',
  renderItem: (item) => item.name,
  fields: {
    id: {
      text: 'ID',
    },
    name: {
      text: 'Name',
    },
    channelId: {
      text: 'Channel ID',
    },
    primaryMessageId: {
      text: 'Primary Message ID',
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
        field: 'name',
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
      fields: ['id', 'name'],
    },
  },
  addOptions: {
    fields: ['name', 'channelId', 'primaryMessageId'],
  },
  editOptions: {
    fields: ['name', 'channelId', 'primaryMessageId'],
  },
  importOptions: {
    fields: ['name', 'channelId', 'primaryMessageId'],
  },
  viewOptions: {
    fields: ['name', 'channelId', 'primaryMessageId'],
  },
  enterOptions: {
    routeType: 'a',
  },
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [
    {
      recordInfo: DiscordChannelOutput,
      lockedFilters: (_that, item) => {
        return [
          {
            field: 'discordChannel',
            operator: 'eq',
            value: item.id,
          },
        ]
      },
      initialSortOptions: {
        field: 'sort',
        desc: false,
      },
    },
  ],
  customActions: [
    {
      text: 'Refresh Output',
      icon: 'mdi-refresh',
      handleClick: refreshDiscordOutput,
      isAsync: true,
    },
  ],
}
