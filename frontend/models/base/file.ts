import type { RecordInfo } from '~/types'
import TimeagoColumn from '~/components/table/common/timeagoColumn.vue'
import FilesizeColumn from '~/components/table/common/filesizeColumn.vue'
import FileColumn from '~/components/table/common/fileColumn.vue'

export const File = <RecordInfo<'file'>>{
  typename: 'file',
  pluralTypename: 'files',
  name: 'File',
  pluralName: 'Files',
  icon: 'mdi-file',
  routeName: 'a-view',
  renderItem: (item) => item.name,
  fields: {
    id: {
      text: 'ID',
    },
    name: {
      text: 'Name',
    },
    'name+id': {
      text: 'Name',
      component: FileColumn,
      compoundOptions: {
        primaryField: 'name',
      },
    },
    size: {
      text: 'Size',
      component: FilesizeColumn,
    },
    location: {
      text: 'Location',
    },
    contentType: {
      text: 'Content Type',
    },
    'createdBy.id': {},
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
        field: 'name+id',
        sortable: false,
      },
      {
        field: 'contentType',
        width: '200px',
        sortable: true,
      },
      {
        field: 'size',
        width: '150px',
        align: 'right',
        sortable: true,
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
    fields: ['name', 'location'],
  },
  editOptions: {
    fields: ['name'],
  },
  viewOptions: {
    fields: ['name', 'size', 'contentType', 'location'],
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}
