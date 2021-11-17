import { User } from '../base'

export const MyProfile = {
  ...User,
  routeName: 'i-view',
  paginationOptions: {
    ...(!!User.paginationOptions && User.paginationOptions),
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
    ],
    downloadOptions: undefined,
  },
  editOptions: {
    fields: ['avatar', 'name', 'isPublic'],
  },
  viewOptions: {
    fields: ['avatar', 'name', 'isPublic'],
  },
  deleteOptions: undefined,
  expandTypes: [],
}
