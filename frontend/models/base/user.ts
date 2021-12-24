import { getUserRoles } from '~/services/dropdown'
import type { RecordInfo } from '~/types'
import TimeagoColumn from '~/components/table/common/timeagoColumn.vue'
import NameAvatarColumn from '~/components/table/common/nameAvatarColumn.vue'
import BooleanColumn from '~/components/table/common/booleanColumn.vue'

export const User = <RecordInfo<'user'>>{
  typename: 'user',
  pluralTypename: 'users',
  name: 'User',
  pluralName: 'Users',
  icon: 'mdi-account',
  routeName: 'a-view',
  renderItem: (item) => item.email,
  fields: {
    id: {
      text: 'ID',
    },
    name: {
      text: 'Name',
    },
    nameWithAvatar: {
      text: 'Name',
      fields: ['name', 'avatar'],
      component: NameAvatarColumn,
    },
    email: {
      text: 'Email',
    },
    avatar: {
      text: 'Avatar',
      inputType: 'avatar',
    },
    password: {
      text: 'Password',
      hidden: true,
    },
    role: {
      text: 'User Role',
      getOptions: getUserRoles,
      inputType: 'select',
    },
    permissions: {
      text: 'Custom Permissions',
      serialize: (val: string[]) => val && val.join(','),
      parseValue: (val: string) =>
        val ? val.split(',').filter((ele) => ele) : [],
    },
    isPublic: {
      text: 'Is Public',
      component: BooleanColumn,
      parseQueryValue: (val) => val === 'true',
      inputType: 'switch',
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
    filterOptions: [
      {
        field: 'role',
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
        field: 'nameWithAvatar',
        sortable: false,
      },
      {
        field: 'email',
        sortable: false,
        width: '150px',
      },
      {
        field: 'role',
        sortable: true,
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
    fields: ['name', 'email', 'password', 'role', 'permissions', 'isPublic'],
  },
  editOptions: {
    fields: ['name', 'email', 'role', 'permissions', 'isPublic'],
  },
  viewOptions: {
    fields: ['name', 'email', 'role', 'permissions', 'isPublic'],
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}
