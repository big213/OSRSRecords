import { Submission } from '../base'

export const PublicSubmission = {
  ...Submission,
  fields: {
    ...Submission.fields,
  },
  paginationOptions: {
    ...Submission.paginationOptions,
    headers: [
      {
        field: 'eventRecordWithParticipants',
        sortable: false,
        width: '250px',
      },
      {
        field: 'participantsListFlat',
        sortable: false,
      },
      {
        field: 'score',
        width: '200px',
        sortable: true,
        align: 'right',
      },
      {
        field: 'mainExternalLink',
        sortable: false,
        width: '150px',
      },
      {
        field: 'happenedOn',
        width: '150px',
        sortable: true,
      },
    ],
    downloadOptions: undefined,
  },
  viewOptions: {
    fields: [
      'eventRecordWithParticipants',
      'eraRecord',
      'participantsListDetail',
      'score',
      'happenedOn',
      'status',
      'world',
      'ranking',
      // 'files',
      'externalLinks',
      //'privateComments',
      'publicComments',
    ],
  },
  addOptions: undefined,
  editOptions: undefined,
  deleteOptions: undefined,
  enterOptions: undefined,
}
