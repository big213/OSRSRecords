import { Submission } from '../base'
export const PublicSubmission = {
  ...Submission,
  paginationOptions: {
    ...Submission.paginationOptions,
    headers: [
      {
        field: 'event.name+event.avatar+event.id+event.__typename+participants',
        sortable: false,
      },
      {
        field: 'score',
        width: '200px',
        sortable: true,
        align: 'right',
      },
      {
        field: 'happenedOn',
        width: '150px',
        sortable: true,
      },
    ],
    downloadOptions: undefined,
  },
  addOptions: undefined,
  editOptions: undefined,
  deleteOptions: undefined,
  enterOptions: undefined,
}
