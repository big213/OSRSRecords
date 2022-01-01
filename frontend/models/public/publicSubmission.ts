import { Submission } from '../base'

export const PublicSubmission = {
  ...Submission,
  fields: {
    ...Submission.fields,
  },
  paginationOptions: {
    ...Submission.paginationOptions,
    headerOptions: [
      {
        field: 'ranking',
        width: '100px',
        align: 'right',
      },
      {
        field: 'eventRecordWithParticipants',
        sortable: false,
        width: '250px',
      },
      {
        field: 'participantsLinksList',
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
      'eventEraRecord',
      'participantsLinksListDetail',
      'score',
      'happenedOn',
      'status',
      'world',
      'ranking',
      'previousRecordHappenedOn',
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
