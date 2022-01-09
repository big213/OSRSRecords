import { Submission } from '../base'

export const PublicSubmission = {
  ...Submission,
  routeName: 'i-view',
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
        width: '250px',
      },
      {
        field: 'participantsLinksList',
      },
      {
        field: 'score',
        width: '200px',
        align: 'right',
      },
      {
        field: 'mainExternalLink',
        width: '150px',
      },
      {
        field: 'happenedOn',
        width: '150px',
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
      'statusReadonly',
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
