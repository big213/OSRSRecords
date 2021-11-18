import { Submission } from '../base'
export const PublicSubmission = {
  ...Submission,
  paginationOptions: {
    ...Submission.paginationOptions,
    headers: [
      {
        field: 'event.name+participants',
        sortable: false,
      },
      {
        field: 'score',
        width: '200px',
        sortable: false,
        align: 'right',
      },
      {
        field: 'happenedOn',
        width: '150px',
        sortable: true,
      },
    ],
  },
  addOptions: undefined,
  editOptions: undefined,
  deleteOptions: undefined,
}
