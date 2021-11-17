import type { RecordInfo } from '~/types'
import RecordColumn from '~/components/table/common/recordColumn.vue'
import TimeagoColumn from '~/components/table/common/timeagoColumn.vue'
import AvatarColumn from '~/components/table/common/avatarColumn.vue'
import BooleanColumn from '~/components/table/common/booleanColumn.vue'
import ViewRecordTableInterface from '~/components/interface/crud/viewRecordTableInterface.vue'
import {
  generateDateLocaleString,
  generateParseDateTimeStringFn,
} from '~/services/base'

export const Character = <RecordInfo<'character'>>{
  typename: 'character',
  pluralTypename: 'characters',
  name: 'Character',
  pluralName: 'Characters',
  icon: 'mdi-account',
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
    'name+avatar': {
      text: 'Name',
      component: RecordColumn,
      compoundOptions: {
        primaryField: 'name',
      },
    },
    description: {
      text: 'Description',
      inputType: 'textarea',
    },
    'ownedBy.id': {
      text: 'Owned By',
      inputType: 'server-autocomplete',
      inputOptions: {
        hasAvatar: true,
        typename: 'user',
      },
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
        field: 'name+avatar',
        sortable: false,
      },
      {
        field: 'ownedBy.id',
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
      'ownedBy.id',
      'minParticipants',
      'maxParticipants',
      'releaseDate',
      'avatar',
      'name',
      'description',
      'isHardMode',
    ],
  },
  // importOptions: { fields: ['avatar', 'name', 'description', 'isPublic'] },
  editOptions: {
    fields: ['avatar', 'name', 'description'],
  },
  viewOptions: {
    fields: [
      'eventClass.id',
      'minParticipants',
      'maxParticipants',
      'releaseDate',
      'avatar',
      'name',
      'description',
      'isHardMode',
    ],
    component: ViewRecordTableInterface,
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}
