import type { RecordInfo } from '~/types'
import {
  generateDateLocaleString,
  generateParseDateTimeStringFn,
} from '~/services/base'
import RecordColumn from '~/components/table/common/recordColumn.vue'
import TimeagoColumn from '~/components/table/common/timeagoColumn.vue'
import AvatarColumn from '~/components/table/common/avatarColumn.vue'
import TruthyOrNoneColumn from '~/components/table/common/truthyOrNoneColumn.vue'
import BooleanColumn from '~/components/table/common/booleanColumn.vue'
import ViewRecordTableInterface from '~/components/interface/crud/viewRecordTableInterface.vue'

export const Era = <RecordInfo<'era'>>{
  typename: 'era',
  pluralTypename: 'eras',
  name: 'Era',
  pluralName: 'Eras',
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
    beginDate: {
      text: 'Start Date',
      inputType: 'datepicker',
      hint: 'To specify the exact date and time, use format: YYYY-MM-DD 1:23 PM',
      // unix timestamp to YYYY-MM-DD HH:MM:SS
      serialize: generateDateLocaleString,
      // YYYY-MM-DD to unix timestamp
      parseValue: generateParseDateTimeStringFn('startOfDay'),
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
      component: TruthyOrNoneColumn,
    },
    isCurrent: {
      text: 'Is Current',
      inputType: 'switch',
      component: BooleanColumn,
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
    downloadOptions: {},
  },
  addOptions: {
    fields: ['avatar', 'name', 'description', 'beginDate', 'endDate'],
  },
  // importOptions: { fields: ['avatar', 'name', 'description', 'isPublic'] },
  editOptions: {
    fields: ['avatar', 'name', 'description', 'beginDate', 'endDate'],
  },
  viewOptions: {
    fields: ['name+avatar', 'description', 'beginDate', 'endDate', 'isCurrent'],
    component: ViewRecordTableInterface,
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}
