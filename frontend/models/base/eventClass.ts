import type { RecordInfo } from '~/types'
import RecordColumn from '~/components/table/common/recordColumn.vue'
import TimeagoColumn from '~/components/table/common/timeagoColumn.vue'
import AvatarColumn from '~/components/table/common/avatarColumn.vue'
import ViewRecordTableInterface from '~/components/interface/crud/viewRecordTableInterface.vue'

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
    'createdBy.id': {
      text: 'Created By',
    },
    isSubEvent: {
      text: 'Sub Event',
      inputType: 'switch',
      default: () => false,
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
    fields: ['avatar', 'name', 'description', 'isSubEvent'],
  },
  // importOptions: { fields: ['avatar', 'name', 'description', 'isPublic'] },
  editOptions: {
    fields: ['avatar', 'name', 'description', 'isSubEvent'],
  },
  viewOptions: {
    fields: ['name+avatar', 'description', 'isSubEvent'],
    component: ViewRecordTableInterface,
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}
